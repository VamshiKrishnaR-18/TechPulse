import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useUserData = (token, setAuthMode) => {
  const queryClient = useQueryClient();
  const [trendsCategory, setTrendsCategory] = useState('languages');
  
  // Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const [savedArticlesPage, setSavedArticlesPage] = useState(1);
  const PAGE_LIMIT = 10;

  // 1. Data Fetching
  const { data: savedData, isLoading: isSavedLoading } = useQuery({
    queryKey: ['savedArticles', token, savedArticlesPage],
    queryFn: () => api.fetchSavedArticles(savedArticlesPage, PAGE_LIMIT),
    enabled: !!token,
  });
  const savedArticles = savedData?.articles || [];
  const savedArticlesMeta = savedData?.meta || { total: 0, page: 1, totalPages: 1 };

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['history', token, historyPage],
    queryFn: () => api.fetchHistory(historyPage, PAGE_LIMIT),
  });
  const history = historyData?.history || [];
  const historyMeta = historyData?.meta || { total: 0, page: 1, totalPages: 1 };

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
    savedArticles, savedArticlesMeta, savedArticlesPage, setSavedArticlesPage,
    history, historyMeta, historyPage, setHistoryPage,
    trends, isTrendsLoading, trendsCategory, setTrendsCategory,
    isSavedLoading, isHistoryLoading,
    handleSaveArticle, handleRemoveArticle, handleClearHistory,
    followedTechs,
    handleToggleFollow
  };
};

export const useUserInterests = (token) => {
  const queryClient = useQueryClient();

  const { data: followedData } = useQuery({
    queryKey: ['followedTechs', token],
    queryFn: () => api.fetchFollowedTechs(),
    enabled: !!token,
    select: (data) => data.followed || [],
  });
  const followedTechs = followedData || [];

  const toggleFollowMutation = useMutation({
    mutationFn: (techName) => api.toggleFollow(techName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['followedTechs'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success(data.followed ? 'Now following topic' : 'Topic removed from interests');
    },
  });

  const handleToggleFollow = (techName) => {
    if (!token) return;
    toggleFollowMutation.mutate(techName);
  };

  return { followedTechs, handleToggleFollow };
};