import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { apiService } from '../api';

const NAV = [
  {
    label: 'Reports',
    hasDropdown: true,
    items: [
      { to: '/report-unidentified-body', label: 'Unidentified Body', description: 'Report a found unidentified body for matching' },
      { to: '/report-missing-person', label: 'Missing Person', description: 'File a missing person report' },
    ],
  },
  { to: '/search-match', label: 'Search' },
  { to: '/records', label: 'Records' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/cases', label: 'Cases' },
];

function Layout() {
  const [health, setHealth] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const closeTimer = useRef(null);

  // Forgiving hover: keep the menu open briefly so the cursor can travel to it.
  const openMenu = (label) => { clearTimeout(closeTimer.current); setActiveDropdown(label); };
  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 280);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Escape closes the dropdown
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setActiveDropdown(null); setMobileOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  // Close the mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isHealthy = health?.status === 'healthy' || health?.database === 'healthy';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
           style={{ backgroundColor: 'rgba(11,11,13,0.82)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #fff, #cfcfd6)' }}>
                <span className="font-bold text-sm" style={{ color: 'var(--bg)' }}>F</span>
              </div>
              <span className="text-white font-medium text-lg tracking-tight">FORENSYNC</span>
            </NavLink>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.hasDropdown && openMenu(item.label)}
                  onMouseLeave={() => item.hasDropdown && scheduleClose()}
                >
                  {item.hasDropdown ? (
                    <>
                      <button
                        className="flex items-center gap-1 px-4 py-2 text-sm transition-colors hover:text-white text-secondary"
                        aria-expanded={activeDropdown === item.label}
                        aria-haspopup="true"
                        onClick={() => (activeDropdown === item.label ? setActiveDropdown(null) : openMenu(item.label))}
                      >
                        {item.label}
                        <ChevronDown size={16} className={`transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                      </button>
                      {activeDropdown === item.label && (
                        // pt-2 keeps a hover "bridge" instead of a dead gap
                        <div className="absolute top-full left-0 pt-2 w-72 animate-fade-in"
                             onMouseEnter={() => openMenu(item.label)}
                             onMouseLeave={scheduleClose}>
                        <div className="rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
                             style={{ backgroundColor: 'rgba(31,31,36,0.98)', border: '1px solid var(--border-strong)' }}>
                          {item.items.map((subItem) => (
                            <NavLink key={subItem.to} to={subItem.to}
                                     onClick={() => setActiveDropdown(null)}
                                     className="block px-4 py-3 transition-colors hover:bg-white/[0.06]">
                              <span className="block text-white font-medium">{subItem.label}</span>
                              <span className="block text-sm mt-0.5 text-muted">{subItem.description}</span>
                            </NavLink>
                          ))}
                        </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <NavLink to={item.to}
                             className={({ isActive }) => `px-4 py-2 text-sm transition-colors ${isActive ? 'text-white' : 'text-secondary hover:text-white'}`}>
                      {item.label}
                    </NavLink>
                  )}
                </div>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'} ${isHealthy ? 'animate-pulse' : ''}`}></span>
                <span className="text-muted">{isHealthy ? 'Online' : 'Offline'}</span>
              </div>
              <NavLink to="/search-match" className="hidden sm:inline-flex btn-warp">
                <Search size={15} /> Quick Search
              </NavLink>
              {/* Mobile menu toggle */}
              <button className="md:hidden p-2 -mr-2 text-white" aria-label="Toggle menu"
                      aria-expanded={mobileOpen} onClick={() => setMobileOpen((v) => !v)}>
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="md:hidden border-t animate-fade-in" style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(11,11,13,0.98)' }}>
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
              <p className="label-warp px-1 py-2">Reports</p>
              {NAV[0].items.map((s) => (
                <MobileLink key={s.to} to={s.to}>{s.label}</MobileLink>
              ))}
              <div className="h-px my-2" style={{ background: 'var(--border)' }} />
              {NAV.slice(1).map((item) => (
                <MobileLink key={item.to} to={item.to}>{item.label}</MobileLink>
              ))}
              <div className="flex items-center gap-2 text-sm px-1 pt-3">
                <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                <span className="text-muted">System {isHealthy ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function MobileLink({ to, children }) {
  return (
    <NavLink to={to}
             className={({ isActive }) => `px-3 py-3 rounded-lg text-base transition-colors ${isActive ? 'text-white bg-white/[0.06]' : 'text-secondary hover:text-white hover:bg-white/[0.04]'}`}>
      {children}
    </NavLink>
  );
}

export default Layout;
