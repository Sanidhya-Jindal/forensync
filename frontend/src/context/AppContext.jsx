import { createContext, useContext, useEffect, useState } from 'react';
import { api, extractErrorMessage } from '../api';
import { summarizeRecord } from '../utils';

const AppContext = createContext(null);
const STORAGE_KEY = 'traceid_recent_records';
const TOAST_LIMIT = 3;

function readStoredRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeRecords(records) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 50)));
}

function createToastPayload(input) {
  const id = crypto.randomUUID();
  return {
    id,
    type: input.type || 'info',
    title: input.title || '',
    message: input.message || '',
  };
}

export function AppProvider({ children }) {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);
  const [offline, setOffline] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [recentRecords, setRecentRecords] = useState(() => readStoredRecords());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPid, setDrawerPid] = useState(null);
  const [drawerRecord, setDrawerRecord] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  useEffect(() => {
    storeRecords(recentRecords);
  }, [recentRecords]);

  const addToast = (toast) => {
    const payload = createToastPayload(toast);
    setToasts((current) => [payload, ...current].slice(0, TOAST_LIMIT));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== payload.id));
    }, 4000);
    return payload.id;
  };

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const refreshHealth = async () => {
    try {
      const response = await api.get('/health');
      setHealth(response.data);
      setOffline(false);
      return response.data;
    } catch (error) {
      setOffline(true);
      throw error;
    }
  };

  const refreshStats = async () => {
    const response = await api.get('/api/stats');
    setStats(response.data?.data || response.data);
    return response.data?.data || response.data;
  };

  const loadBootstrap = async () => {
    setLoadingBootstrap(true);
    try {
      const healthResponse = await api.get('/health');
      setHealth(healthResponse.data);
      setOffline(false);
      try {
        const statsResponse = await api.get('/api/stats');
        setStats(statsResponse.data?.data || statsResponse.data);
      } catch (error) {
        addToast({ type: 'warning', title: 'Stats unavailable', message: extractErrorMessage(error) });
      }
    } catch (error) {
      setOffline(true);
    } finally {
      setLoadingBootstrap(false);
    }
  };

  useEffect(() => {
    loadBootstrap();
  }, []);

  const rememberRecord = (record, source = 'record') => {
    if (!record) return;
    const summary = summarizeRecord(record);
    if (!summary?.pid) return;
    const entry = {
      ...summary,
      source,
      cachedAt: new Date().toISOString(),
    };
    setRecentRecords((current) => {
      const filtered = current.filter((item) => item.pid !== entry.pid);
      return [entry, ...filtered].slice(0, 30);
    });
  };

  const loadRecord = async (pid) => {
    setDrawerPid(pid);
    setDrawerOpen(true);
    setDrawerLoading(true);
    setDrawerError('');
    try {
      const response = await api.get(`/api/record/${encodeURIComponent(pid)}`);
      const record = response.data?.data || response.data;
      setDrawerRecord(record);
      rememberRecord(record, 'lookup');
      return record;
    } catch (error) {
      setDrawerError(extractErrorMessage(error));
      throw error;
    } finally {
      setDrawerLoading(false);
    }
  };

  const openRecord = async (pid) => {
    if (!pid) return;
    return loadRecord(pid);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerPid(null);
    setDrawerError('');
  };

  return (
    <AppContext.Provider value={{
      health,
      stats,
      loadingBootstrap,
      offline,
      refreshHealth,
      refreshStats,
      addToast,
      removeToast,
      toasts,
      recentRecords,
      rememberRecord,
      openRecord,
      closeDrawer,
      drawerOpen,
      drawerPid,
      drawerRecord,
      drawerLoading,
      drawerError,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
