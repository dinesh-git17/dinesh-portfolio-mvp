// path: src/components/sections/Hero/state/interactionStore.ts
// Finite-state interaction store for Hero orbit controls with inertial physics
// SSR-safe Zustand store with stable API for camera interaction management

import { create } from 'zustand';

// Type Definitions

/** Finite state machine states for interaction handling */
export type InteractionState = 'IDLE' | 'DRAGGING' | 'INERTIA';

/** Spherical coordinate system for camera positioning (radians) */
export interface CameraSpherical {
  theta: number; // Horizontal rotation around Y-axis
  phi: number; // Elevation angle from XZ-plane
}

/** Configuration parameters for interaction sensitivity and constraints */
export interface InteractionConfig {
  dragSensitivity: number; // Multiplier for pointer delta to radian conversion
  damping: number; // Exponential decay factor per frame (0-1)
  minZoom: number; // Minimum camera distance
  maxZoom: number; // Maximum camera distance
  minElevationDeg: number; // Minimum elevation in degrees
  maxElevationDeg: number; // Maximum elevation in degrees
}

/** Core interaction store state interface */
interface InteractionState_Internal {
  // Finite state machine
  state: InteractionState;

  // Camera positioning
  current: CameraSpherical; // Current camera position
  target: CameraSpherical; // Target position for smooth transitions

  // Zoom control
  zoom: number; // Current zoom level
  targetZoom: number; // Target zoom for smooth transitions

  // Physics simulation
  velocity: { theta: number; phi: number }; // Angular velocity in rad/s
  lastTs: number | null; // Last timestamp for delta calculations

  // Input state tracking
  isPointerCaptured: boolean; // Pointer capture status
  isKeyboardFocused: boolean; // Keyboard focus for accessibility

  // Configuration
  config: InteractionConfig; // Current interaction parameters
}

/** Store actions interface with stable API surface */
interface InteractionActions {
  // Configuration
  setConfig: (partial: Partial<InteractionConfig>) => void;

  // Drag interaction lifecycle
  beginDrag: (ts: number) => void;
  updateDrag: (dxPx: number, dyPx: number, dtMs: number) => void;
  endDrag: (ts: number) => void;

  // Physics simulation
  tickInertia: (dtMs: number) => void;

  // Zoom controls
  setZoomTarget: (zoom: number) => void;
  applyWheelZoom: (deltaY: number) => void;
  applyPinchZoom: (scale: number) => void;
  commitZoom: (dtMs: number) => void;

  // Keyboard accessibility
  setKeyboardFocus: (focused: boolean) => void;
  nudgeOrbitFromKeys: (
    xDir: -1 | 0 | 1,
    yDir: -1 | 0 | 1,
    dtMs: number
  ) => void;

  // Utility
  reset: () => void;
}

export type InteractionStore = InteractionState_Internal & InteractionActions;

// Constants and Helpers

/** Default configuration values optimized for good UX */
const DEFAULT_CONFIG: InteractionConfig = {
  dragSensitivity: 0.5,
  damping: 0.95,
  minZoom: 2,
  maxZoom: 10,
  minElevationDeg: -60,
  maxElevationDeg: 60,
};

/** Conversion factor from pixels to radians based on sensitivity */
const DRAG_SENSITIVITY_TO_RAD_PER_PX = 0.005;

/** Velocity threshold below which inertia stops (rad/s) */
const VELOCITY_EPSILON = 1e-4;

/** Zoom sensitivity for wheel events */
const WHEEL_ZOOM_SENSITIVITY = 0.1;

/** Zoom easing factor per second */
const ZOOM_EASE_LAMBDA = 4.0;

/** Keyboard nudge speed in rad/s */
const KEYBOARD_NUDGE_SPEED = 1.0;

// Math Helper Functions

/** Convert degrees to radians */
const degToRad = (deg: number): number => (deg * Math.PI) / 180;

/** Clamp value between min and max */
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Wrap theta angle to [-π, π] range */
const wrapTheta = (theta: number): number => {
  let wrapped = theta;
  while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
  while (wrapped < -Math.PI) wrapped += 2 * Math.PI;
  return wrapped;
};

/** Check if velocity magnitude is near zero */
const isNearZero = (velocity: { theta: number; phi: number }): boolean =>
  Math.abs(velocity.theta) < VELOCITY_EPSILON &&
  Math.abs(velocity.phi) < VELOCITY_EPSILON;

/** Exponential ease from current to target with time-based lambda */
const easeExp = (
  current: number,
  target: number,
  lambdaPerSec: number,
  dtMs: number
): number => {
  const factor = 1 - Math.exp(-lambdaPerSec * (dtMs / 1000));
  return current + (target - current) * factor;
};

/** Precompute elevation limits in radians from config */
const getElevationLimits = (
  config: InteractionConfig
): { minPhi: number; maxPhi: number } => ({
  minPhi: degToRad(config.minElevationDeg),
  maxPhi: degToRad(config.maxElevationDeg),
});

// Initial State

const initialState: InteractionState_Internal = {
  state: 'IDLE',
  current: { theta: 0, phi: 0 },
  target: { theta: 0, phi: 0 },
  zoom: 4, // Middle of 2-10 range
  targetZoom: 4,
  velocity: { theta: 0, phi: 0 },
  lastTs: null,
  isPointerCaptured: false,
  isKeyboardFocused: false,
  config: DEFAULT_CONFIG,
};

