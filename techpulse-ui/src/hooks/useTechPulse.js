import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../services/apiService.js';

export const useTechPulse = () => {
  const queryClient = useQueryClient();
  const [tech, setTech] = useState('');
  const [tech2, setTech2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [result2, setResult2] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('feed');
  const [trendsCategory, setTrendsCategory] = useState('languages');
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [debouncedFeedQuery, setDebouncedFeedQuery] = useState('');
  const [suggestedQuery, setSuggestedQuery] = useState('');
  const [activeFeedTab, setActiveFeedTab] = useState('For You');
  const [visibleFeedCount, setVisibleFeedCount] = useState(12);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isVersus, setIsVersus] = useState(false);
  const [dbOffline] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('tp_token'));

  // React Query: Feed
  const { data: feedData } = useQuery({
    queryKey: ['feed', activeFeedTab, debouncedFeedQuery],
    queryFn: () => api.fetchFeed({ query: debouncedFeedQuery, tab: activeFeedTab }),
    select: (data) => data.success ? data.feed : [],
  });
  const feed = useMemo(() => feedData || [], [feedData]);

  const filteredFeed = useMemo(() => {
    if (!debouncedFeedQuery) return feed;
    const search = debouncedFeedQuery.toLowerCase();
    return feed.filter(item => {
      const title = item.title?.toLowerCase() || '';
      const source = item.source?.toLowerCase() || '';
      const desc = item.description?.toLowerCase() || '';
      const tags = (item.tags || []).join(' ').toLowerCase();
      return title.includes(search) || source.includes(search) || desc.includes(search) || tags.includes(search);
    });
  }, [feed, debouncedFeedQuery]);

  // AI Suggestion Mutation
  const suggestMutation = useMutation({
    mutationFn: api.suggestSearch,
    onSuccess: (data) => {
      if (data.success) {
        setSuggestedQuery(data.suggestedQuery);
      }
    },
  });

  const handleSearchChange = (query) => {
    setFeedSearchQuery(query);
    setSuggestedQuery('');
    if (query.length > 3) {
      suggestMutation.mutate(query);
    }
  };

  const applySuggestion = () => {
    if (suggestedQuery) {
      setFeedSearchQuery(suggestedQuery);
      setDebouncedFeedQuery(suggestedQuery);
      setSuggestedQuery('');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFeedQuery(feedSearchQuery.trim());
      setVisibleFeedCount(12); // Reset count on search
    }, 350);
    return () => clearTimeout(timer);
  }, [feedSearchQuery]);

  useEffect(() => {
    setVisibleFeedCount(12); // Reset count on tab change
  }, [activeFeedTab]);

  const loadMoreFeed = () => {
    setVisibleFeedCount(prev => prev + 12);
  };

  // React Query: Saved Articles
  const { data: savedData } = useQuery({
    queryKey: ['savedArticles', token],
    queryFn: () => api.fetchSavedArticles(token),
    enabled: !!token,
    select: (data) => data.success ? data.articles : [],
  });
  const savedArticles = savedData || [];

  // React Query: History
  const { data: historyData } = useQuery({
    queryKey: ['history', token],
    queryFn: () => api.fetchHistory(token),
    select: (data) => data.success ? data.history : [],
  });
  const history = historyData || [];

  // React Query: Analytics/Trends
  const { data: analyticsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['analytics', trendsCategory],
    queryFn: () => api.fetchMetrics(trendsCategory),
    select: (data) => {
      if (!data.success) return [];
      return data.trends.map((t) => ({ 
        name: t.techName, 
        techName: t.techName,
        score: t.score,
        sources: t.sources,
        momentum: ((t.sources?.github || 0) * 0.6 + (t.sources?.jobs || 0) * 0.4) - (t.sources?.stackoverflow || 0),
        demand: t.sources?.jobs || 0,
        sentiment: t.sources?.github || 0,
        fill: t.fill
      }));
    },
  });
  const trends = analyticsData || [];

  // Mutations
  const saveArticleMutation = useMutation({
    mutationFn: (article) => api.saveArticle(article, token),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
        toast.success('Article saved to reading list');
      } else {
        toast.error(data.message || 'Failed to save article');
      }
    },
  });

  const authMutation = useMutation({
    mutationFn: (data) => api.auth(authMode, data),
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('tp_token', data.token);
        setAuthMode(null);
        toast.success(`Welcome back, ${data.user.name || 'User'}!`);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    },
  });

  useEffect(() => {
    const ticker = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % (feed.length || 1));
    }, 8000);
    return () => clearInterval(ticker);
  }, [feed.length]);

  const handleSaveArticle = (article) => {
    if (!token) { setAuthMode('signup'); return; }
    saveArticleMutation.mutate(article);
  };

  const handleSummarize = async (article) => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const data = await api.summarize(article);
      if (data.success) {
        setSummary({ ...data, article });
        toast.success('Summary generated');
      } else {
        toast.error('Failed to summarize');
      }
    } catch { toast.error('Summarization failed'); }
    finally { setIsSummarizing(false); }
  };

  const handleAuth = (e) => {
    e.preventDefault();
    authMutation.mutate(authData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tp_token');
    toast.success('Logged out successfully');
  };

  const analyzeTech = async (targetTech, setResultFn, setStreamFn) => {
    try {
      const response = await fetch(api.getStreamUrl(targetTech));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.status === 'streaming') { 
              accumulatedText += data.chunk; 
              setStreamFn(accumulatedText); 
            }
            if (data.done) { 
              setResultFn(data);
              setStreamFn(''); // Clear streaming text when done to show parsed content
              if (token) {
                api.saveAnalysis(targetTech, token).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['history'] });
                });
              }
              toast.success(`Analysis for ${targetTech} complete`);
              return data; 
            }
          }
        }
      }
    } catch (err) { 
      toast.error(`Analysis failed: ${err.message}`);
      throw err; 
    }
  };

  const handleAnalyze = async () => {
    if (!tech) return;
    setLoading(true); setError(null); setResult(null); setResult2(null); 
    setStreamingText('');
    
    try {
      if (isVersus && tech2) {
        await Promise.all([
          analyzeTech(tech, setResult, setStreamingText),
          analyzeTech(tech2, setResult2, setStreamingText)
        ]);
      } else {
        await analyzeTech(tech, setResult, setStreamingText);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const startQuickAnalyze = (t) => {
    setTech(t); setIsVersus(false); setActiveTab('analysis');
    setTimeout(() => {
      handleAnalyze();
    }, 100);
  };

  const handleRemoveArticle = (articleId) => {
    if (!token) return;
    api.deleteArticle(articleId, token).then(data => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
        toast.success('Article removed');
      }
    });
  };

  const handleClearHistory = () => {
    if (!token) return;
    api.clearHistory(token).then(data => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['history'] });
        toast.success('History cleared');
      }
    });
  };

  return {
    tech, setTech, tech2, setTech2, loading, result, result2, streamingText,
    error, setError, feed: filteredFeed, pulseIndex, trends, isTrendsLoading, trendsCategory, setTrendsCategory, history, activeTab, setActiveTab,
    feedSearchQuery, setFeedSearchQuery, suggestedQuery, handleSearchChange, applySuggestion,
    activeFeedTab, setActiveFeedTab, visibleFeedCount, loadMoreFeed,
    summary, setSummary, isSummarizing, isVersus, setIsVersus,
    dbOffline, authMode, setAuthMode, authData, setAuthData, user, token, savedArticles,
    handleAnalyze, handleSaveArticle, handleRemoveArticle, handleSummarize, handleAuth, handleLogout, startQuickAnalyze, handleClearHistory,
    resetAnalysis: () => { setResult(null); setResult2(null); setTech(''); setTech2(''); setIsVersus(false); }
  };
};
