export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress; // 0.0 (morph/start) to 1.0 (assembled) to 2.0 (crack/liquid)
  uniform float uStreakProgress; // 0.0 to 1.0 for light streak pass
  uniform vec3 uMousePos; // normalized mouse coords in world space
  uniform float uRepulsionForce;
  uniform float uWaveDistortion;
  uniform float uThemeId; // 0: Chrome, 1: Holographic, 2: Gold, 3: Cyber, 4: Diamond

  attribute vec3 aTargetPosition;
  attribute float aLetterIndex;
  attribute vec3 aRandomDir;
  attribute float aSize;
  attribute vec3 aColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec3 vPosition;
  varying float vGlow;
  varying float vLetterIndex;

  // Simplex noise helper
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * (1.0 / 49.0));
    vec4 x_ = floor(j * n_);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vLetterIndex = aLetterIndex;
    vec3 startPos = position; // Initial random galaxy distribution
    vec3 targetPos = aTargetPosition;

    // Stage 1: Galaxy Swirl Physics
    float angle = length(startPos.xy) * 0.5 - uTime * 0.8;
    vec3 swirledStart = vec3(
      startPos.x * cos(angle) - startPos.y * sin(angle),
      startPos.x * sin(angle) + startPos.y * cos(angle),
      startPos.z + sin(uTime + length(startPos)) * 0.5
    );

    // Interpolate towards target letter positions based on uProgress (0.0 to 1.0)
    float morphFactor = smoothstep(0.0, 1.0, uProgress);
    vec3 currentPos = mix(swirledStart, targetPos, morphFactor);

    // Stage 2: Gentle Floating Space Wave Motion per letter
    float letterOffset = aLetterIndex * 0.4;
    float floatY = sin(uTime * 1.5 + letterOffset) * 0.12;
    float floatX = cos(uTime * 1.2 + letterOffset * 0.8) * 0.06;
    float floatZ = sin(uTime * 1.8 + letterOffset * 1.2) * 0.08;
    currentPos += vec3(floatX, floatY, floatZ) * morphFactor;

    // Stage 3: Crack & Liquid Energy Explosion (uProgress > 1.0)
    float crackProgress = max(0.0, uProgress - 1.0);
    if (crackProgress > 0.0) {
      vec3 noiseForce = vec3(
        snoise(currentPos * 1.5 + vec3(uTime * 0.8, 0.0, 0.0)),
        snoise(currentPos * 1.5 + vec3(0.0, uTime * 0.8, 0.0)),
        snoise(currentPos * 1.5 + vec3(0.0, 0.0, uTime * 0.8))
      );
      vec3 explodeDir = normalize(aRandomDir + noiseForce * 0.8);
      currentPos += explodeDir * crackProgress * 8.0;
    }

    // Stage 4: Interactive Mouse Repulsion & Wave Ripple
    vec3 distVec = currentPos - uMousePos;
    float dist = length(distVec);
    if (dist < 3.5 && uRepulsionForce > 0.01) {
      float force = (1.0 - dist / 3.5) * uRepulsionForce * 1.5;
      currentPos += normalize(distVec) * force;
    }

    // Wave ripple distortion
    if (uWaveDistortion > 0.01) {
      float wave = sin(dist * 4.0 - uTime * 6.0) * uWaveDistortion * 0.25;
      currentPos.z += wave;
    }

    // Light Streak Flyby Influence
    if (uStreakProgress > 0.01 && uStreakProgress < 0.99) {
      float streakX = (uStreakProgress - 0.5) * 20.0;
      float dToStreak = abs(currentPos.x - streakX);
      if (dToStreak < 2.5) {
        currentPos.z += (2.5 - dToStreak) * 0.8;
      }
    }

    vPosition = currentPos;
    vColor = aColor;

    // Particle size calculation
    float pSize = aSize;
    if (uStreakProgress > 0.01 && uStreakProgress < 0.99) {
      pSize *= 1.8;
    }

    vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = (pSize / -mvPosition.z) * (3.0 + sin(uTime * 3.0 + aSize) * 0.5);

    // Alpha & Glow calculation
    vAlpha = smoothstep(0.0, 0.1, uProgress) * (1.0 - smoothstep(1.8, 2.0, uProgress));
    vGlow = 0.5 + 0.5 * sin(uTime * 2.0 + currentPos.x * 0.5);
  }
`;

export const particleFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uThemeId;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;

  varying vec3 vColor;
  varying float vAlpha;
  varying vec3 vPosition;
  varying float vGlow;
  varying float vLetterIndex;

  void main() {
    // Round particle shape
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft neon radial halo
    float alphaHalo = smoothstep(0.5, 0.0, dist);
    float core = smoothstep(0.2, 0.0, dist);

    // Animated metallic chrome / holographic color shift
    vec3 baseCol = mix(uPrimaryColor, uSecondaryColor, 0.5 + 0.5 * sin(vPosition.x * 0.4 + uTime * 1.5));
    
    // Light reflection streak passing over text
    float sheenSweep = sin(vPosition.x * 0.8 - vPosition.y * 0.4 + uTime * 3.0);
    float sheen = pow(max(0.0, sheenSweep), 8.0);
    vec3 finalColor = mix(baseCol, vec3(1.0, 1.0, 1.0), sheen * 0.8);

    // Sparkle pop
    float sparkle = pow(max(0.0, sin(uTime * 8.0 + vPosition.x * 12.0 + vPosition.y * 9.0)), 12.0);
    finalColor += vec3(1.0, 0.95, 0.8) * sparkle * 1.5;

    gl_FragColor = vec4(finalColor * (1.2 + core * 0.8), (alphaHalo * 0.8 + core * 0.5) * vAlpha);
  }
`;
