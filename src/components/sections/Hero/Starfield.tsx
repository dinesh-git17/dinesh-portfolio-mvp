// path: src/components/sections/Hero/Starfield.tsx
// Static InstancedMesh starfield with tier-based particle scaling for Hero Galaxy scene
// Deterministic seeded placement, minimal geometry, no animations per AC1/AC3/AC4

'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { selectConfig, useHeroStore } from './state/heroStore';

export type StarfieldProps = {
  /** Outer radius for random spherical distribution (world units). Default: 60 */
  radius?: number;
  /** Radius of each star sphere (world units). Default: 0.025 */
  starSize?: number;
  /** Seed for deterministic placement across renders/tiers. Default: 1337 */
  seed?: number;
  /** Optional className for container group */
  className?: string;
};

/**
 * Simple Linear Congruential Generator for deterministic star placement
 * Ensures consistent positioning across renders and quality tier changes
 * @param seed Initial seed value
 * @returns PRNG function returning values in [0, 1)
 */
function createSeededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return function (): number {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * Generate deterministic star positions within a sphere
 * Uses Marsaglia's method for uniform spherical distribution
 * @param count Number of stars to generate
 * @param radius Sphere radius for distribution
 * @param random Seeded random number generator
 * @returns Array of Vector3 positions
 */
function generateStarPositions(
  count: number,
  radius: number,
  random: () => number
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    // Marsaglia method for uniform sphere point picking
    let x1: number, x2: number, w: number;
    do {
      x1 = 2.0 * random() - 1.0;
      x2 = 2.0 * random() - 1.0;
      w = x1 * x1 + x2 * x2;
    } while (w >= 1.0);

    const sqrtW = Math.sqrt((-2.0 * Math.log(w)) / w);
    const y = x1 * sqrtW;
    const z = x2 * sqrtW;

    // Third coordinate for sphere
    const x = 2.0 * random() - 1.0;

    // Normalize to unit sphere, then scale by random radius
    const length = Math.sqrt(x * x + y * y + z * z);
    const r = radius * Math.cbrt(random()); // Cube root for uniform volume distribution

    positions.push(
      new THREE.Vector3((x / length) * r, (y / length) * r, (z / length) * r)
    );
  }

  return positions;
}

export default function Starfield({
  radius = 60,
  starSize = 0.025,
  seed = 1337,
  className,
}: StarfieldProps): React.JSX.Element {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const config = useHeroStore(selectConfig);

  // Generate star positions when particles count, radius, or seed changes
  const starPositions = useMemo(() => {
    const random = createSeededRandom(seed);
    return generateStarPositions(config.particles, radius, random);
  }, [config.particles, radius, seed]);

  // Create geometry and material (static, only recreated if starSize changes)
  const { geometry, material } = useMemo(() => {
    const geom = new THREE.SphereGeometry(starSize, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });

    return { geometry: geom, material: mat };
  }, [starSize]);

  // Update instance matrices when positions or count changes
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !starPositions.length) return;

    // Set instance count to current particle count
    mesh.count = config.particles;

    // Update instance matrices for visible particles
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < config.particles; i++) {
      if (i < starPositions.length) {
        const position = starPositions[i];
        if (position) {
          matrix.setPosition(position.x, position.y, position.z);
          mesh.setMatrixAt(i, matrix);
        }
      }
    }

    // Mark instance matrix for GPU update
    mesh.instanceMatrix.needsUpdate = true;
  }, [starPositions, config.particles]);

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <group name={className ?? 'StarfieldGroup'}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, config.particles]}
        frustumCulled={true}
      />
    </group>
  );
}
