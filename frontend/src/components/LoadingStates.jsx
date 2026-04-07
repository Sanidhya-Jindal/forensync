export function SkeletonCard() {
  return <div className="h-28 animate-pulse rounded-lg border border-slate-700 bg-slate-800/70" />;
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800/60">
      <div className="grid grid-cols-5 gap-4 border-b border-slate-700 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span>PID</span>
        <span>Type</span>
        <span>Date</span>
        <span>Status</span>
        <span>Location</span>
      </div>
      <div className="divide-y divide-slate-700">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 px-4 py-4">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-700" />
            <div className="h-4 w-40 animate-pulse rounded bg-slate-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/70 p-4">
      <div className="flex gap-4">
        <div className="h-24 w-24 animate-pulse rounded-md bg-slate-700" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
