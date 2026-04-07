import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { apiService } from '../api';

function Layout() {
  const [health, setHealth] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await apiService.healthCheck();
        setHealth(response.data);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    checkHealth();
  }, []);

  const isHealthy = health?.status === 'healthy' || health?.database === 'healthy';

  const navItems = [
    {
      label: 'Reports',
      hasDropdown: true,
      items: [
        { to: '/report-unidentified-body', label: 'Unidentified Body', description: 'Report a found unidentified body for matching' },
        { to: '/report-missing-person', label: 'Missing Person', description: 'File a missing person report' },
      ],
    },
    { to: '/search-match', label: 'Search', hasDropdown: false },
    { to: '/records', label: 'Records', hasDropdown: false },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0D0D0D' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl" style={{ backgroundColor: 'rgba(13,13,13,0.8)', borderBottom: '1px solid #333333' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="font-bold text-sm" style={{ color: '#0D0D0D' }}>F</span>
              </div>
              <span className="text-white font-medium text-lg tracking-tight">FORENSYNC</span>
            </NavLink>

            {/* Nav Items */}
            <div className="flex items-center gap-1">
              {navItems.map((item, index) => (
                <div
                  key={index}
                  className="relative"
                  onMouseEnter={() => item.hasDropdown && setActiveDropdown(index)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  {item.hasDropdown ? (
                    <>
                      <button className="flex items-center gap-1 px-4 py-2 text-sm transition-colors hover:text-white" style={{ color: '#9B9B9B' }}>
                        {item.label}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {activeDropdown === index && (
                        <div className="absolute top-full left-0 mt-1 w-72 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl" style={{ backgroundColor: 'rgba(38,38,38,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {item.items.map((subItem) => (
                            <NavLink
                              key={subItem.to}
                              to={subItem.to}
                              className="block px-4 py-3 transition-colors"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <span className="block text-white font-medium">{subItem.label}</span>
                              <span className="block text-sm mt-0.5" style={{ color: '#717171' }}>{subItem.description}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `px-4 py-2 text-sm transition-colors ${isActive ? 'text-white' : 'hover:text-white'}`
                      }
                      style={({ isActive }) => ({ color: isActive ? '#FFFFFF' : '#9B9B9B' })}
                    >
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <span style={{ color: '#717171' }}>{isHealthy ? 'Online' : 'Offline'}</span>
              </div>
              <NavLink to="/search-match" className="btn-warp">
                Quick Search
              </NavLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
