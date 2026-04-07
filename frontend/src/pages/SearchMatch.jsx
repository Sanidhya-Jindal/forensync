import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api';

function SearchMatch() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('text');
  const [query, setQuery] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSearching(true);
    setResults([]);

    try {
      if (searchType === 'photo' && photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        const response = await apiService.searchByImage(formData);
        setResults(response.data.matches || []);
      } else {
        const response = await apiService.searchMatch({ search_text: query });
        setResults(response.data.matches || []);
      }
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
        className="flex items-center gap-2 text-sm mb-6 transition-colors hover:text-white"
        style={{ color: '#9B9B9B' }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <p className="label-warp mb-4">SEARCH</p>
      <h1 className="text-4xl font-medium text-white mb-2">Search & Match</h1>
      <p className="mb-8" style={{ color: '#9B9B9B' }}>
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
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <label className="block text-sm mb-2" style={{ color: '#9B9B9B' }}>
                  Upload a photo for facial recognition matching
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="input-warp"
                />
              </div>
              {photoPreview && (
                <div className="w-24 h-24 rounded-lg overflow-hidden" style={{ border: '1px solid #333333' }}>
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={searching || !photo}
              className="btn-warp-primary mt-4 disabled:opacity-50"
            >
              {searching ? 'Analyzing...' : 'Search by Photo'}
            </button>
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
            <p style={{ color: '#717171' }}>No results yet. Enter a search query above.</p>
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

function ResultCard({ result }) {
  const confidence = Math.round((result.similarity || result.confidence_score || 0) * 100);
  
  return (
    <div className="card-warp p-4 transition-all duration-300 cursor-pointer group animate-fade-in hover:scale-[1.01]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {result.photo_path && (
            <div className="w-16 h-16 rounded-lg overflow-hidden relative group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#1A1A1A' }}>
              <img 
                src={`http://localhost:8000/${result.photo_path}`} 
                alt="Match"
                className="w-full h-full object-cover"
                onError={(e) => e.target.style.display = 'none'}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}
          <div>
            <p className="text-white font-medium font-mono">{result.pid}</p>
            <p className="text-sm" style={{ color: '#717171' }}>
              {result.gender || 'Unknown'} • Age: {result.age || result.estimated_age || 'N/A'}
            </p>
            {result.police_station && (
              <p className="text-sm" style={{ color: '#717171' }}>{result.police_station}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-lg font-medium transition-all group-hover:scale-110 ${
            confidence >= 75 ? 'text-emerald-400' : 
            confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {confidence}%
          </p>
          <p className="text-xs" style={{ color: '#717171' }}>match</p>
        </div>
      </div>
    </div>
  );
}

export default SearchMatch;
