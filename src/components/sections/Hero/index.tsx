// path: src/components/sections/Hero/index.tsx
// Hero section container with SSR text and client-side 3D integration
// Preserves layout stability and prevents CLS during 3D mount

'use client';

import dynamic from 'next/dynamic';

import HeroCopy from './HeroCopy';

// Client-only dynamic import for 3D scene (no SSR)
const Hero3D = dynamic(() => import('./Hero3D'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='h-6 w-6 animate-spin rounded-full border-2 border-space-400 border-t-transparent' />
    </div>
  ),
});

export type HeroProps = {
  /** Optional className for the <section> container */
  className?: string;
  /** Show FPS overlay during development */
  debugFps?: boolean;
};

/**
 * Hero section with SSR text content and client-side 3D galaxy visualization.
 *
 * Responsibility: Layout integration of text and 3D scene without CLS or SSR blocking.
 *
 * Maps to Jira Requirements:
 * - AC1: Text renders immediately (SSR), 3D loads progressively ≤3s
 * - Preserves existing semantic structure and accessibility features
 * - Dynamic import prevents 3D from blocking SSR hydration
 * - Reserved container space prevents cumulative layout shift
 *
 * Invariants:
 * - HeroCopy renders server-side for SEO and LCP optimization
 * - 3D content mounts client-only with proper fallback states
 * - Layout grid remains stable during all loading phases
 * - Accessibility structure maintains semantic relationships
 */
export default function Hero({ className = '', debugFps = false }: HeroProps) {
  return (
    <section
      id='hero'
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
      role='banner'
      aria-labelledby='hero-title'
    >
      {/* 3D Background Canvas - reserved space to prevent CLS */}
      <div className='absolute inset-0 z-0'>
        {/* Fixed container dimensions to prevent layout shift */}
        <div className='h-full w-full' style={{ minHeight: '100vh' }}>
          <Hero3D
            showFps={debugFps}
            ariaLabel='Interactive galaxy background visualization'
            className='absolute inset-0'
          />
        </div>
      </div>

      {/* Content overlay with responsive grid */}
      <div className='relative z-10 flex min-h-screen items-center'>
        <div className='hero-grid w-full px-4 sm:px-6 lg:px-8'>
          {/* Left grid column - empty for spacing */}
          <div className='hidden lg:block' />

          {/* Center content column */}
          <div className='flex items-center justify-start'>
            <div className='w-full max-w-3xl'>
              <HeroCopy />
            </div>
          </div>

          {/* Right grid column - reserved for future controls/UI */}
          <div className='hidden lg:block'>
            {/* Future: Audio controls, quality settings will go here */}
            <div
              className='fixed bottom-8 right-8 z-20'
              data-testid='controls-slot'
            >
              {/* Future: <HeroControls /> will mount here */}
            </div>
          </div>
        </div>
      </div>

      {/* Performance optimization: Preload hint for future 3D assets */}
      <link
        rel='preload'
        href='/galaxy-particle-texture.webp'
        as='image'
        type='image/webp'
        // Only preload if user hasn't indicated reduced motion preference
        media='(prefers-reduced-motion: no-preference)'
      />

      {/* Screen reader skip link */}
      <a
        href='#main-content'
        className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-space-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg'
      >
        Skip to main content
      </a>
    </section>
  );
}
