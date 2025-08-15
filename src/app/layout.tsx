// Root layout component with semantic HTML, SEO meta tags, and font optimization
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Dinesh Dawonauth',
    template: '%s | Dinesh Dawonauth',
  },
  description:
    'Data scientist & full-stack engineer in Toronto. I build ML-powered apps end-to-end—data pipelines, accurate models, elegant React/Next.js UIs, scalable APIs.',
  keywords: [
    'data scientist',
    'machine learning',
    'ml engineer',
    'full-stack engineer',
    'frontend',
    'backend',
    'react',
    'next.js',
    'typescript',
    'python',
    'sql',
    'postgresql',
    'fastapi',
    'node.js',
    'llms',
    'ai',
    'data engineering',
    'mlops',
    'portfolio',
    'toronto',
  ],
  authors: [{ name: 'Dinesh Dawonauth' }],
  creator: 'Dinesh Dawonauth',
  metadataBase: new URL('https://dineshd.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://dineshd.dev',
    title: 'Dinesh Dawonauth - Portfolio',
    description:
      'Data scientist & full-stack engineer in Toronto. I build ML-powered apps end-to-end—data pipelines, accurate models, elegant React/Next.js UIs, scalable APIs.',
    siteName: 'Dinesh Dawonauth Portfolio',
    images: [
      {
        url: 'https://dineshd.dev/og.png',
        width: 1200,
        height: 630,
        alt: 'Dinesh Dawonauth — Data Scientist & Full-Stack Engineer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dinesh Dawonauth - Portfolio',
    description:
      'Data scientist & full-stack engineer in Toronto. I build ML-powered apps end-to-end—data pipelines, accurate models, elegant React/Next.js UIs, scalable APIs.',
    images: ['https://dineshd.dev/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://dineshd.dev',
  },
  verification: {
    // Use the HTML-tag "content" value only (URL-prefix property).
    google: 'F9puku1egDkCrh_qXEJy05fQn24NLUASBrkRBfM1hRE',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/icon.svg' type='image/svg+xml' />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='theme-color' content='#1e1b4b' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </head>
      <body className='min-h-screen bg-background text-foreground antialiased'>
        <div className='relative flex min-h-screen flex-col'>
          <main className='flex-1'>{children}</main>
          <footer className='border-t border-stellar-200 bg-stellar-50 py-6'>
            <div className='hero-grid'>
              <div></div>
              <div className='text-center text-sm text-stellar-600'>
                <p>
                  © {new Date().getFullYear()} Dinesh Dawonauth. All rights
                  reserved.
                </p>
              </div>
              <div></div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
