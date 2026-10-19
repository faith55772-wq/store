const BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchJSON(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errData = await response.json();
      errorMsg = errData.message || errorMsg;
    } catch (e) {}
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Overview
  getOverviewStats: (storeId) => fetchJSON(`/api/overview/stats${storeId ? `?storeId=${storeId}` : ''}`),

  // Stores
  getStores: (status) => fetchJSON(`/api/stores${status ? `?status=${status}` : ''}`),
  getPendingStores: () => fetchJSON('/api/stores/pending'),
  getStore: (id) => fetchJSON(`/api/stores/${id}`),
  registerStore: (data) => fetchJSON('/api/stores/register', { method: 'POST', body: JSON.stringify(data) }),
  approveStore: (id) => fetchJSON(`/api/stores/${id}/approve`, { method: 'POST' }),
  rejectStore: (id) => fetchJSON(`/api/stores/${id}/reject`, { method: 'POST' }),

  // Recordings
  getRecordings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJSON(`/api/recordings${q ? `?${q}` : ''}`);
  },
  getRecording: (id) => fetchJSON(`/api/recordings/${id}`),
  analyzeRecording: (id) => fetchJSON(`/api/recordings/${id}/analyze`, { method: 'POST' }),
  uploadRecording: async (formData) => {
    const url = `${BASE_URL}/api/recordings/upload`;
    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  },

  // Daily Reports
  getDailyReport: (date, storeId) => fetchJSON(`/api/reports/daily?date=${date || ''}&storeId=${storeId || 'all'}`),
  runDailyAnalysis: (date, storeId) =>
    fetchJSON('/api/reports/daily/analyze', {
      method: 'POST',
      body: JSON.stringify({ date, storeId }),
    }),
  getPdfReportUrl: (date, storeId) => `${BASE_URL}/api/reports/daily/pdf?date=${date || ''}&storeId=${storeId || 'all'}`,

  // Deepgram
  getDeepgramHealth: () => fetchJSON('/api/deepgram/health'),
};
