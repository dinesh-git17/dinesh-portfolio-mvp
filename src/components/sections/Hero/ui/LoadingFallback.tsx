// path: src/components/sections/Hero/ui/LoadingFallback.tsx
// Accessible, reduced-motion-aware Suspense fallback for Hero Galaxy Canvas
// Pure SSR-safe component with minimal DOM footprint for AC1 performance

export type LoadingFallbackProps = {
  /** Accessible label for screen readers. Default: "Loading galaxy experience…" */
  label?: string;
  /** Optional helper text visible under the spinner (kept short). */
  helperText?: string;
  /** Size in px for the spinner visual. Default: 24 */
  size?: number;
  /** Optional className to style the outer container */
  className?: string;
  /** Data test id for E2E tests */
  'data-testid'?: string;
};

export default function LoadingFallback({
  label = 'Loading galaxy experience…',
  helperText,
  size = 24,
  className = '',
  'data-testid': dataTestId = 'hero-loading-fallback',
}: LoadingFallbackProps): React.JSX.Element {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center space-y-3 ${className}`}
      role='status'
      aria-live='polite'
      aria-busy='true'
      data-testid={dataTestId}
    >
      {/* Visually hidden screen reader text */}
      <span className='sr-only'>{label}</span>

      {/* Animated spinner - respects prefers-reduced-motion */}
      <div
        className='border-2 border-current border-t-transparent rounded-full motion-safe:animate-spin text-space-400'
        style={{ width: size, height: size }}
        aria-hidden='true'
      />

      {/* Optional helper text */}
      {helperText && (
        <p className='text-sm text-stellar-600 text-center max-w-xs leading-relaxed'>
          {helperText}
        </p>
      )}
    </div>
  );
}
