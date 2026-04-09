import React, { useRef, useState, useEffect } from 'react'
import html2canvas from 'html2canvas'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, TrendingUp, Activity, Layers, Cpu, Search, ArrowRight, X, LayoutDashboard, BookMarked } from 'lucide-react'
import { useTechPulse } from './hooks/useTechPulse'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import NewsFeed from './components/feed/NewsFeed'
import AnalysisDashboard from './components/analysis/AnalysisDashboard'
import GlobalTrends from './components/trends/GlobalTrends'
import AuthModals from './components/auth/AuthModals'
import SummarySidebar from './components/feed/SummarySidebar'
import CommandPalette from './components/layout/CommandPalette'
import LandingPage from './components/layout/LandingPage'

function App() {
  const reportRef = useRef(null)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [showLanding, setShowLanding] = useState(!localStorage.getItem('tp_token'))
  const {
    tech, setTech, tech2, setTech2, result, result2, streamingText,
    error, feed, pulseIndex, trends, activeTab, setActiveTab, trendsCategory, setTrendsCategory,
    feedSearchQuery, suggestedQuery, handleSearchChange, applySuggestion,
    activeFeedTab, setActiveFeedTab, visibleFeedCount, loadMoreFeed,
    summary, setSummary, isSummarizing, isVersus, setIsVersus,
    dbOffline, authMode, setAuthMode, authData, setAuthData, user, token, savedArticles,
    handleAnalyze, handleSaveArticle, handleRemoveArticle, handleSummarize, handleAuth, handleLogout, startQuickAnalyze, resetAnalysis,
    history
  } = useTechPulse()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navItems = [
    { id: 'feed', label: 'Market Feed', icon: LayoutDashboard },
    { id: 'analysis', label: 'Intelligence Lab', icon: Zap },
    { id: 'saved', label: 'Reading List', icon: BookMarked },
    { id: 'trends', label: 'Global Trends', icon: TrendingUp },
  ]

  const exportReport = async () => {
    if (!token) { setAuthMode('signup'); return }
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 2 })
    const link = document.createElement('a')
    link.download = `techpulse-${tech}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }

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
              onStart={(tabId = 'feed') => {
                if (tabId) setActiveTab(tabId)
                setShowLanding(false)
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
              key={isCommandPaletteOpen ? 'open' : 'closed'}
              isOpen={isCommandPaletteOpen} 
              onClose={() => setIsCommandPaletteOpen(false)}
              navItems={navItems}
              onNavigate={setActiveTab}
              startQuickAnalyze={startQuickAnalyze}
              history={history}
            />

            {/* Sidebar Navigation */}
            <Sidebar 
              activeTab={activeTab} setActiveTab={setActiveTab} setSummary={setSummary}
              setResult={() => {}} setResult2={() => {}} startQuickAnalyze={startQuickAnalyze}
              feed={feed} pulseIndex={pulseIndex} handleSummarize={handleSummarize}
              token={token} user={user} handleLogout={handleLogout} setAuthMode={setAuthMode}
              setTech={setTech} setIsVersus={setIsVersus}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0">
              <Header activeTab={activeTab} setActiveTab={setActiveTab} />

              <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {/* Intelligence Lab (Initial State) */}
                  {!result && activeTab === 'analysis' && (
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
                  <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-sm">Intelligence Lab</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed">
                    Generate real-time strategic intelligence reports for any technology, framework, or industry trend.
                  </p>
                </div>

                {/* Direct Entry Input */}
                <div className="w-full max-w-xl space-y-4">
                   <div className="flex justify-center gap-4 mb-2">
                      <button 
                        onClick={() => setIsVersus(false)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${!isVersus ? 'bg-tp-accent text-black' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                      >
                         Standard
                      </button>
                      <button 
                        onClick={() => setIsVersus(true)}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${isVersus ? 'bg-tp-indigo text-white' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                      >
                         Comparison Mode
                      </button>
                   </div>

                   <div className="relative group">
                      <div className={`absolute -inset-0.5 bg-gradient-to-r ${isVersus ? 'from-tp-indigo to-tp-accent' : 'from-tp-accent to-tp-indigo'} rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000`}></div>
                      <div className="relative flex flex-col bg-tp-dark/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 focus-within:border-tp-accent/50 transition-all divide-y divide-white/5">
                         <div className="flex items-center pl-6 py-2">
                            <Search size={18} className="text-slate-500 mr-4" />
                            <input 
                              type="text" 
                              value={tech}
                              onChange={(e) => setTech(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                              placeholder={isVersus ? "Base technology (e.g. React)..." : "Enter technology (e.g. Next.js, PyTorch)..."}
                              className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-slate-600"
                            />
                         </div>
                         {isVersus && (
                            <div className="flex items-center pl-6 py-2">
                               <Search size={18} className="text-tp-indigo mr-4 opacity-50" />
                               <input 
                                 type="text" 
                                 value={tech2}
                                 onChange={(e) => setTech2(e.target.value)}
                                 onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                 placeholder="Comparison target (e.g. Vue)..."
                                 className="flex-1 bg-transparent border-none outline-none text-white font-bold text-sm placeholder:text-slate-600"
                               />
                            </div>
                         )}
                         <div className="flex justify-end p-1">
                            <button 
                              onClick={handleAnalyze}
                              disabled={!tech.trim() || (isVersus && !tech2.trim())}
                              className={`px-8 py-3 ${isVersus ? 'bg-tp-indigo hover:bg-tp-indigo/90 text-white' : 'bg-tp-accent hover:bg-tp-accent/90 text-black'} disabled:bg-white/5 disabled:text-slate-600 font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center gap-2`}
                            >
                               {isVersus ? 'Run Comparison' : 'Analyze'}
                               <ArrowRight size={14} />
                            </button>
                         </div>
                      </div>
                   </div>
                   <div className="mt-4 flex flex-wrap justify-center gap-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                      <span>Popular:</span>
                      {['React', 'Rust', 'LLMs', 'Web3'].map(t => (
                         <button key={t} onClick={() => startQuickAnalyze(t)} className="hover:text-tp-accent transition-colors">{t}</button>
                      ))}
                   </div>
                </div>

                {/* Strategic Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
                   {[
                      { step: '01', title: 'Data Ingestion', desc: 'Aggregates signals from GitHub, HackerNews, Reddit, and market sources.' },
                      { step: '02', title: 'AI Synthesis', desc: 'Processes raw data through LLM models to extract technical trends and sentiment.' },
                      { step: '03', title: 'Market Verdict', desc: 'Delivers actionable insights, roadmap projections, and ecosystem health scores.' }
                   ].map((item, i) => (
                      <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4 hover:bg-white/5 transition-all text-left group">
                         <div className="text-tp-accent font-black text-xs tracking-widest">{item.step}</div>
                         <h4 className="text-sm font-black text-white uppercase italic">{item.title}</h4>
                         <p className="text-[10px] text-slate-500 font-bold leading-relaxed group-hover:text-slate-400">{item.desc}</p>
                      </div>
                   ))}
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
                        Complete breakdown of a single tech stack including developer sentiment, hiring demand, and future roadmap.
                      </p>
                      <div className="mt-6 text-[8px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-tp-accent transition-colors">Select from Quick Interests to start</div>
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
                        Comparative analysis between two technologies to identify competitive advantages and ecosystem trade-offs.
                      </p>
                      <div className="mt-6 text-[8px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-tp-indigo transition-colors">Coming soon in v2.6</div>
                   </div>
                </div>
              </motion.div>
            )}

                  {/* Discovery Feed View */}
                  {!result && activeTab === 'feed' && (
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
                />
              </motion.div>
            )}

                  {/* Analysis View */}
                  {result && activeTab === 'analysis' && (
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
                  result={result} result2={result2} 
                  streamingText={streamingText}
                  startQuickAnalyze={startQuickAnalyze} exportReport={exportReport} reportRef={reportRef}
                />
              </motion.div>
            )}

                  {/* Reading List View */}
                  {!result && activeTab === 'saved' && (
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
                          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Reading List</h2>
                       </div>

                       {savedArticles.length === 0 ? (
                         <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                            <div className="text-4xl mb-4">📚</div>
                            <p className="text-slate-500 font-bold">No saved articles yet. Start exploring the feed!</p>
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
                                 {item.image && <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-black/20"><img src={item.image} className="w-full h-full object-cover" /></div>}
                                 <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                       <div className="text-[8px] font-black text-tp-indigo uppercase tracking-widest mb-1">{item.source}</div>
                                       <h3 className="text-lg font-black text-white leading-tight group-hover:text-tp-indigo transition-colors line-clamp-2">{item.title}</h3>
                                    </div>
                                    <div className="flex gap-3 mt-4">
                                       <button onClick={() => handleSummarize({ ...item, description: 'Saved from your reading list.' })} className="text-[9px] font-black text-white uppercase tracking-widest bg-tp-indigo px-3 py-1.5 rounded-lg">✨ Summarize</button>
                                       <button onClick={() => handleRemoveArticle(item.id)} className="text-[9px] font-black text-slate-500 hover:text-red-400 uppercase tracking-widest pt-2">Remove</button>
                                       <a href={item.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest pt-2 ml-auto">Read Original</a>
                                    </div>
                                 </div>
                              </motion.div>
                            ))}
                         </div>
                       )}
                    </motion.div>
                  )}

                  {/* Global Trends View */}
                  {!result && activeTab === 'trends' && (
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
  )
}

export default App
