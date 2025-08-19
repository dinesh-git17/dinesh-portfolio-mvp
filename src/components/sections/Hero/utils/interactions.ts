// path: src/components/sections/Hero/utils/interactions.ts
// SSR-safe input normalization utilities for Hero section pointer/touch/wheel events
// Provides pure, allocation-light helpers with stable sign/unit conventions

/**
 * Pointer device classification for input handling
 */
export type PointerKind = 'mouse' | 'touch' | 'pen' | 'unknown';

/**
 * 2D point in client-space CSS pixels
 */
export type Point = { x: number; y: number };

/**
 * Normalized pointer event data with consistent cross-platform representation
 */
export type NormalizedPointer = {
  /** Client-space coordinates in CSS pixels */
  pos: Point;
  /** Delta from previous position in CSS pixels */
  delta: Point;
  /** Button state bitfield from the event (0 when absent) */
  buttons: number;
  /** Pointer classification derived from event.pointerType or heuristics */
  kind: PointerKind;
  /** Whether the event is primary (best-effort for mouse/touch) */
  isPrimary: boolean;
  /** Event timestamp in ms (uses event.timeStamp when available, else 0) */
  ts: number;
};

/**
 * Normalized wheel event data with zoom intent calculation
 */
export type NormalizedWheel = {
  /** Wheel delta converted to CSS pixels (positive = scroll down) */
  deltaPxY: number;
  /** DOM deltaMode as friendly string */
  mode: 'pixel' | 'line' | 'page';
  /**
   * Zoom intent in abstract units: + means zoom-in, - means zoom-out.
   * Computed as clamp(-deltaPxY / 120, -1, 1) for parity with common mice/trackpads.
   */
  zoomDelta: number;
};

/**
 * Pinch gesture metrics for two-finger zoom/pan
 */
export type PinchMetrics = {
  /** Current scale relative to the gesture start distance */
  scale: number;
  /** Incremental change since the previous update */
  deltaScale: number;
  /** Center point between the two active touches (CSS pixels) */
  center: Point;
};

// Constants for wheel normalization
const LINE_HEIGHT_PX = 16;
const PAGE_HEIGHT_PX = 800;
const ZOOM_SENSITIVITY = 120; // Standard wheel delta for 1 unit of zoom

/**
 * Maps pointer event type to device classification
 * @param input Unknown event object to inspect
 * @returns Pointer device type or 'unknown' if unrecognizable
 */
export function getPointerKind(input: unknown): PointerKind {
  if (!input || typeof input !== 'object') return 'unknown';

  const event = input as { pointerType?: string; type?: string };

  if (typeof event.pointerType === 'string') {
    switch (event.pointerType.toLowerCase()) {
      case 'mouse':
        return 'mouse';
      case 'touch':
        return 'touch';
      case 'pen':
        return 'pen';
      default:
        return 'unknown';
    }
  }

  // Fallback heuristics for non-pointer events
  if (typeof event.type === 'string') {
    if (event.type.startsWith('mouse')) return 'mouse';
    if (event.type.startsWith('touch')) return 'touch';
  }

  return 'unknown';
}

/**
 * Extracts client coordinates from various event types
 * @param e Event object with clientX/Y or touches array
 * @returns First available coordinate pair or null if unavailable
 */
