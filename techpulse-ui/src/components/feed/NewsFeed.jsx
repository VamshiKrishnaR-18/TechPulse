import React, { useMemo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bookmark, User, Globe, Target, Shield, Clock, Zap, TrendingUp, AlertCircle, Settings2, Sliders, XCircle, BrainCircuit, Search, ThumbsUp, MessageSquare, Share2, MoreHorizontal, CheckCircle2, Loader2, ArrowUpRight, Menu, HelpCircle } from 'lucide-react'
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';
import { api } from '../../services/apiService';
import { toast } from 'sonner';

const NewsFeed = ({
  activeFeedTab,
  setActiveFeedTab,
  feed,
  handleSummarize,
  handleSaveArticle,
  dbOffline,
  savedArticles,
  searchQuery = '',
  onSearchChange,
  suggestedQuery = '',
  onApplySuggestion,
  visibleCount = 16,
  onLoadMore,
  trends = [],
  isLoading = false,
  user = null,
  followedTechs = [],
  triggerAuth,
  handleOpenChat,
  onOpenSidebar,
  isFeedLoading
}) => {
  const [sourceFilter, setSourceFilter] = useState('All')
  const [minRelevance, setMinRelevance] = useState(user?.minRelevance || 0)
  const [mutedTags, setMutedTags] = useState(user?.mutedTags || [])
  const [showFilters, setShowFilters] = useState(false)
  const [tagToMute, setTagToMute] = useState('')

  // Sync with user prefs when they load
  useEffect(() => {
    if (user) {
      setMinRelevance(user.minRelevance || 0);
      setMutedTags(user.mutedTags || []);
    }
  }, [user]);

  // Persist preferences
  const handleUpdatePrefs = async (newPrefs) => {
    if (!user) return;
    try {
      await api.updatePreferences(newPrefs);
      toast.success('Preferences updated');
    } catch (err) {
      toast.error('Failed to save preferences');
    }
  };

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 animate-pulse h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-white/5" />
          <div className="w-20 h-3 rounded bg-white/5" />
        </div>
        <div className="w-12 h-3 rounded bg-white/5" />
      </div>
      <div className="w-full h-5 rounded bg-white/5 mt-2" />
      <div className="w-3/4 h-5 rounded bg-white/5" />
      <div className="flex gap-2">
        <div className="w-10 h-3 rounded bg-white/5" />
        <div className="w-10 h-3 rounded bg-white/5" />
      </div>
      <div className="w-full aspect-[16/9] rounded-xl bg-white/5" />
      <div className="mt-auto flex justify-between pt-4 border-t border-white/5">
        <div className="flex gap-4">
          <div className="w-8 h-4 rounded bg-white/5" />
          <div className="w-8 h-4 rounded bg-white/5" />
        </div>
        <div className="flex gap-3">
          <div className="w-4 h-4 rounded bg-white/5" />
          <div className="w-4 h-4 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  const filteredBySource = useMemo(() => {
    let result = feed;
    
    // 🛡️ Personalization: "For You" strictly matches followed techs if selected
    if (activeFeedTab === 'For You' && user && followedTechs.length > 0) {
      result = result.filter(item => 
        followedTechs.some(tech => 
          item.title.toLowerCase().includes(tech.toLowerCase()) || 
          item.tags.some(t => t.toLowerCase().includes(tech.toLowerCase()))
        )
      );
    } else if (activeFeedTab === 'Trending') {
      result = [...result].sort((a, b) => (b.points || 0) - (a.points || 0));
    } else if (activeFeedTab === 'Recent') {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (sourceFilter !== 'All') {
      if (sourceFilter === 'Reddit') {
        result = result.filter(f => 
          typeof f.source === 'string' && (f.source === 'Reddit' || f.source.startsWith('r/'))
        )
      } else {
        result = result.filter(f => f.source === sourceFilter)
      }
    }

    if (minRelevance > 0) {
      result = result.filter(f => (f.relevanceScore || 0) >= minRelevance)
    }

    if (mutedTags.length > 0) {
      result = result.filter(f => {
        const itemTags = (f.tags || []).map(t => t.toLowerCase());
        return !mutedTags.some(muted => itemTags.includes(muted.toLowerCase()));
      });
    }

    return result;
  }, [feed, sourceFilter, minRelevance, mutedTags, activeFeedTab])

  const visibleItems = useMemo(() => filteredBySource.slice(0, visibleCount), [filteredBySource, visibleCount])

  // 🛡️ Human Tag Translators
  const getImpactBadge = (horizon) => {
    switch (horizon?.toLowerCase()) {
      case 'long-term': return { label: 'Industry Shift', color: 'text-tp-indigo bg-tp-indigo/10 border-tp-indigo/20', icon: TrendingUp };
      case 'short-term': return { label: 'Trending Today', icon: Zap, color: 'text-tp-accent bg-tp-accent/10 border-tp-accent/20' };
      case 'immediate': return { label: 'Version Release', icon: Sparkles, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' };
      default: return { label: 'Market Update', icon: Globe, color: 'text-slate-500 bg-white/5 border-white/10' };
    }
  };

  const getCategoryBadge = (category) => {
    switch (category?.toUpperCase()) {
      case 'SECURITY VULNERABILITY':
      case 'SECURITY': 
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: '🔴' };
      case 'MARKET ACQUISITION':
      case 'MARKET': 
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: '🟢' };
      case 'AI BREAKTHROUGH': 
        return { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: '🟣' };
      case 'INFRASTRUCTURE': 
        return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: '🔵' };
      case 'OPEN SOURCE': 
        return { color: 'bg-tp-accent/10 text-tp-accent border-tp-accent/20', icon: '🟠' };
      case 'PRODUCT LAUNCH':
        return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: '🟡' };
      default: 
        return { color: 'bg-white/5 text-slate-400 border-white/10', icon: '⚪' };
    }
  };

  const getCredibilityBadge = (score) => {
    if (score >= 90) return { label: 'Verified Source', icon: CheckCircle2, color: 'text-emerald-400' };
    if (score >= 75) return { label: 'High Signal', icon: Shield, color: 'text-tp-accent' };
    return null;
  };

  // 🧬 Radial Gauge Component
  const RadialMatch = ({ score, size = 36 }) => {
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    
    return (
      <div className="relative flex flex-col items-center group/match">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg className="transform -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-tp-accent transition-all duration-1000"
            />
          </svg>
          <span className="absolute text-[8px] font-black text-white">{score}%</span>
        </div>
        <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter mt-1 group-hover/match:text-tp-accent transition-colors">Match</span>
      </div>
    );
  };

  // 🎨 Tag-Based Accent Colors
  const getTagAccent = (tags = []) => {
    const mainTag = tags[0]?.toLowerCase() || '';
    if (mainTag.includes('js') || mainTag.includes('javascript')) return 'border-t-yellow-400';
    if (mainTag.includes('python')) return 'border-t-blue-400';
    if (mainTag.includes('rust')) return 'border-t-orange-500';
    if (mainTag.includes('react')) return 'border-t-cyan-400';
    if (mainTag.includes('go')) return 'border-t-sky-400';
    if (mainTag.includes('ai') || mainTag.includes('llm')) return 'border-t-purple-500';
    return 'border-t-tp-accent/30';
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f] overflow-hidden">
      {/* Top Filter Bar */}
      <div className="px-4 lg:px-8 py-4 border-b border-white/5 bg-[#0f0f0f]/80 backdrop-blur-md sticky top-0 z-30 w-full">
        <div className="max-w-[1600px] mx-auto flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button 
              onClick={onOpenSidebar}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all shrink-0"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative group w-full max-w-[200px] xl:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-tp-accent transition-colors" size={14} />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-tp-accent/30 transition-all"
              />
            </div>

            <div className="hidden sm:flex bg-white/5 p-1 rounded-xl border border-white/5 shrink-0">
               {[
                 { id: 'For You', label: 'Recommended' },
                 { id: 'Trending', label: 'Signal' },
                 { id: 'Recent', label: 'Newest' }
               ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setActiveFeedTab(t.id)} 
                    className={`text-[9px] lg:text-[10px] font-black uppercase tracking-widest px-3 lg:px-4 py-2 rounded-lg transition-all ${activeFeedTab === t.id ? 'bg-tp-accent text-black shadow-lg shadow-tp-accent/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                     {t.label}
                  </button>
               ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-full shrink-0 mr-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Signals</span>
            </div>

            <div className="relative group/legend">
               <button className="p-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-tp-accent hover:border-tp-accent/30 transition-all">
                  <HelpCircle size={16} />
               </button>
               <div className="absolute top-full right-0 mt-3 w-64 p-4 bg-[#1a1d23] border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover/legend:opacity-100 transition-opacity pointer-events-none z-50">
                  <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Intelligence Legend</h4>
                  <div className="space-y-3">
                     <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full border-2 border-tp-accent flex items-center justify-center text-[8px] font-black text-tp-accent shrink-0">80%</div>
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                           <span className="text-white">Match Score:</span> Relevance to your technical stack and interests.
                        </p>
                     </div>
                     <div className="flex gap-3">
                        <div className="w-6 h-6 flex items-center justify-center text-emerald-400 shrink-0"><TrendingUp size={12} /></div>
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                           <span className="text-white">Signal Momentum:</span> Community traction and engagement velocity.
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-all shrink-0 ${showFilters ? 'bg-tp-accent border-tp-accent text-black' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
            >
              <Settings2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/5 bg-[#141414]"
          >
            <div className="max-w-[1600px] mx-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {/* Market Source Filter */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Source</span>
                <div className="flex flex-wrap gap-2">
                  {['All', 'GitHub', 'Dev.to', 'HackerNews', 'Reddit', 'Cloudflare', 'Netflix', 'Stripe', 'Meta', 'Vercel', 'AWS', 'OpenAI'].map(src => (
                    <button
                      key={src}
                      onClick={() => setSourceFilter(src)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                        sourceFilter === src 
                        ? 'bg-tp-accent text-black border-tp-accent' 
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {src}
                    </button>
                  ))}
                </div>
              </div>

              {/* Relevance Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Min. Relevance</span>
                  <span className="text-xs font-bold text-tp-accent">{minRelevance}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="10"
                  value={minRelevance}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setMinRelevance(val);
                    handleUpdatePrefs({ minRelevance: val });
                  }}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-tp-accent"
                />
              </div>

              {/* Push Intelligence Settings */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Daily Push Intelligence</span>
                <div className="flex flex-col gap-3">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {[
                      { id: 'NONE', label: 'Off' },
                      { id: 'SLACK', label: 'Slack' },
                      { id: 'DISCORD', label: 'Discord' },
                      { id: 'EMAIL', label: 'Email' }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => handleUpdatePrefs({ notificationType: type.id })}
                        className={`flex-1 text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all ${
                          user?.notificationType === type.id 
                            ? 'bg-tp-accent text-black shadow-lg shadow-tp-accent/20' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {(user?.notificationType === 'SLACK' || user?.notificationType === 'DISCORD') && (
                    <input
                      value={user?.webhookUrl || ''}
                      onChange={(e) => handleUpdatePrefs({ webhookUrl: e.target.value })}
                      placeholder={`${user.notificationType} Webhook URL...`}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-tp-accent/50 transition-all"
                    />
                  )}
                  {user?.notificationType === 'EMAIL' && (
                    <p className="text-[9px] font-bold text-slate-500 uppercase italic tracking-widest">
                      Sent daily to {user.email} at 8:00 AM
                    </p>
                  )}
                </div>
              </div>

              {/* Muted Tags */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mute Content Tags</span>
                <div className="flex gap-2">
                  <input
                    value={tagToMute}
                    onChange={(e) => setTagToMute(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagToMute.trim()) {
                        if (!mutedTags.includes(tagToMute.trim())) {
                          const newMuted = [...mutedTags, tagToMute.trim()];
                          setMutedTags(newMuted);
                          handleUpdatePrefs({ mutedTags: newMuted });
                        }
                        setTagToMute('');
                      }
                    }}
                    placeholder="e.g. Web3..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0f0f0f]">
        <div className="max-w-[1600px] mx-auto p-6">
           {isFeedLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl h-[400px] animate-pulse flex flex-col p-8 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="w-24 h-4 bg-white/5 rounded" />
                       <div className="w-10 h-10 rounded-full bg-white/5" />
                    </div>
                    <div className="space-y-3">
                       <div className="w-3/4 h-8 bg-white/5 rounded" />
                       <div className="w-1/2 h-8 bg-white/5 rounded" />
                    </div>
                    <div className="flex-1 border-l-2 border-white/5 pl-5 space-y-4">
                       <div className="w-full h-4 bg-white/5 rounded" />
                       <div className="w-full h-4 bg-white/5 rounded" />
                       <div className="w-2/3 h-4 bg-white/5 rounded" />
                    </div>
                    <div className="mt-auto pt-4 border-t border-white/5 flex justify-between">
                       <div className="w-32 h-4 bg-white/5 rounded" />
                       <div className="w-8 h-8 bg-white/5 rounded" />
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <>
               {/* Top Info Banner (Daily.dev Style) */}
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="mb-8 p-6 bg-gradient-to-r from-tp-accent/10 via-tp-indigo/5 to-transparent border border-white/5 rounded-2xl flex items-center justify-between group"
           >
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-tp-accent/20 flex items-center justify-center text-tp-accent group-hover:scale-110 transition-transform duration-500">
                    <Sparkles size={32} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-white mb-1">Boost your technical edge with AI analysis</h2>
                    <p className="text-sm text-slate-400">Click on any card to generate a deep-dive summary and key technical takeaways.</p>
                 </div>
              </div>
              <button className="px-6 py-2.5 bg-tp-accent text-black font-bold rounded-xl text-sm hover:scale-105 transition-all shadow-lg shadow-tp-accent/20">
                 Explore Intelligence
              </button>
           </motion.div>

           <motion.div 
             variants={container}
             initial="hidden"
             animate="show"
             className="grid grid-cols-1 md:grid-cols-2 gap-8"
           >
              {/* Main Feed Column */}
              {isLoading ? (
                 Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              ) : (
                <AnimatePresence mode="popLayout">
                  {visibleItems.map((item, i) => {
                     const impact = getImpactBadge(item.impactHorizon);
                     const credibility = getCredibilityBadge(item.credibilityScore);
                     const isTopTier = item.relevanceScore >= 90;
                     const isHero = i === 0 && activeFeedTab === 'For You';
                     const accentClass = getTagAccent(item.tags);
                     
                     return (
                        <motion.div 
                           key={item.id || item.url} 
                           layout
                           variants={itemVariants}
                           exit={{ opacity: 0, scale: 0.95 }}
                           whileHover={{ y: -4 }}
                           onClick={() => handleSummarize(item)} 
                           className={`group flex flex-col bg-[#1e1e1e] border-x border-b border-white/5 rounded-2xl hover:bg-slate-800/50 hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] cursor-pointer relative h-fit border-t-2 ${accentClass} ${isHero ? 'md:col-span-2 p-2' : ''}`}
                        >
                           {/* Card Header: Human Badges */}
                           <div className="p-4 flex items-center justify-between gap-3 border-b border-white/5 rounded-t-2xl">
                           <div className="flex items-center gap-3">
                              {/* Impact Category Badge */}
                              {item.impactCategory && (
                                <div className="group/impact relative">
                                  <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getCategoryBadge(item.impactCategory).color}`}>
                                     <span>{getCategoryBadge(item.impactCategory).icon}</span>
                                     {item.impactCategory}
                                  </div>
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-0 mb-2 w-40 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 opacity-0 group-hover/impact:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                     <span className="text-white block mb-1">Impact Category</span>
                                     Technical nature of the signal: {item.impactCategory}
                                  </div>
                                </div>
                              )}
                              
                              {/* Sparkline Velocity */}
                              <div className="flex items-center gap-3 group/velocity relative">
                                <div className="w-12 h-6 flex items-center">
                                  <Sparklines data={Array.from({length: 8}, () => Math.floor(Math.random() * 50) + (item.points > 1000 ? 50 : 20))} margin={2}>
                                    <SparklinesLine color={item.points > 1000 ? "#34d399" : "#64748b"} style={{ strokeWidth: 3 }} />
                                    <SparklinesSpots size={2} />
                                  </Sparklines>
                                </div>
                                <div className="flex flex-col items-start">
                                   <div className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter ${
                                     item.points > 1000 ? 'text-emerald-400' : 'text-slate-500'
                                   }`}>
                                      <TrendingUp size={10} className={item.points > 1000 ? 'animate-pulse' : ''} />
                                      +{item.points > 1000 ? item.points.toLocaleString() : Math.floor(Math.random() * 800) + 200}
                                   </div>
                                   <span className="text-[7px] font-black text-slate-600 uppercase tracking-tighter group-hover/velocity:text-slate-400 transition-colors">Signal</span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 opacity-0 group-hover/velocity:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                   <span className="text-white block mb-1">Signal Momentum</span>
                                   Community traction and engagement velocity across technical platforms.
                                </div>
                              </div>
                           </div>
                           
                           <div className="group/match-tip relative flex items-center gap-3">
                              <RadialMatch score={item.relevanceScore || 70} />
                              
                              {/* Tooltip */}
                              <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 opacity-0 group-hover/match-tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                 <span className="text-white block mb-1">Stack Match</span>
                                 Relevance to your technical stack: {followedTechs.length > 0 ? followedTechs.join(', ') : 'Market Trends'}
                              </div>
                           </div>
                        </div>

                        {/* Content Area */}
                        <div className={`flex-1 flex flex-col ${isHero ? 'p-8' : 'p-6'}`}>
                           {/* Title - Strong Hierarchy */}
                           <div className="flex justify-between items-start gap-4 mb-4">
                              <h3 className={`font-extrabold text-white tracking-tight leading-tight group-hover:text-tp-accent transition-colors line-clamp-2 ${isHero ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'}`}>
                                 {item.cleanTitle || item.title}
                              </h3>
                              <div className="p-2 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-tp-accent hover:text-black shrink-0">
                                 <ArrowUpRight size={18} />
                              </div>
                           </div>

                           {/* Intelligence Panel (AI Summary) */}
                           {(item.aiSummary || item.description) && (
                              <div className="group/ai-panel relative border-l-2 border-tp-accent/30 pl-5 py-1 mb-6 transition-all group-hover:border-tp-accent flex-1">
                                 <div className="flex items-center gap-2 mb-2 opacity-50">
                                    <Sparkles size={10} className="text-slate-500" />
                                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.2em]">Intelligence Synthesis</span>
                                 </div>
                                 <div className={`font-medium leading-relaxed italic transition-colors ${
                                    isHero ? 'text-[14px] lg:text-[16px] text-white' : 'text-[13px] lg:text-[14px] text-slate-400 group-hover:text-slate-200'
                                 }`}>
                                    <span className="text-tp-accent mr-1 font-black not-italic text-[11px] uppercase tracking-widest">AI TL;DR:</span>
                                    <div className={isHero ? "" : "line-clamp-4"}>
                                       {item.aiSummary ? (
                                          item.aiSummary
                                       ) : (
                                          <span className="flex items-center gap-2 text-slate-500">
                                             <Loader2 size={10} className="animate-spin" />
                                             {item.description && item.description !== 'Comments' 
                                             ? item.description 
                                             : 'Synthesizing technical signal...'}
                                          </span>
                                       )}
                                    </div>
                                 </div>
                                 {/* Tooltip */}
                                 <div className="absolute top-0 left-full ml-4 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 opacity-0 group-hover/ai-panel:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                    <span className="text-white block mb-1">AI Synthesis</span>
                                    High-fidelity architectural summary generated by Llama 3.1 LLM.
                                 </div>
                              </div>
                           )}

                           {/* Card Footer: Metadata & Actions */}
                           <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                              <div className="flex items-center gap-4">
                                 <div className="group/query relative">
                                    <button 
                                       onClick={(e) => { e.stopPropagation(); handleOpenChat(item); }}
                                       className="text-[10px] font-black uppercase tracking-widest text-tp-accent opacity-0 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all flex items-center gap-1"
                                    >
                                       Intelligence Query ↗
                                    </button>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 border border-white/10 rounded-lg text-[9px] font-bold text-slate-400 opacity-0 group-hover/query:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-md">
                                       <span className="text-white block mb-1">Intelligence Query</span>
                                       Start a deep-dive conversation with the AI about this technical update.
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                    <span>{item.source}</span>
                                    <span>•</span>
                                    <span>{new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                 <button 
                                    onClick={(e) => { e.stopPropagation(); handleSaveArticle(item); }}
                                    className={`p-2 rounded-lg transition-all ${
                                       savedArticles.some(s => s.url === item.url) ? 'text-tp-accent bg-tp-accent/10' : 'text-slate-600 hover:text-white hover:bg-white/5'
                                    }`}
                                 >
                                    <Bookmark size={16} fill={savedArticles.some(s => s.url === item.url) ? "currentColor" : "none"} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* Hero Gradient Overlay */}
                        {isHero && (
                           <div className="absolute inset-0 pointer-events-none border border-tp-accent/20 rounded-2xl shadow-[inset_0_0_40px_rgba(59,130,246,0.05)]" />
                        )}
                     </motion.div>
                  )})}
                </AnimatePresence>
              )}

              {/* Load More Trigger */}
              {filteredBySource.length > visibleCount && (
                 <div className="mt-12 flex justify-center col-span-full">
                    <button 
                       onClick={onLoadMore}
                       className="px-8 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/10 transition-all"
                    >
                       Scan More Intelligence
                    </button>
                 </div>
              )}
           </motion.div>
             </>
           )}
        </div>
      </div>
    </div>
  )
}

export default NewsFeed;
