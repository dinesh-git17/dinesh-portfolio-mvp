// path: src/components/sections/Hero/state/heroStore.ts
// Centralized Zustand store for Hero Galaxy 3D scene state management
// Tracks device capabilities, quality tiers, FPS, and loading states per AC3/AC4

import { create } from 'zustand';

import type { DeviceCaps } from '../utils/deviceCaps';
import { QualityTier, getQualityConfig } from '../utils/qualityTiers';

/**
 * Comprehensive Hero scene state interface
 * Covers all aspects of 3D scene management and performance optimization
 * AC3: Frame rate tracking and maintenance
 * AC4: Quality tier adaptation and configuration
 */
interface HeroState {
  // Loading and availability states
  /** Scene loading completion status */
  isLoaded: boolean;
  /** WebGL context availability for 3D rendering */
  isWebGLAvailable: boolean;
  /** WebGL version: 0=unavailable, 1=WebGL1, 2=WebGL2 */
  webglVersion: 0 | 1 | 2;

  // Device characteristics
  /** Mobile device detection result */
  isMobile: boolean;
  /** Raw device pixel ratio from browser */
  dpr: number;
  /** DPR clamped per AC3 limits (1.5x mobile, 2.0x desktop) */
  clampedDpr: number;

  // Performance tracking (AC3: Frame Rate Maintenance)
  /** Current FPS measurement for performance monitoring */
  fps: number;

  // Quality management (AC4: Quality Tier Adaptation)
  /** Current quality tier assignment */
  tier: QualityTier;
  /** Quality configuration for current tier */
  config: ReturnType<typeof getQualityConfig>;

  // Error handling
  /** Error message if initialization or runtime failures occur */
  error?: string;
}

/**
 * Hero store actions interface
 * Defines mutations for device capability updates, tier changes, and state management
 */
interface HeroActions {
  /**
   * Apply device capabilities assessment results
   * Updates all capability fields and recomputes configuration
   * @param caps - Complete device capability assessment
   */
  setCaps: (caps: DeviceCaps) => void;

  /**
   * Update quality tier and recompute configuration
   * Used for manual tier overrides or dynamic adjustments
   * @param tier - New quality tier to apply
   */
  setTier: (tier: QualityTier) => void;

  /**
   * Update current FPS measurement for AC3 performance tracking
   * @param fps - Current frame rate measurement
   */
  setFps: (fps: number) => void;

  /**
   * Set scene loading completion status
   * @param loaded - True when scene is fully initialized and interactive
   */
  setLoaded: (loaded: boolean) => void;

  /**
   * Set or clear error state
   * @param error - Error message or undefined to clear
   */
  setError: (error?: string) => void;

  /**
   * Reset store to initial state
   * Used for cleanup or reinitialization scenarios
   */
  reset: () => void;
}

type HeroStore = HeroState & HeroActions;

/**
 * Initial state with conservative defaults for SSR safety
 * All values represent pre-evaluation state before device capability detection
 */
const initialState: HeroState = {
  isLoaded: false,
  isWebGLAvailable: false,
  webglVersion: 0,
  isMobile: false,
  dpr: 1,
  clampedDpr: 1,
  fps: 0,
  tier: QualityTier.LOW,
  config: getQualityConfig(QualityTier.LOW),
  error: '',
};

/**
 * Zustand store for Hero Galaxy scene state management
 * Provides centralized state for 3D scene, performance monitoring, and quality adaptation
 *
 * AC3 Integration: FPS tracking enables frame rate maintenance across device tiers
 * AC4 Integration: Tier and config management enables automatic quality adaptation
 */
export const useHeroStore = create<HeroStore>(set => ({
  ...initialState,

  setCaps: (caps: DeviceCaps) => {
    set({
      isWebGLAvailable: caps.isWebGLAvailable,
      webglVersion: caps.webglVersion,
      isMobile: caps.isMobile,
      dpr: caps.dpr,
      clampedDpr: caps.clampedDpr,
      tier: caps.tier,
      config: caps.config,
      error: caps.reason ?? '',
    });
  },

  setTier: (tier: QualityTier) => {
    set({
      tier,
      config: getQualityConfig(tier),
    });
  },

  setFps: (fps: number) => {
    set({ fps });
  },

  setLoaded: (loaded: boolean) => {
    set({ isLoaded: loaded });
  },

  setError: (error?: string) => {
    set({ error: error ?? '' });
  },

  reset: () => {
    set(initialState);
  },
}));

// Tree-shakeable selectors for optimized component subscriptions

/**
 * Selector for quality tier state
 * Used by scene components to adjust particle counts and render settings
 */
export const selectTier = (state: HeroStore) => state.tier;

/**
 * Selector for quality configuration
 * Provides render parameters for current tier
 */
export const selectConfig = (state: HeroStore) => state.config;

/**
 * Selector for FPS performance data
 * Used by performance monitoring and UI components
 */
export const selectFps = (state: HeroStore) => state.fps;

/**
 * Selector for loading state
 * Used by UI components to show loading indicators
 */
export const selectLoaded = (state: HeroStore) => state.isLoaded;

/**
 * Selector for device capability summary
 * Aggregates key capability fields for component consumption
 */
export const selectCaps = (state: HeroStore) => ({
  isWebGLAvailable: state.isWebGLAvailable,
  webglVersion: state.webglVersion,
  isMobile: state.isMobile,
  dpr: state.dpr,
  clampedDpr: state.clampedDpr,
});

/**
 * Selector for error state
 * Used by error boundaries and fallback components
 */
export const selectError = (state: HeroStore) => state.error;
