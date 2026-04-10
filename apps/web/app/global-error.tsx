'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import './globals.css';

/**
 * Root-level error UI for App Router render failures; must define html/body.
 * Custom fallback (not `next/error`) avoids Pages Router manifest issues on App-only builds.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#capture-react-render-errors
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--paper)',
          color: 'var(--ink)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              margin: '0 0 0.75rem',
            }}
          >
            Something went wrong
          </h1>
          <p style={{ margin: 0, color: 'var(--ink3)', fontSize: '0.875rem' }}>
            This error has been reported. Please refresh the page or try again later.
          </p>
          {error.digest ? (
            <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: 'var(--ink3)' }}>
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
