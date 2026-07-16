import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Fingerprint, UserSearch, ScanFace, Database, ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { apiService } from '../api';

function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const statsRes = await apiService.getStats();
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const databaseStats = stats?.data?.database || stats?.database || {};

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/search-match?q=${encodeURIComponent(q.trim())}` : '/search-match');
  };

  const features = [
    {
      label: 'REPORT',
      title: 'Unidentified Body',
      description: 'Submit details about a found unidentified body for identification matching.',
      to: '/report-unidentified-body',
      Icon: Fingerprint,
    },
    {
      label: 'REPORT',
      title: 'Missing Person',
      description: 'File a missing person report with photos and physical descriptions.',
      to: '/report-missing-person',
      Icon: UserSearch,
    },
    {
      label: 'SEARCH',
      title: 'Search & Match',
      description: 'Cross-match with AI facial recognition and description-based similarity.',
      to: '/search-match',
      Icon: ScanFace,
    },
    {
      label: 'VIEW',
      title: 'Records',
      description: 'Browse and manage every reported case in the database.',
      to: '/records',
      Icon: Database,
    },
  ];

  return (
    <div className="py-4 relative">
      {/* Hero */}
      <section className="relative py-14 md:py-20 mb-14">
        <div className="absolute inset-0 grid-bg pointer-events-none" aria-hidden="true"></div>

        <div className="relative max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full"
               style={{ background: 'var(--accent-soft)', border: '1px solid var(--border)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }}></span>
            <span className="label-warp">AI Identification System</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium text-white leading-[1.05] tracking-tight mb-5">
            Reuniting families<br />through technology
          </h1>
          <p className="text-lg md:text-xl mb-8 text-secondary max-w-2xl mx-auto">
            ForenSync matches missing persons with unidentified bodies using facial
            recognition and description-based similarity — turning scattered records into answers.
          </p>

          {/* Search straight from the hero */}
          <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, description, or distinguishing marks…"
                aria-label="Search records"
                className="input-warp pl-10"
              />
            </div>
            <button type="submit" className="btn-warp-primary sm:w-auto">
              Search <ArrowRight size={16} />
            </button>
          </form>
          <p className="text-sm text-muted">
            or{' '}
            <Link to="/report-missing-person" className="underline underline-offset-4 hover:text-white transition-colors">
              report a missing person
            </Link>{' '}
            ·{' '}
            <Link to="/report-unidentified-body" className="underline underline-offset-4 hover:text-white transition-colors">
              report an unidentified body
            </Link>
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="UNIDENTIFIED" value={loading ? '—' : databaseStats.unidentified_bodies ?? 0} description="Bodies in database" />
          <StatCard label="MISSING" value={loading ? '—' : databaseStats.missing_persons ?? 0} description="Persons reported" />
          <StatCard label="OPEN CASES" value={loading ? '—' : (databaseStats.uidb_by_status?.Open ?? 0)} description="Pending identification" />
          <StatCard label="IDENTIFIED" value={loading ? '—' : (databaseStats.uidb_by_status?.Identified ?? 0)} description="Successful matches" accent />
        </div>
      </section>

      {/* Features */}
      <section>
        <p className="label-warp mb-3">WHAT YOU CAN DO</p>
        <h2 className="text-2xl md:text-3xl font-medium text-white mb-8">Four ways to work a case</h2>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.to}
              className="card-warp p-6 group relative overflow-hidden focus:outline-none focus-visible:ring-2"
              style={{ outlineColor: 'var(--accent)' }}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                   style={{ background: 'radial-gradient(circle at top right, var(--accent-soft) 0%, transparent 60%)' }}></div>
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                       style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <feature.Icon size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="label-warp mb-1">{feature.label}</p>
                    <h3 className="text-lg font-medium text-white mb-1">{feature.title}</h3>
                    <p className="text-muted text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
                <ArrowUpRight size={20} className="shrink-0 text-muted group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, description, accent }) {
  return (
    <div className="card-warp p-5 md:p-6 group">
      <p className="label-warp mb-2">{label}</p>
      <p className="text-3xl md:text-4xl font-medium mb-1 transition-all group-hover:scale-105 inline-block"
         style={{ color: accent ? 'var(--accent)' : '#fff' }}>{value}</p>
      <p className="text-muted text-sm">{description}</p>
    </div>
  );
}

export default Home;
