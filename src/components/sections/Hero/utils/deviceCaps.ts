// path: src/components/sections/Hero/utils/deviceCaps.ts
// Device capability detection and GPU benchmarking for Hero Galaxy 3D scene
// Implements performance tier selection per AC3/AC4 requirements with SSR safety

import { QualityTier, clampDpr, getQualityConfig } from './qualityTiers';

/**
 * Comprehensive device capability data for performance optimization
 * Aligns with AC3 frame rate targets and AC4 quality tier adaptation
 */
export interface DeviceCaps {
  /** WebGL availability status for 3D rendering */
  isWebGLAvailable: boolean;
  /** WebGL version: 0=unavailable, 1=WebGL1, 2=WebGL2 */
  webglVersion: 0 | 1 | 2;
  /** Failure reason if WebGL unavailable */
  reason?: string;
  /** Mobile device detection result */
  isMobile: boolean;
  /** Raw device pixel ratio from browser */
  dpr: number;
  /** DPR clamped per AC3 limits (1.5x mobile, 2.0x desktop) */
  clampedDpr: number;
  /** Estimated FPS from lightweight benchmark */
  fpsEstimate?: number;
  /** Quality tier assignment per AC3/AC4 thresholds */
  tier: QualityTier;
  /** Quality configuration for assigned tier */
  config: ReturnType<typeof getQualityConfig>;
}

/**
 * SSR-safe browser environment detection
 * Prevents server-side rendering errors from window access
 * @returns true if running in browser environment
 */
export function isBrowser(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  );
}

/**
 * Conservative mobile device detection via User Agent
 * Uses standard UA patterns to avoid false positives on tablet devices
 * @returns true if mobile device detected
 */
export function isMobileUA(): boolean {
  if (!isBrowser()) return false;

  const ua = navigator.userAgent.toLowerCase();
  const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod'];

  return (
    mobileKeywords.some(keyword => ua.includes(keyword)) &&
    !ua.includes('tablet') &&
    !ua.includes('ipad')
  );
}

/**
 * WebGL context detection with version capability checking
 * Tests WebGL2 first, falls back to WebGL1, handles failures gracefully
 * @returns WebGL availability status with version and failure reason
 */
export function detectWebGLVersion(): {
  available: boolean;
  version: 0 | 1 | 2;
  reason?: string;
} {
  if (!isBrowser()) {
    return { available: false, version: 0, reason: 'SSR environment' };
  }

  try {
    const canvas = document.createElement('canvas');

    // Test WebGL2 first for best performance
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      return { available: true, version: 2 };
    }

    // Fallback to WebGL1
    const gl1 =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl1) {
      return { available: true, version: 1 };
    }

    return { available: false, version: 0, reason: 'WebGL not supported' };
  } catch (error) {
    return {
      available: false,
      version: 0,
      reason: `WebGL detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Lightweight FPS benchmark using requestAnimationFrame
 * Measures frame timing over specified duration for performance estimation
 * AC3 targets: ≥45fps mid-tier, ≥30fps low-tier devices
 * @param durationMs - Benchmark duration in milliseconds (default: 700ms)
 * @returns Promise resolving to estimated FPS
 */
export function benchmarkFps(durationMs = 700): Promise<number> {
  if (!isBrowser()) {
    return Promise.resolve(30); // Conservative default for SSR
  }

  return new Promise(resolve => {
    let frameCount = 0;
    let startTime = 0;

    function frame(currentTime: number) {
      if (startTime === 0) {
        startTime = currentTime;
      }

      frameCount++;

      if (currentTime - startTime < durationMs) {
        requestAnimationFrame(frame);
      } else {
        const elapsed = currentTime - startTime;
        const fps = (frameCount * 1000) / elapsed;
        resolve(Math.round(fps));
      }
    }

    requestAnimationFrame(frame);
  });
}

/**
 * Quality tier decision logic based on FPS benchmark and device type
 * Implements AC3 frame rate requirements and AC4 adaptation thresholds
 * Conservative mobile thresholds account for thermal throttling
 * @param fps - Estimated FPS from benchmark
 * @param isMobile - Mobile device detection result
 * @returns Quality tier assignment per AC3/AC4 specifications
 */
export function decideTier(fps: number, isMobile: boolean): QualityTier {
  if (isMobile) {
    // Mobile tier thresholds (conservative due to thermal limits)
    if (fps >= 50) return QualityTier.MEDIUM; // No HIGH tier for mobile
    if (fps >= 35) return QualityTier.MEDIUM;
    return QualityTier.LOW; // < 35fps
  } else {
    // Desktop tier thresholds (AC3: ≥45fps mid-tier requirement)
    if (fps >= 55) return QualityTier.HIGH;
    if (fps >= 40) return QualityTier.MEDIUM; // 40-54fps range
    return QualityTier.LOW; // < 40fps
  }
}

/**
 * Comprehensive device capability evaluation with performance benchmarking
 * Main API for determining quality tier and render configuration
 * Handles SSR safety, WebGL detection, FPS benchmarking, and tier assignment
 * @returns Promise resolving to complete device capability assessment
 */
export async function evaluateDeviceCaps(): Promise<DeviceCaps> {
  // SSR safety: return conservative defaults for server-side rendering
  if (!isBrowser()) {
    return {
      isWebGLAvailable: false,
      webglVersion: 0,
      reason: 'Server-side rendering environment',
      isMobile: false,
      dpr: 1,
      clampedDpr: 1,
      fpsEstimate: 0,
      tier: QualityTier.LOW,
      config: getQualityConfig(QualityTier.LOW),
    };
  }

  // Device type and pixel ratio detection
  const isMobile = isMobileUA();
  const dpr = window.devicePixelRatio || 1;
  const clampedDpr = clampDpr(dpr, isMobile);

  // WebGL capability detection
  const webglResult = detectWebGLVersion();

  // Early exit for WebGL unavailable - force LOW tier
  if (!webglResult.available) {
    return {
      isWebGLAvailable: false,
      webglVersion: webglResult.version,
      reason: webglResult.reason || 'WebGL detection failed',
      isMobile,
      dpr,
      clampedDpr,
      fpsEstimate: 0,
      tier: QualityTier.LOW,
      config: getQualityConfig(QualityTier.LOW),
    };
  }

  // FPS benchmarking for performance-based tier selection
  const fpsEstimate = await benchmarkFps();
  const tier = decideTier(fpsEstimate, isMobile);
  const config = getQualityConfig(tier);

  return {
    isWebGLAvailable: true,
    webglVersion: webglResult.version,
    isMobile,
    dpr,
    clampedDpr,
    fpsEstimate,
    tier,
    config,
  };
}
