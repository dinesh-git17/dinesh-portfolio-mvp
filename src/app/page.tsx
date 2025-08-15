// Home page with Hero section integration for portfolio
import Hero from '@/components/sections/Hero';

export default function HomePage() {
  return (
    <>
      {/* Hero section with SSR text content */}
      <Hero />

      {/* Main content sections will be added in future iterations */}
      <div id='main-content' className='relative z-10'>
        {/* Future sections: About, Work, Skills, Contact */}

        {/* Placeholder content for development */}
        <section className='bg-white py-24'>
          <div className='hero-grid'>
            <div></div>
            <div className='text-center'>
              <h2 className='text-3xl font-bold text-stellar-900 sm:text-4xl'>
                More sections coming soon
              </h2>
              <p className='mt-4 text-lg text-stellar-600'>
                Additional portfolio sections will be implemented in future
                sprints.
              </p>
            </div>
            <div></div>
          </div>
        </section>
      </div>
    </>
  );
}
