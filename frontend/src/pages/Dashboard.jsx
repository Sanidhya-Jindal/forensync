import { ArrowRight, Database, Image, MapPin, ShieldAlert, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SkeletonCard, SkeletonTable } from '../components/LoadingStates';
import { formatDateTime, formatNumber, getStatusTone, joinClasses } from '../utils';

function MetricCard({ label, value, subtitle, tone = 'default', icon: Icon }) {
  const toneClasses = {
    default: 'text-white',
    teal: 'text-teal-300',
    amber: 'text-amber-300',
    emerald: 'text-emerald-300',
    red: 'text-red-300',
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/90 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">{label}</div>
          <div className={joinClasses('mt-2 font-heading text-3xl font-semibold', toneClasses[tone] || toneClasses.default)}>{value}</div>
          {subtitle ? <div className="mt-2 text-sm text-slate-500">{subtitle}</div> : null}
        </div>
        {Icon ? <Icon className="h-5 w-5 text-slate-500" /> : null}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const tone = getStatusTone(status);
  const classes = {
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
    muted: 'bg-slate-700 text-slate-300',
    default: 'bg-slate-700 text-slate-200',
  };
  return <span className={joinClasses('rounded-full px-3 py-1 text-xs font-medium', classes[tone] || classes.default)}>{status || 'Open'}</span>;
}

export function Dashboard() {
  const { stats, health, recentRecords, openRecord } = useApp();
  const databaseStats = stats?.database || {};
  const vectorStats = stats?.vector_database || {};
  const healthServices = [
    { label: 'Database', value: health?.database, icon: Database },
    { label: 'Vector DB', value: health?.vector_db, icon: Image },
    { label: 'Face Recognition', value: health?.face_recognition, icon: ShieldAlert },
  ];
  const activityRows = recentRecords.slice(0, 10);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-white">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Operational overview of unidentified body and missing person records, vector availability, and recent case activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats ? (
          <>
            <MetricCard label="Total Unidentified Bodies" value={formatNumber(databaseStats.unidentified_bodies)} subtitle="cases in database" icon={Users} />
            <MetricCard label="Total Missing Persons" value={formatNumber(databaseStats.missing_persons)} subtitle="reported cases" icon={Users} />
            <MetricCard label="Open UIDB Cases" value={formatNumber(databaseStats.uidb_by_status?.Open || databaseStats.uidb_by_status?.open || 0)} subtitle="unresolved cases" tone="amber" icon={ShieldAlert} />
            <MetricCard label="Identified Cases" value={formatNumber(databaseStats.uidb_by_status?.Identified || databaseStats.mp_by_status?.Found || 0)} subtitle="resolved matches" tone="teal" icon={ArrowRight} />
          </>
        ) : (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-lg border border-slate-700 bg-slate-800/90 shadow-soft">
          <div className="border-b border-slate-700 px-5 py-4">
            <h2 className="font-heading text-lg font-semibold text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-400">Recent records viewed or created in this session.</p>
          </div>
          {activityRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3">PID</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {activityRows.map((record) => (
                    <tr key={record.pid} onClick={() => openRecord(record.pid)} className="cursor-pointer transition hover:bg-slate-900/80">
                      <td className="px-5 py-4 font-mono text-teal-300">{record.pid}</td>
                      <td className="px-5 py-4 text-slate-200">{record.record_type === 'missing_person' ? 'Missing Person' : 'UIDB'}</td>
                      <td className="px-5 py-4 text-slate-300">{formatDateTime(record.date)}</td>
                      <td className="px-5 py-4"><StatusPill status={record.status} /></td>
                      <td className="px-5 py-4 text-slate-300">{record.location || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-10 text-sm text-slate-400">
              No local case activity yet. Open a record from Search & Match or submit a report to populate the activity feed.
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-lg border border-slate-700 bg-slate-800/90 p-5 shadow-soft">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">System Health</h2>
            <p className="mt-1 text-sm text-slate-400">Service availability and vector index counts.</p>
          </div>
          <div className="space-y-3">
            {healthServices.map((service) => (
              <div key={service.label} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
                <div className="flex items-center gap-3">
                  <service.icon className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-200">{service.label}</span>
                </div>
                <div className={joinClasses('flex items-center gap-2 text-xs', service.value === 'healthy' || service.value === 'available' ? 'text-emerald-300' : 'text-red-300')}>
                  <span className={joinClasses('h-2.5 w-2.5 rounded-full', service.value === 'healthy' || service.value === 'available' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
                  {service.value || 'unavailable'}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Vector counts</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-3">
                <div className="text-slate-400">Text embeddings</div>
                <div className="mt-1 font-mono text-lg text-white">{formatNumber(vectorStats.text_embeddings)}</div>
              </div>
              <div className="rounded-md border border-slate-700 bg-slate-950 px-3 py-3">
                <div className="text-slate-400">Face embeddings</div>
                <div className="mt-1 font-mono text-lg text-white">{formatNumber(vectorStats.face_embeddings)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 px-4 py-4 text-sm text-teal-100">
            Use Search & Match for investigative triage. Records opened from the drawer are cached locally for faster recall.
          </div>
        </section>
      </div>
    </div>
  );
}
