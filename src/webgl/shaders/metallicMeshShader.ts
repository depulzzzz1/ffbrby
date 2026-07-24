export const metallicVertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uMousePos;
  uniform float uTiltFactor;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vEyeVector;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vEyeVector = normalize(worldPosition.xyz - cameraPosition);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const metallicFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  uniform float uMetalness;
  uniform float uRoughness;
  uniform float uOpacity;
  uniform float uThemeId; // 0: Chrome, 1: Holographic, 2: Gold, 3: Cyber, 4: Diamond

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  varying vec3 vEyeVector;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vEyeVector);

    // Fresnel Reflection (Glass / Metallic Sheen)
    float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);

    // Animated Specular Light Sweep across text surface
    float lightSweep = sin(vWorldPosition.x * 0.5 - vWorldPosition.y * 0.3 + uTime * 2.2);
    float sweepHighlight = pow(max(0.0, lightSweep), 16.0);

    // Base Metallic Gradient Color
    vec3 metallicColor = mix(uPrimaryColor, uSecondaryColor, 0.5 + 0.5 * sin(vWorldPosition.x * 0.3 + uTime));
    
    // Theme-specific iridescent / holographic rainbow dispersion
    if (uThemeId == 1.0) { // Holographic
      vec3 irid = 0.5 + 0.5 * cos(uTime * 1.5 + vWorldPosition.xyx * 0.8 + vec3(0.0, 2.0, 4.0));
      metallicColor = mix(metallicColor, irid, 0.65);
    } else if (uThemeId == 2.0) { // Gold
      vec3 goldSpec = vec3(1.0, 0.85, 0.4);
      metallicColor = mix(metallicColor, goldSpec, sweepHighlight);
    } else if (uThemeId == 3.0) { // Cyber Neon
      vec3 cyberGlow = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.8), sin(vWorldPosition.x + uTime));
      metallicColor = mix(metallicColor, cyberGlow, 0.5 + fresnel * 0.5);
    } else if (uThemeId == 4.0) { // Diamond Glass
      vec3 diamondDispersion = vec3(
        sin(vWorldPosition.x * 2.0 + uTime),
        cos(vWorldPosition.y * 2.0 + uTime * 1.2),
        sin(vWorldPosition.z * 2.0 + uTime * 0.8)
      ) * 0.5 + 0.5;
      metallicColor = mix(metallicColor, diamondDispersion, fresnel);
    }

    // Add High Contrast Chrome Highlights & Specular Reflection
    vec3 lightDir1 = normalize(vec3(1.0, 1.5, 2.0));
    vec3 lightDir2 = normalize(vec3(-1.5, -1.0, 1.0));
    
    float diff1 = max(0.0, dot(normal, lightDir1));
    float diff2 = max(0.0, dot(normal, lightDir2));

    vec3 reflectDir = reflect(-lightDir1, normal);
    float spec = pow(max(0.0, dot(viewDir, reflectDir)), 32.0);

    vec3 finalColor = metallicColor * (0.3 + diff1 * 0.7 + diff2 * 0.3);
    finalColor += vec3(1.0) * (spec * uMetalness + sweepHighlight * 1.2);
    finalColor += uAccentColor * fresnel * 1.2; // Neon Edge Glow

    gl_FragColor = vec4(finalColor, uOpacity);
  }
`;