// Zustand Store Implementation

/**
 * Zustand store for interaction state management
 * Provides finite state machine with inertial physics and zoom controls
 * SSR-safe with no browser globals at module scope
 */
export const useInteractionStore = create<InteractionStore>((set, get) => ({
  ...initialState,

  // Configuration Management
  setConfig: (partial: Partial<InteractionConfig>) => {
    set(state => ({
      config: { ...state.config, ...partial },
    }));
  },

  // Drag Interaction Lifecycle
  beginDrag: (ts: number) => {
    set({
      state: 'DRAGGING',
      lastTs: ts,
      velocity: { theta: 0, phi: 0 },
    });
  },

  updateDrag: (dxPx: number, dyPx: number, dtMs: number) => {
    const state = get();
    const { config } = state;
    const { minPhi, maxPhi } = getElevationLimits(config);

    // Convert pixel deltas to angular deltas
    const radPerPx = config.dragSensitivity * DRAG_SENSITIVITY_TO_RAD_PER_PX;
    const dTheta = -dxPx * radPerPx; // Negative for natural feel
    const dPhi = dyPx * radPerPx;

    // Update target position with clamping
    const newTarget = {
      theta: wrapTheta(state.target.theta + dTheta),
      phi: clamp(state.target.phi + dPhi, minPhi, maxPhi),
    };

    // Calculate velocity from deltas (for inertia)
    const dtSec = Math.max(dtMs / 1000, 1e-6); // Prevent division by zero
    const velocity = {
      theta: dTheta / dtSec,
      phi: dPhi / dtSec,
    };

    set({
      target: newTarget,
      velocity,
    });
  },

  endDrag: (ts: number) => {
    const state = get();
    if (isNearZero(state.velocity)) {
      set({ state: 'IDLE' });
    } else {
      set({
        state: 'INERTIA',
        lastTs: ts,
      });
    }
  },

  // Physics Simulation
  tickInertia: (dtMs: number) => {
    const state = get();
    if (state.state !== 'INERTIA') return;

    const { config } = state;
    const { minPhi, maxPhi } = getElevationLimits(config);
    const dtSec = dtMs / 1000;

    // Apply exponential damping to velocity
    const dampingFactor = Math.pow(config.damping, dtMs / 16.67); // Normalize to 60fps
    const newVelocity = {
      theta: state.velocity.theta * dampingFactor,
      phi: state.velocity.phi * dampingFactor,
    };

    // Integrate velocity to update target position
    const newTarget = {
      theta: wrapTheta(state.target.theta + newVelocity.theta * dtSec),
      phi: clamp(state.target.phi + newVelocity.phi * dtSec, minPhi, maxPhi),
    };

    // Stop inertia if velocity becomes negligible
    if (isNearZero(newVelocity)) {
      set({
        state: 'IDLE',
        target: newTarget,
        velocity: { theta: 0, phi: 0 },
      });
    } else {
      set({
        target: newTarget,
        velocity: newVelocity,
      });
    }
  },

  // Zoom Controls
  setZoomTarget: (zoom: number) => {
    const { config } = get();
    set({
      targetZoom: clamp(zoom, config.minZoom, config.maxZoom),
    });
  },

  applyWheelZoom: (deltaY: number) => {
    const state = get();
    const zoomDelta = deltaY * WHEEL_ZOOM_SENSITIVITY;
    const newTargetZoom = state.targetZoom + zoomDelta;
    get().setZoomTarget(newTargetZoom);
  },

  applyPinchZoom: (scale: number) => {
    const state = get();
    const newTargetZoom = state.targetZoom * scale;
    get().setZoomTarget(newTargetZoom);
  },

  commitZoom: (dtMs: number) => {
    const state = get();
    const newZoom = easeExp(
      state.zoom,
      state.targetZoom,
      ZOOM_EASE_LAMBDA,
      dtMs
    );
    set({ zoom: newZoom });
  },

  // Keyboard Accessibility
  setKeyboardFocus: (focused: boolean) => {
    set({ isKeyboardFocused: focused });
  },

  nudgeOrbitFromKeys: (xDir: -1 | 0 | 1, yDir: -1 | 0 | 1, dtMs: number) => {
    if (xDir === 0 && yDir === 0) return;

    const state = get();
    const { config } = state;
    const { minPhi, maxPhi } = getElevationLimits(config);
    const dtSec = dtMs / 1000;

    // Calculate angular deltas from keyboard input
    const speed = KEYBOARD_NUDGE_SPEED * config.dragSensitivity;
    const dTheta = -xDir * speed * dtSec; // Negative for consistent direction
    const dPhi = yDir * speed * dtSec;

    // Update target position with clamping
    const newTarget = {
      theta: wrapTheta(state.target.theta + dTheta),
      phi: clamp(state.target.phi + dPhi, minPhi, maxPhi),
    };

    // Update velocity for smooth transitions
    const newVelocity = {
      theta: dTheta / dtSec,
      phi: dPhi / dtSec,
    };

    set({
      target: newTarget,
      velocity: newVelocity,
      state: state.state === 'IDLE' ? 'INERTIA' : state.state,
    });
  },

  // Utility
  reset: () => {
    set(initialState);
  },
}));
