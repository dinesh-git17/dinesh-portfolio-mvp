// Hero section container with responsive grid layout and future canvas slot
import HeroCopy from './HeroCopy';

export default function Hero() {
  return (
    <section
      className='relative min-h-screen w-full overflow-hidden'
      role='banner'
      aria-label='Hero section with portfolio introduction'
    >
      {/* Background container for future galaxy canvas */}
      <div className='absolute inset-0 z-0'>
        {/* Placeholder gradient background until 3D canvas is implemented */}
        <div className='h-full w-full bg-gradient-to-br from-space-950 via-stellar-900 to-nebula-950' />

        {/* Canvas slot - will be replaced with galaxy visualization in ST-1 */}
        <div
          className='absolute inset-0'
          data-testid='canvas-slot'
          aria-hidden='true'
        >
          {/* Future: <GalaxyCanvas /> will mount here */}
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
