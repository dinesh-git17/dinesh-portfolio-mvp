// path: src/components/sections/Hero/utils/__tests__/deviceCaps.test.ts
// Unit tests for device capability tier decision thresholds and SSR fallback behavior
// Validates AC3/AC4 performance requirements with fast, deterministic Node-only tests

import { describe, expect, it } from 'vitest';

import { benchmarkFps, decideTier, evaluateDeviceCaps } from '../deviceCaps';
import { QualityTier, getQualityConfig } from '../qualityTiers';

describe('Tier Decision Thresholds - Desktop', () => {
  it('assigns HIGH tier for 60fps on desktop', () => {
    const result = decideTier(60, false);
    expect(result).toBe(QualityTier.HIGH);
  });

  it('assigns MEDIUM tier for 54fps on desktop', () => {
    const result = decideTier(54, false);
    expect(result).toBe(QualityTier.MEDIUM);
  });

  it('assigns LOW tier for 39fps on desktop', () => {
    const result = decideTier(39, false);
    expect(result).toBe(QualityTier.LOW);
  });

  it('validates HIGH tier threshold at 55fps boundary', () => {
    expect(decideTier(55, false)).toBe(QualityTier.HIGH);
    expect(decideTier(54, false)).toBe(QualityTier.MEDIUM);
  });

  it('validates MEDIUM tier threshold at 40fps boundary', () => {
    expect(decideTier(40, false)).toBe(QualityTier.MEDIUM);
    expect(decideTier(39, false)).toBe(QualityTier.LOW);
  });
});

describe('Tier Decision Thresholds - Mobile', () => {
  it('assigns MEDIUM tier for 55fps on mobile (no HIGH tier)', () => {
    const result = decideTier(55, true);
    expect(result).toBe(QualityTier.MEDIUM);
  });

  it('assigns MEDIUM tier for 40fps on mobile', () => {
    const result = decideTier(40, true);
    expect(result).toBe(QualityTier.MEDIUM);
  });

  it('assigns LOW tier for 34fps on mobile', () => {
    const result = decideTier(34, true);
    expect(result).toBe(QualityTier.LOW);
  });

  it('validates mobile MEDIUM tier threshold at 50fps boundary', () => {
    expect(decideTier(50, true)).toBe(QualityTier.MEDIUM);
    expect(decideTier(49, true)).toBe(QualityTier.MEDIUM);
  });

  it('validates mobile LOW tier threshold at 35fps boundary', () => {
    expect(decideTier(35, true)).toBe(QualityTier.MEDIUM);
    expect(decideTier(34, true)).toBe(QualityTier.LOW);
  });

  it('never assigns HIGH tier for mobile devices', () => {
    // Test extremely high FPS - should cap at MEDIUM for mobile
    expect(decideTier(120, true)).toBe(QualityTier.MEDIUM);
    expect(decideTier(90, true)).toBe(QualityTier.MEDIUM);
    expect(decideTier(70, true)).toBe(QualityTier.MEDIUM);
  });
});

describe('SSR Fallback - evaluateDeviceCaps in Node', () => {
  it('returns conservative defaults for server-side rendering', async () => {
    // This test runs in Node.js environment (no browser globals)
    const result = await evaluateDeviceCaps();

    expect(result.webglVersion).toBe(0);
    expect(result.isWebGLAvailable).toBe(false);
    expect(result.tier).toBe(QualityTier.LOW);
    expect(result.dpr).toBe(1);
    expect(result.clampedDpr).toBe(1);
    expect(result.fpsEstimate).toBe(0);
  });

  it('matches LOW tier config structure in SSR fallback', async () => {
    const result = await evaluateDeviceCaps();
    const expectedConfig = getQualityConfig(QualityTier.LOW);

    expect(result.config.particles).toBe(expectedConfig.particles);
    expect(result.config.particles).toBe(5000); // AC4 LOW tier requirement
    expect(result.config.renderScale).toBe(expectedConfig.renderScale);
    expect(result.config.dprCapMobile).toBe(expectedConfig.dprCapMobile);
    expect(result.config.dprCapDesktop).toBe(expectedConfig.dprCapDesktop);
  });

  it('includes SSR-specific reason message', async () => {
    const result = await evaluateDeviceCaps();
    expect(result.reason).toBe('Server-side rendering environment');
  });

  it('sets device characteristics to safe defaults', async () => {
    const result = await evaluateDeviceCaps();
    expect(result.isMobile).toBe(false); // Conservative desktop assumption
    expect(result.dpr).toBe(1); // Standard pixel ratio
    expect(result.clampedDpr).toBe(1); // No scaling applied
  });
});

describe('Non-browser Benchmark Guard', () => {
  it('returns conservative default FPS in Node environment', async () => {
    // benchmarkFps should detect Node.js environment and return fallback value
    const fps = await benchmarkFps();
    expect(fps).toBe(30); // Conservative default per implementation
  });

  it('benchmarkFps resolves quickly in Node', async () => {
    const startTime = Date.now();
    await benchmarkFps();
    const elapsed = Date.now() - startTime;

    // Should resolve immediately in Node without RAF delay
    expect(elapsed).toBeLessThan(50);
  });

  it('benchmarkFps handles custom duration parameter in Node', async () => {
    // Should ignore duration parameter and return immediately
    const fps = await benchmarkFps(2000);
    expect(fps).toBe(30);
  });
});

describe('Tier Decision Edge Cases', () => {
  it('handles zero FPS gracefully', () => {
    expect(decideTier(0, false)).toBe(QualityTier.LOW);
    expect(decideTier(0, true)).toBe(QualityTier.LOW);
  });

  it('handles negative FPS gracefully', () => {
    expect(decideTier(-1, false)).toBe(QualityTier.LOW);
    expect(decideTier(-10, true)).toBe(QualityTier.LOW);
  });

  it('handles extremely high FPS', () => {
    expect(decideTier(240, false)).toBe(QualityTier.HIGH);
    expect(decideTier(240, true)).toBe(QualityTier.MEDIUM); // Mobile cap
  });

  it('validates floating point FPS values', () => {
    expect(decideTier(54.9, false)).toBe(QualityTier.MEDIUM);
    expect(decideTier(55.1, false)).toBe(QualityTier.HIGH);
    expect(decideTier(34.9, true)).toBe(QualityTier.LOW);
    expect(decideTier(35.1, true)).toBe(QualityTier.MEDIUM);
  });
});

describe('Configuration Consistency', () => {
  it('validates tier assignments align with AC4 particle counts', () => {
    // Verify tier decisions produce expected particle counts
    const lowConfig = getQualityConfig(decideTier(30, false));
    const mediumConfig = getQualityConfig(decideTier(50, false));
    const highConfig = getQualityConfig(decideTier(70, false));

    expect(lowConfig.particles).toBe(5000);
    expect(mediumConfig.particles).toBe(20000);
    expect(highConfig.particles).toBe(50000);
  });

  it('ensures mobile tier caps align with AC3 requirements', () => {
    // Mobile should never exceed MEDIUM tier
    const mobileHighFps = decideTier(100, true);
    const config = getQualityConfig(mobileHighFps);

    expect(mobileHighFps).toBe(QualityTier.MEDIUM);
    expect(config.particles).toBe(20000); // Not 50k HIGH tier
  });
});
