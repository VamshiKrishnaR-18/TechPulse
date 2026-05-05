import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, TrendingUp, ExternalLink, Bookmark, CheckCircle2, Zap, Activity, ShieldAlert, Target, Globe, Send, MessageSquare, User, Bot, Loader2, Clock } from 'lucide-react'

const SummarySidebar = ({ summary, isSummarizing, setSummary, handleSaveArticle, dbOffline, savedArticles, user, triggerAuth }) => {
  const isSaved = summary?.article && savedArticles.some(s => s.url === summary.article.url);

  return (
    <AnimatePresence>
      {(summary || isSummarizing) && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSummary(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-[500px] bg-[#0b0f1a] border-l border-white/5 flex flex-col fixed right-0 top-0 h-screen z-50 shadow-[-20px_0_40px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-tp-accent/10 flex items-center justify-center text-tp-accent border border-tp-accent/20">
                   <Sparkles size={16} />
                 </div>
                 <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Intelligence Deep-Dive</h2>
              </div>
              <button 
                onClick={() => setSummary(null)} 
                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              {isSummarizing ? (
                 <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-50 px-12 text-center">
                    <div className="relative">
                       <div className="w-16 h-16 border-2 border-tp-accent/20 rounded-full animate-ping absolute" />
                       <div className="w-16 h-16 border-2 border-tp-accent border-t-transparent rounded-full animate-spin relative" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-white uppercase tracking-widest animate-pulse">Deep Intelligence Synthesis</p>
                       <p className="text-[9px] text-slate-500 font-bold leading-relaxed uppercase">Aggregating cross-domain signals and performing strategic technical audit...</p>
                    </div>
                 </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Article Identity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="px-2 py-1 bg-tp-accent/10 rounded text-[9px] font-black text-tp-accent uppercase">
                          {summary.article.relevanceScore || 70}% Match
                       </div>
                       <div className="px-2 py-1 bg-tp-indigo/10 rounded text-[9px] font-black text-tp-indigo uppercase">
                          {summary.article.impactHorizon || 'Market Shift'}
                       </div>
                    </div>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight italic">
                      {summary.article.cleanTitle || summary.article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Globe size={10} /> {summary.article.source}</span>
                       <span className="flex items-center gap-1.5"><Clock size={10} /> {new Date(summary.article.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Strategic Synthesis (The Core) */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Zap size={12} className="text-tp-accent" />
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strategic Synthesis</h4>
                    </div>
                    <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                       {Array.isArray(summary.summary) && summary.summary.length > 0 ? (
                         summary.summary.map((point, i) => (
                            <div key={i} className="flex gap-4 group">
                               <div className="mt-1.5 w-1 h-1 rounded-full bg-tp-accent shrink-0" />
                               <p className="text-xs text-slate-300 font-medium leading-relaxed">{point}</p>
                            </div>
                         ))
                       ) : (
                         <div className="flex gap-4 group">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-tp-accent shrink-0" />
                            <p className="text-xs text-slate-300 font-medium leading-relaxed italic opacity-50">
                               Refining strategic intelligence points...
                            </p>
                         </div>
                       )}
                    </div>
                  </div>

                  {/* Intelligence Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                       <h4 className="text-[9px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                         <TrendingUp size={10} className="text-emerald-400" />
                         Sentiment
                       </h4>
                       <div className="flex items-end gap-2">
                          <span className="text-3xl font-black text-white">{summary.sentiment_score}%</span>
                          <span className="text-[9px] font-black text-emerald-400 mb-1">BULLISH</span>
                       </div>
                    </div>
                    <div className="p-5 bg-tp-accent/5 border border-tp-accent/10 rounded-2xl space-y-3">
                       <h4 className="text-[9px] font-black text-tp-accent uppercase tracking-widest flex items-center gap-2">
                         <Activity size={10} />
                         Verdict
                       </h4>
                       <p className="text-[10px] text-slate-300 font-bold leading-snug line-clamp-2 italic">"{summary.impact_verdict}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {!isSummarizing && (
              <div className="p-8 border-t border-white/5 bg-[#0b0f1a] space-y-3">
                <button 
                  onClick={() => handleSaveArticle(summary.article)} 
                  disabled={dbOffline || isSaved}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-slate-200'}`}
                >
                   {isSaved ? <CheckCircle2 size={14} /> : <Bookmark size={14} />}
                   {isSaved ? 'Signal Saved' : 'Save Intelligence'}
                </button>
                <a 
                  href={summary.article.url} target="_blank" rel="noreferrer"
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
                >
                   <ExternalLink size={12} />
                   View Original Signal
                </a>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default SummarySidebar