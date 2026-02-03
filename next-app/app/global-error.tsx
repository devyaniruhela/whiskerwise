'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui', padding: 24, background: '#f0fdf4' }}>
        <div style={{ maxWidth: 480, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 16, border: '2px solid #fecaca' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 24, fontFamily: 'monospace' }}>{error.message}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={reset}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#6cb257', color: '#fff', border: 'none', fontWeight: 500 }}
            >
              Try again
            </button>
            <a
              href="/now-wiser"
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none' }}
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
