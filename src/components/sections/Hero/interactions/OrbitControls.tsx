// path: src/components/sections/Hero/interactions/OrbitControls.tsx
// Headless orbit control component bridging DOM pointer events to interaction store
// RAF-batched pointer moves, capture handling, single-touch filtering for drag-only

import * as React from 'react';
import { useEffect, useRef } from 'react';

import { useInteractionStore } from '../state/interactionStore';
import {
  getActiveOptions,
  getPassiveOptions,
  getPointerKind,
  normalizePointer,
  shouldPreventDefaultForGesture,
  type Point,
} from '../utils/interactions';

export type OrbitControlsProps = {
  /** Element to attach listeners to (Canvas wrapper or container). Required. */
  containerRef: React.RefObject<HTMLElement>;
  /** Enable/disable controls; default true */
  enabled?: boolean;
  /** Optional: override drag sensitivity (fallback to store config 0.5) */
  dragSensitivity?: number;
};

/**
 * Headless orbit controls for pointer/touch drag interaction.
 *
 * Responsibility: Bridge DOM events to interaction store with performance optimizations.
 * - RAF-batched pointermove updates to maintain ≤1 update per frame
 * - Pointer capture and release handling for smooth dragging
 * - Single-touch filtering (multi-touch reserved for ZoomControls)
 * - SSR-safe with all DOM work in useEffect
 *
 * Behavior:
 * - pointerdown: captures pointer, calls beginDrag(), records initial position
 * - pointermove: RAF-batched updates with delta calculation and store.updateDrag()
 * - pointerup/cancel/lostcapture: releases pointer, calls endDrag()
 * - Touch events: normalized through same pipeline for legacy support
 * - Gesture prevention: selective preventDefault for touch to avoid browser conflicts
 *
 * Performance:
 * - Constant-time hot path with minimal allocations
 * - Only processes primary pointer events during drag
 * - Delta time clamped to 50ms to prevent physics instability
 *
 * @param props - Control configuration
 * @returns null (headless component)
 */
