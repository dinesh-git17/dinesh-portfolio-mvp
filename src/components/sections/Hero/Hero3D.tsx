// path: src/components/sections/Hero/Hero3D.tsx
// Thin composition component that mounts Canvas and Scene with accessibility support
// Provides stable API for Hero consumption with optional debug FPS overlay

'use client';

import React from 'react';

import GalaxyScene from './GalaxyScene';
import HeroCanvas from './HeroCanvas';
import FpsMonitor from './metrics/FpsMonitor';
import LoadingFallback from './ui/LoadingFallback';

export type Hero3DProps = {
  /** Accessible label for the canvas container */
  ariaLabel?: string;
  /** Optional class for the outer Canvas wrapper */
  className?: string;
  /** Provide a custom Suspense fallback; defaults to <LoadingFallback /> */
  fallback?: React.ReactNode;
  /** Optional debug overlay to visualize FPS */
  showFps?: boolean;
  /** Scene tunables (forwarded to GalaxyScene) */
  radius?: number;
  starSize?: number;
  seed?: number;
  cameraDistance?: number;
};

/**
 * Hero3D composition component for ST-1 foundation phase.
 *
 * Responsibility: Mount Canvas and Scene together with accessibility and debug support.
 *
 * Maps to Jira Requirements:
 * - Provides stable API for Hero/index.tsx consumption
 * - Forwards scene tunables to GalaxyScene without modification
 * - Optional FPS overlay for performance validation (AC3)
 * - Accessible fallback for progressive loading (AC1)
 *
 * Invariants:
 * - No per-frame work; all runtime happens in children
 * - Shallow JSX structure for optimal performance
 * - SSR-safe at module scope
 * - Stable props API for future ST-3/4 integrations
 */
export default function Hero3D({
  ariaLabel = 'Interactive galaxy visualization',
  className,
  fallback,
  showFps = false,
  radius = 60,
  starSize = 0.025,
  seed = 1337,
  cameraDistance = 10,
}: Hero3DProps): React.JSX.Element {
  const resolvedFallback = fallback ?? <LoadingFallback />;

  return (
    <HeroCanvas
      ariaLabel={ariaLabel}
      className={className ?? ''}
      fallback={resolvedFallback}
    >
      <GalaxyScene
        radius={radius}
        starSize={starSize}
        seed={seed}
        cameraDistance={cameraDistance}
      />
      {showFps ? <FpsMonitor debugOverlay reportIntervalMs={500} /> : null}
    </HeroCanvas>
  );
}
