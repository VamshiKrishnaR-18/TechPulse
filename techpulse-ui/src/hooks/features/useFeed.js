import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useFeed = () => {
  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [debouncedFeedQuery, setDebouncedFeedQuery] = useState('');
  const [suggestedQuery, setSuggestedQuery] = useState('');
  const [activeFeedTab, setActiveFeedTab] = useState('For You');
  const [visibleFeedCount, setVisibleFeedCount] = useState(12);
  const [summary, setSummary] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  // 1. Fetch Feed
  const { data: feedData } = useQuery({
    queryKey: ['feed', activeFeedTab, debouncedFeedQuery],
    queryFn: () => api.fetchFeed({ query: debouncedFeedQuery, tab: activeFeedTab }),
    select: (data) => data.success ? data.feed : [],
  });
  const feed = useMemo(() => feedData || [], [feedData]);

  // 2. Filter Feed
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

  // 3. Search & AI Suggestions
  const suggestMutation = useMutation({
    mutationFn: api.suggestSearch,
    onSuccess: (data) => {
      if (data.success) setSuggestedQuery(data.suggestedQuery);
    },
  });

  const handleSearchChange = (query) => {
    setFeedSearchQuery(query);
    setSuggestedQuery('');
    if (query.length > 3) suggestMutation.mutate(query);
  };

  const applySuggestion = () => {
    if (suggestedQuery) {
      setFeedSearchQuery(suggestedQuery);
      setDebouncedFeedQuery(suggestedQuery);
      setSuggestedQuery('');
    }
  };

  // 4. Summarization
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

  // Lifecycle Effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFeedQuery(feedSearchQuery.trim());
      setVisibleFeedCount(12); 
    }, 350);
    return () => clearTimeout(timer);
  }, [feedSearchQuery]);

  useEffect(() => { setVisibleFeedCount(12); }, [activeFeedTab]);

  useEffect(() => {
    const ticker = setInterval(() => setPulseIndex(prev => (prev + 1) % (feed.length || 1)), 8000);
    return () => clearInterval(ticker);
  }, [feed.length]);

  return {
    feed: filteredFeed, pulseIndex,
    feedSearchQuery, setFeedSearchQuery, suggestedQuery, handleSearchChange, applySuggestion,
    activeFeedTab, setActiveFeedTab, visibleFeedCount, loadMoreFeed: () => setVisibleFeedCount(prev => prev + 12),
    summary, setSummary, isSummarizing, handleSummarize
  };
};