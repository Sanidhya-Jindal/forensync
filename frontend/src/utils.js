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

// Get Tailwind status color classes
export function getStatusTone(status) {
  const tones = {
    Open: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Matched: 'bg-green-100 text-green-800 border-green-300',
    Closed: 'bg-slate-100 text-slate-600 border-slate-300',
    Pending: 'bg-blue-100 text-blue-800 border-blue-300',
    Processed: 'bg-teal-100 text-teal-800 border-teal-300',
    Archived: 'bg-gray-100 text-gray-600 border-gray-300',
  };
  return tones[status] || 'bg-slate-100 text-slate-600 border-slate-300';
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
