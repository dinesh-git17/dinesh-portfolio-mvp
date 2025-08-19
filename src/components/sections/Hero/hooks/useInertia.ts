// path: src/components/sections/Hero/hooks/useInertia.ts
// RAF-driven inertia and zoom easing hook for smooth orbit control physics
// Integrates with interaction store for frame-rate independent physics simulation

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useInteractionStore } from '../state/interactionStore';

export type UseInertiaOptions = {
  /** Enable or disable the loop; default true */
  enabled?: boolean;
  /** Damping coefficient per 60fps frame (store uses this in its math); default 0.95 */
  dampingPerFrame?: number;
  /** Max delta to process to avoid spiral-of-death; default 50ms */
  maxDtMs?: number;
};

export type UseInertiaHandle = {
  /** Imperatively start the loop (idempotent) */
  start: () => void;
  /** Imperatively stop the loop (idempotent) */
  stop: () => void;
  /** Whether the loop is currently running */
  isRunning: boolean;
};

/**
 * RAF-based inertia and zoom easing hook for orbit control physics
 *
 * Responsibilities:
 * - Drives physics simulation via requestAnimationFrame loop
 * - Calls store actions in sequence: tickInertia → commitZoom
 * - Frame time clamping prevents spiral-of-death during lag spikes
 * - SSR-safe with proper cleanup and browser guards
 *
 * Performance characteristics:
 * - Constant-time work per frame (no allocations in hot path)
 * - Frame delta clamping at 50ms prevents backlog accumulation
 * - Idempotent start/stop operations for stable state management
 * - Zero overhead when disabled or unmounted
 */
export function useInertia(options: UseInertiaOptions = {}): UseInertiaHandle {
  const { enabled = true, maxDtMs = 50 } = options;

  // Store selectors for physics actions
  const tickInertia = useInteractionStore(state => state.tickInertia);
  const commitZoom = useInteractionStore(state => state.commitZoom);

  // RAF loop state - use refs to avoid allocations in frame callback
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  // Frame callback - memoized to prevent useEffect churn
  const tick = useCallback(
    (now: number) => {
      const lastTs = lastTsRef.current;

      if (lastTs === 0) {
        // First frame - just record timestamp
        lastTsRef.current = now;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      // Calculate frame delta with clamping
      const dtMs = Math.min(now - lastTs, maxDtMs);

      // Execute physics simulation in correct order
      tickInertia(dtMs); // Angular velocity integration + damping
      commitZoom(dtMs); // Zoom easing toward target

      // Update state and schedule next frame
      lastTsRef.current = now;
      rafIdRef.current = requestAnimationFrame(tick);
    },
    [tickInertia, commitZoom, maxDtMs]
  );

  // Idempotent start function
  const start = useCallback(() => {
    // SSR safety guard
    if (typeof window === 'undefined' || !('requestAnimationFrame' in window)) {
      return;
    }

    // Already running - no-op
    if (rafIdRef.current !== null) {
      return;
    }

    // Reset timestamp and start loop
    lastTsRef.current = 0;
    setIsRunning(true);
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // Idempotent stop function
  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    // Cleanup on unmount or when enabled changes
    return stop;
  }, [enabled, start, stop]);

  return {
    start,
    stop,
    isRunning,
  };
}
