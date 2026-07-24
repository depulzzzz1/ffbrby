import * as THREE from 'three';
import gsap from 'gsap';
import { EngineSettings, ParticlePoint, ThemeConfig, WordName, WORDS } from '../types';
import { TextGeometrySampler } from './TextGeometrySampler';
import { particleVertexShader, particleFragmentShader } from './shaders/particleShader';
import { metallicVertexShader, metallicFragmentShader } from './shaders/metallicMeshShader';
import { backgroundVertexShader, backgroundFragmentShader } from './shaders/backgroundShader';
import { soundEngine } from '../audio/soundEngine';

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  chrome: {
    id: 'chrome',
    name: 'Liquid Chrome',
    primaryColor: '#e0e6ed',
    secondaryColor: '#8899a6',
    accentColor: '#38bdf8',
    glowColor: '#0284c7',
    metalness: 0.95,
    roughness: 0.1,
    bgGradientStart: '#030712',
    bgGradientEnd: '#0f172a',
  },
  holographic: {
    id: 'holographic',
    name: 'Holographic Prism',
    primaryColor: '#f43f5e',
    secondaryColor: '#8b5cf6',
    accentColor: '#06b6d4',
    glowColor: '#a855f7',
    metalness: 0.9,
    roughness: 0.15,
    bgGradientStart: '#090514',
    bgGradientEnd: '#180a29',
  },
  gold: {
    id: 'gold',
    name: '24K Luxury Gold',
    primaryColor: '#fbbf24',
    secondaryColor: '#d97706',
    accentColor: '#fef08a',
    glowColor: '#f59e0b',
    metalness: 0.98,
    roughness: 0.08,
    bgGradientStart: '#110c03',
    bgGradientEnd: '#1e1606',
  },
  neon: {
    id: 'neon',
    name: 'Cyber Neon',
    primaryColor: '#00f0ff',
    secondaryColor: '#ff007f',
    accentColor: '#7000ff',
    glowColor: '#00f0ff',
    metalness: 0.85,
    roughness: 0.2,
    bgGradientStart: '#03001e',
    bgGradientEnd: '#12002b',
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Crystal',
    primaryColor: '#ffffff',
    secondaryColor: '#c7d2fe',
    accentColor: '#818cf8',
    glowColor: '#a5b4fc',
    metalness: 0.7,
    roughness: 0.05,
    bgGradientStart: '#050814',
    bgGradientEnd: '#111827',
  },
};

