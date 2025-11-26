'use client';

import { useEffect } from 'react';

/**
 * Root error boundary for the entire application.
 * Catches errors in the root layout and must render its own html/body tags.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console since logger may not be available in global error context
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'Global error occurred',
        error: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
      })
    );
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div
              style={{
                margin: '0 auto 1rem',
                display: 'flex',
                height: '3rem',
                width: '3rem',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                backgroundColor: '#475569',
              }}
            >
              <svg
                style={{ height: '1.5rem', width: '1.5rem', color: 'white' }}
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
            <h2
              style={{
                marginBottom: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#475569',
              }}
            >
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#4b5563' }}>
              We encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={() => reset()}
              style={{
                borderRadius: '0.375rem',
                padding: '0.5rem 1rem',
                color: 'white',
                backgroundColor: '#475569',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
