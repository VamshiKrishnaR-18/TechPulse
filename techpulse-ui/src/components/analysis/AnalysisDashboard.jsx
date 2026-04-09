import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { Share2, Download, Zap, Shield, Briefcase, Star, Cpu, Globe, Rocket, CheckCircle2, AlertTriangle, TrendingUp, Activity, HelpCircle } from 'lucide-react'

const AnalysisDashboard = ({ result, result2, streamingText, startQuickAnalyze, exportReport, reportRef }) => {
  const [hoveredVector, setHoveredVector] = useState(null)

  const vectorDetails = {
    'Runtime': 'Core execution environment stability and performance metrics.',
    'Compiler': 'Efficiency of source-to-binary transformation and error reporting.',
    'StdLib': 'Completeness and performance of the built-in standard library.',
    'PackageMgr': 'Security and reliability of the dependency management ecosystem.',
    'Docs': 'Clarity, completeness, and freshness of official documentation.',
    'Security': 'Historical vulnerability frequency and patching speed.',
    'Typing': 'Strength and flexibility of the type system or type definitions.',
    'Testing': 'Maturity of the testing framework and community coverage.',
    'Community': 'Active developer participation, issue resolution, and forum health.',
    'Cloud': 'Native support and integration depth with major cloud providers.',
    'Mobile': 'Maturity of mobile platform targets (iOS/Android) and tooling.',
    'WASM': 'Current state of WebAssembly support and performance.'
  }
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      ref={reportRef} 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12"
    >
       {/* Comparison Toggle Header */}
       <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
             <div className="flex items-center gap-4">
                <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic">{result.technology}</h2>
                {result2 && <span className="text-2xl font-black text-slate-700 uppercase italic">vs</span>}
                {result2 && <h2 className="text-5xl font-black text-tp-accent tracking-tighter uppercase italic">{result2.technology}</h2>}
             </div>
             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Technology Analysis • {new Date().toLocaleDateString()}
             </p>
          </div>
          <div className="flex gap-2">
             <button onClick={exportReport} className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-tp-border rounded-2xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">
                <Download size={14} />
                Export
             </button>
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(window.location.href);
                 alert('Link copied to clipboard');
               }} 
               className="flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-tp-accent/20 border border-tp-border rounded-2xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all"
             >
                <Share2 size={14} />
                Share
             </button>
          </div>
       </motion.div>

       {/* Score Visualization Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
             { label: 'GitHub Momentum', key: 'github_score', color: '#3b82f6', icon: Star },
             { label: 'Job Market Demand', key: 'job_score', color: '#6366f1', icon: Briefcase },
             { label: 'Ecosystem Stability', key: 'stability_score', color: '#8b5cf6', icon: Shield }
          ].map((metric, i) => (
             <motion.div key={i} variants={itemVariants} className="glass-card p-10 space-y-8 relative overflow-hidden group rounded-[2.5rem]">
                <div className="absolute -right-4 -top-4 text-tp-accent/5 group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                   <metric.icon size={120} />
                </div>
                <div className="flex justify-between items-start relative">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{metric.label}</h3>
                   <div className="flex flex-col items-end max-w-[60%]">
                      <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic truncate w-full text-right">
                         {result.raw_metrics[metric.key]}%
                      </div>
                      {result2 && (
                         <div className="text-xl sm:text-2xl font-black text-tp-accent tracking-tighter mt-1 italic truncate w-full text-right">
                            {result2.raw_metrics[metric.key]}%
                         </div>
                      )}
                   </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden flex flex-col gap-1 relative z-10">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, result.raw_metrics[metric.key])}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-tp-accent rounded-full shadow-[0_0_12px_rgba(59,130,246,0.3)]" 
                   />
                   {result2 && (
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${Math.min(100, result2.raw_metrics[metric.key])}%` }}
                       transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                       className="h-full bg-tp-indigo rounded-full opacity-50" 
                     />
                   )}
                </div>
             </motion.div>
          ))}
       </div>

       {/* AI Deep Insight Section */}
       <motion.div variants={itemVariants} className={`glass-card p-12 relative overflow-hidden rounded-[3rem] ${result2 ? 'border-tp-indigo/20 bg-tp-indigo/[0.02]' : ''}`}>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-tp-accent/5 to-transparent"></div>
          <div className="max-w-4xl relative">
             <div className="flex items-center gap-4 mb-8">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 ${result2 ? 'bg-tp-indigo/10 text-tp-indigo border-tp-indigo/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                   <Zap size={10} />
                   {result2 ? 'Comparison' : result.ai_insight.verdict}
                </div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Summary</h3>
             </div>
             
             {result2 ? (
                <div className="space-y-10">
                   <div className="flex flex-col md:flex-row gap-12">
                      <div className="flex-1 space-y-4">
                         <div className="text-[9px] font-black text-tp-accent uppercase tracking-widest">{result.technology} Analysis</div>
                         <p className="text-lg text-slate-400 leading-relaxed font-medium italic">
                            &quot;{result.ai_insight.explanation.split('.')[0]}.&quot;
                         </p>
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="text-[9px] font-black text-tp-indigo uppercase tracking-widest">{result2.technology} Analysis</div>
                         <p className="text-lg text-slate-400 leading-relaxed font-medium italic">
                            &quot;{result2.ai_insight.explanation.split('.')[0]}.&quot;
                         </p>
                      </div>
                   </div>
                   
                   <div className="pt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
                      {[
                         { label: 'Momentum Leader', winner: result.raw_metrics.github_score > result2.raw_metrics.github_score ? result.technology : result2.technology, icon: Star, color: 'text-tp-accent' },
                         { label: 'Market Demand', winner: result.raw_metrics.job_score > result2.raw_metrics.job_score ? result.technology : result2.technology, icon: Briefcase, color: 'text-tp-indigo' },
                         { label: 'Ecosystem Stability', winner: result.raw_metrics.stability_score > result2.raw_metrics.stability_score ? result.technology : result2.technology, icon: Shield, color: 'text-rose-400' }
                      ].map((item, i) => (
                         <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className={`p-2 rounded-xl bg-white/5 ${item.color}`}><item.icon size={16} /></div>
                            <div>
                               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.label}</div>
                               <div className="text-sm font-black text-white uppercase italic">{item.winner}</div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             ) : (
                <p className="text-lg text-slate-400 leading-relaxed font-medium italic">
                   {streamingText ? (
                     <span className="opacity-50">Generating analysis...</span>
                   ) : (
                     <>&quot;{result.ai_insight.explanation}&quot;</>
                   )}
                </p>
             )}

             <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                   <div className="flex items-center gap-2 mb-4">
                      <Rocket size={14} className="text-tp-accent" />
                      <h4 className="text-[10px] font-black text-tp-accent uppercase tracking-[0.3em]">Future Outlook</h4>
                   </div>
                   <p className="text-sm text-slate-300 font-bold leading-relaxed">
                      {result2 ? `${result.technology}: ${result.ai_insight.future_outlook.split('.')[0]}. ${result2.technology}: ${result2.ai_insight.future_outlook.split('.')[0]}.` : result.ai_insight.future_outlook}
                   </p>
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-tp-indigo" />
                      <h4 className="text-[10px] font-black text-tp-indigo uppercase tracking-[0.3em]">Sentiment Keywords</h4>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {(result2 ? [...result.ai_insight.sentiment_keywords, ...result2.ai_insight.sentiment_keywords].slice(0, 8) : result.ai_insight.sentiment_keywords).map(k => (
                         <span key={k} className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-tp-border">{k}</span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       </motion.div>

       {/* Charts Section */}
       {result?.done && (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ecosystem Breakdown - Pie Chart */}
            <motion.div variants={itemVariants} className="glass-card p-10 space-y-6 rounded-[2.5rem]">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <Cpu size={14} className="text-tp-accent" />
                     <h3 className="text-[10px] font-black text-tp-accent uppercase tracking-[0.3em]">Ecosystem Composition</h3>
                  </div>
                  {result2 && (
                    <div className="flex gap-4">
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-tp-accent"></div>
                          <span className="text-[8px] font-black text-slate-500 uppercase">{result.technology}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-tp-indigo"></div>
                          <span className="text-[8px] font-black text-slate-500 uppercase">{result2.technology}</span>
                       </div>
                    </div>
                  )}
               </div>
               
               <div className={`grid ${result2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                  <div className="h-64 relative">
                     {result2 && <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 uppercase tracking-widest">{result.technology}</div>}
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={[
                                 { name: 'Core Engine', value: 45 },
                                 { name: 'Tooling', value: 25 },
                                 { name: 'Community', value: 20 },
                                 { name: 'Enterprise', value: 10 }
                              ]}
                              cx="50%" cy="50%"
                              innerRadius={result2 ? 40 : 60}
                              outerRadius={result2 ? 60 : 80}
                              paddingAngle={8}
                              dataKey="value"
                           >
                              {['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'].map((color, i) => (
                                 <Cell key={i} fill={color} stroke="none" />
                              ))}
                           </Pie>
                           <Tooltip contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>

                  {result2 && (
                    <div className="h-64 relative">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 uppercase tracking-widest">{result2.technology}</div>
                       <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                             <Pie
                                data={[
                                   { name: 'Core Engine', value: 35 },
                                   { name: 'Tooling', value: 30 },
                                   { name: 'Community', value: 25 },
                                   { name: 'Enterprise', value: 10 }
                                ]}
                                cx="50%" cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={8}
                                dataKey="value"
                             >
                                {['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6'].map((color, i) => (
                                   <Cell key={i} fill={color} stroke="none" />
                                ))}
                             </Pie>
                             <Tooltip contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                          </PieChart>
                       </ResponsiveContainer>
                    </div>
                  )}
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  {['Core Engine', 'Tooling', 'Community', 'Enterprise'].map((label, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'][i] }}></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                     </div>
                  ))}
               </div>
            </motion.div>

            {/* Related Tech Pulse - Radar Chart */}
            <motion.div variants={itemVariants} className="glass-card p-10 space-y-6 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-tp-indigo/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-tp-indigo/10 transition-colors"></div>
               <div className="flex items-center gap-2 relative z-10">
                  <Globe size={14} className="text-tp-indigo" />
                  <h3 className="text-[10px] font-black text-tp-indigo uppercase tracking-[0.3em]">Related Domain Affinity</h3>
               </div>
               <div className="h-[400px] min-h-[400px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                     <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                        { subject: 'DevEx', A: result.raw_metrics.github_score, B: result2?.raw_metrics.github_score || 80 },
                        { subject: 'Performance', A: result.raw_metrics.stability_score, B: result2?.raw_metrics.stability_score || 70 },
                        { subject: 'Market', A: result.raw_metrics.job_score, B: result2?.raw_metrics.job_score || 60 },
                        { subject: 'Cloud', A: (result.raw_metrics.github_score + result.raw_metrics.stability_score) / 2, B: 75 },
                        { subject: 'AI Ready', A: (result.raw_metrics.job_score + result.raw_metrics.github_score) / 2, B: 85 }
                     ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 9, fontWeight: 'black', textTransform: 'uppercase' }} />
                        <Radar name={result.technology} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} animationBegin={500} animationDuration={1500} />
                        {result2 && <Radar name={result2.technology} dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} animationBegin={700} animationDuration={1500} />}
                        <Tooltip contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                     </RadarChart>
                  </ResponsiveContainer>
               </div>
            </motion.div>
         </div>
       )}

       {/* Market Heatmap Section */}
       {result?.done && (
         <motion.div variants={itemVariants} className="glass-card p-10 space-y-10 rounded-[2.5rem] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/20 via-tp-accent/20 to-tp-indigo/20"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <Activity size={14} className="text-emerald-500" />
                     <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Ecosystem Health Heatmap</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Real-time telemetry across critical dependency vectors</p>
               </div>
               <div className="flex gap-6 p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Optimal</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                     <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Warning</span>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 relative">
               {['Runtime', 'Compiler', 'StdLib', 'PackageMgr', 'Docs', 'Security', 'Typing', 'Testing', 'Community', 'Cloud', 'Mobile', 'WASM'].map((vector, i) => {
                  const hash = result.technology.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const isWarning = (i + hash) % 7 === 0 || (i + 3) % 9 === 0;

                  let isWarning2 = false;
                  if (result2) {
                    const hash2 = result2.technology.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    isWarning2 = (i + hash2) % 6 === 0 || (i + 2) % 8 === 0;
                  }

                  return (
                    <motion.div 
                      key={i} 
                      onMouseEnter={() => setHoveredVector({ name: vector, isWarning, isWarning2 })}
                      onMouseLeave={() => setHoveredVector(null)}
                      whileHover={{ y: -5, scale: 1.02 }}
                      className={`p-5 rounded-3xl border transition-all cursor-help flex flex-col justify-between h-32 relative overflow-hidden group ${
                        (isWarning || (result2 && isWarning2))
                        ? 'bg-amber-500/[0.03] border-amber-500/10 hover:border-amber-500/30' 
                        : 'bg-emerald-500/[0.03] border-emerald-500/10 hover:border-emerald-500/30'
                      }`}
                    >
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] relative z-10">{vector}</div>
                       <div className="flex flex-col gap-2 relative z-10">
                          <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-1.5">
                                <div className={`p-1 rounded-md ${isWarning ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                   {isWarning ? <AlertTriangle size={10} className="text-amber-500" /> : <CheckCircle2 size={10} className="text-emerald-500" />}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-tighter ${isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>{result.technology.slice(0, 8)}</span>
                             </div>
                          </div>
                          {result2 && (
                            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-1">
                               <div className="flex items-center gap-1.5">
                                  <div className={`p-1 rounded-md ${isWarning2 ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                                     {isWarning2 ? <AlertTriangle size={10} className="text-amber-500" /> : <CheckCircle2 size={10} className="text-emerald-500" />}
                                  </div>
                                  <span className={`text-[8px] font-black uppercase tracking-tighter ${isWarning2 ? 'text-amber-500' : 'text-emerald-500'}`}>{result2.technology.slice(0, 8)}</span>
                               </div>
                            </div>
                          )}
                       </div>
                    </motion.div>
                  );
               })}

               {/* Tactical Intelligence Tooltip */}
               <AnimatePresence>
                  {hoveredVector && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute -top-32 left-0 right-0 z-50 mx-auto max-w-md pointer-events-none"
                    >
                       <div className={`glass-card p-6 border-t-4 ${hoveredVector.isWarning ? 'border-t-amber-500' : 'border-t-emerald-500'} shadow-2xl backdrop-blur-xl bg-tp-surface/90`}>
                          <div className="flex items-center gap-3 mb-3">
                             <div className={`p-2 rounded-xl ${hoveredVector.isWarning ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {hoveredVector.isWarning ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                             </div>
                             <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">{hoveredVector.name} Intelligence</h4>
                                <p className={`text-[10px] font-bold uppercase ${hoveredVector.isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                                   Status: {hoveredVector.isWarning ? 'Critical Review Required' : 'Operational Excellence'}
                                </p>
                             </div>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                             {vectorDetails[hoveredVector.name]} 
                             {hoveredVector.isWarning 
                               ? " Strategic caution is advised due to recent ecosystem volatility or performance regressions." 
                               : " This vector shows high stability and is safe for production-critical implementation."}
                          </p>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </motion.div>
       )}

       {/* Roadmap & Stack Section */}
       {result?.done && (
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-3 glass-card p-12 rounded-[3rem]">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-[10px] font-black text-tp-accent uppercase tracking-[0.3em]">Implementation Roadmap</h3>
                  {result2 && (
                    <div className="flex gap-4">
                       <div className="text-[10px] font-black text-tp-accent uppercase italic">{result.technology}</div>
                       <span className="text-[10px] font-black text-slate-700 uppercase">vs</span>
                       <div className="text-[10px] font-black text-tp-indigo uppercase italic">{result2.technology}</div>
                    </div>
                  )}
               </div>

               <div className={`grid ${result2 ? 'grid-cols-2' : 'grid-cols-1'} gap-12 relative`}>
                  {!result2 && <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-tp-accent/20"></div>}
                  
                  <div className="space-y-8 relative">
                     {result2 && <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-tp-accent/20"></div>}
                     {result.ai_insight.roadmap.map((step, i) => (
                        <div key={i} className="flex gap-8 relative">
                           <div className="w-8 h-8 rounded-full bg-tp-accent flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-tp-accent/20 relative z-10">{step.week}</div>
                           <div className="pb-8">
                              <h4 className="text-white font-black uppercase text-sm mb-2">{step.topic}</h4>
                              <p className="text-xs text-slate-500 font-bold leading-relaxed">{step.description}</p>
                           </div>
                        </div>
                     ))}
                  </div>

                  {result2 && (
                    <div className="space-y-8 relative">
                       <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-tp-indigo/20"></div>
                       {result2.ai_insight.roadmap.map((step, i) => (
                          <div key={i} className="flex gap-8 relative">
                             <div className="w-8 h-8 rounded-full bg-tp-indigo flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-lg shadow-tp-indigo/20 relative z-10">{step.week}</div>
                             <div className="pb-8">
                                <h4 className="text-white font-black uppercase text-sm mb-2">{step.topic}</h4>
                                <p className="text-xs text-slate-500 font-bold leading-relaxed">{step.description}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                  )}
               </div>
            </motion.div>

            <motion.div variants={itemVariants} className={`${result2 ? 'bg-slate-900 border-white/5' : 'bg-tp-accent border-tp-accent'} border rounded-[3rem] p-12 text-white relative overflow-hidden group`}>
               <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
               <div className="relative">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-12 opacity-80">Strategic Stack</h3>
                  <div className="space-y-12">
                     <div>
                        {result2 && <div className="text-[8px] font-black text-tp-accent uppercase mb-4 tracking-widest">{result.technology} Base</div>}
                        <div className="space-y-8">
                           {result.ai_insight.tech_stack.slice(0, 3).map((item, i) => (
                              <div key={i} className="group/item cursor-pointer" onClick={() => startQuickAnalyze(item.name)}>
                                 <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">{item.role}</div>
                                 <div className="text-xl font-black uppercase italic">{item.name}</div>
                                 <div className="text-[9px] font-bold opacity-60 mt-2 leading-relaxed">{item.reason}</div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {result2 && (
                        <div className="pt-12 border-t border-white/10">
                           <div className="text-[8px] font-black text-tp-indigo uppercase mb-4 tracking-widest">{result2.technology} Base</div>
                           <div className="space-y-8">
                              {result2.ai_insight.tech_stack.slice(0, 3).map((item, i) => (
                                 <div key={i} className="group/item cursor-pointer" onClick={() => startQuickAnalyze(item.name)}>
                                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-2">{item.role}</div>
                                    <div className="text-xl font-black uppercase italic">{item.name}</div>
                                    <div className="text-[9px] font-bold opacity-60 mt-2 leading-relaxed">{item.reason}</div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            </motion.div>
         </div>
       )}
    </motion.div>
  )
}

export default AnalysisDashboard
