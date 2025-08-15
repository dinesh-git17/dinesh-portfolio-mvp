// Hero copy component with semantic SSR text content for data scientist & full-stack engineer
import Link from 'next/link';

export default function HeroCopy() {
  return (
    <div className='relative z-10 flex flex-col items-start justify-center space-y-6 text-left'>
      {/* Main heading with semantic H1 */}
      <div className='space-y-2'>
        <h1 className='text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl'>
          <span className='block'>Dinesh Dawonauth</span>
          <span className='block bg-gradient-to-r from-space-600 via-nebula-600 to-space-700 bg-clip-text text-transparent'>
            Data Scientist &
          </span>
          <span className='block bg-gradient-to-r from-nebula-600 via-space-600 to-nebula-700 bg-clip-text text-transparent'>
            Full-Stack Engineer
          </span>
        </h1>
      </div>

      {/* Subtitle with value proposition */}
      <div className='max-w-2xl'>
        <p className='text-lg leading-relaxed text-stellar-700 sm:text-xl'>
          Based in Toronto, I build{' '}
          <span className='font-semibold text-space-700'>ML-powered apps</span>{' '}
          end-to-end—from data pipelines and accurate models to elegant{' '}
          <span className='font-semibold text-nebula-700'>
            React/Next.js UIs
          </span>{' '}
          and scalable APIs.
        </p>
      </div>

      {/* Supporting description */}
      <div className='max-w-xl'>
        <p className='text-base leading-relaxed text-stellar-600'>
          I specialize in transforming complex data into intelligent
          applications that solve real-world problems, with expertise spanning
          machine learning, modern web development, and cloud architecture.
        </p>
      </div>

      {/* Call-to-action buttons */}
      <div className='flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
        <Link
          href='#work'
          className='inline-flex items-center justify-center rounded-md bg-space-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-space-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-space-500 focus:ring-offset-2'
        >
          View My Work
        </Link>
        <Link
          href='#contact'
          className='inline-flex items-center justify-center rounded-md border border-stellar-300 bg-white px-6 py-3 text-base font-medium text-stellar-700 shadow-sm transition-all duration-200 hover:bg-stellar-50 hover:border-stellar-400 focus:outline-none focus:ring-2 focus:ring-space-500 focus:ring-offset-2'
        >
          Get In Touch
        </Link>
      </div>

      {/* Quick skills highlight */}
      <div className='pt-4'>
        <div className='flex flex-wrap gap-2'>
          {[
            'Python',
            'TypeScript',
            'React',
            'Machine Learning',
            'PostgreSQL',
            'FastAPI',
            'Next.js',
            'LLMs',
          ].map(skill => (
            <span
              key={skill}
              className='inline-flex items-center rounded-full bg-stellar-100 px-3 py-1 text-sm font-medium text-stellar-700'
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