export class TextAnimationEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private sampler: TextGeometrySampler;
  private settings: EngineSettings;

  // WebGL Objects
  private backgroundMesh!: THREE.Mesh;
  private backgroundMaterial!: THREE.ShaderMaterial;
  private particleSystem!: THREE.Points;
  private particleMaterial!: THREE.ShaderMaterial;
  private particleGeometry!: THREE.BufferGeometry;
  private lightStreakMesh!: THREE.Mesh;
  private lightStreakMaterial!: THREE.ShaderMaterial;
  private backgroundDust!: THREE.Points;

  // Animation State
  private currentWordIndex: number = 0;
  private currentParticleCount: number = 20000;
  private animationTimeline: gsap.core.Timeline | null = null;
  private clock: THREE.Clock = new THREE.Clock();
  private mousePos: THREE.Vector2 = new THREE.Vector2(0, 0);
  private targetMousePos: THREE.Vector2 = new THREE.Vector2(0, 0);
  private isDestroyed: boolean = false;
  private onWordChangeCallback?: (word: WordName, stepIndex: number) => void;

  // Word points data cache
  private wordPointsMap: Map<WordName, ParticlePoint[]> = new Map();

  constructor(container: HTMLElement, settings: EngineSettings, onWordChange?: (word: WordName, stepIndex: number) => void) {
    this.container = container;
    this.settings = settings;
    this.onWordChangeCallback = onWordChange;

    this.currentParticleCount = settings.particleDensity === 'ultra' ? 25000 : settings.particleDensity === 'high' ? 18000 : 10000;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 14);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 3. Text Sampler
    this.sampler = new TextGeometrySampler();

    // 4. Pre-sample points for all 5 words
    WORDS.forEach(word => {
      const points = this.sampler.sampleWordPoints(word, this.currentParticleCount);
      this.wordPointsMap.set(word, points);
    });

    // 5. Build WebGL Objects
    this.createBackground();
    this.createLightStreak();
    this.createParticleSystem();
    this.createBackgroundDust();

    // 6. Listeners & Loop
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onTouchMove, { passive: true });

    // 7. Start Loop & Timeline
    this.animate();
    this.startSequenceForWord(WORDS[0]);
  }

  private createBackground() {
    const geo = new THREE.PlaneGeometry(30, 20);
    const theme = THEME_CONFIGS[this.settings.theme] || THEME_CONFIGS.chrome;

    this.backgroundMaterial = new THREE.ShaderMaterial({
      vertexShader: backgroundVertexShader,
      fragmentShader: backgroundFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uBgStart: { value: new THREE.Color(theme.bgGradientStart) },
        uBgEnd: { value: new THREE.Color(theme.bgGradientEnd) },
        uThemeId: { value: 0 },
      },
      depthWrite: false,
    });

    this.backgroundMesh = new THREE.Mesh(geo, this.backgroundMaterial);
    this.backgroundMesh.position.z = -5;
    this.scene.add(this.backgroundMesh);
  }

  private createLightStreak() {
    const geo = new THREE.PlaneGeometry(16, 0.4);
    this.lightStreakMaterial = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uProgress;
        uniform vec3 uColor;
        varying vec2 vUv;
        void main() {
          float dist = abs(vUv.x - uProgress);
          float glow = pow(max(0.0, 1.0 - dist * 4.0), 3.0);
          float verticalFade = sin(vUv.y * 3.14159);
          gl_FragColor = vec4(uColor * 2.0, glow * verticalFade);
        }
      `,
      uniforms: {
        uProgress: { value: -0.5 },
        uColor: { value: new THREE.Color('#38bdf8') },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.lightStreakMesh = new THREE.Mesh(geo, this.lightStreakMaterial);
    this.lightStreakMesh.position.z = 1;
    this.scene.add(this.lightStreakMesh);
  }

  private createParticleSystem() {
    const count = this.currentParticleCount;
    this.particleGeometry = new THREE.BufferGeometry();

    const initialPositions = new Float32Array(count * 3);
    const targetPositions = new Float32Array(count * 3);
    const randomDirs = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const letterIndices = new Float32Array(count);

    const firstWordPoints = this.wordPointsMap.get(WORDS[0]) || [];
    const theme = THEME_CONFIGS[this.settings.theme];
    const primaryCol = new THREE.Color(theme.primaryColor);
    const secondaryCol = new THREE.Color(theme.secondaryColor);

    for (let i = 0; i < count; i++) {
      // Start position (Swirling Galaxy)
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 8;
      initialPositions[i * 3] = Math.cos(angle) * radius;
      initialPositions[i * 3 + 1] = Math.sin(angle) * radius;
      initialPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      // Target position
      const p = firstWordPoints[i % firstWordPoints.length] || { x: 0, y: 0, z: 0, letterIndex: 0 };
      targetPositions[i * 3] = p.x;
      targetPositions[i * 3 + 1] = p.y;
      targetPositions[i * 3 + 2] = p.z;

      letterIndices[i] = p.letterIndex;

      // Random explosion direction
      randomDirs[i * 3] = (Math.random() - 0.5) * 2;
      randomDirs[i * 3 + 1] = (Math.random() - 0.5) * 2;
      randomDirs[i * 3 + 2] = (Math.random() - 0.5) * 2;

      sizes[i] = 12 + Math.random() * 18;

      const col = primaryCol.clone().lerp(secondaryCol, Math.random());
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    this.particleGeometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(targetPositions, 3));
    this.particleGeometry.setAttribute('aRandomDir', new THREE.BufferAttribute(randomDirs, 3));
    this.particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    this.particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('aLetterIndex', new THREE.BufferAttribute(letterIndices, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uStreakProgress: { value: 0 },
        uMousePos: { value: new THREE.Vector3() },
        uRepulsionForce: { value: this.settings.mouseRepulsion ? 1.0 : 0.0 },
        uWaveDistortion: { value: 0 },
        uThemeId: { value: 0 },
        uPrimaryColor: { value: primaryCol },
        uSecondaryColor: { value: secondaryCol },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particleSystem = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.scene.add(this.particleSystem);
  }

  private createBackgroundDust() {
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = -2 - Math.random() * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });

    this.backgroundDust = new THREE.Points(geo, mat);
    this.scene.add(this.backgroundDust);
  }

  // --- Sequence Control ---
  public startSequenceForWord(word: WordName) {
    if (this.animationTimeline) {
      this.animationTimeline.kill();
    }

    const wordPoints = this.wordPointsMap.get(word);
    if (!wordPoints) return;

    // Update target positions buffer
    const targetAttr = this.particleGeometry.attributes.aTargetPosition as THREE.BufferAttribute;
    const targetArr = targetAttr.array as Float32Array;
    const letterAttr = this.particleGeometry.attributes.aLetterIndex as THREE.BufferAttribute;
    const letterArr = letterAttr.array as Float32Array;

    for (let i = 0; i < this.currentParticleCount; i++) {
      const p = wordPoints[i % wordPoints.length];
      targetArr[i * 3] = p.x;
      targetArr[i * 3 + 1] = p.y;
      targetArr[i * 3 + 2] = p.z;
      letterArr[i] = p.letterIndex;
    }
    targetAttr.needsUpdate = true;
    letterAttr.needsUpdate = true;

    // Build Master Sequence Timeline
    const tl = gsap.timeline({
      onStart: () => {
        if (this.onWordChangeCallback) this.onWordChangeCallback(word, 1);
      },
      onComplete: () => {
        if (this.settings.autoLoop) {
          this.nextWord();
        }
      },
    });

    this.animationTimeline = tl;

    // Reset progress uniforms
    this.particleMaterial.uniforms.uProgress.value = 0;
    this.lightStreakMaterial.uniforms.uProgress.value = -0.5;

    // Step 1: Dark Screen to Glowing Light Streak
    tl.to(
      this.lightStreakMaterial.uniforms.uProgress,
      {
        value: 1.5,
        duration: 1.2,
        ease: 'power2.inOut',
        onStart: () => {
          soundEngine.playLightStreak();
          if (this.onWordChangeCallback) this.onWordChangeCallback(word, 2);
        },
      },
      0.2
    );

    // Step 2: Particles Swirl & Condense into Metallic Letters
    tl.to(
      this.particleMaterial.uniforms.uProgress,
      {
        value: 1.0,
        duration: 2.2,
        ease: 'expo.out',
        onStart: () => {
          soundEngine.playParticleSwirl();
          if (this.onWordChangeCallback) this.onWordChangeCallback(word, 4);
        },
      },
      1.0
    );

    // Step 3: Metallic Snap & Hold floating state
    tl.add(() => {
      soundEngine.playMetallicSnap();
      if (this.onWordChangeCallback) this.onWordChangeCallback(word, 6);
    }, 3.2);

    // Wave distortion pulse during hold
    tl.to(
      this.particleMaterial.uniforms.uWaveDistortion,
      {
        value: 1.0,
        duration: 0.8,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      },
      3.5
    );

    // Step 4: Disintegrate into Liquid Energy Explosion
    tl.to(
      this.particleMaterial.uniforms.uProgress,
      {
        value: 2.0,
        duration: 1.6,
        ease: 'power3.in',
        onStart: () => {
          soundEngine.playDisintegrate();
          if (this.onWordChangeCallback) this.onWordChangeCallback(word, 10);
        },
      },
      5.5
    );
  }

  public nextWord() {
    this.currentWordIndex = (this.currentWordIndex + 1) % WORDS.length;
    this.startSequenceForWord(WORDS[this.currentWordIndex]);
  }

  public prevWord() {
    this.currentWordIndex = (this.currentWordIndex - 1 + WORDS.length) % WORDS.length;
    this.startSequenceForWord(WORDS[this.currentWordIndex]);
  }

  public selectWord(word: WordName) {
    const idx = WORDS.indexOf(word);
    if (idx !== -1) {
      this.currentWordIndex = idx;
      this.startSequenceForWord(word);
    }
  }

  public updateTheme(themeKey: string) {
    const theme = THEME_CONFIGS[themeKey];
    if (!theme) return;
    this.settings.theme = themeKey as any;

    const primaryCol = new THREE.Color(theme.primaryColor);
    const secondaryCol = new THREE.Color(theme.secondaryColor);

    this.particleMaterial.uniforms.uPrimaryColor.value = primaryCol;
    this.particleMaterial.uniforms.uSecondaryColor.value = secondaryCol;
    this.backgroundMaterial.uniforms.uBgStart.value = new THREE.Color(theme.bgGradientStart);
    this.backgroundMaterial.uniforms.uBgEnd.value = new THREE.Color(theme.bgGradientEnd);
    this.lightStreakMaterial.uniforms.uColor.value = new THREE.Color(theme.accentColor);
  }

  public toggleSound(enabled: boolean) {
    this.settings.soundEnabled = enabled;
    soundEngine.setMuted(!enabled);
  }

  // --- Animation Loop ---
  private animate = () => {
    if (this.isDestroyed) return;
    requestAnimationFrame(this.animate);

    const elapsedTime = this.clock.getElapsedTime();

    // Smooth mouse interpolation
    this.mousePos.lerp(this.targetMousePos, 0.08);

    // Update Shader Uniforms
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = elapsedTime;
      this.particleMaterial.uniforms.uMousePos.value.set(this.mousePos.x * 5, this.mousePos.y * 3, 0);
    }

    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.uTime.value = elapsedTime;
      this.backgroundMaterial.uniforms.uMouse.value.copy(this.mousePos);
    }

    // Parallax Camera 3D Tilt
    if (this.settings.tiltEnabled) {
      this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.mousePos.x * 1.5, 0.05);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.mousePos.y * 1.0, 0.05);
      this.camera.lookAt(0, 0, 0);
    }

    // Drifting background dust
    if (this.backgroundDust) {
      this.backgroundDust.rotation.y = elapsedTime * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onMouseMove = (e: MouseEvent) => {
    this.targetMousePos.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.targetMousePos.y = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.targetMousePos.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      this.targetMousePos.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
  };

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.backgroundMaterial) {
      this.backgroundMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationTimeline) this.animationTimeline.kill();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onTouchMove);
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
