import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, User, ChevronRight, MapPin } from 'lucide-react';
import { apiService } from '../api';
import { useApp } from '../context/AppContext';
import { assetUrl } from '../utils';

function Records() {
  const navigate = useNavigate();
  const { openRecord } = useApp();
  const [activeTab, setActiveTab] = useState('unidentified');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError('');
      try {
        const response = activeTab === 'unidentified'
          ? await apiService.getUnidentifiedBodies()
          : await apiService.getMissingPersons();
        setRecords(response.data.data || response.data || []);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to fetch records');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [activeTab]);

  const filtered = useMemo(() => {
    if (!query.trim()) return records;
    const q = query.toLowerCase();
    return records.filter((r) =>
      [r.pid, r.name, r.gender, r.police_station, r.found_address, r.last_seen_address]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [records, query]);

  return (
    <div className="py-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm mb-6 text-secondary transition-colors hover:text-white"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <p className="label-warp mb-3">DATABASE</p>
      <h1 className="text-3xl md:text-4xl font-medium text-white mb-2">Records</h1>
      <p className="mb-8 text-secondary">Browse all reported cases in the system.</p>

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('unidentified')}
                  className={activeTab === 'unidentified' ? 'btn-warp-primary' : 'btn-warp'}>
            Unidentified Bodies
          </button>
          <button onClick={() => setActiveTab('missing')}
                  className={activeTab === 'missing' ? 'btn-warp-primary' : 'btn-warp'}>
            Missing Persons
          </button>
        </div>
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by PID, name, station…"
            aria-label="Filter records"
            className="input-warp pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="card-warp p-4 mb-4" style={{ borderColor: 'rgba(239,68,68,0.5)' }}>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-warp p-4 flex items-center gap-4" style={{ animation: 'none' }}>
              <div className="w-14 h-14 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
                <div className="h-3 w-48 rounded animate-pulse" style={{ background: 'var(--surface-2)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-warp p-12 text-center">
          <p className="text-muted">
            {records.length === 0 ? 'No records found.' : `No records match “${query}”.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-3">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </p>
          <div className="space-y-2">
            {filtered.map((record, index) => (
              <RecordRow
                key={record.pid}
                record={record}
                index={index}
                onOpen={() => openRecord(record.pid)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function RecordRow({ record, index, onOpen }) {
  const [imgOk, setImgOk] = useState(true);
  const photo = record.profile_photo ? assetUrl(record.profile_photo) : null;
  const place = record.found_address || record.last_seen_address || record.police_station;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-warp p-4 w-full text-left group animate-fade-in focus:outline-none focus-visible:ring-2"
      style={{ animationDelay: `${Math.min(index, 10) * 0.04}s`, outlineColor: 'var(--accent)' }}
    >
      <div className="flex items-center gap-4">
        {/* Real case photo (object-cover is fine at thumbnail size; full photo shows in the drawer) */}
        <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
             style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          {photo && imgOk ? (
            <img src={photo} alt="" className="w-full h-full object-cover" onError={() => setImgOk(false)} />
          ) : (
            <User size={20} className="text-muted" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-white font-medium font-mono text-sm">{record.pid}</p>
          <p className="text-sm text-muted truncate">
            {record.name ? `${record.name} • ` : ''}
            {record.gender || 'Unknown'} • Age: {record.estimated_age ?? record.age ?? 'N/A'}
          </p>
          {place && (
            <p className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="shrink-0" /> {place}
            </p>
          )}
        </div>

        <div className="text-right shrink-0 flex items-center gap-3">
          <StatusBadge status={record.status} />
          <ChevronRight size={16} className="text-muted group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ status }) {
  const statusLower = (status || 'open').toLowerCase();
  const styles = {
    open: { backgroundColor: 'rgba(234,179,8,0.15)', color: '#FACC15', borderColor: 'rgba(234,179,8,0.3)' },
    identified: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34D399', borderColor: 'rgba(16,185,129,0.3)' },
    found: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34D399', borderColor: 'rgba(16,185,129,0.3)' },
    closed: { backgroundColor: 'rgba(255,255,255,0.06)', color: '#8A8A92', borderColor: 'var(--border)' },
  };
  const style = styles[statusLower] || styles.open;

  return (
    <span className="px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap"
          style={{ ...style, border: `1px solid ${style.borderColor}` }}>
      {status || 'Open'}
    </span>
  );
}

export default Records;
