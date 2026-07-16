import { useMemo, useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { api, apiService } from '../api';
import { useApp } from '../context/AppContext';
import { SectionCard, Select, TextInput } from '../components/FormPrimitives';
import { formatDateTime, getStatusTone, joinClasses, extractErrorMessage } from '../utils';

function StatusBadge({ status }) {
  const tone = getStatusTone(status);
  const classes = {
    success: 'bg-emerald-500/15 text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-red-500/15 text-red-300',
    muted: 'bg-white/10 text-muted',
    default: 'bg-white/10 text-secondary',
  };
  return <span className={joinClasses('rounded-full px-3 py-1 text-xs font-medium', classes[tone] || classes.default)}>{status || 'Open'}</span>;
}

export default function CaseRecords() {
  const { addToast, openRecord, rememberRecord } = useApp();
  const [allRecords, setAllRecords] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState('');
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

  // Load the real records from the API (the backend DOES expose list endpoints).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingList(true);
      setListError('');
      try {
        const [bodies, missing] = await Promise.all([
          apiService.getUnidentifiedBodies(),
          apiService.getMissingPersons(),
        ]);
        if (cancelled) return;
        const b = (bodies.data?.data || []).map((r) => ({ ...r, record_type: 'unidentified_body' }));
        const m = (missing.data?.data || []).map((r) => ({ ...r, record_type: 'missing_person' }));
        setAllRecords([...b, ...m]);
      } catch (error) {
        if (!cancelled) setListError(extractErrorMessage(error));
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const records = useMemo(() => {
    return allRecords.filter((record) => {
      if (record.record_type !== typeFilter) return false;
      if (statusFilter !== 'All' && String(record.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (genderFilter !== 'All' && String(record.gender || '').toLowerCase() !== genderFilter.toLowerCase()) return false;
      if (searchQuery) {
        const haystack = [record.pid, record.name, record.found_address, record.last_seen_address, record.police_station, record.status, record.gender].join(' ').toLowerCase();
        if (!haystack.includes(searchQuery.toLowerCase())) return false;
      }
      if (dateFrom || dateTo) {
        const value = new Date(record.found_date || record.reported_date || record.last_seen_date || 0).getTime();
        if (dateFrom && value < new Date(dateFrom).getTime()) return false;
        if (dateTo) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (value > end.getTime()) return false;
        }
      }
      return true;
    });
  }, [allRecords, typeFilter, statusFilter, genderFilter, searchQuery, dateFrom, dateTo]);

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
    <div className="space-y-6 py-4 animate-fade-in">
      <div>
        <p className="label-warp mb-3">DATABASE</p>
        <h1 className="text-3xl md:text-4xl font-medium text-white">Case Records</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">Browse every case in the database, filter by status or metadata, and load any case directly by PID.</p>
      </div>

      <SectionCard title="PID Lookup">
        <div className="flex flex-col gap-3 md:flex-row">
          <TextInput value={pidLookup} onChange={(event) => setPidLookup(event.target.value)} onKeyDown={(e) => e.key === 'Enter' && lookupPid()} placeholder="Enter PID like UIDB-2025-00101 or MP-2025-00012" />
          <button type="button" onClick={lookupPid} disabled={loadingPid} className="btn-warp-accent shrink-0 disabled:cursor-not-allowed disabled:opacity-60">
            {loadingPid ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Search className="h-4 w-4" />}
            Lookup PID
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Records Browser">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setTypeFilter('unidentified_body'); setPage(1); }}
                  className={typeFilter === 'unidentified_body' ? 'btn-warp-primary' : 'btn-warp'}>
            Unidentified Bodies
          </button>
          <button type="button" onClick={() => { setTypeFilter('missing_person'); setPage(1); }}
                  className={typeFilter === 'missing_person' ? 'btn-warp-primary' : 'btn-warp'}>
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

      <div className="card-warp" style={{ animation: 'none' }}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {loadingList ? 'Loading records…' : `${records.length} ${typeFilter === 'missing_person' ? 'missing persons' : 'unidentified bodies'}`}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {listError ? <span className="text-red-300">{listError}</span> : 'Live from the case database. Use the filters above to narrow results.'}
            </p>
          </div>
          <div className="text-sm text-muted">
            Page <span className="font-mono text-white">{currentPage}</span> of <span className="font-mono text-white">{totalPages}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.18em] text-muted" style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                <th className="px-5 py-3">PID</th>
                {typeFilter === 'missing_person' ? (
                  <>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Gender</th>
                    <th className="px-5 py-3">Age</th>
                    <th className="px-5 py-3">Reported</th>
                    <th className="px-5 py-3">Last Seen Address</th>
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
            <tbody className="[&>tr]:border-t" style={{ borderColor: 'var(--border)' }}>
              {pagedRecords.length ? pagedRecords.map((record) => (
                <tr key={record.pid} className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-mono">{record.pid}</td>
                  {typeFilter === 'missing_person' ? (
                    <>
                      <td className="px-5 py-4 text-secondary">{record.name || 'Unknown'}</td>
                      <td className="px-5 py-4 text-secondary">{record.gender || '—'}</td>
                      <td className="px-5 py-4 text-secondary">{record.age ?? '—'}</td>
                      <td className="px-5 py-4 text-secondary">{formatDateTime(record.reported_date)}</td>
                      <td className="px-5 py-4 text-secondary">{record.last_seen_address || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-4 text-secondary">{record.gender || '—'}</td>
                      <td className="px-5 py-4 text-secondary">{record.estimated_age ?? '—'}</td>
                      <td className="px-5 py-4 text-secondary">{formatDateTime(record.found_date)}</td>
                      <td className="px-5 py-4 text-secondary">{record.found_address || '—'}</td>
                      <td className="px-5 py-4 text-secondary">{record.police_station || '—'}</td>
                    </>
                  )}
                  <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => openRecord(record.pid)} className="btn-warp !min-h-0 !px-3 !py-1.5 !text-xs">
                      View
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-sm text-muted">
                    {loadingList ? 'Loading records…' : 'No records match these filters. Try clearing the search or status filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="btn-warp disabled:cursor-not-allowed disabled:opacity-50">
            Previous
          </button>
          <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="btn-warp disabled:cursor-not-allowed disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
