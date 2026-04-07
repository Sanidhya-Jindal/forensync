import { useMemo, useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { api, extractErrorMessage } from '../api';
import { useApp } from '../context/AppContext';
import { SectionCard, Select, TextInput } from '../components/FormPrimitives';
import { formatDateTime, getStatusTone, joinClasses } from '../utils';

function StatusBadge({ status }) {
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

export function CaseRecords() {
  const { recentRecords, addToast, openRecord, rememberRecord } = useApp();
  const [typeFilter, setTypeFilter] = useState('unidentified_body');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pidLookup, setPidLookup] = useState('');
  const [loadingPid, setLoadingPid] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const records = useMemo(() => {
    return recentRecords.filter((record) => {
      if (record.record_type !== typeFilter) return false;
      if (statusFilter !== 'All' && String(record.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (genderFilter !== 'All' && String(record.gender || '').toLowerCase() !== genderFilter.toLowerCase()) return false;
      if (searchQuery) {
        const haystack = [record.pid, record.name, record.location, record.police_station, record.description, record.status, record.gender].join(' ').toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) return false;
      }
      if (dateFrom || dateTo) {
        const value = new Date(record.date || record.reported_date || record.last_seen_date || record.createdAt || record.cachedAt || 0).getTime();
        if (dateFrom && value < new Date(dateFrom).getTime()) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (value > end.getTime()) return false;
        }
      }
      return true;
    });
  }, [recentRecords, typeFilter, statusFilter, genderFilter, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const lookupPid = async () => {
    if (!pidLookup.trim()) return;
    setLoadingPid(true);
    try {
      const response = await api.get(`/api/record/${encodeURIComponent(pidLookup.trim())}`);
      const record = response.data?.data || response.data;
      rememberRecord(record, 'lookup');
      addToast({ type: 'success', title: 'Record loaded', message: record.pid });
      await openRecord(record.pid);
      setPidLookup('');
    } catch (error) {
      addToast({ type: 'error', title: 'Lookup failed', message: extractErrorMessage(error) });
    } finally {
      setLoadingPid(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-white">Case Records</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Browse locally cached records, filter by status or metadata, and load any case directly by PID.</p>
      </div>

      <SectionCard title="PID Lookup">
        <div className="flex flex-col gap-3 md:flex-row">
          <TextInput value={pidLookup} onChange={(event) => setPidLookup(event.target.value)} placeholder="Enter PID like UIDB-2025-00101 or MP-2025-00012" />
          <button type="button" onClick={lookupPid} disabled={loadingPid} className="inline-flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2.5 font-medium text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loadingPid ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Search className="h-4 w-4" />}
            Lookup PID
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Records Browser">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTypeFilter('unidentified_body')} className={joinClasses('rounded-md border px-3 py-2 text-sm transition', typeFilter === 'unidentified_body' ? 'border-teal-500/40 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300')}>
            Unidentified Bodies
          </button>
          <button type="button" onClick={() => setTypeFilter('missing_person')} className={joinClasses('rounded-md border px-3 py-2 text-sm transition', typeFilter === 'missing_person' ? 'border-teal-500/40 bg-teal-500/10 text-teal-200' : 'border-slate-700 bg-slate-900 text-slate-300')}>
            Missing Persons
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <TextInput value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search PID, address, police station, description" className="xl:col-span-2" />
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Identified">Identified</option>
            <option value="Closed">Closed</option>
            <option value="Found">Found</option>
            <option value="Deceased">Deceased</option>
          </Select>
          <Select value={genderFilter} onChange={(event) => setGenderFilter(event.target.value)}>
            <option value="All">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Unknown">Unknown</option>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <TextInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            <TextInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
        </div>
      </SectionCard>

      <div className="rounded-lg border border-slate-700 bg-slate-800/90 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-white">{records.length} cached records</h2>
            <p className="mt-1 text-sm text-slate-400">The backend does not expose a paginated list endpoint, so this browser uses locally loaded cases and direct PID lookup.</p>
          </div>
          <div className="text-sm text-slate-400">
            Page <span className="font-mono text-white">{currentPage}</span> of <span className="font-mono text-white">{totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-3">PID</th>
                {typeFilter === 'missing_person' ? (
                  <>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Gender</th>
                    <th className="px-5 py-3">Age</th>
                    <th className="px-5 py-3">Last Seen</th>
                    <th className="px-5 py-3">Reporter</th>
                  </>
                ) : (
                  <>
                    <th className="px-5 py-3">Gender</th>
                    <th className="px-5 py-3">Est. Age</th>
                    <th className="px-5 py-3">Found Date</th>
                    <th className="px-5 py-3">Found Address</th>
                    <th className="px-5 py-3">Police Station</th>
                  </>
                )}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {pagedRecords.length ? pagedRecords.map((record) => (
                <tr key={record.pid} className="hover:bg-slate-900/80">
                  <td className="px-5 py-4 font-mono text-teal-300">{record.pid}</td>
                  {typeFilter === 'missing_person' ? (
                    <>
                      <td className="px-5 py-4 text-slate-200">{record.name || 'Unknown'}</td>
                      <td className="px-5 py-4 text-slate-300">{record.gender || '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{record.age ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{formatDateTime(record.last_seen_date || record.date)}</td>
                      <td className="px-5 py-4 text-slate-300">{record.reporter_name || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4 text-slate-300">{record.gender || '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{record.estimated_age ?? '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{formatDateTime(record.found_date || record.date)}</td>
                      <td className="px-5 py-4 text-slate-300">{record.location || record.found_address || '—'}</td>
                      <td className="px-5 py-4 text-slate-300">{record.police_station || '—'}</td>
                    </>
                  )}
                  <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => openRecord(record.pid)} className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-900">
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={typeFilter === 'missing_person' ? 7 : 8} className="px-5 py-14 text-center text-sm text-slate-400">
                    No records match the current cache and filters. Load a PID directly or open a case from Search &amp; Match to populate this list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-700 px-5 py-4">
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
            Previous
          </button>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
