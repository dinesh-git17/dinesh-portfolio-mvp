// path: src/components/sections/Hero/utils/physics.ts
// SSR-safe physics utilities for Hero orbit inertia and spherical camera math
// Pure functions for stable API consumption by interaction store and hooks

/**
 * Spherical coordinate representation in radians
 * Used for camera positioning in orbit controls
 */
export type Spherical = {
  /** Horizontal rotation around Y-axis in radians */
  theta: number;
  /** Elevation angle from XZ-plane in radians */
  phi: number;
};

/**
 * Angular velocity in radians per second
 * Represents camera rotation speed for inertial motion
 */
export type AngularVel = {
  /** Horizontal angular velocity in rad/s */
  dTheta: number;
  /** Vertical angular velocity in rad/s */
  dPhi: number;
};

/**
 * Camera elevation constraints in radians
 * Prevents over-rotation and maintains usable viewing angles
 */
export type Constraints = {
  /** Minimum elevation angle in radians (typically negative) */
  minPhi: number;
  /** Maximum elevation angle in radians (typically positive) */
  maxPhi: number;
};

/**
 * Convert degrees to radians
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Clamp value between minimum and maximum bounds
 * @param v - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value within [min, max]
 */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * Wrap theta angle to (-π, π] range to prevent infinite growth
 * Maintains consistent angular representation over long interactions
 * @param theta - Angle in radians
 * @returns Wrapped angle in (-π, π] range
 */
export function wrapTheta(theta: number): number {
  let wrapped = theta;
  while (wrapped > Math.PI) wrapped -= 2 * Math.PI;
  while (wrapped <= -Math.PI) wrapped += 2 * Math.PI;
  return wrapped;
}

/**
 * Check if angular velocity magnitude is near zero
 * Used to determine when to stop inertial motion
 * @param v - Angular velocity in rad/s
 * @param eps - Epsilon threshold, default 1e-4 rad/s
 * @returns true if velocity magnitude below threshold
 */
export function isNearZero(v: number, eps = 1e-4): boolean {
  return Math.abs(v) < eps;
}

/**
 * Convert per-frame damping to per-deltaTime damping factor
 * Ensures consistent physics regardless of frame rate variations
 * @param dampingPerFrame - Damping factor for 16.6667ms frame (0.95 typical)
 * @param dtMs - Actual delta time in milliseconds
 * @returns Time-corrected damping factor
 */
export function dampingFactorPerDt(
  dampingPerFrame: number,
  dtMs: number
): number {
  return Math.pow(dampingPerFrame, dtMs / 16.6667);
}

/**
 * Apply time-corrected damping to angular velocity with zero cutoff
 * Pure function that returns new velocity object
 * @param v - Angular velocity to damp
 * @param dampingPerFrame - Base damping factor (0.95 typical)
 * @param dtMs - Delta time in milliseconds
 * @param eps - Zero threshold, default 1e-4 rad/s
 * @returns New angular velocity with damping applied
 */
export function applyDamping(
  v: AngularVel,
  dampingPerFrame: number,
  dtMs: number,
  eps = 1e-4
): AngularVel {
  const factor = dampingFactorPerDt(dampingPerFrame, dtMs);

  const dTheta = v.dTheta * factor;
  const dPhi = v.dPhi * factor;

  return {
    dTheta: isNearZero(dTheta, eps) ? 0 : dTheta,
    dPhi: isNearZero(dPhi, eps) ? 0 : dPhi,
  };
}

/**
 * Integrate angular velocity into spherical coordinates with constraints
 * Pure function for physics simulation step
 * @param current - Current spherical position in radians
 * @param vel - Angular velocity in rad/s
 * @param dtMs - Delta time in milliseconds
 * @param constraints - Elevation angle limits in radians
 * @returns New spherical position after integration
 */
export function integrateSpherical(
  current: Spherical,
  vel: AngularVel,
  dtMs: number,
  constraints: Constraints
): Spherical {
  const dtSec = dtMs / 1000;

  const newTheta = wrapTheta(current.theta + vel.dTheta * dtSec);
  const newPhi = clamp(
    current.phi + vel.dPhi * dtSec,
    constraints.minPhi,
    constraints.maxPhi
  );

  return {
    theta: newTheta,
    phi: newPhi,
  };
}

/**
 * Exponential approach from current to target value
 * Smooth easing for camera transitions and zoom interpolation
 * @param current - Current value
 * @param target - Target value to approach
 * @param lambdaPerSec - Approach rate constant in Hz (4.0 typical)
 * @param dtMs - Delta time in milliseconds
 * @returns New value between current and target
 */
export function easeExp(
  current: number,
  target: number,
  lambdaPerSec: number,
  dtMs: number
): number {
  const factor = 1 - Math.exp(-lambdaPerSec * (dtMs / 1000));
  return current + (target - current) * factor;
}
