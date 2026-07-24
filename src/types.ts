export type WordName = 'DANTO' | 'APUT' | 'TARDI' | 'ROMIN' | 'SUTRISNO';

export const WORDS: WordName[] = ['DANTO', 'APUT', 'TARDI', 'ROMIN', 'SUTRISNO'];

export enum AnimationStage {
  DARK_SCREEN = 0,
  LIGHT_STREAK = 1,
  PARTICLE_SPAWN = 2,
  GALAXY_SWIRL = 3,
  MERGE_LETTERS = 4,
  METALLIC_SHINE = 5,
  NEON_GLOW = 6,
  FLOATING_SPACE = 7,
  LIGHT_REFLECTIONS = 8,
  SPARKLE_BURSTS = 9,
  CRACK_FRAGMENTS = 10,
  LIQUID_ENERGY = 11,
  MORPH_NEXT = 12,
}

export type ThemeStyle = 'chrome' | 'holographic' | 'gold' | 'neon' | 'diamond';

export interface ThemeConfig {
  id: ThemeStyle;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  metalness: number;
  roughness: number;
  bgGradientStart: string;
  bgGradientEnd: string;
}

export interface EngineSettings {
  theme: ThemeStyle;
  particleDensity: 'ultra' | 'high' | 'medium'; // 25,000 | 15,000 | 8,000
  fontSize: number;
  fontFamily: string;
  speed: number;
  soundEnabled: boolean;
  autoLoop: boolean;
  mouseRepulsion: boolean;
  tiltEnabled: boolean;
  qualityFPS: 120 | 60 | 30;
}

export interface ParticlePoint {
  x: number;
  y: number;
  z: number;
  letterIndex: number;
  u: number;
  v: number;
  nx: number;
  ny: number;
  nz: number;
}
