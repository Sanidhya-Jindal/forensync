import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';

function Records() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('unidentified');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="py-4">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:text-white"
        style={{ color: '#9B9B9B' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="label-warp mb-4">DATABASE</p>
      <h1 className="text-4xl font-medium text-white mb-2">Records</h1>
      <p className="mb-8" style={{ color: '#9B9B9B' }}>
        Browse all reported cases in the system.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setActiveTab('unidentified')}
          className={activeTab === 'unidentified' ? 'btn-warp-primary' : 'btn-warp'}
        >
          Unidentified Bodies
        </button>
        <button
          onClick={() => setActiveTab('missing')}
          className={activeTab === 'missing' ? 'btn-warp-primary' : 'btn-warp'}
        >
          Missing Persons
        </button>
      </div>

      {error && (
        <div className="card-warp p-4 mb-4" style={{ borderColor: 'rgba(239,68,68,0.5)' }}>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Records List */}
      {loading ? (
        <div className="card-warp p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="card-warp p-12 text-center">
          <p style={{ color: '#717171' }}>No records found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((record, index) => (
            <div 
              key={record.pid} 
              className="card-warp p-4 cursor-pointer group animate-fade-in hover:scale-[1.01]"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1A1A1A' }}>
                    <span className="text-lg transition-transform group-hover:scale-125" style={{ color: '#717171' }}>
                      {activeTab === 'unidentified' ? '👤' : '🔍'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium font-mono text-sm">{record.pid}</p>
                    <p className="text-sm" style={{ color: '#717171' }}>
                      {record.gender || 'Unknown'} • Age: {record.estimated_age || record.age || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={record.status} />
                  <p className="text-xs mt-1" style={{ color: '#717171' }}>
                    {record.police_station || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const statusLower = (status || 'open').toLowerCase();
  const styles = {
    open: { backgroundColor: 'rgba(234,179,8,0.2)', color: '#FACC15', borderColor: 'rgba(234,179,8,0.3)' },
    identified: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34D399', borderColor: 'rgba(16,185,129,0.3)' },
    found: { backgroundColor: 'rgba(16,185,129,0.2)', color: '#34D399', borderColor: 'rgba(16,185,129,0.3)' },
    closed: { backgroundColor: '#2D2D2D', color: '#717171', borderColor: '#333333' },
  };
  
  const style = styles[statusLower] || styles.open;
  
  return (
    <span 
      className="px-2 py-1 text-xs font-medium rounded-md"
      style={{ ...style, border: `1px solid ${style.borderColor}` }}
    >
      {status || 'Open'}
    </span>
  );
}

export default Records;
