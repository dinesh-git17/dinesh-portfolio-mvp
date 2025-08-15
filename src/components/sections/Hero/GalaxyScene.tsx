// path: src/components/sections/Hero/GalaxyScene.tsx

'use client';

import Camera from './Camera';
import Starfield from './Starfield';

/**
 * Main 3D scene composition for ST-1 foundation phase.
 *
 * Responsibility: Compose camera controls and particle system for stable, lightweight galaxy.
 *
 * Maps to Jira Acceptance Criteria:
 * - AC1: Scene loads within 3s; relies on Canvas Suspense/ErrorBoundary for performance
 * - AC2: Camera responds smoothly <100ms; delegated to Camera component drag-only controls
 * - AC4: Particle scaling adapts to device tiers; delegated to Starfield via store/config
 *
 * Invariants:
 * - No per-frame work at this level (deferred to components)
 * - Stable composition for future effects/audio integration
 * - SSR-safe at module scope
 */

export type GalaxySceneProps = {
  /** Starfield radius (world units). Default: 60 */
  radius?: number;
  /** Star size (world units). Default: 0.025 */
  starSize?: number;
  /** Seed for deterministic distribution. Default: 1337 */
  seed?: number;
  /** Camera distance from origin. Default: 10 */
  cameraDistance?: number;
  /** Optional wrapper group className */
  className?: string;
};

export default function GalaxyScene({
  radius = 60,
  starSize = 0.025,
  seed = 1337,
  cameraDistance = 10,
  className: _className,
}: GalaxySceneProps): React.JSX.Element {
  return (
    <group name={_className ?? 'GalaxyGroup'}>
      <Camera distance={cameraDistance} />
      <Starfield radius={radius} starSize={starSize} seed={seed} />
    </group>
  );
}
