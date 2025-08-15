// path: src/components/sections/Hero/utils/__tests__/qualityTiers.test.ts
// Unit tests for quality tier particle targets and DPR caps per AC4/Jira constraints
// Validates device capability thresholds and configuration integrity

import { describe, expect, it } from 'vitest';

import {
  QUALITY_CONFIG,
  QUALITY_PARTICLE_TARGETS,
  QualityTier,
  clampDpr,
  getQualityConfig,
} from '../qualityTiers';

describe('Quality Tier Particle Targets', () => {
  it('enforces AC4 particle count requirements', () => {
    // AC4 specification: LOW=5k, MEDIUM=20k, HIGH=50k particles
    expect(QUALITY_PARTICLE_TARGETS.LOW).toBe(5000);
    expect(QUALITY_PARTICLE_TARGETS.MEDIUM).toBe(20000);
    expect(QUALITY_PARTICLE_TARGETS.HIGH).toBe(50000);
  });

  it('matches QUALITY_CONFIG particle counts to targets', () => {
    expect(QUALITY_CONFIG[QualityTier.LOW].particles).toBe(5000);
    expect(QUALITY_CONFIG[QualityTier.MEDIUM].particles).toBe(20000);
    expect(QUALITY_CONFIG[QualityTier.HIGH].particles).toBe(50000);
  });

  it('validates getQualityConfig returns correct particle counts', () => {
    expect(getQualityConfig(QualityTier.LOW).particles).toBe(5000);
    expect(getQualityConfig(QualityTier.MEDIUM).particles).toBe(20000);
    expect(getQualityConfig(QualityTier.HIGH).particles).toBe(50000);
  });
});

describe('DPR Capping (Device Pixel Ratio)', () => {
  it('enforces mobile DPR cap at 1.5x', () => {
    expect(clampDpr(3.0, true)).toBe(1.5);
    expect(clampDpr(2.5, true)).toBe(1.5);
    expect(clampDpr(1.8, true)).toBe(1.5);
    expect(clampDpr(1.0, true)).toBe(1.0); // No upscaling
  });

  it('enforces desktop DPR cap at 2.0x', () => {
    expect(clampDpr(3.0, false)).toBe(2.0);
    expect(clampDpr(2.5, false)).toBe(2.0);
    expect(clampDpr(1.5, false)).toBe(1.5);
    expect(clampDpr(1.0, false)).toBe(1.0); // No upscaling
  });

  it('handles edge cases and boundary values', () => {
    // Exact boundary values
    expect(clampDpr(1.5, true)).toBe(1.5);
    expect(clampDpr(2.0, false)).toBe(2.0);

    // Zero and negative values (defensive)
    expect(clampDpr(0, true)).toBe(0);
    expect(clampDpr(-1, false)).toBe(-1);
  });
});

describe('Quality Configuration Shape', () => {
  it('validates render scale ranges for all tiers', () => {
    Object.values(QualityTier).forEach(tier => {
      const config = getQualityConfig(tier);
      expect(config.renderScale).toBeGreaterThanOrEqual(0.8);
      expect(config.renderScale).toBeLessThanOrEqual(1.0);
    });
  });

  it('enforces AC3 FPS targets', () => {
    Object.values(QualityTier).forEach(tier => {
      const config = getQualityConfig(tier);
      expect(config.targetFpsMid).toBeGreaterThanOrEqual(45);
      expect(config.targetFpsLow).toBeGreaterThanOrEqual(30);
    });
  });

  it('validates DPR cap consistency across tiers', () => {
    Object.values(QualityTier).forEach(tier => {
      const config = getQualityConfig(tier);
      expect(config.dprCapMobile).toBe(1.5);
      expect(config.dprCapDesktop).toBe(2.0);
    });
  });

  it('ensures complete configuration structure', () => {
    Object.values(QualityTier).forEach(tier => {
      const config = getQualityConfig(tier);
      expect(config).toHaveProperty('particles');
      expect(config).toHaveProperty('renderScale');
      expect(config).toHaveProperty('dprCapMobile');
      expect(config).toHaveProperty('dprCapDesktop');
      expect(config).toHaveProperty('targetFpsMid');
      expect(config).toHaveProperty('targetFpsLow');
    });
  });
});

describe('QualityTier Enum Integrity', () => {
  it('contains exactly three tier values', () => {
    const tierValues = Object.values(QualityTier);
    expect(tierValues).toHaveLength(3);
  });

  it('validates expected tier string values', () => {
    expect(Object.values(QualityTier)).toEqual(
      expect.arrayContaining(['LOW', 'MEDIUM', 'HIGH'])
    );
  });

  it('ensures all tiers have corresponding configs', () => {
    Object.values(QualityTier).forEach(tier => {
      expect(QUALITY_CONFIG).toHaveProperty(tier);
      expect(getQualityConfig(tier)).toBeDefined();
    });
  });
});

describe('Configuration Invariants', () => {
  it('enforces ascending particle counts by tier', () => {
    const lowParticles = QUALITY_CONFIG[QualityTier.LOW].particles;
    const mediumParticles = QUALITY_CONFIG[QualityTier.MEDIUM].particles;
    const highParticles = QUALITY_CONFIG[QualityTier.HIGH].particles;

    expect(lowParticles).toBeLessThan(mediumParticles);
    expect(mediumParticles).toBeLessThan(highParticles);
  });

  it('enforces ascending render scales by tier', () => {
    const lowScale = QUALITY_CONFIG[QualityTier.LOW].renderScale;
    const mediumScale = QUALITY_CONFIG[QualityTier.MEDIUM].renderScale;
    const highScale = QUALITY_CONFIG[QualityTier.HIGH].renderScale;

    expect(lowScale).toBeLessThanOrEqual(mediumScale);
    expect(mediumScale).toBeLessThanOrEqual(highScale);
  });

  it('validates numeric types for all config values', () => {
    Object.values(QualityTier).forEach(tier => {
      const config = getQualityConfig(tier);
      expect(typeof config.particles).toBe('number');
      expect(typeof config.renderScale).toBe('number');
      expect(typeof config.dprCapMobile).toBe('number');
      expect(typeof config.dprCapDesktop).toBe('number');
      expect(typeof config.targetFpsMid).toBe('number');
      expect(typeof config.targetFpsLow).toBe('number');
    });
  });
});
