// API Configuration
// Use environment variable in production, empty string for local proxy
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to format dates
export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Helper to format date-time
export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Join CSS class names, filtering out falsy values
export function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Format a number with locale-aware commas
export function formatNumber(num) {
  if (num === null || num === undefined) return 'N/A';
  return Number(num).toLocaleString();
}

/**
 * Map a record status to a semantic tone key.
 * Callers (CaseRecords / Dashboard StatusBadge) look this up in their own
 * class maps, so this must return a KEY ('success' | 'warning' | ...),
 * not a class string.
 */
export function getStatusTone(status) {
  const tones = {
    open: 'warning',
    pending: 'warning',
    identified: 'success',
    matched: 'success',
    found: 'success',
    processed: 'success',
    deceased: 'danger',
    closed: 'muted',
    archived: 'muted',
  };
  return tones[String(status || '').toLowerCase()] || 'default';
}

// Build a full asset URL from a relative path
export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API_BASE_URL || '';
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

// Summarize a record into a short description object
export function summarizeRecord(record) {
  if (!record) return null;
  const parts = [];
  if (record.name) parts.push(record.name);
  if (record.gender) parts.push(record.gender);
  if (record.age || record.estimated_age) parts.push(`${record.age || record.estimated_age} yrs`);
  if (record.police_station) parts.push(record.police_station);
  return {
    pid: record.pid,
    label: parts.join(' · ') || 'Record',
    status: record.status,
    record_type: record.record_type,
  };
}

// Extract a human-readable error message from an axios error or generic Error
export function extractErrorMessage(error) {
  if (!error) return 'An unknown error occurred';
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'An unknown error occurred';
}
