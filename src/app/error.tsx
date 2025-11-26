'use client';

import { useEffect } from 'react';
import { log } from '@/lib/utils/logger';

/**
 * Route segment error boundary.
 * Catches errors in route segments and displays a user-friendly fallback.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    log.error('Route error occurred', error, { digest: error.digest });
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: '#475569' }}
        >
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-semibold" style={{ color: '#475569' }}>
          Something went wrong
        </h2>
        <p className="mb-6 text-gray-600">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="rounded-md px-4 py-2 text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: '#475569' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
