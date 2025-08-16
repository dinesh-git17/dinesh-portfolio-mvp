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

// WebGL context type alias for proper typing
type GL = WebGLRenderingContext | WebGL2RenderingContext;

/**
 * WebGL context detection with version capability checking
 * Tests WebGL2 first, falls back to WebGL1, handles failures gracefully
 * Uses separate canvas elements to prevent context conflicts with R3F
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
    // Test WebGL2 first - use dedicated canvas
    const canvas2 = document.createElement('canvas');
    const gl2 = canvas2.getContext('webgl2') as WebGL2RenderingContext | null;
    if (gl2) {
      // Clean disposal to prevent context conflicts
      const loseExt = gl2.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
      return { available: true, version: 2 };
    }

    // Test WebGL1 - use separate canvas to avoid conflicts
    const canvas1 = document.createElement('canvas');
    const gl1 = (canvas1.getContext('webgl') ||
      canvas1.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl1) {
      // Clean disposal to prevent context conflicts
      const loseExt = gl1.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
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
 * Lightweight FPS benchmark for performance tier assignment
 * Creates temporary off-screen rendering context to measure GPU performance
 * @returns Promise resolving to estimated FPS capability
 */
export async function benchmarkFps(): Promise<number> {
  if (!isBrowser()) return 30; // Conservative SSR default

  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    canvas.style.position = 'absolute';
    canvas.style.left = '-1000px';
    canvas.style.top = '-1000px';
    document.body.appendChild(canvas);

    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as GL | null;
    if (!gl) {
      document.body.removeChild(canvas);
      resolve(15); // Low-end fallback
      return;
    }

    // Simple rendering benchmark
    let frames = 0;
    const startTime = performance.now();
    const duration = 500; // 500ms test

    function renderFrame() {
      if (!gl) return; // Additional null guard for closure

      if (performance.now() - startTime >= duration) {
        const fps = Math.round((frames * 1000) / duration);

        // Clean up
        const loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt) loseExt.loseContext();
        document.body.removeChild(canvas);

        resolve(Math.min(fps, 120)); // Cap at 120fps
        return;
      }

      // Simple render operations
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      frames++;
      requestAnimationFrame(renderFrame);
    }

    renderFrame();
  });
}

/**
 * Quality tier selection based on device capabilities and FPS benchmark
 * Implements AC3/AC4 performance thresholds with mobile-specific adjustments
 * @param fps Estimated or measured FPS capability
 * @param isMobile Mobile device flag for tier adjustment
 * @returns Appropriate quality tier assignment
 */
export function decideTier(fps: number, isMobile: boolean): QualityTier {
  // Mobile tier caps per AC3 requirements
  if (isMobile) {
    if (fps >= 50) return QualityTier.MEDIUM;
    return QualityTier.LOW;
  }

  // Desktop tier thresholds
  if (fps >= 55) return QualityTier.HIGH;
  if (fps >= 40) return QualityTier.MEDIUM;
  return QualityTier.LOW;
}

/**
 * Complete device capability evaluation
 * Orchestrates all detection methods and returns comprehensive capability data
 * @returns Promise resolving to complete device capability assessment
 */
export async function evaluateDeviceCaps(): Promise<DeviceCaps> {
  // SSR safety fallback
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
