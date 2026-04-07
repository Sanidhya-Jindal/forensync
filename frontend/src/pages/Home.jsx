import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../api';

function Home() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const features = [
    {
      label: 'REPORT',
      title: 'Unidentified Body',
      description: 'Submit details about found unidentified bodies for identification matching',
      to: '/report-unidentified-body',
      icon: '🆔',
    },
    {
      label: 'REPORT',
      title: 'Missing Person',
      description: 'File a missing person report with photos and descriptions',
      to: '/report-missing-person',
      icon: '🔍',
    },
    {
      label: 'SEARCH',
      title: 'Search & Match',
      description: 'Use AI-powered facial recognition and text matching to find potential matches',
      to: '/search-match',
      icon: '🤖',
    },
    {
      label: 'VIEW',
      title: 'Records',
      description: 'Browse and manage all reported cases in the database',
      to: '/records',
      icon: '📊',
    },
  ];

  return (
    <div className="py-4 relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full opacity-5" 
             style={{ background: 'radial-gradient(circle, #F87171 0%, transparent 70%)' }}></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-5" 
             style={{ background: 'radial-gradient(circle, #F87171 0%, transparent 70%)' }}></div>
      </div>

      {/* Hero Section */}
      <section className="mb-16 relative animate-fade-in">
        <p className="label-warp mb-4">IDENTIFICATION SYSTEM</p>
        <h1 className="text-5xl md:text-7xl font-medium text-white leading-tight tracking-tight mb-6 animate-slide-in">
          Reuniting families<br />
          through technology
        </h1>
        <p className="text-xl max-w-2xl mb-8 animate-fade-in" style={{ color: '#9B9B9B', animationDelay: '0.1s' }}>
          FORENSYNC is a comprehensive platform for reporting, searching, and matching 
          missing persons with unidentified bodies using AI-powered recognition.
        </p>
        <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link to="/report-missing-person" className="btn-warp-primary">
            Report Missing Person
          </Link>
          <Link to="/search-match" className="btn-warp">
            Search Database
          </Link>
        </div>
      </section>

      {/* Stats Section */}
      <section className="mb-16 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            label="UNIDENTIFIED" 
            value={loading ? '...' : databaseStats.unidentified_bodies || 0} 
            description="Bodies in database"
            delay="0s"
          />
          <StatCard 
            label="MISSING" 
            value={loading ? '...' : databaseStats.missing_persons || 0} 
            description="Persons reported"
            delay="0.1s"
          />
          <StatCard 
            label="OPEN CASES" 
            value={loading ? '...' : (databaseStats.uidb_by_status?.Open || 0)} 
            description="Pending identification"
            delay="0.2s"
          />
          <StatCard 
            label="IDENTIFIED" 
            value={loading ? '...' : (databaseStats.uidb_by_status?.Identified || 0)} 
            description="Successful matches"
            delay="0.3s"
          />
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative">
        <p className="label-warp mb-4">FEATURES</p>
        <h2 className="text-3xl font-medium text-white mb-8">What you can do</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.to}
              className="card-warp p-6 group transition-all duration-200 relative overflow-hidden"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ background: 'radial-gradient(circle at top right, rgba(248,113,113,0.1) 0%, transparent 60%)' }}></div>
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{feature.icon}</span>
                  <p className="label-warp">{feature.label}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-white mb-1">{feature.title}</h3>
                    <p style={{ color: '#717171' }}>{feature.description}</p>
                  </div>
                  <svg 
                    className="w-6 h-6 group-hover:text-white group-hover:translate-x-1 transition-all" 
                    style={{ color: '#717171' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, description, delay }) {
  return (
    <div className="card-warp p-6 group" style={{ animationDelay: delay }}>
      <p className="label-warp mb-2">{label}</p>
      <p className="text-4xl font-medium text-white mb-1 transition-all group-hover:scale-110 inline-block">{value}</p>
      <p className="text-sm" style={{ color: '#717171' }}>{description}</p>
    </div>
  );
}

export default Home;
