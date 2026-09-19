const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Generates or retrieves a persistent browser fingerprint key for deduplicating guest votes
export const getVoterKey = () => {
  let key = localStorage.getItem('voter_key');
  if (!key) {
    key = 'voter_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
    localStorage.setItem('voter_key', key);
  }
  return key;
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
};

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request('/auth/me'),

  // Polls
  listPolls: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/polls${query ? `?${query}` : ''}`);
  },
  getPoll: (id) => request(`/polls/${id}`),
  createPoll: (payload) => request('/polls', { method: 'POST', body: JSON.stringify(payload) }),
  castVote: (pollId, optionIds) => request(`/polls/${pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({
      optionIds,
      voterKey: getVoterKey(),
    }),
  }),
  closePoll: (pollId) => request(`/polls/${pollId}/close`, { method: 'POST' }),

  // WebSocket URL helper
  getWebSocketUrl: (pollId) => {
    const voterKey = getVoterKey();
    if (import.meta.env.VITE_WS_URL) {
      return `${import.meta.env.VITE_WS_URL}/ws/polls/${pollId}?voterKey=${voterKey}`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/polls/${pollId}?voterKey=${voterKey}`;
  },
};
