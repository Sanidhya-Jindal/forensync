import { RefreshCw } from 'lucide-react';

export function SystemOffline({ onRetry }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 text-slate-100">
      <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-8 text-center shadow-soft">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-300">
          <RefreshCw className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-white">System Offline</h1>
        <p className="mt-3 leading-7 text-slate-400">
          The backend at http://localhost:8000 is unreachable. Verify the FastAPI server is running, then retry.
        </p>
        <button type="button" onClick={onRetry} className="mt-6 rounded-md bg-teal-600 px-5 py-2.5 font-medium text-white transition hover:bg-teal-500">
          Retry connection
        </button>
      </div>
    </div>
  );
}
