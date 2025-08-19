// path: src/components/sections/Hero/hooks/useCamera.ts
// Camera transform hook with eased orbit interpolation for Three.js cameras
// Converts interaction store spherical coords to camera position with smooth easing

'use client';

import { useMemo, useRef } from 'react';
import type { PerspectiveCamera } from 'three';

import { useInteractionStore } from '../state/interactionStore';
import { clamp, easeExp } from '../utils/physics';

export type UseCameraOptions = {
  /** Target point the camera looks at (world units) */
  target?: readonly [number, number, number]; // default [0,0,0]
  /** Base radius at zoom = 1; actual radius = baseRadius / zoom */
  baseRadius?: number; // default 10
  /** Easing strength λ (per second) for angle smoothing */
  angularEase?: number; // default 12
};

export type CameraHandle = {
  /** Attach a camera instance once; safe to call multiple times */
  bind: (cam: PerspectiveCamera | null) => void;
  /** Per-frame updater; pass dtMs from your render loop (e.g., R3F useFrame) */
  onFrame: (dtMs: number) => void;
  /** Read current smoothed spherical angles (for debugging/telemetry) */
  getSpherical: () => { theta: number; phi: number };
  /** Read current computed radius (after zoom mapping) */
  getRadius: () => number;
};

/**
 * Camera transform hook with eased orbit interpolation for Three.js cameras
 *
 * Maps interaction store spherical coordinates (theta/phi/zoom) to camera position
 * with smooth exponential easing for natural camera movement. Supports both R3F
 * useFrame integration and standalone render loops.
 *
 * Behavior:
 * - Reads target.theta/phi and zoom from interaction store via selector
 * - Maintains local smoothed angles with exponential easing each frame
 * - Computes radius as baseRadius / clamp(zoom, 2, 10) for 2×-10× zoom range
 * - Converts spherical → cartesian and applies to bound PerspectiveCamera
 * - SSR-safe with no global access at module scope
 * - Allocation-free hot path for optimal performance
 *
 * @example
 * // With R3F useFrame
 * const { bind, onFrame } = useCamera({ baseRadius: 15 });
 * useFrame((_, delta) => onFrame(delta * 1000));
 * return <PerspectiveCamera ref={(c) => bind(c)} />;
 *
 * @example
 * // Standalone render loop
 * const { bind, onFrame } = useCamera();
 * camera.current = new PerspectiveCamera();
 * bind(camera.current);
 * // In RAF: onFrame(deltaMs);
 *
 * @param opts - Configuration options for target, radius, and easing
 * @returns CameraHandle with bind, onFrame, and getter methods
 */
export function useCamera(opts: UseCameraOptions = {}): CameraHandle {
  const {
    target = [0, 0, 0] as const,
    baseRadius = 10,
    angularEase = 12,
  } = opts;

  // Store selector for orbit/zoom data - stable subscription
  const storeData = useInteractionStore(state => ({
    targetTheta: state.target.theta,
    targetPhi: state.target.phi,
    zoom: state.zoom,
  }));

  // Mutable refs for smooth interpolation state (no allocations in hot path)
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const smoothThetaRef = useRef<number>(0);
  const smoothPhiRef = useRef<number>(0);

  // Stable target point tuple - convert to tuple for position.set() compatibility
  const targetX = target[0];
  const targetY = target[1];
  const targetZ = target[2];
  const targetPoint = useMemo(
    () => [targetX, targetY, targetZ] as const,
    [targetX, targetY, targetZ]
  );

  // Bind camera instance (idempotent)
  const bind = useMemo(
    () => (cam: PerspectiveCamera | null) => {
      cameraRef.current = cam;
      if (cam) {
        // Initialize smooth angles to current store values on first bind
        smoothThetaRef.current = storeData.targetTheta;
        smoothPhiRef.current = storeData.targetPhi;
      }
    },
    [storeData.targetTheta, storeData.targetPhi]
  );

  // Per-frame update with eased interpolation
  const onFrame = useMemo(
    () => (dtMs: number) => {
      const camera = cameraRef.current;
      if (!camera) return;

      // Apply exponential easing to smooth angles
      smoothThetaRef.current = easeExp(
        smoothThetaRef.current,
        storeData.targetTheta,
        angularEase,
        dtMs
      );
      smoothPhiRef.current = easeExp(
        smoothPhiRef.current,
        storeData.targetPhi,
        angularEase,
        dtMs
      );

      // Compute radius from zoom with clamping
      const radius = baseRadius / clamp(storeData.zoom, 2, 10);

      // Convert spherical to cartesian coordinates
      const theta = smoothThetaRef.current;
      const phi = smoothPhiRef.current;

      const x = targetPoint[0] + radius * Math.cos(phi) * Math.cos(theta);
      const y = targetPoint[1] + radius * Math.sin(phi);
      const z = targetPoint[2] + radius * Math.cos(phi) * Math.sin(theta);

      // Apply transform to camera
      camera.position.set(x, y, z);
      camera.lookAt(targetPoint[0], targetPoint[1], targetPoint[2]);
    },
    [storeData, baseRadius, angularEase, targetPoint]
  );

  // Debug/telemetry getters
  const getSpherical = useMemo(
    () => () => ({
      theta: smoothThetaRef.current,
      phi: smoothPhiRef.current,
    }),
    []
  );

  const getRadius = useMemo(
    () => () => baseRadius / clamp(storeData.zoom, 2, 10),
    [baseRadius, storeData.zoom]
  );

  return {
    bind,
    onFrame,
    getSpherical,
    getRadius,
  };
}
