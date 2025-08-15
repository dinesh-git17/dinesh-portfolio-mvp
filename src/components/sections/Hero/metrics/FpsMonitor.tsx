// path: src/components/sections/Hero/metrics/FpsMonitor.tsx
// RAF-based FPS monitor with EMA smoothing and throttled store updates
// Provides headless hook and optional debug overlay for AC3 validation

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useHeroStore } from '../state/heroStore';

export type FpsOptions = {
  /** Window for EMA smoothing (0..1). 0.2 = heavier smoothing. Default: 0.2 */
  smoothing?: number;
  /** Minimum ms between store updates (throttle). Default: 500ms */
  reportIntervalMs?: number;
  /** Optional callback when FPS changes after throttle. */
  onChange?: (fps: number) => void;
};

export type FpsMonitorProps = FpsOptions & {
  /** If true, render a tiny top-left overlay showing FPS. Default: false (headless) */
  debugOverlay?: boolean;
  /** Optional className for overlay container */
  className?: string;
  /** Data test id for E2E tests */
  'data-testid'?: string;
};

/**
 * Headless FPS monitoring hook using requestAnimationFrame
 * Updates Zustand store at throttled intervals with EMA-smoothed FPS readings
 *
 * Implementation details:
 * - SSR-safe: no-op when not in browser
 * - Single RAF loop with performance.now() delta timing
 * - EMA smoothing: ema = alpha * instant + (1 - alpha) * prev
 * - Throttled store updates to avoid excessive re-renders
 * - Zero allocations in RAF loop for optimal performance
 */
export function useFpsMonitor({
  smoothing = 0.2,
  reportIntervalMs = 500,
  onChange,
}: FpsOptions = {}): void {
  // Normalize onChange to definite function for exactOptionalPropertyTypes compliance
  const onFpsChange = useMemo<(fps: number) => void>(
    () => onChange ?? (() => {}),
    [onChange]
  );

  // RAF tracking refs - no React state to avoid re-renders
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const emaFpsRef = useRef<number>(60); // Initialize with 60fps assumption
  const lastReportRef = useRef<number>(0);

  // EMA alpha coefficient: lower smoothing = more smoothing
  const alpha = 1 - smoothing;

  const tick = useCallback(
    (currentTime: number) => {
      const lastTime = lastTimeRef.current;

      if (lastTime === 0) {
        // First frame - just record timestamp
        lastTimeRef.current = currentTime;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate instantaneous FPS from frame delta
      const delta = currentTime - lastTime;
      if (delta > 0) {
        const instantFps = 1000 / delta;

        // Apply EMA smoothing: ema = alpha * instant + (1 - alpha) * prev
        emaFpsRef.current =
          alpha * instantFps + (1 - alpha) * emaFpsRef.current;
      }

      // Throttled reporting to store and callback
      if (currentTime - lastReportRef.current >= reportIntervalMs) {
        const roundedFps = Math.round(emaFpsRef.current);

        // Update store directly without triggering re-renders
        useHeroStore.getState().setFps(roundedFps);

        // Optional callback notification
        onFpsChange(roundedFps);

        lastReportRef.current = currentTime;
      }

      lastTimeRef.current = currentTime;
      rafIdRef.current = requestAnimationFrame(tick);
    },
    [alpha, reportIntervalMs, onFpsChange]
  );

  useEffect(() => {
    // SSR guard: only run in browser
    if (typeof window === 'undefined') return;

    // Start RAF loop
    rafIdRef.current = requestAnimationFrame(tick);

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [tick]);
}

/**
 * FPS Monitor component with optional debug overlay
 * Headless by default - only renders UI when debugOverlay=true
 *
 * Performance characteristics:
 * - Zero DOM impact when debugOverlay=false
 * - Minimal fixed overlay when enabled
 * - Throttled DOM updates align with store update frequency
 * - No React re-renders for FPS tracking (uses direct store access)
 */
export default function FpsMonitor({
  smoothing = 0.2,
  reportIntervalMs = 500,
  onChange,
  debugOverlay = false,
  className = 'fixed left-2 top-2 z-50 px-2 py-1 text-xs rounded bg-black/60 text-white',
  'data-testid': testId = 'fps-monitor',
}: FpsMonitorProps = {}): React.JSX.Element | null {
  // Hook manages all FPS tracking logic
  // Normalize onChange to definite function for exactOptionalPropertyTypes compliance
  const onFpsChange = useMemo<(fps: number) => void>(
    () => onChange ?? (() => {}),
    [onChange]
  );

  useFpsMonitor({ smoothing, reportIntervalMs, onChange: onFpsChange });

  // State for overlay display (only when overlay enabled)
  const [displayFps, setDisplayFps] = useState<number>(0);

  // Update overlay display at same throttled interval as store
  useEffect(() => {
    if (!debugOverlay) return;

    const updateDisplay = () => {
      const currentFps = useHeroStore.getState().fps;
      setDisplayFps(currentFps);
    };

    // Initial update
    updateDisplay();

    // Throttled updates aligned with report interval
    const intervalId = setInterval(updateDisplay, reportIntervalMs);

    return () => clearInterval(intervalId);
  }, [debugOverlay, reportIntervalMs]);

  // Headless mode: no DOM output
  if (!debugOverlay) {
    return null;
  }

  // Debug overlay mode: minimal fixed display
  return (
    <div
      className={className}
      data-testid={testId}
      aria-live='off' // Decorative only - no screen reader announcements
      role='status'
      aria-label='Current frames per second'
    >
      {displayFps} FPS
    </div>
  );
}