export default function OrbitControls({
  containerRef,
  enabled = true,
  dragSensitivity,
}: OrbitControlsProps): null {
  const { beginDrag, updateDrag, endDrag, setConfig, setKeyboardFocus } =
    useInteractionStore();

  // Drag state tracking
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<Point | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const capturedPointerIdRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ pos: Point; ts: number } | null>(null);

  // Apply drag sensitivity config when prop changes
  useEffect(() => {
    if (dragSensitivity !== undefined) {
      setConfig({ dragSensitivity });
    }
  }, [dragSensitivity, setConfig]);

  // RAF loop for batched move updates
  const processPendingMove = React.useCallback(() => {
    const pending = pendingMoveRef.current;
    if (
      !pending ||
      !isDraggingRef.current ||
      !lastPointerRef.current ||
      lastTimestampRef.current === null
    ) {
      rafIdRef.current = null;
      return;
    }

    const { pos, ts } = pending;
    const lastPos = lastPointerRef.current;
    const lastTs = lastTimestampRef.current;

    // Calculate deltas
    const dx = pos.x - lastPos.x;
    const dy = pos.y - lastPos.y;
    const dtMs = Math.min(ts - lastTs, 50); // Clamp to 50ms for stability

    // Update store with CSS pixel deltas
    updateDrag(dx, dy, dtMs);

    // Update tracking state
    lastPointerRef.current = pos;
    lastTimestampRef.current = ts;
    pendingMoveRef.current = null;
    rafIdRef.current = null;
  }, [updateDrag]);

  // Pointer event handlers
  const handlePointerDown = React.useCallback(
    (e: PointerEvent) => {
      if (!enabled || isDraggingRef.current) return;

      // Filter for primary pointer only
      if (!e.isPrimary) return;

      // Check for multi-touch (defer to ZoomControls)
      const target = e.currentTarget as HTMLElement;
      const eventWithTouches = e as PointerEvent & { touches?: TouchList };
      if (eventWithTouches.touches && eventWithTouches.touches.length >= 2)
        return;

      const normalized = normalizePointer(e);
      if (!normalized) return;

      const kind = getPointerKind(e);

      // Prevent default for touch to avoid browser navigation
      if (shouldPreventDefaultForGesture(kind, false)) {
        e.preventDefault();
      }

      // Capture pointer for smooth dragging
      try {
        target.setPointerCapture(e.pointerId);
        capturedPointerIdRef.current = e.pointerId;
      } catch {
        // Pointer capture not supported, continue without
      }

      // Initialize drag state
      isDraggingRef.current = true;
      lastPointerRef.current = normalized.pos;
      lastTimestampRef.current = performance.now();

      // Notify store
      beginDrag(lastTimestampRef.current);
    },
    [enabled, beginDrag]
  );

  const handlePointerMove = React.useCallback(
    (e: PointerEvent) => {
      if (!enabled || !isDraggingRef.current || !e.isPrimary) return;

      const normalized = normalizePointer(
        e,
        lastPointerRef.current || undefined
      );
      if (!normalized) return;

      // Enqueue latest move (keep only most recent)
      pendingMoveRef.current = {
        pos: normalized.pos,
        ts: performance.now(),
      };

      // Schedule RAF if not already pending
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processPendingMove);
      }
    },
    [enabled, processPendingMove]
  );

  const handlePointerEnd = React.useCallback(
    (e: PointerEvent) => {
      if (!enabled || !isDraggingRef.current) return;

      // Only process if this is the captured pointer
      if (
        capturedPointerIdRef.current !== null &&
        e.pointerId !== capturedPointerIdRef.current
      ) {
        return;
      }

      // Release pointer capture
      if (capturedPointerIdRef.current !== null) {
        const target = e.currentTarget as HTMLElement;
        try {
          target.releasePointerCapture(capturedPointerIdRef.current);
        } catch {
          // Ignore release errors
        }
        capturedPointerIdRef.current = null;
      }

      // Cancel pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Reset state
      isDraggingRef.current = false;
      lastPointerRef.current = null;
      lastTimestampRef.current = null;
      pendingMoveRef.current = null;

      // Notify store
      endDrag(performance.now());
    },
    [enabled, endDrag]
  );

  // Touch event handlers (legacy support)
  const handleTouchStart = React.useCallback(
    (e: TouchEvent) => {
      // Convert to pointer-like event for normalization
      const pointerEvent = {
        ...e,
        pointerId: 1,
        isPrimary: true,
        clientX: e.touches[0]?.clientX,
        clientY: e.touches[0]?.clientY,
      } as unknown as PointerEvent;

      handlePointerDown(pointerEvent);
    },
    [handlePointerDown]
  );

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      const pointerEvent = {
        ...e,
        pointerId: 1,
        isPrimary: true,
        clientX: e.touches[0]?.clientX,
        clientY: e.touches[0]?.clientY,
      } as unknown as PointerEvent;

      handlePointerMove(pointerEvent);
    },
    [handlePointerMove]
  );

  const handleTouchEnd = React.useCallback(
    (e: TouchEvent) => {
      const pointerEvent = {
        ...e,
        pointerId: 1,
        isPrimary: true,
      } as unknown as PointerEvent;

      handlePointerEnd(pointerEvent);
    },
    [handlePointerEnd]
  );

  // Focus handlers for keyboard accessibility
  const handleFocus = React.useCallback(() => {
    if (setKeyboardFocus) {
      setKeyboardFocus(true);
    }
  }, [setKeyboardFocus]);

  const handleBlur = React.useCallback(() => {
    if (setKeyboardFocus) {
      setKeyboardFocus(false);
    }
  }, [setKeyboardFocus]);

  // Attach/detach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Pointer events (modern)
    container.addEventListener(
      'pointerdown',
      handlePointerDown,
      getActiveOptions()
    );
    container.addEventListener(
      'pointermove',
      handlePointerMove,
      getPassiveOptions()
    );
    container.addEventListener(
      'pointerup',
      handlePointerEnd,
      getActiveOptions()
    );
    container.addEventListener(
      'pointercancel',
      handlePointerEnd,
      getActiveOptions()
    );
    container.addEventListener(
      'lostpointercapture',
      handlePointerEnd,
      getActiveOptions()
    );
    container.addEventListener(
      'pointerleave',
      handlePointerEnd,
      getActiveOptions()
    );

    // Touch events (legacy)
    container.addEventListener(
      'touchstart',
      handleTouchStart,
      getActiveOptions()
    );
    container.addEventListener(
      'touchmove',
      handleTouchMove,
      getPassiveOptions()
    );
    container.addEventListener('touchend', handleTouchEnd, getActiveOptions());
    container.addEventListener(
      'touchcancel',
      handleTouchEnd,
      getActiveOptions()
    );

    // Focus events (keyboard accessibility)
    container.addEventListener('focus', handleFocus);
    container.addEventListener('blur', handleBlur);

    return () => {
      // Cleanup listeners
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerEnd);
      container.removeEventListener('pointercancel', handlePointerEnd);
      container.removeEventListener('lostpointercapture', handlePointerEnd);
      container.removeEventListener('pointerleave', handlePointerEnd);

      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);

      container.removeEventListener('focus', handleFocus);
      container.removeEventListener('blur', handleBlur);

      // Cancel any pending RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [
    containerRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerEnd,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleFocus,
    handleBlur,
  ]);

  // Cleanup on unmount or disable
  useEffect(() => {
    return () => {
      // Reset drag state
      isDraggingRef.current = false;
      lastPointerRef.current = null;
      lastTimestampRef.current = null;
      pendingMoveRef.current = null;
      capturedPointerIdRef.current = null;

      // Cancel RAF
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [enabled]);

  return null;
}
