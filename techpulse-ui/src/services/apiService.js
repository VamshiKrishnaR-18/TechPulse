const BASE_URL = 'http://127.0.0.1:5000/api';

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});

export const api = {
  // 🧠 ENTERPRISE STANDARD: The new analyze endpoint with explicit error throwing for React Query
  analyze: async (techName) => {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tech: techName })
    });
    
    const data = await res.json();
    
    // React Query relies on actual Errors being thrown to trigger the "error" state in the UI
    if (!res.ok || data.success === false) {
      throw new Error(data.message || `Failed to analyze ${techName}.`);
    }
    
    return data;
  },

  fetchFeed: async ({ query = '', tab = 'For You' } = {}) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tab) params.set('tab', tab);
    const res = await fetch(`${BASE_URL}/feed?${params.toString()}`);
    return res.json();
  },

  suggestSearch: async (query) => {
    const res = await fetch(`${BASE_URL}/suggest-search?query=${encodeURIComponent(query)}`);
    return res.json();
  },
  
  fetchMetrics: async (category = 'languages') => {
    const res = await fetch(`${BASE_URL}/metrics?category=${category}`);
    return res.json();
  },
  
  fetchHistory: async (token) => {
    const res = await fetch(`${BASE_URL}/history${token ? `?token=${token}` : ''}`, {
      headers: getHeaders(token)
    });
    return res.json();
  },
  
  fetchSavedArticles: async (token) => {
    const res = await fetch(`${BASE_URL}/saved-articles`, {
      headers: getHeaders(token)
    });
    return res.json();
  },
  
  saveArticle: async (article, token) => {
    const res = await fetch(`${BASE_URL}/save-article`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ ...article, token })
    });
    return res.json();
  },
  
  summarize: async (article) => {
    const res = await fetch(`${BASE_URL}/summarize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title: article.title, description: article.description, url: article.url })
    });
    return res.json();
  },
  
  auth: async (mode, data) => {
    const res = await fetch(`${BASE_URL}/${mode}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },
  
  saveAnalysis: async (techName, token) => {
    const res = await fetch(`${BASE_URL}/save`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify({ techName, token })
    });
    return res.json();
  },

  getStreamUrl: (tech) => `${BASE_URL}/analyze/stream?tech=${encodeURIComponent(tech)}`
};