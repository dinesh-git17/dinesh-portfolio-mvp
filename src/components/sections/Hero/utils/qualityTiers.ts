// path: src/components/sections/Hero/utils/qualityTiers.ts
// Quality tier system for Hero Galaxy 3D scene performance optimization
// Maps device capabilities to particle counts and render settings per AC3/AC4

/**
 * Quality tier enumeration for device capability-based performance scaling
 * Maps to AC4 particle count targets: LOW=5k, MEDIUM=20k, HIGH=50k
 */
export enum QualityTier {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/**
 * Configuration interface for quality tier settings
 * Defines performance targets and render parameters per AC3/AC4
 */
export interface QualityConfig {
  /** Particle count for starfield - AC4 scaling targets */
  particles: number;
  /** Render scale multiplier (0.8-1.0) for resolution adjustment */
  renderScale: number;
  /** Device pixel ratio cap for mobile devices */
  dprCapMobile: number;
  /** Device pixel ratio cap for desktop devices */
  dprCapDesktop: number;
  /** Target FPS for mid-tier devices per AC3 */
  targetFpsMid: number;
  /** Target FPS for low-tier devices per AC3 */
  targetFpsLow: number;
}

/**
 * Quality configuration mapping per AC3/AC4 requirements
 * LOW: 5k particles, conservative settings for ≥30fps on low-tier
 * MEDIUM: 20k particles, balanced settings for ≥45fps on mid-tier
 * HIGH: 50k particles, maximum quality for capable devices
 */
export const QUALITY_CONFIG: Record<QualityTier, QualityConfig> = {
  [QualityTier.LOW]: {
    particles: 5000,
    renderScale: 0.8,
    dprCapMobile: 1.5,
    dprCapDesktop: 2.0,
    targetFpsMid: 45,
    targetFpsLow: 30,
  },
  [QualityTier.MEDIUM]: {
    particles: 20000,
    renderScale: 0.9,
    dprCapMobile: 1.5,
    dprCapDesktop: 2.0,
    targetFpsMid: 45,
    targetFpsLow: 30,
  },
  [QualityTier.HIGH]: {
    particles: 50000,
    renderScale: 1.0,
    dprCapMobile: 1.5,
    dprCapDesktop: 2.0,
    targetFpsMid: 45,
    targetFpsLow: 30,
  },
};

/**
 * Quick reference for AC4 particle count targets
 * Used by scene components and tests for validation
 */
export const QUALITY_PARTICLE_TARGETS = {
  LOW: 5000,
  MEDIUM: 20000,
  HIGH: 50000,
} as const;

/**
 * Retrieves quality configuration for specified tier
 * @param tier - Quality tier enum value
 * @returns Configuration object with performance settings
 */
export function getQualityConfig(tier: QualityTier): QualityConfig {
  return QUALITY_CONFIG[tier];
}

/**
 * Clamps device pixel ratio per mobile/desktop constraints
 * Enforces AC3 DPR limits: mobile 1.5x, desktop 2.0x max
 * @param dpr - Raw device pixel ratio from window.devicePixelRatio
 * @param isMobile - Device type detection result
 * @returns Clamped DPR value within tier constraints
 */
export function clampDpr(dpr: number, isMobile: boolean): number {
  const maxDpr = isMobile
    ? QUALITY_CONFIG[QualityTier.LOW].dprCapMobile
    : QUALITY_CONFIG[QualityTier.LOW].dprCapDesktop;
  return Math.min(dpr, maxDpr);
}
