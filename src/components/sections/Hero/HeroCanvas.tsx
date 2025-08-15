// path: src/components/sections/Hero/HeroCanvas.tsx
// R3F Canvas wrapper with Suspense boundaries, DPR caps, WebGL context handling
// Provides device capability detection and quality tier initialization per AC3/AC4

'use client';

import type { RootState } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import React, { Component, ReactNode, Suspense, useEffect } from 'react';
import type { WebGLRenderer } from 'three';

import { useHeroStore } from './state/heroStore';
import { evaluateDeviceCaps } from './utils/deviceCaps';

interface HeroCanvasProps {
  /** Children are the 3D scene (e.g., <GalaxyScene />) — optional for now */
  children?: ReactNode;
  /** Accessible label for SR; defaults to "Interactive galaxy visualization" */
  ariaLabel?: string;
  /** Optional Suspense fallback; defaults to a minimal inline loader */
  fallback?: ReactNode;
  /** Optional className for the outer container */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onError: (error: string) => void;
}

/**
 * Internal ErrorBoundary for WebGL/R3F error handling
 * Catches renderer failures and reports to store
 */
class CanvasErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      /* eslint-disable-next-line no-console */
      console.error('Canvas error boundary caught:', error, errorInfo);
    }
    this.props.onError(`3D rendering failed: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-space-950 via-stellar-900 to-nebula-950'>
          <div className='text-center text-white/70'>
            <div className='text-lg font-medium'>
              3D visualization unavailable
            </div>
            <div className='mt-1 text-sm'>Fallback rendering active</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Minimal internal loading fallback
 * Used when no custom fallback provided
 */
function InlineFallback() {
  return (
    <div className='flex h-full w-full items-center justify-center bg-gradient-to-br from-space-950 via-stellar-900 to-nebula-950'>
      <div className='text-center text-white/70'>
        <div className='mb-2 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60 mx-auto' />
        <div className='text-sm font-medium'>Loading galaxy visualization</div>
      </div>
    </div>
  );
}

/**
 * R3F Canvas wrapper with device capability detection and quality optimization
 * Implements AC1-AC4 requirements with DPR caps, WebGL detection, and error handling
 */
export default function HeroCanvas({
  children,
  ariaLabel = 'Interactive galaxy visualization',
  fallback,
  className = '',
}: HeroCanvasProps) {
  const setError = useHeroStore(state => state.setError);
  const setCaps = useHeroStore(state => state.setCaps);
  const setLoaded = useHeroStore(state => state.setLoaded);
  const isMobile = useHeroStore(state => state.isMobile);

  const [glRef, setGlRef] = React.useState<WebGLRenderer | null>(null);

  // Device capability detection on mount
  useEffect(() => {
    async function initializeCapabilities() {
      try {
        const caps = await evaluateDeviceCaps();
        setCaps(caps);

        if (!caps.isWebGLAvailable) {
          setError('WebGL unavailable');
          return;
        }

        setLoaded(true);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown initialization error';
        setError(`Initialization failed: ${message}`);
      }
    }

    initializeCapabilities();
  }, [setCaps, setLoaded, setError]);

  // WebGL context loss/restore handling setup
  const handleContextCreated = (state: RootState) => {
    const { gl } = state; // gl is WebGLRenderer
    setGlRef(gl);
  };

  // WebGL event listeners with cleanup in useEffect
  useEffect(() => {
    if (!glRef) return;

    const canvas = glRef.domElement;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (process.env.NODE_ENV !== 'production') {
        /* eslint-disable-next-line no-console */
        console.warn('WebGL context lost');
      }
      setError('WebGL context lost');
    };

    const handleContextRestore = () => {
      if (process.env.NODE_ENV !== 'production') {
        /* eslint-disable-next-line no-console */
        console.debug('WebGL context restored');
      }
      setError(undefined);
      setLoaded(true);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestore);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestore);
    };
  }, [glRef, setError, setLoaded]);

  return (
    <div
      className={`h-full w-full ${className}`}
      role='img'
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <CanvasErrorBoundary onError={setError}>
        <Canvas
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{
            powerPreference: 'high-performance',
            antialias: false,
            alpha: true,
            preserveDrawingBuffer: false,
          }}
          frameloop='always'
          shadows={false}
          onCreated={handleContextCreated}
        >
          <Suspense fallback={fallback || <InlineFallback />}>
            {children}
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
