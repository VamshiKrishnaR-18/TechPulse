import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../components/layout/Sidebar';

describe('Sidebar', () => {
  it('renders TechPulse brand name', () => {
    const props = {
      activeTab: 'feed',
      setActiveTab: vi.fn(),
      setSummary: vi.fn(),
      setResult: vi.fn(),
      setResult2: vi.fn(),
      startQuickAnalyze: vi.fn(),
      feed: [],
      pulseIndex: 0,
      handleSummarize: vi.fn(),
      token: null,
      user: null,
      handleLogout: vi.fn(),
      setAuthMode: vi.fn()
    };
    
    render(<Sidebar {...props} />);
    const brandElements = screen.getAllByText(/TechPulse/i);
    expect(brandElements.length).toBeGreaterThan(0);
    expect(brandElements[0]).toBeInTheDocument();
  });
});
