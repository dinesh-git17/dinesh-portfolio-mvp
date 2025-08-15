// path: src/components/sections/Hero/Camera.tsx
// Orbital camera controller with drag-only rotation for Hero Galaxy scene
// Implements AC2 responsiveness requirements without zoom/pan/damping per ST-1 scope

'use client';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { ReactElement } from 'react';

/**
 * Camera component props interface
 * Provides stable API for orbital camera configuration
 */
export interface CameraProps {
  /** Initial spherical distance from origin (world units). Default: 10 */
  distance?: number;
  /** Vertical limits to avoid flipping. Default: [0.25 * Math.PI, 0.9 * Math.PI] */
  polarLimits?: [number, number];
  /** Horizontal rotation speed (radians per pixel). Default: drei default */
  rotateSpeed?: number;
  /** Optional: className for a wrapping group */
  className?: string;
}

/**
 * Orbital camera controller for Hero Galaxy scene
 *
 * Implements AC2 Camera Control Responsiveness:
 * - Drag rotation responds within ≤100ms of input per AC2 requirements
 * - Touch/mouse input provides smooth orbital motion around galaxy center
 * - Disabled zoom/pan/damping per ST-1 scope (zoom/inertia added in ST-2)
 *
 * Technical approach:
 * - Uses drei PerspectiveCamera + OrbitControls for proven performance
 * - Conservative FOV (55°) and near/far planes for optimal culling
 * - Polar angle limits prevent camera flipping and maintain orientation
 * - Single-finger touch rotation supported on mobile devices
 *
 * Out of scope for ST-1:
 * - Zoom controls (enableZoom=false) - added in ST-2
 * - Pan movement (enablePan=false) - not in roadmap
 * - Inertial damping (enableDamping=false) - added in ST-2
 *
 * @param props - Camera configuration options
 * @returns ReactElement containing PerspectiveCamera and OrbitControls
 */
export default function Camera({
  distance = 10,
  polarLimits = [0.25 * Math.PI, 0.9 * Math.PI],
  rotateSpeed,
  className: _className,
}: CameraProps): ReactElement {
  return (
    <>
      {/* Main camera with conservative settings for performance */}
      <PerspectiveCamera
        makeDefault
        fov={55}
        near={0.1}
        far={1000}
        position={[0, 0, distance]}
      />

      {/* Orbital controls restricted to rotation-only per ST-1 scope */}
      <OrbitControls
        target={[0, 0, 0]}
        // Rotation settings
        enableRotate={true}
        {...(rotateSpeed !== undefined ? { rotateSpeed } : {})}
        minPolarAngle={polarLimits[0]}
        maxPolarAngle={polarLimits[1]}
        // Disabled interactions per ST-1 scope
        enableZoom={false}
        enablePan={false}
        enableDamping={false}
        // Touch support for mobile devices
        touches={{
          ONE: 2, // ROTATE
          TWO: 0, // NONE (no zoom/pan)
        }}
      />
    </>
  );
}
