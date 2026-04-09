import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Zap, LayoutDashboard, BookMarked, TrendingUp, Command, ArrowRight, Clock } from 'lucide-react'

const CommandPalette = ({ isOpen, onClose, navItems, onNavigate, startQuickAnalyze, history = [] }) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const filteredActions = [
    ...navItems.map(item => ({ type: 'nav', ...item })),
    ...['React', 'Rust', 'LLMs', 'Web3', 'Kubernetes', 'Python'].map(tech => ({ type: 'tech', label: `Analyze ${tech}`, tech })),
    ...history.map(h => ({ type: 'history', label: h.techName, tech: h.techName }))
  ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()))

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative w-full max-w-2xl bg-[#11141a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex items-center px-6 py-5 border-b border-white/5">
            <Search size={20} className="text-slate-500 mr-4" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actions, tech, or market signals..."
              className="flex-1 bg-transparent border-none outline-none text-white font-bold text-lg placeholder:text-slate-600"
            />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
               <span className="text-[10px] font-black text-slate-500 uppercase">ESC</span>
            </div>
          </div>

          <div className="flex-1 max-h-[400px] overflow-y-auto p-4 custom-scrollbar">
            {filteredActions.length > 0 ? (
              <div className="space-y-1">
                {filteredActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (action.type === 'nav') onNavigate(action.id)
                      else if (action.type === 'tech' || action.type === 'history') startQuickAnalyze(action.tech)
                      onClose()
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-tp-accent/10 group transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-tp-accent group-hover:bg-tp-accent/10 transition-all">
                        {action.type === 'nav' && <action.icon size={18} />}
                        {action.type === 'tech' && <Zap size={18} />}
                        {action.type === 'history' && <Clock size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white uppercase tracking-tight">{action.label}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {action.type === 'nav' ? 'Navigation' : action.type === 'tech' ? 'Quick Analysis' : 'Recent Search'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={14} className="text-slate-700 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                  <Command size={32} />
                </div>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching tactical actions found.</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-white/5 rounded flex items-center justify-center text-[8px] font-black text-slate-500">↑↓</div>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-white/5 rounded flex items-center justify-center text-[8px] font-black text-slate-500">↵</div>
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Select</span>
                </div>
             </div>
             <div className="text-[9px] font-black text-tp-accent uppercase tracking-[0.2em] italic">TechPulse HUD v2.5</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CommandPalette
