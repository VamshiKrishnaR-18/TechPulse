import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Bookmark, User, Globe } from 'lucide-react'

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
  visibleCount = 12,
  onLoadMore
}) => {
  const [sourceFilter, setSourceFilter] = useState('All')
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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  const filteredBySource = useMemo(() => {
    if (sourceFilter === 'All') return feed
    if (sourceFilter === 'Reddit') return feed.filter(f => typeof f.source === 'string' && f.source.startsWith('r/'))
    return feed.filter(f => f.source === sourceFilter)
  }, [feed, sourceFilter])

  const visibleItems = useMemo(() => filteredBySource.slice(0, visibleCount), [filteredBySource, visibleCount])

  return (
    <div className="space-y-8">
       <div className="flex items-end justify-between border-b border-tp-border pb-4 gap-6 flex-wrap">
          <div className="flex gap-8">
             {['For You', 'Trending', 'Recent'].map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveFeedTab(t)} 
                  className={`text-xs font-black uppercase tracking-widest transition-all pb-4 -mb-4 border-b-2 relative ${activeFeedTab === t ? 'text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}
                >
                   {t}
                   {activeFeedTab === t && (
                     <motion.div 
                       layoutId="activeTab" 
                       className="absolute bottom-0 left-0 right-0 h-0.5 bg-tp-accent"
                     />
                   )}
                </button>
             ))}
          </div>
          <div className="flex-1 flex items-center gap-3 min-w-[280px]">
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search topics, sources, tags…"
              className="flex-1 bg-[#0f1420] border border-white/5 rounded-2xl px-4 py-2.5 text-[12px] font-bold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-tp-accent/30"
            />
            {suggestedQuery && (
              <button
                onClick={() => onApplySuggestion?.()}
                className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-tp-accent/10 text-tp-accent hover:bg-tp-accent/20"
                title="Apply AI suggestion"
              >
                Try “{suggestedQuery}”
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {['All', 'GitHub', 'Dev.to', 'HackerNews', 'Reddit'].map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl transition-all ${sourceFilter === src ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                title={src}
              >
                {src}
              </button>
            ))}
          </div>
       </div>

       <motion.div 
         variants={container}
         initial="hidden"
         animate="show"
         className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
       >
          {visibleItems.map((item, i) => (
             <motion.div 
                key={item.id || i} 
                variants={itemVariants}
                viewport={{ amount: 0.2, once: true }}
                onClick={() => handleSummarize(item)} 
                className="glass-card glass-card-hover p-6 flex flex-col h-[420px] cursor-pointer relative overflow-hidden group"
             >
                <div className="absolute top-4 right-4 z-10">
                   <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                     <Globe size={8} />
                     {item.source}
                   </div>
                </div>
                <div className="h-48 -mx-6 -mt-6 mb-6 overflow-hidden bg-black/20 flex items-center justify-center relative">
                   {item.image ? (
                      <img src={item.image} loading="lazy" decoding="async" alt={item.title || 'news image'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0f1420] to-[#0b1020]">
                        <div className="text-4xl opacity-20 group-hover:scale-125 transition-transform duration-700">
                          {typeof item.source === 'string' && item.source.startsWith('r/') ? '👽' : '📰'}
                        </div>
                      </div>
                   )}
                   <div className="absolute inset-0 bg-gradient-to-t from-tp-surface to-transparent opacity-60"></div>
                </div>
                <div className="flex-1 flex flex-col">
                   <div className="flex gap-2 mb-3">
                      {item.tags?.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[8px] font-black text-tp-accent uppercase tracking-widest"># {tag}</span>
                      ))}
                   </div>
                   <h3 className="text-lg font-black text-white leading-tight group-hover:text-tp-accent transition-colors line-clamp-2 mb-2">{item.title}</h3>
                   <p className="text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-3 mb-2">{item.description || 'No description available.'}</p>
                   <div className="mt-auto flex items-center justify-between pt-6 border-t border-tp-border">
                      <div className="flex items-center gap-2">
                         <button onClick={(e) => {e.stopPropagation(); handleSummarize(item)}} className="flex items-center gap-2 px-4 py-2 bg-tp-accent hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-tp-accent/20">
                            <Sparkles size={10} />
                            AI SUMMARY
                         </button>
                         <a
                           href={item.url}
                           onClick={(e) => e.stopPropagation()}
                           target="_blank"
                           rel="noreferrer"
                           className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest px-2"
                           title="Open original"
                         >
                           Read
                         </a>
                         <button 
                           onClick={(e) => {e.stopPropagation(); handleSaveArticle(item)}} 
                           disabled={dbOffline}
                           className={`p-2 rounded-xl border transition-all ${dbOffline ? 'opacity-20 cursor-not-allowed' : ''} ${savedArticles.some(s => s.url === item.url) ? 'bg-tp-accent border-tp-accent text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                           title={dbOffline ? "Saving unavailable in offline mode" : "Save for later"}
                         >
                            <Bookmark size={14} fill={savedArticles.some(s => s.url === item.url) ? "currentColor" : "none"} />
                         </button>
                      </div>
                      <div className="text-right">
                         <div className="text-[8px] font-black text-slate-600 uppercase mb-0.5 flex items-center justify-end gap-1">
                           <User size={8} />
                           Author
                         </div>
                         <div className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{item.author}</div>
                      </div>
                   </div>
                </div>
             </motion.div>
          ))}
       </motion.div>
       <div className="flex items-center justify-center pt-2">
         {visibleItems.length < filteredBySource.length ? (
           <button
             onClick={() => onLoadMore?.()}
             className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300"
           >
             Load More
           </button>
         ) : (
           <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">End of Feed</div>
         )}
       </div>
    </div>
  )
}

export default NewsFeed
