import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useUserData = (token, setAuthMode) => {
  const queryClient = useQueryClient();
  const [trendsCategory, setTrendsCategory] = useState('languages');

  // 1. Data Fetching
  const { data: savedData } = useQuery({
    queryKey: ['savedArticles', token],
    queryFn: () => api.fetchSavedArticles(token),
    enabled: !!token,
    select: (data) => data.success ? data.articles : [],
  });
  const savedArticles = savedData || [];

  const { data: historyData } = useQuery({
    queryKey: ['history', token],
    queryFn: () => api.fetchHistory(token),
    select: (data) => data.success ? data.history : [],
  });
  const history = historyData || [];

  const { data: analyticsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['analytics', trendsCategory],
    queryFn: () => api.fetchMetrics(trendsCategory),
    select: (data) => {
      if (!data.success) return [];
      return data.trends.map((t) => ({ 
        name: t.techName, techName: t.techName, score: t.score, sources: t.sources,
        momentum: ((t.sources?.github || 0) * 0.6 + (t.sources?.jobs || 0) * 0.4) - (t.sources?.stackoverflow || 0),
        demand: t.sources?.jobs || 0, sentiment: t.sources?.github || 0, fill: t.fill
      }));
    },
  });
  const trends = analyticsData || [];

  // 2. Mutations
  const saveArticleMutation = useMutation({
    mutationFn: (article) => api.saveArticle(article, token),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['savedArticles'] });
        toast.success('Article saved to reading list');
      } else { toast.error(data.message || 'Failed to save article'); }
    },
  });

  const handleSaveArticle = (article) => {
    if (!token) { setAuthMode('signup'); return; }
    saveArticleMutation.mutate(article);
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
    savedArticles, history, trends, isTrendsLoading, trendsCategory, setTrendsCategory,
    handleSaveArticle, handleRemoveArticle, handleClearHistory
  };
};