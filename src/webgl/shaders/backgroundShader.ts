export const backgroundVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const backgroundFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uBgStart;
  uniform vec3 uBgEnd;
  uniform float uThemeId;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = gl_FragCoord.xy / uResolution.xy;
    vec2 normMouse = uMouse * 0.5 + 0.5;

    // Dark luxury base gradient
    vec3 color = mix(uBgStart, uBgEnd, st.y);

    // Animated Aurora mesh waves
    float n1 = snoise(st * 2.5 + vec2(uTime * 0.1, uTime * 0.15));
    float n2 = snoise(st * 4.0 - vec2(uTime * 0.2, uTime * 0.1));
    float aurora = smoothstep(0.1, 0.8, n1 * 0.5 + n2 * 0.5);

    vec3 auroraColor = mix(uBgStart * 2.0, vec3(0.1, 0.4, 0.8), aurora);
    color += auroraColor * 0.35;

    // Volumetric Light Rays originating from mouse position
    vec2 lightOrigin = normMouse;
    vec2 delta = st - lightOrigin;
    float dist = length(delta);
    float ray = pow(max(0.0, 1.0 - dist), 3.0);
    
    float rayNoise = snoise(vec2(atan(delta.y, delta.x) * 3.0, uTime * 0.5));
    color += vec3(0.4, 0.6, 1.0) * ray * (0.5 + rayNoise * 0.5) * 0.3;

    // Vignette
    float vignette = 1.0 - smoothstep(0.4, 1.4, length(st - vec2(0.5)));
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
