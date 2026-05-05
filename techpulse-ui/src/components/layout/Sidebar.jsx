import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Zap, 
  BookMarked, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  LogOut, 
  Sparkles,
  Search,
  Activity,
  Plus
} from 'lucide-react'
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { cn } from '/src/utils/cn.js'

const Sidebar = ({ activeTab, setActiveTab, setSummary, setResult, setResult2, startQuickAnalyze, feed, pulseIndex, handleSummarize, user, handleLogout, setAuthMode, setTech, setIsVersus, isOpen, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const navItems = [
    { id: 'feed', label: 'Intelligence Feed', icon: LayoutDashboard },
    { id: 'trends', label: 'Global Trends', icon: TrendingUp },
    { id: 'analysis', label: 'Intelligence Lab', icon: Zap },
    { id: 'saved', label: 'Reading List', icon: BookMarked },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ 
          width: isCollapsed ? '80px' : '320px',
          x: isOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -320 : 0)
        }}
        transition={{ duration: 0.3, ease: "circOut" }}
        className={cn(
          "bg-tp-dark border-r border-tp-border flex flex-col sticky top-0 h-screen z-50 lg:z-40 group/sidebar transition-transform lg:translate-x-0",
          "fixed lg:sticky",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
          {/* Collapse Toggle (Desktop Only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-10 w-6 h-6 bg-tp-accent rounded-full items-center justify-center text-white shadow-lg shadow-tp-accent/20 border border-tp-border z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 hover:scale-110"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

        <div className={cn("flex flex-col h-full p-8 overflow-y-auto custom-scrollbar", isCollapsed && "p-4 items-center")}>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn("flex items-center gap-3 mb-12 group cursor-pointer", isCollapsed && "mb-8")} 
            onClick={() => {setActiveTab('feed'); setResult(null); setResult2(null); onClose?.()}}
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
                onClick={() => {setActiveTab(item.id); setSummary(null); setResult2(null); setResult(null); onClose?.()}} 
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
                    onClose?.();
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

          {/* Bottom Actions */}
          <div className={cn("mt-auto pt-8 border-t border-white/5 space-y-4", isCollapsed && "items-center")}>
            <SignedIn>
              <div className="space-y-4">
                <div className={cn("flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl", isCollapsed && "px-2 justify-center")}>
                  <UserButton 
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 rounded-xl",
                        userButtonPopoverCard: "bg-tp-dark border border-white/10",
                        userButtonPopoverFooter: "hidden"
                      }
                    }}
                  />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-white truncate">{user?.email}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Strategic Access</p>
                    </div>
                  )}
                </div>
              </div>
            </SignedIn>
            
            <SignedOut>
              <button 
                onClick={() => setAuthMode('signup')}
                className={cn("flex items-center gap-3 w-full px-4 py-3 bg-tp-accent text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all shadow-lg shadow-tp-accent/20", isCollapsed && "p-3 justify-center")}
              >
                <Sparkles size={16} />
                {!isCollapsed && <span>Initialize Intel</span>}
              </button>
            </SignedOut>
          </div>
        </div>
    </motion.aside>
    </>
  )
}

export default Sidebar
