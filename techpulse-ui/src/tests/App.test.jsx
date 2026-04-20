import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as useTechPulseHook from '../hooks/useTechPulse';

// Mock the hook
vi.mock('../hooks/useTechPulse', () => ({
  useTechPulse: vi.fn()
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('App Root Component', () => {
  const mockAppState = {
    token: null,
    user: null,
    activeTab: 'feed',
    setActiveTab: vi.fn(),
    handleLogin: vi.fn(),
    handleRegister: vi.fn(),
    handleLogout: vi.fn(),
    setAuthMode: vi.fn(),
    authMode: null,
    isVersus: false,
    setIsVersus: vi.fn(),
    tech: '',
    setTech: vi.fn(),
    tech2: '',
    setTech2: vi.fn(),
    loading: false,
    result: null,
    result2: null,
    streamingText: '',
    handleAnalyze: vi.fn(),
    resetAnalysis: vi.fn(),
    history: [],
    savedArticles: [],
    trends: [],
    isTrendsLoading: false,
    trendsCategory: 'languages',
    setTrendsCategory: vi.fn(),
    handleSaveArticle: vi.fn(),
    handleRemoveArticle: vi.fn(),
    handleClearHistory: vi.fn(),
    dbOffline: false,
    feed: [],
    isFeedLoading: false,
    pulseIndex: 0,
    handleSummarize: vi.fn(),
    summary: null,
    setSummary: vi.fn(),
    searchQuery: '',
    onSearchChange: vi.fn(),
    suggestedQuery: '',
    applySuggestion: vi.fn(),
    visibleFeedCount: 12,
    loadMoreFeed: vi.fn(),
    cachedTechNames: [],
    savedArticlesMeta: { total: 0, page: 1, totalPages: 1 },
    savedArticlesPage: 1,
    setSavedArticlesPage: vi.fn(),
    followedTechs: [],
    handleToggleFollow: vi.fn(),
    startQuickAnalyze: vi.fn(),
  };

  it('renders landing page for unauthenticated users', () => {
    vi.spyOn(useTechPulseHook, 'useTechPulse').mockReturnValue(mockAppState);
    
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    // Check for landing page elements
    expect(screen.getByText(/TechPulse/i)).toBeInTheDocument();
    expect(screen.getByText(/Pulse/i)).toBeInTheDocument();
  });

  it('renders Sidebar and Header components', () => {
    vi.spyOn(useTechPulseHook, 'useTechPulse').mockReturnValue(mockAppState);
    
    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    );
    
    // Sidebar should be present
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    // Header should be present
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
