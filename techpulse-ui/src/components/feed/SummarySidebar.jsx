import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, TrendingUp, Info, ExternalLink, Bookmark, CheckCircle2, Zap, Activity, ShieldAlert, Target, Globe } from 'lucide-react'

const SummarySidebar = ({ summary, isSummarizing, setSummary, handleSaveArticle, dbOffline, savedArticles }) => {
  const isSaved = summary?.article && savedArticles.some(s => s.url === summary.article.url);

  return (
    <AnimatePresence>
      {(summary || isSummarizing) && (
        <motion.aside 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-[520px] bg-[#0b0f1a]/98 backdrop-blur-3xl border-l border-white/5 flex flex-col p-10 fixed right-0 top-0 h-screen overflow-y-auto z-50 shadow-[-30px_0_60px_rgba(0,0,0,0.8)] custom-scrollbar"
        >
           <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-tp-accent/10 flex items-center justify-center text-tp-accent border border-tp-accent/20">
                   <Sparkles size={18} className="animate-pulse" />
                 </div>
                 <div>
                    <h2 className="text-[10px] font-black text-tp-accent uppercase tracking-[0.4em] mb-1">AI Summary</h2>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Key takeaways and analysis</p>
                 </div>
              </div>
              <motion.button 
                whileHover={{ rotate: 90, scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSummary(null)} 
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"
              >
                <X size={20} />
              </motion.button>
           </div>

           {isSummarizing ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                 <div className="relative">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-28 h-28 border-2 border-tp-accent/10 rounded-[2.5rem]" 
                    />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="absolute inset-0 w-28 h-28 border-2 border-tp-accent border-t-transparent border-r-transparent rounded-[2.5rem]" 
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-tp-accent">
                       <Zap size={32} className="animate-pulse" />
                    </div>
                 </div>
                 <div className="text-center">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-2">Analyzing</p>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Summarizing key points...</p>
                 </div>
              </div>
           ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-10"
              >
                 <div className="space-y-6">
                    <h3 className="text-3xl font-black text-white tracking-tighter uppercase leading-tight italic decoration-tp-accent underline-offset-8 underline decoration-4">{summary.article.title}</h3>
                    <div className="flex items-center gap-4">
                       <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                          <Globe size={10} className="text-tp-accent" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{summary.article.source}</span>
                       </div>
                       <div className="flex items-center gap-2 text-slate-600">
                          <Activity size={10} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{new Date(summary.article.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8">
                    {/* Key Technical Concepts (Replacing Sentiment Cloud) */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-2">
                          <Target size={14} className="text-tp-indigo" />
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Technical Domain Tags</h4>
                       </div>
                       <div className="flex flex-wrap gap-2">
                          {(summary.key_concepts || summary.summary[0].split(' ').slice(0, 6)).map((word, i) => (
                             <motion.span 
                               key={i} 
                               whileHover={{ y: -2, backgroundColor: 'rgba(96, 165, 250, 0.15)' }}
                               className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-default ${i % 2 === 0 ? 'bg-tp-indigo/10 border-tp-indigo/20 text-tp-indigo' : 'bg-white/5 border-white/10 text-slate-400'}`}
                             >
                                {word.replace(/[^a-zA-Z\s]/g, '')}
                             </motion.span>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Sparkles size={12} className="text-tp-accent" />
                          Key Points
                       </h4>
                       <div className="space-y-4 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8">
                          {summary.summary.map((point, i) => (
                             <motion.div 
                               initial={{ opacity: 0, x: 10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: 0.3 + i * 0.1 }}
                               key={i} 
                               className="flex gap-5 group"
                             >
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-tp-accent shadow-[0_0_8px_rgba(56,189,248,0.8)] group-hover:scale-150 transition-transform shrink-0" />
                                <p className="text-sm text-slate-300 font-bold leading-relaxed group-hover:text-white transition-colors">{point}</p>
                             </motion.div>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4 group hover:bg-white/10 transition-all">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-400" />
                            Sentiment
                          </h4>
                          <div className="flex items-end gap-2">
                             <div className="text-5xl font-black text-white tracking-tighter">{summary.sentiment_score}%</div>
                             <div className={`text-[10px] font-black uppercase mb-2 ${summary.sentiment_score > 60 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {summary.sentiment_score > 60 ? 'Bullish' : 'Neutral'}
                             </div>
                          </div>
                       </div>
                       <div className="p-8 bg-tp-accent/5 rounded-[2rem] border border-tp-accent/10 space-y-4 group hover:bg-tp-accent/10 transition-all relative overflow-hidden">
                          <h4 className="text-[10px] font-black text-tp-accent uppercase tracking-widest flex items-center gap-2">
                            <Activity size={12} />
                            Verdict
                          </h4>
                          <p className="text-[11px] text-slate-200 font-bold leading-relaxed italic">{summary.impact_verdict}</p>
                       </div>
                    </div>

                    {/* New Risks Section */}
                    {summary.risks && summary.risks.length > 0 && (
                       <div className="p-8 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 space-y-4">
                          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                             <ShieldAlert size={14} />
                             Potential Challenges
                          </h4>
                          <ul className="space-y-2">
                             {summary.risks.map((risk, i) => (
                                <li key={i} className="text-[11px] text-slate-400 font-bold leading-relaxed flex items-start gap-2">
                                   <span className="text-rose-400/50 mt-1">•</span>
                                   {risk}
                                </li>
                             ))}
                          </ul>
                       </div>
                    )}

                    {summary.techMetrics && (
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-10 bg-gradient-to-br from-tp-indigo to-tp-accent rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-tp-accent/20 relative overflow-hidden group"
                      >
                         <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                         <div className="relative">
                            <div className="flex justify-between items-start mb-8">
                               <div>
                                  <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Ecosystem Vitality</h4>
                                  <div className="text-2xl font-black uppercase italic tracking-tighter">{summary.main_tech}</div>
                               </div>
                               <div className="text-4xl font-black italic">{summary.techMetrics.github_score}%</div>
                            </div>
                            <div className="space-y-4">
                               <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${summary.techMetrics.github_score}%` }}
                                    transition={{ duration: 1.5, delay: 0.6 }}
                                    className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                                  />
                               </div>
                               <p className="text-[10px] font-bold opacity-80 leading-relaxed italic">Market telemetry confirms high institutional and developer interest in {summary.main_tech} ecosystem.</p>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </div>

                 <div className="pt-12 mt-auto border-t border-tp-border space-y-4">
                    <button 
                      onClick={() => handleSaveArticle(summary.article)} 
                      disabled={dbOffline || isSaved}
                      className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isSaved ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-slate-200 shadow-xl shadow-white/5'}`}
                    >
                       {isSaved ? <CheckCircle2 size={16} /> : <Bookmark size={16} />}
                       {isSaved ? 'Saved' : 'Save Article'}
                    </button>
                    <a 
                      href={summary.article.url} target="_blank" rel="noreferrer"
                      className="w-full py-5 bg-white/5 hover:bg-white/10 border border-tp-border rounded-2xl text-[10px] font-black text-slate-400 hover:text-white flex items-center justify-center gap-2 uppercase tracking-widest transition-all"
                    >
                       <ExternalLink size={14} />
                       Read Full Source
                    </a>
                 </div>
              </motion.div>
           )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

export default SummarySidebar
