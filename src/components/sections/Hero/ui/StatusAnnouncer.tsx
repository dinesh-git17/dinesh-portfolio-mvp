// path: src/components/sections/Hero/ui/StatusAnnouncer.tsx
// Accessible status/error announcer for 3D scene loading and WebGL failures
// Provides SR-only and optional visible error reporting per a11y requirements

'use client';

import React, { useEffect, useRef } from 'react';

import { useHeroStore } from '../state/heroStore';

export type StatusAnnouncerProps = {
  /** Show a small visible banner for errors instead of SR-only. Default: false (SR-only) */
  visibleError?: boolean;
  /** Optional className for the visible error banner container */
  className?: string;
  /** Data test id for E2E tests */
  'data-testid'?: string;
};

/**
 * Accessible status announcer for Hero Galaxy 3D scene.
 *
 * Responsibility: Surface loading states and errors to assistive technology without
 * interfering with visual design or performance.
 *
 * Implementation details:
 * - Uses separate live regions for status (polite) vs errors (assertive)
 * - Prevents duplicate announcements via ref tracking
 * - Optional visible error banner with unobtrusive styling
 * - Zero performance impact: minimal DOM, selective subscriptions
 * - SSR-safe: no browser APIs at module scope
 *
 * Invariants:
 * - Status announces only once when loaded becomes true
 * - Error announces immediately when error state changes
 * - Visible errors are non-blocking and dismissible by nature
 * - All text content is concise and actionable
 */
export default function StatusAnnouncer({
  visibleError = false,
  className = '',
  'data-testid': dataTestId = 'hero-status-announcer',
}: StatusAnnouncerProps): React.JSX.Element | null {
  // Selective store subscriptions to minimize re-renders
  const isLoaded = useHeroStore(state => state.isLoaded);
  const error = useHeroStore(state => state.error);

  // Track if we've already announced "loaded" to prevent duplicates
  const hasAnnouncedLoadedRef = useRef(false);

  // Reset announced state when error changes (for potential recovery scenarios)
  useEffect(() => {
    if (error) {
      hasAnnouncedLoadedRef.current = false;
    }
  }, [error]);

  // Determine status message for polite announcements
  let statusMessage = '';
  if (isLoaded && !hasAnnouncedLoadedRef.current) {
    statusMessage = 'Galaxy ready.';
    hasAnnouncedLoadedRef.current = true;
  }

  // Don't render if no status to announce and no error to display
  if (!statusMessage && !error) {
    return null;
  }

  return (
    <div data-testid={dataTestId}>
      {/* SR-only status region for loading completion (polite) */}
      {statusMessage && (
        <div
          role='status'
          aria-live='polite'
          aria-atomic='true'
          className='sr-only'
        >
          {statusMessage}
        </div>
      )}

      {/* Error announcements and optional visible banner */}
      {error && (
        <>
          {/* SR-only error announcement (assertive/immediate) */}
          <div role='alert' aria-atomic='true' className='sr-only'>
            3D visualization error: {error}
          </div>

          {/* Optional visible error banner */}
          {visibleError && (
            <div
              className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md rounded-md bg-red-600/10 border border-red-600/30 px-3 py-2 text-sm text-red-700 dark:text-red-300 shadow-lg ${className}`}
              role='alert'
              aria-describedby='error-details'
            >
              <div className='flex items-start gap-2'>
                <div className='flex-1'>
                  <p className='font-medium'>
                    3D unavailable. Showing text-only experience.
                  </p>
                  <span id='error-details' className='sr-only'>
                    Technical details: {error}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
