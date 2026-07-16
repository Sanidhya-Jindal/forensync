import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { apiService } from '../api';
import { assetUrl } from '../utils';

function SearchMatch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchType, setSearchType] = useState('text');
  const [targetType, setTargetType] = useState('missing_person');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  // Revoke previous blob URL whenever photo changes to prevent memory leak
  useEffect(() => {
    if (!photo) return;
    const objectUrl = URL.createObjectURL(photo);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  // If we arrived from the home hero with ?q=…, run that search immediately.
  const ranInitial = useRef(false);
  useEffect(() => {
    if (searchParams.get('q') && !ranInitial.current) {
      ranInitial.current = true;
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      // Preview is handled by the effect above
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError('');
    setSearching(true);
    setResults([]);

    try {
      const formData = new FormData();
      if (searchType === 'photo' && photo) {
        formData.append('photo', photo);
      } else {
        formData.append('search_text', query);
      }
      formData.append('target_type', targetType);
      const response = await apiService.searchMatch(formData);
      setResults(response.data.results || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="py-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm mb-6 text-secondary transition-colors hover:text-white"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      <p className="label-warp mb-3">SEARCH</p>
      <h1 className="text-3xl md:text-4xl font-medium text-white mb-2">Search &amp; Match</h1>
      <p className="mb-8 text-secondary">
        Find potential matches between missing persons and unidentified bodies.
      </p>

      {error && (
        <div className="card-warp p-4 mb-6" style={{ borderColor: 'rgba(239,68,68,0.5)' }}>
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSearchType('text')}
          className={searchType === 'text' ? 'btn-warp-primary' : 'btn-warp'}
        >
          Text Search
        </button>
        <button
          onClick={() => setSearchType('photo')}
          className={searchType === 'photo' ? 'btn-warp-primary' : 'btn-warp'}
        >
          Photo Search
        </button>
      </div>

      {/* Which population to match against (cross-population search) */}
      <div className="mb-6">
        <p className="text-sm mb-2 text-secondary">Search against</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTargetType('missing_person')}
            className={targetType === 'missing_person' ? 'btn-warp-primary' : 'btn-warp'}
          >
            Missing Persons
          </button>
          <button
            onClick={() => setTargetType('unidentified_body')}
            className={targetType === 'unidentified_body' ? 'btn-warp-primary' : 'btn-warp'}
          >
            Unidentified Bodies
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        {searchType === 'text' ? (
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter description, name, or keywords..."
              className="input-warp flex-1"
            />
            <button
              type="submit"
              disabled={searching}
              className="btn-warp-primary disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        ) : (
          <div className="card-warp p-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-1 w-full">
                <label className="block text-sm mb-2 text-secondary">
                  Upload a photo for facial recognition matching
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="input-warp"
                />
                <button
                  type="submit"
                  disabled={searching || !photo}
                  className="btn-warp-primary mt-4 disabled:opacity-50"
                >
                  {searching ? 'Scanning…' : 'Search by Photo'}
                </button>
              </div>
              {photoPreview && (
                <ScanPreview src={photoPreview} scanning={searching} />
              )}
            </div>
          </div>
        )}
      </form>

      {/* Results */}
      <div>
        <p className="label-warp mb-4">RESULTS {results.length > 0 && `(${results.length})`}</p>
        {searching ? (
          <div className="card-warp p-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : results.length === 0 ? (
          <div className="card-warp p-12 text-center">
            <p className="text-muted">No results yet. Enter a search query above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result, index) => (
              <ResultCard key={result.pid || index} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ScanPreview({ src, scanning }) {
  const corner = (pos) => {
    const s = { position: 'absolute', width: 16, height: 16 };
    if (pos.includes('t')) { s.top = 6; s.borderTop = '2px solid'; }
    if (pos.includes('b')) { s.bottom = 6; s.borderBottom = '2px solid'; }
    if (pos.includes('l')) { s.left = 6; s.borderLeft = '2px solid'; }
    if (pos.includes('r')) { s.right = 6; s.borderRight = '2px solid'; }
    return s;
  };
  return (
    <div className={`scan-frame rounded-xl shrink-0 ${scanning ? 'scanning' : ''}`}
         style={{ width: 200, height: 200, border: '1px solid var(--border-strong)', background: '#000' }}>
      <img src={src} alt="Uploaded face being scanned" className="w-full h-full object-cover" style={{ opacity: 0.92 }} />
      <div className="scan-grid" />
      <div className="scan-band" />
      <div className="scan-line" style={{ top: 0 }} />
      <span className="scan-corner" style={corner('tl')} />
      <span className="scan-corner" style={corner('tr')} />
      <span className="scan-corner" style={corner('bl')} />
      <span className="scan-corner" style={corner('br')} />
      <div className="absolute left-0 right-0 bottom-0 flex items-center gap-2 px-2 py-1.5"
           style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.75))' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        <span className="text-[11px] font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          {scanning ? 'SCANNING FACE…' : 'READY TO SCAN'}
        </span>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const details = result.details || {};
  const confidence = Math.round(
    result.confidence_percentage != null
      ? result.confidence_percentage
      : (result.combined_score || 0) * 100
  );
  const photoPath = details.profile_photo;

  return (
    <div className="card-warp p-4 transition-all duration-300 cursor-pointer group animate-fade-in hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {photoPath && (
            <div className="w-16 h-16 rounded-lg overflow-hidden relative group-hover:scale-110 transition-transform duration-300" style={{ background: 'var(--surface-2)' }}>
              <img
                src={assetUrl(photoPath)}
                alt="Match"
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}
          <div>
            <p className="text-white font-medium font-mono">{result.pid}</p>
            <p className="text-sm text-muted">
              {details.name ? `${details.name} • ` : ''}{details.gender || 'Unknown'} • Age: {details.age || details.estimated_age || 'N/A'}
            </p>
            {details.police_station && (
              <p className="text-sm text-muted">{details.police_station}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-medium transition-all group-hover:scale-110 ${
            result.match_band === 'strong' ? 'text-emerald-400' :
            result.match_band === 'possible' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {confidence}%
          </p>
          <p className="text-xs capitalize text-muted">
            {result.match_band ? `${result.match_band} match` : 'match'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default SearchMatch;
