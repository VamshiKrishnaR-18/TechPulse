import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  TrendingUp,
  Activity,
  Layers,
  Cpu,
  Search,
  ArrowRight,
  X,
  LayoutDashboard,
  BookMarked,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useTechPulse } from "./hooks/useTechPulse";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import NewsFeed from "./components/feed/NewsFeed";
import AnalysisDashboard from "./components/analysis/AnalysisDashboard";
import GlobalTrends from "./components/trends/GlobalTrends";
import AuthModals from "./components/auth/AuthModals";
import SummarySidebar from "./components/feed/SummarySidebar";
import CommandPalette from "./components/layout/CommandPalette";
import LandingPage from "./components/layout/LandingPage";
import AdminDashboard from "./components/admin/AdminDashboard";

function App() {
  const reportRef = useRef(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(
    !localStorage.getItem("tp_token"),
  );
  const {
    tech,
    setTech,
    tech2,
    setTech2,
    result,
    result2,
    streamingText,
    error,
    feed,
    pulseIndex,
    trends,
    activeTab,
    setActiveTab,
    trendsCategory,
    setTrendsCategory,
    feedSearchQuery,
    suggestedQuery,
    handleSearchChange,
    applySuggestion,
    activeFeedTab,
    setActiveFeedTab,
    visibleFeedCount,
    loadMoreFeed,
    summary,
    setSummary,
    isSummarizing,
    isVersus,
    setIsVersus,
    dbOffline,
    authMode,
    setAuthMode,
    authData,
    setAuthData,
    user,
    token,
    savedArticles,
    handleAnalyze,
    handleSaveArticle,
    handleRemoveArticle,
    handleSummarize,
    handleAuth,
    handleLogout,
    startQuickAnalyze,
    resetAnalysis,
    history,
    cachedTechNames,
    savedArticlesMeta,
    savedArticlesPage,
    setSavedArticlesPage,
    followedTechs,
    handleToggleFollow,
    isGuestHistory,
  } = useTechPulse();

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = cachedTechNames.filter(
    (name) =>
      name.toLowerCase().includes(tech.toLowerCase()) &&
      name.toLowerCase() !== tech.toLowerCase()
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === "Space") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { id: "feed", label: "Market Feed", icon: LayoutDashboard },
    { id: "analysis", label: "Intelligence Lab", icon: Zap },
    { id: "saved", label: "Reading List", icon: BookMarked },
    { id: "trends", label: "Global Trends", icon: TrendingUp },
    ...(user?.role === 'ADMIN' ? [{ id: "admin", label: "Super User Admin", icon: Activity }] : [])
  ];

  const exportReport = async () => {
    if (!token) {
      setAuthMode("signup");
      return;
    }
    if (!reportRef.current) return;
    const canvas = await html2canvas(reportRef.current, {
      backgroundColor: "#0f172a",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = `techpulse-${tech}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  return (
    <div className="h-screen bg-tp-dark text-slate-200 flex font-tp-sans selection:bg-tp-accent/30 overflow-hidden">
      <AnimatePresence mode="wait">
        {showLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full h-screen overflow-y-auto custom-scrollbar"
          >
            <LandingPage
              onStart={(tabId = "feed") => {
                if (tabId) setActiveTab(tabId);
                setShowLanding(false);
              }}
              user={user}
            />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex overflow-hidden"
          >
            <CommandPalette
              key={isCommandPaletteOpen ? "open" : "closed"}
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
              navItems={navItems}
              onNavigate={setActiveTab}
              startQuickAnalyze={startQuickAnalyze}
              history={history}
            />

            {/* Sidebar Navigation */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSummary={setSummary}
              setResult={() => {}}
              setResult2={() => {}}
              startQuickAnalyze={startQuickAnalyze}
              feed={feed}
              pulseIndex={pulseIndex}
              handleSummarize={handleSummarize}
              token={token}
              user={user}
              handleLogout={handleLogout}
              setAuthMode={setAuthMode}
              setTech={setTech}
              setIsVersus={setIsVersus}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
              <Header activeTab={activeTab} setActiveTab={setActiveTab} />

              <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {/* Intelligence Lab (Initial State) */}
                  {!result && activeTab === "analysis" && (
                    <motion.div
                      key="analysis-init"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-12 max-w-4xl mx-auto"
                    >
                      <div className="relative group">
                        <div className="absolute inset-0 bg-tp-accent/20 blur-3xl rounded-full scale-150 group-hover:bg-tp-accent/30 transition-all"></div>
                        <div className="relative w-28 h-28 bg-tp-accent/10 rounded-[2.5rem] border border-tp-accent/20 flex items-center justify-center text-tp-accent mb-4 shadow-2xl shadow-tp-accent/10">
                          <Zap size={56} className="animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-4 max-w-xl">
                        <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-sm">
                          Intelligence Lab
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed">
                          Generate real-time strategic intelligence reports for
                          any technology, framework, or industry trend.
                        </p>
                      </div>

                      {/* Direct Entry Input */}
                      <div className="w-full max-w-xl space-y-4">
                        <div className="flex justify-center gap-4 mb-2">
                          <button
                            onClick={() => setIsVersus(false)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${!isVersus ? "bg-tp-accent text-black" : "bg-white/5 text-slate-500 hover:text-white"}`}
                          >
                            Standard
                          </button>
                          <button
                            onClick={() => setIsVersus(true)}
                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isVersus ? "bg-tp-indigo text-white" : "bg-white/5 text-slate-500 hover:text-white"}`}
                          >
                            Comparison Mode
                          </button>
                        </div>

                        <div className="relative group">
                          <div
                            className={`absolute -inset-0.5 bg-gradient-to-r ${isVersus ? "from-tp-indigo to-tp-accent" : "from-tp-accent to-tp-indigo"} rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000`}
                          ></div>
                          <div className="relative flex flex-col bg-tp-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 focus-within:border-tp-accent/50 transition-all divide-y divide-white/5">
                            <div className="flex items-center pl-6 py-2">
                              <Search
                                size={18}
                                className="text-slate-500 mr-4"
                              />
                              <input
                                type="text"
                                value={tech}
                                onChange={(e) => {
                                  setTech(e.target.value);
                                  setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (activeSuggestionIndex >= 0) {
                                      setTech(filteredSuggestions[activeSuggestionIndex]);
                                      setShowSuggestions(false);
                                    } else {
                                      handleAnalyze();
                                    }
                                  } else if (e.key === "ArrowDown") {
                                    setActiveSuggestionIndex((prev) => 
                                      prev < filteredSuggestions.length - 1 ? prev + 1 : prev
                                    );
                                  } else if (e.key === "ArrowUp") {
                                    setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
                                  } else if (e.key === "Escape") {
                                    setShowSuggestions(false);
                                  }
                                }}
                                placeholder={
                                  isVersus
                                    ? "Base technology (e.g. React)..."
                                    : "Enter technology (e.g. Next.js, PyTorch)..."
                                }
                                className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-slate-600"
                              />

                              {/* Autocomplete Dropdown */}
                              {showSuggestions && tech.length > 0 && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-tp-dark border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden">
                                  {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                                    <button
                                      key={suggestion}
                                      onClick={() => {
                                        setTech(suggestion);
                                        setShowSuggestions(false);
                                      }}
                                      className={`w-full text-left px-6 py-3 text-sm font-bold transition-colors ${
                                        index === activeSuggestionIndex 
                                        ? 'bg-tp-accent text-black' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                      }`}
                                    >
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            {isVersus && (
                              <div className="flex items-center pl-6 py-2">
                                <Search
                                  size={18}
                                  className="text-tp-indigo mr-4 opacity-50"
                                />
                                <input
                                  type="text"
                                  value={tech2}
                                  onChange={(e) => setTech2(e.target.value)}
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleAnalyze()
                                  }
                                  placeholder="Comparison target (e.g. Vue)..."
                                  className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-slate-600"
                                />
                              </div>
                            )}
                            <div className="flex justify-end p-1">
                              <button
                                onClick={handleAnalyze}
                                disabled={
                                  !tech.trim() || (isVersus && !tech2.trim())
                                }
                                className={`px-8 py-3 ${isVersus ? "bg-tp-indigo hover:bg-tp-indigo/90 text-white" : "bg-tp-accent hover:bg-tp-accent/90 text-black"} disabled:bg-white/5 disabled:text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center gap-2`}
                              >
                                {isVersus ? "Run Comparison" : "Analyze"}
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                          <span>Popular:</span>
                          {["React", "Rust", "LLMs", "Web3"].map((t) => (
                            <button
                              key={t}
                              onClick={() => startQuickAnalyze(t)}
                              className="hover:text-tp-accent transition-colors"
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Strategic Process Steps */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
                        {history.length > 0 && !isGuestHistory ? (
                          <div className="col-span-full space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                               <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] italic">
                                  Your Recent Reports
                               </h3>
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                  {history.length} Reports Saved
                               </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                               {history.slice(0, 6).map((item, i) => (
                                  <motion.button
                                     key={item.id}
                                     initial={{ opacity: 0, y: 10 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     transition={{ delay: i * 0.05 }}
                                     onClick={() => startQuickAnalyze(item.techName)}
                                     className="group p-6 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-tp-accent/30 transition-all text-left relative overflow-hidden"
                                  >
                                     <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-20 transition-opacity">
                                        <Activity size={40} />
                                     </div>
                                     <div className="text-[8px] font-black text-tp-accent uppercase tracking-widest mb-1">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                     </div>
                                     <h4 className="text-lg font-black text-white group-hover:text-tp-accent transition-colors">
                                        {item.techName}
                                     </h4>
                                     <div className="flex gap-2 mt-3">
                                        <div className="px-2 py-0.5 bg-tp-accent/10 rounded-md text-[8px] font-black text-tp-accent uppercase tracking-tighter">
                                           Hiring: {item.metrics?.job_score || 0}%
                                        </div>
                                        <div className="px-2 py-0.5 bg-tp-indigo/10 rounded-md text-[8px] font-black text-tp-indigo uppercase tracking-tighter">
                                           GitHub: {item.metrics?.github_score || 0}%
                                        </div>
                                     </div>
                                  </motion.button>
                               ))}
                            </div>
                          </div>
                        ) : (
                          <>
                            {isGuestHistory && (
                              <div className="col-span-full p-8 bg-tp-accent/5 border border-tp-accent/20 rounded-[2rem] mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                  <h4 className="text-sm font-black text-white uppercase italic tracking-widest mb-1">Personalize Your Intelligence</h4>
                                  <p className="text-[10px] text-slate-500 font-bold">Sign in to track your technical analysis history and save custom reports.</p>
                                </div>
                                <button 
                                  onClick={() => setAuthMode('signup')}
                                  className="px-6 py-3 bg-tp-accent hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                  Get Started
                                </button>
                              </div>
                            )}
                            {[
                              {
                                step: "01",
                                title: "Data Ingestion",
                                desc: "Aggregates signals from GitHub, HackerNews, Reddit, and market sources.",
                              },
                              {
                                step: "02",
                                title: "AI Synthesis",
                                desc: "Processes raw data through LLM models to extract technical trends and sentiment.",
                              },
                              {
                                step: "03",
                                title: "Market Verdict",
                                desc: "Delivers actionable insights, roadmap projections, and ecosystem health scores.",
                              },
                            ].map((item, i) => (
                              <div
                                key={i}
                                className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4 hover:bg-white/5 transition-all text-left group"
                              >
                                <div className="text-tp-accent font-black text-xs tracking-widest">
                                  {item.step}
                                </div>
                                <h4 className="text-sm font-black text-white uppercase italic">
                                  {item.title}
                                </h4>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed group-hover:text-slate-400">
                                  {item.desc}
                                </p>
                              </div>
                            ))}
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl pt-4">
                        <div className="glass-card p-10 border-tp-accent/20 hover:border-tp-accent/40 transition-all relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={80} />
                          </div>
                          <div className="text-[11px] font-black text-tp-accent uppercase mb-3 tracking-widest flex items-center gap-2">
                            <Activity size={14} />
                            Deep-Dive Analysis
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            Complete breakdown of a single tech stack including
                            developer sentiment, hiring demand, and future
                            roadmap.
                          </p>
                          <div className="mt-6 text-[8px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-tp-accent transition-colors">
                            Select from Quick Interests to start
                          </div>
                        </div>
                        <div className="glass-card p-10 border-tp-indigo/20 hover:border-tp-indigo/40 transition-all relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Layers size={80} />
                          </div>
                          <div className="text-[11px] font-black text-tp-indigo uppercase mb-3 tracking-widest flex items-center gap-2">
                            <Cpu size={14} />
                            Side-by-Side Compare
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            Comparative analysis between two technologies to
                            identify competitive advantages and ecosystem
                            trade-offs.
                          </p>
                          <div className="mt-6 text-[8px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-tp-indigo transition-colors">
                            Coming soon in v2.6
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Discovery Feed View */}
                  {!result && activeTab === "feed" && (
                    <motion.div
                      key="feed"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      <NewsFeed
                        activeFeedTab={activeFeedTab}
                        setActiveFeedTab={setActiveFeedTab}
                        feed={feed}
                        handleSummarize={handleSummarize}
                        handleSaveArticle={handleSaveArticle}
                        dbOffline={dbOffline}
                        savedArticles={savedArticles}
                        searchQuery={feedSearchQuery}
                        onSearchChange={handleSearchChange}
                        suggestedQuery={suggestedQuery}
                        onApplySuggestion={applySuggestion}
                        visibleCount={visibleFeedCount}
                        onLoadMore={loadMoreFeed}
                        trends={trends}
                      />
                    </motion.div>
                  )}

                  {/* Analysis View */}
                  {result && activeTab === "analysis" && (
                    <motion.div
                      key="analysis"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex justify-start">
                        <button
                          onClick={resetAnalysis}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all"
                        >
                          <X size={14} />
                          Back to Search
                        </button>
                      </div>
                      <AnalysisDashboard
                        result={result}
                        result2={result2}
                        streamingText={streamingText}
                        startQuickAnalyze={startQuickAnalyze}
                        exportReport={exportReport}
                        reportRef={reportRef}
                        followedTechs={followedTechs}
                        handleToggleFollow={handleToggleFollow}
                      />
                    </motion.div>
                  )}

                  {/* Reading List View */}
                  {!result && activeTab === "saved" && (
                    <motion.div
                      key="saved"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex flex-col gap-1">
                          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
                            Your Reading List
                          </h2>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {savedArticlesMeta.total} Articles Total • Page {savedArticlesPage} of {savedArticlesMeta.totalPages}
                          </p>
                        </div>
                        
                        {/* Pagination Controls */}
                        {savedArticlesMeta.totalPages > 1 && (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={savedArticlesPage === 1}
                              onClick={() => setSavedArticlesPage(p => Math.max(1, p - 1))}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 disabled:opacity-20 transition-all"
                            >
                              <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-black text-white px-2 uppercase tracking-widest">
                              {savedArticlesPage} / {savedArticlesMeta.totalPages}
                            </span>
                            <button
                              disabled={savedArticlesPage === savedArticlesMeta.totalPages}
                              onClick={() => setSavedArticlesPage(p => Math.min(savedArticlesMeta.totalPages, p + 1))}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-slate-400 disabled:opacity-20 transition-all"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        )}
                      </div>

                      {savedArticles.length === 0 ? (
                        <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                          <div className="text-4xl mb-4">📚</div>
                          <p className="text-slate-500 font-bold">
                            No saved articles yet. Start exploring the feed!
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {savedArticles.map((item, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              className="bg-[#1a1d23] border border-white/5 rounded-3xl p-6 flex gap-6 hover:border-tp-indigo/30 transition-all group"
                            >
                              {item.image && (
                                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-black/20">
                                  <img
                                    src={item.image}
                                    className="w-full h-full object-cover"
                                    alt={item.title}
                                  />
                                </div>
                              )}
                              <div className="flex-1 flex flex-col justify-between">
                                <div>
                                  <div className="text-[8px] font-black text-tp-indigo uppercase tracking-widest mb-1">
                                    {item.source}
                                  </div>
                                  <h3 className="text-lg font-black text-white leading-tight group-hover:text-tp-indigo transition-colors line-clamp-2">
                                    {item.title}
                                  </h3>
                                </div>
                                <div className="flex gap-3 mt-4">
                                  <button
                                    onClick={() =>
                                      handleSummarize({
                                        ...item,
                                        description:
                                          "Saved from your reading list.",
                                      })
                                    }
                                    className="text-[9px] font-black text-white uppercase tracking-widest bg-tp-indigo px-3 py-1.5 rounded-lg"
                                  >
                                    ✨ Summarize
                                  </button>
                                  <button
                                    onClick={() => handleRemoveArticle(item.id)}
                                    className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest pt-2"
                                  >
                                    Remove
                                  </button>
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest pt-2 ml-auto"
                                  >
                                    Read Original
                                  </a>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Bottom Pagination */}
                      {savedArticlesMeta.totalPages > 1 && (
                        <div className="flex justify-center pt-8">
                           <div className="flex items-center gap-4 p-2 bg-white/5 border border-white/5 rounded-2xl">
                              <button
                                disabled={savedArticlesPage === 1}
                                onClick={() => {
                                  setSavedArticlesPage(p => Math.max(1, p - 1));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-6 py-2 bg-tp-dark hover:bg-tp-accent hover:text-black border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-20 transition-all"
                              >
                                Previous
                              </button>
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                                Page {savedArticlesPage} of {savedArticlesMeta.totalPages}
                              </span>
                              <button
                                disabled={savedArticlesPage === savedArticlesMeta.totalPages}
                                onClick={() => {
                                  setSavedArticlesPage(p => Math.min(savedArticlesMeta.totalPages, p + 1));
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="px-6 py-2 bg-tp-dark hover:bg-tp-accent hover:text-black border border-white/5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest disabled:opacity-20 transition-all"
                              >
                                Next
                              </button>
                           </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Global Trends View */}
                  {!result && activeTab === "trends" && (
                    <motion.div
                      key="trends"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                      <GlobalTrends
                        trends={trends}
                        category={trendsCategory}
                        setCategory={setTrendsCategory}
                      />
                    </motion.div>
                  )}
                  {/* Admin Dashboard View */}
                  {activeTab === "admin" && (
                    <motion.div
                      key="admin"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <AdminDashboard user={user} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </main>

            {/* Global Modals & Sidebars */}
            <AuthModals
              authMode={authMode}
              setAuthMode={setAuthMode}
              authData={authData}
              setAuthData={setAuthData}
              handleAuth={handleAuth}
              error={error}
            />

            <SummarySidebar
              summary={summary}
              isSummarizing={isSummarizing}
              setSummary={setSummary}
              handleSaveArticle={handleSaveArticle}
              dbOffline={dbOffline}
              savedArticles={savedArticles}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