export function getClientXY(
  e:
    | { clientX?: number; clientY?: number }
    | { touches?: ArrayLike<{ clientX: number; clientY: number }> }
    | { changedTouches?: ArrayLike<{ clientX: number; clientY: number }> }
): Point | null {
  const event = e as {
    clientX?: number;
    clientY?: number;
    touches?: ArrayLike<{ clientX: number; clientY: number }>;
    changedTouches?: ArrayLike<{ clientX: number; clientY: number }>;
  };

  // Direct clientX/Y properties (mouse, single touch)
  if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    return { x: event.clientX, y: event.clientY };
  }

  // Touch events - prefer touches over changedTouches
  const touches = event.touches || event.changedTouches;
  if (touches && touches.length > 0) {
    const touch = touches[0];
    if (
      touch &&
      typeof touch.clientX === 'number' &&
      typeof touch.clientY === 'number'
    ) {
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  return null;
}

/**
 * Normalizes pointer events to consistent format with delta calculation
 * @param e Unknown event object to normalize
 * @param prev Previous position for delta calculation
 * @returns Normalized pointer data or null if coordinates unavailable
 */
export function normalizePointer(
  e: unknown,
  prev?: Point
): NormalizedPointer | null {
  const pos = getClientXY(
    e as {
      clientX?: number;
      clientY?: number;
      touches?: ArrayLike<{ clientX: number; clientY: number }>;
      changedTouches?: ArrayLike<{ clientX: number; clientY: number }>;
    }
  );
  if (!pos) return null;

  const event = e as {
    buttons?: number;
    isPrimary?: boolean;
    timeStamp?: number;
  };

  const delta = prev
    ? { x: pos.x - prev.x, y: pos.y - prev.y }
    : { x: 0, y: 0 };

  return {
    pos,
    delta,
    buttons: event.buttons ?? 0,
    kind: getPointerKind(e),
    isPrimary: event.isPrimary ?? true,
    ts: typeof event.timeStamp === 'number' ? event.timeStamp : 0,
  };
}

/**
 * Normalizes wheel events with zoom intent calculation
 * @param e Wheel event object with deltaY and deltaMode
 * @returns Normalized wheel data with pixel-converted deltas and zoom intent
 */
export function normalizeWheel(e: {
  deltaY?: number;
  deltaMode?: number;
}): NormalizedWheel {
  const deltaY = e.deltaY ?? 0;
  const deltaMode = e.deltaMode ?? 0;

  let deltaPxY: number;
  let mode: 'pixel' | 'line' | 'page';

  switch (deltaMode) {
    case 1: // DOM_DELTA_LINE
      deltaPxY = deltaY * LINE_HEIGHT_PX;
      mode = 'line';
      break;
    case 2: // DOM_DELTA_PAGE
      deltaPxY = deltaY * PAGE_HEIGHT_PX;
      mode = 'page';
      break;
    default: // DOM_DELTA_PIXEL (0)
      deltaPxY = deltaY;
      mode = 'pixel';
      break;
  }

  // Zoom intent: negative wheel delta = zoom in (positive zoomDelta)
  const zoomDelta = clamp(-deltaPxY / ZOOM_SENSITIVITY, -1, 1);

  return { deltaPxY, mode, zoomDelta };
}

/**
 * Computes pinch gesture metrics from touch array
 * @param touches Touch list with at least 2 touches
 * @param prev Previous gesture state containing distance
 * @returns Current metrics and state for next call, or null if insufficient touches
 */
export function computePinch(
  touches: ArrayLike<{ clientX: number; clientY: number }>,
  prev?: { distance: number }
): { metrics: PinchMetrics; state: { distance: number } } | null {
  if (touches.length < 2) return null;

  const touch1 = touches[0];
  const touch2 = touches[1];

  // TypeScript strict null check: ensure touches exist
  if (!touch1 || !touch2) return null;

  // Calculate distance between first two touches
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Prevent division by zero on initial touch
  const prevDistance = prev?.distance ?? distance;
  const scale = distance / prevDistance;
  const deltaScale = scale - (prev ? 1 : 0);

  // Center point between the two touches
  const center = {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };

  return {
    metrics: { scale, deltaScale, center },
    state: { distance },
  };
}

/**
 * Clamps value between min and max bounds
 * @param v Value to clamp
 * @param min Minimum bound
 * @param max Maximum bound
 * @returns Clamped value
 */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Returns passive event listener options for scroll/wheel events
 * @returns Options object with passive: true
 */
export function getPassiveOptions(): { passive: boolean } {
  return { passive: true };
}

/**
 * Returns active event listener options for drag/pointer events
 * @returns Options object with passive: false for preventDefault capability
 */
export function getActiveOptions(): { passive: false } {
  return { passive: false };
}

/**
 * Determines if preventDefault should be called for gesture events
 * @param kind Pointer device type
 * @param isPinching Whether pinch gesture is active
 * @returns True if preventDefault recommended to avoid browser conflicts
 */
export function shouldPreventDefaultForGesture(
  kind: PointerKind,
  isPinching: boolean
): boolean {
  // Prevent default for touch gestures to avoid browser navigation/zoom
  return kind === 'touch' && isPinching;
}
