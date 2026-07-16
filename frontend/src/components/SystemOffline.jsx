import { RefreshCw } from 'lucide-react';

export function SystemOffline({ onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-white">
      <div className="w-full max-w-lg rounded-lg border border-white/10 bg-[var(--bg-secondary)] p-8 text-center shadow-soft">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
          <RefreshCw className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-white">System Offline</h1>
        <p className="mt-3 leading-7 text-muted">
          Unable to reach the backend server. Verify the API server is running and accessible, then retry.
        </p>
        <button type="button" onClick={onRetry} className="mt-6 rounded-md bg-[var(--accent)] px-5 py-2.5 font-medium text-white transition hover:bg-[var(--accent-strong)]">
          Retry connection
        </button>
      </div>
    </div>
  );
}
