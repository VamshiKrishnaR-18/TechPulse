import axios from "axios";

// Pull from Vite environment variables, fallback to localhost
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// 1. Create a centralized Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. REQUEST INTERCEPTOR: Attach Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("tp_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. RESPONSE INTERCEPTOR: Global Error Handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "An unexpected server error occurred.";

    if (error.response?.status === 401) {
      console.warn("Authentication expired. Logging out.");
    }

    return Promise.reject(new Error(message));
  },
);

// 4. The Clean API Definitions
export const api = {
  analyze: (techName) => apiClient.post("/analyze", { tech: techName }),
  fetchFeed: ({ query = "", tab = "For You" } = {}) =>
    apiClient.get("/feed", { params: { q: query, tab } }),
  suggestSearch: (query) =>
    apiClient.get("/suggest-search", { params: { query } }),
  fetchMetrics: (category = "languages") =>
    apiClient.get("/metrics", { params: { category } }),
  fetchHistory: (page = 1, limit = 10) => apiClient.get("/history", { params: { page, limit } }),
  fetchSavedArticles: (page = 1, limit = 10) => apiClient.get("/saved-articles", { params: { page, limit } }),
  saveArticle: (article) => apiClient.post("/save-article", article),
  summarize: (article) =>
    apiClient.post("/summarize", {
      title: article.title,
      description: article.description,
      url: article.url,
    }),
  auth: (mode, data) => apiClient.post(`/${mode}`, data),
  toggleFollow: (techName) => apiClient.post("/follow/toggle", { techName }),
  fetchFollowedTechs: () => apiClient.get("/follow/list"),
  saveAnalysis: (techName) => apiClient.post("/save", { techName }),
  getStreamUrl: (tech) =>
    `${BASE_URL}/analyze/stream?tech=${encodeURIComponent(tech)}`,
  fetchAdminStats: () => apiClient.get("/admin/stats"),
  fetchAdminLogs: (type = "combined") =>
    apiClient.get("/admin/logs", {
      params: { type },
    }),
  fetchCachedTechNames: () => apiClient.get("/cached-names"),
  deleteArticle: (articleId) => apiClient.delete(`/save-article/${articleId}`),
  clearHistory: () => apiClient.delete("/history"),
};