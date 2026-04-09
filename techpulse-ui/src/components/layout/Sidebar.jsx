import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, BookMarked, TrendingUp, Sparkles, LogOut, User, Activity, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

const Sidebar = ({ activeTab, setActiveTab, setSummary, setResult, setResult2, startQuickAnalyze, feed, pulseIndex, handleSummarize, token, user, handleLogout, setAuthMode, setTech, setIsVersus }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const navItems = [
    { id: 'feed', label: 'Market Feed', icon: LayoutDashboard },
    { id: 'analysis', label: 'Intelligence Lab', icon: Zap },
    { id: 'saved', label: 'Reading List', icon: BookMarked },
    { id: 'trends', label: 'Global Trends', icon: TrendingUp },
  ]

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? '80px' : '320px' }}
      transition={{ duration: 0.3, ease: "circOut" }}
      className="bg-tp-dark border-r border-tp-border flex flex-col sticky top-0 h-screen z-40 relative group/sidebar"
    >
        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-tp-accent rounded-full flex items-center justify-center text-white shadow-lg shadow-tp-accent/20 border border-tp-border z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={cn("flex flex-col h-full p-8 overflow-y-auto custom-scrollbar", isCollapsed && "p-4 items-center")}>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn("flex items-center gap-3 mb-12 group cursor-pointer", isCollapsed && "mb-8")} 
            onClick={() => {setActiveTab('feed'); setResult(null); setResult2(null)}}
          >
            <div className="w-10 h-10 bg-tp-accent rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg shadow-tp-accent/20 group-hover:rotate-12 transition-all shrink-0">T</div>
            {!isCollapsed && (
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl font-black tracking-tighter text-white uppercase italic"
              >
                TechPulse
              </motion.h1>
            )}
          </motion.div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => {setActiveTab(item.id); setSummary(null); setResult(null); setResult2(null)}} 
                className={cn(
                  "nav-btn group relative flex items-center gap-3 w-full",
                  activeTab === item.id ? "bg-tp-accent/10 text-tp-accent" : "hover:bg-white/5 text-slate-500 hover:text-slate-200",
                  isCollapsed && "justify-center px-0 h-12 rounded-2xl"
                )}
              >
                <item.icon size={16} className={cn("transition-colors shrink-0", activeTab === item.id ? "text-tp-accent" : "group-hover:text-slate-200")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="sidebarActive"
                    className={cn("absolute left-0 w-1 h-6 bg-tp-accent rounded-full", isCollapsed && "h-8")}
                  />
                )}
              </button>
            ))}

            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-8 pb-2 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"
              >
                <Zap size={10} />
                Quick Interests
              </motion.div>
            )}
            
            <div className="space-y-1">
              {['React', 'Rust', 'LLMs'].map(t => (
                <button 
                  key={t} 
                  onClick={() => {
                    setTech(t);
                    setIsVersus(false);
                    setActiveTab('analysis');
                    startQuickAnalyze(t);
                  }} 
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all group",
                    isCollapsed && "px-0 justify-center h-10"
                  )}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-tp-accent/30 group-hover:bg-tp-accent transition-colors shrink-0" />
                  {!isCollapsed && <span>{t}</span>}
                </button>
              ))}
            </div>

            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="pt-8 pb-4"
              >
                <div className="bg-tp-accent/5 border border-tp-accent/10 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-tp-accent/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="flex items-center gap-2 relative z-10">
                      <Activity size={12} className="text-tp-accent animate-pulse" />
                      <span className="text-[10px] font-black text-tp-accent uppercase tracking-widest">Live Market Pulse</span>
                  </div>
                  
                  <div className="relative z-10 h-16">
                    <AnimatePresence mode="wait">
                      {feed.length > 0 ? (
                        <motion.div 
                          key={pulseIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-3"
                        >
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2 italic">
                              &quot;{feed[pulseIndex]?.title}&quot;
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">{feed[pulseIndex]?.source}</span>
                              <button 
                                onClick={() => handleSummarize(feed[pulseIndex])} 
                                className="text-[9px] font-black text-tp-accent uppercase tracking-widest hover:underline flex items-center gap-1"
                              >
                                <Sparkles size={8} />
                                AI Brief
                              </button>
                            </div>
                        </motion.div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Listening for market signals...</p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </nav>

          <div className={cn("mt-auto pt-6 border-t border-white/5", isCollapsed && "pt-4")}>
            {token ? (
              <div className={cn("flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group", isCollapsed && "p-1 justify-center")}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-tp-accent to-tp-indigo flex items-center justify-center text-xs font-black text-white shadow-lg shadow-tp-accent/10 group-hover:rotate-6 transition-all shrink-0">
                  {user?.email?.[0].toUpperCase()}
                </div>
                {!isCollapsed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 overflow-hidden"
                  >
                    <div className="text-xs font-bold text-white truncate">{user?.email}</div>
                    <button 
                      onClick={handleLogout} 
                      className="text-[9px] text-slate-500 hover:text-rose-400 uppercase font-black flex items-center gap-1 mt-0.5 transition-colors"
                    >
                      <LogOut size={8} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setAuthMode('signup')} 
                className={cn(
                  "w-full py-4 bg-tp-accent/10 hover:bg-tp-accent text-tp-accent hover:text-white border border-tp-accent/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-tp-accent/5 flex items-center justify-center gap-2",
                  isCollapsed && "px-0 h-12"
                )}
              >
                <User size={12} />
                {!isCollapsed && <span>Join TechPulse</span>}
              </button>
            )}
          </div>
        </div>
    </motion.aside>
  )
}

export default Sidebar
