import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, CartesianGrid, LabelList } from 'recharts'
import { TrendingUp, Activity, BarChart3, Info, Zap, Globe, Cpu, Layers, ChevronDown } from 'lucide-react'

const GlobalTrends = ({ trends, category, setCategory }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const categories = [
    { id: 'languages', label: 'Languages', icon: <Zap size={14} /> },
    { id: 'frameworks', label: 'Frameworks', icon: <Layers size={14} /> },
    { id: 'frontend', label: 'Frontend', icon: <Activity size={14} /> },
    { id: 'backend', label: 'Backend', icon: <Cpu size={14} /> },
    { id: 'mobile', label: 'Mobile', icon: <Globe size={14} /> },
    { id: 'cloud', label: 'Cloud/DevOps', icon: <Layers size={14} /> },
    { id: 'database', label: 'Databases', icon: <Layers size={14} /> },
    { id: 'ai', label: 'AI/ML', icon: <Zap size={14} /> },
    { id: 'llm', label: 'LLMs/GenAI', icon: <Activity size={14} /> },
    { id: 'cybersecurity', label: 'Security', icon: <Globe size={14} /> },
    { id: 'web3', label: 'Web3', icon: <Cpu size={14} /> },
    { id: 'domains', label: 'Domains', icon: <TrendingUp size={14} /> },
    { id: 'industry_trends', label: 'Industry Trends', icon: <Activity size={14} /> }
  ]

  const currentCategory = categories.find(c => c.id === category) || categories[0]

  const normalizedTrends = useMemo(() => {
    return (trends || []).map(t => ({
      ...t,
      momentum: Number((t.momentum || 0).toFixed(1)),
      demand: Number((t.demand || 0).toFixed(1)),
      sentiment: Number((t.sentiment || 0).toFixed(1))
    }))
  }, [trends])

  const currentMomentum = useMemo(() => {
    return [...normalizedTrends].sort((a, b) => b.momentum - a.momentum)
  }, [normalizedTrends])

  const top5Trends = useMemo(() => {
    return [...normalizedTrends].sort((a, b) => b.score - a.score).slice(0, 5)
  }, [normalizedTrends])

  if (!normalizedTrends.length) {
    return <div className="flex items-center justify-center p-20 glass-card text-slate-500 font-black uppercase tracking-[0.2em]">Synchronizing Market Data...</div>
  }

  const leader = normalizedTrends[0]
  const fastest = currentMomentum[0]
  const avgDemand = (normalizedTrends.reduce((acc, item) => acc + item.demand, 0) / normalizedTrends.length).toFixed(1)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Globe className="text-tp-accent" size={22} />
            <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Global Market Intelligence</h2>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Current signals from developer usage, repo activity, and hiring demand</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="glass-card px-6 py-3 border-tp-accent/30 flex items-center gap-4 hover:border-tp-accent transition-all min-w-[220px]"
          >
            <div className="w-8 h-8 bg-tp-accent/10 rounded-lg flex items-center justify-center text-tp-accent">{currentCategory.icon}</div>
            <div className="text-left">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Insight</div>
              <div className="text-sm font-black text-white uppercase italic tracking-tighter">{currentCategory.label}</div>
            </div>
            <ChevronDown size={16} className={`text-slate-500 ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute top-full right-0 mt-3 w-64 glass-card border-white/10 p-2 z-[100] max-h-[400px] overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl ${category === cat.id ? 'bg-tp-accent/20 border border-tp-accent/30' : 'hover:bg-white/5 border border-transparent'}`}
                  >
                    <div className={`${category === cat.id ? 'text-tp-accent' : 'text-slate-500'}`}>{cat.icon}</div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${category === cat.id ? 'text-white' : 'text-slate-400'}`}>{cat.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-[2rem] relative group">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Current Leader</div>
          <div className="text-xl font-black text-white uppercase mt-2">{leader.techName}</div>
          <div className="text-sm font-black text-tp-accent mt-1">{leader.score.toFixed(1)}% adoption</div>
          
          {/* Tooltip */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-[#1e293b] border border-tp-accent/30 rounded-2xl shadow-2xl backdrop-blur-md">
                <p className="text-[9px] text-slate-300 font-bold leading-relaxed uppercase tracking-wide text-center">
                   Highest overall adoption share in the {currentCategory.label} market.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1e293b]"></div>
             </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] relative group">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fastest Rising Now</div>
          <div className="text-xl font-black text-white uppercase mt-2">{fastest.techName}</div>
          <div className="text-sm font-black text-emerald-400 mt-1">+{fastest.momentum.toFixed(1)} momentum</div>

          {/* Tooltip */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-[#1e293b] border border-emerald-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
                <p className="text-[9px] text-slate-300 font-bold leading-relaxed uppercase tracking-wide text-center">
                   Strongest week-over-week growth in developer interest and activity.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1e293b]"></div>
             </div>
          </div>
        </div>
        <div className="glass-card p-6 rounded-[2rem] relative group">
          <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Hiring Demand</div>
          <div className="text-xl font-black text-white uppercase mt-2">{avgDemand}%</div>
          <div className="text-sm font-black text-indigo-400 mt-1">{currentCategory.label} market</div>

          {/* Tooltip */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-4 bg-[#1e293b] border border-indigo-500/30 rounded-2xl shadow-2xl backdrop-blur-md">
                <p className="text-[9px] text-slate-300 font-bold leading-relaxed uppercase tracking-wide text-center">
                   Aggregated volume of job postings and recruitment signals for this sector.
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1e293b]"></div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-tp-accent" />
            <h3 className="text-[10px] font-black text-tp-accent uppercase tracking-[0.3em]">Adoption Share</h3>
          </div>
          <div className="h-[340px] min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedTrends} margin={{ bottom: 40 }}>
                <XAxis 
                  dataKey="techName" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} animationDuration={600}>
                  {normalizedTrends.map((entry, index) => <Cell key={entry.techName || index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-emerald-400" />
            <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Trending Tech Right Now</h3>
          </div>
          <div className="h-[340px] min-h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMomentum} margin={{ bottom: 40 }}>
                <XAxis 
                  dataKey="techName" 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800 }}
                />
                <Bar dataKey="momentum" radius={[8, 8, 0, 0]} fill="#10b981" animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={14} className="text-indigo-400" />
            <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Demand vs Sentiment</h3>
          </div>
          <div className="h-[320px] min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 40, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis type="number" dataKey="demand" name="Demand" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} label={{ value: 'Market Demand', position: 'bottom', fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <YAxis type="number" dataKey="sentiment" name="Sentiment" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} label={{ value: 'Developer Sentiment', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="glass-card p-3 border-tp-accent/30 bg-[#1e293b]/90 backdrop-blur-md">
                          <div className="text-[10px] font-black text-tp-accent uppercase mb-1">{data.techName}</div>
                          <div className="text-[9px] text-white font-bold">Demand: {data.demand}%</div>
                          <div className="text-[9px] text-white font-bold">Sentiment: {data.sentiment}%</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={normalizedTrends} fill="#38bdf8">
                   <LabelList dataKey="techName" position="top" style={{ fill: '#94a3b8', fontSize: 8, fontWeight: 800 }} />
                   {normalizedTrends.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={14} className="text-rose-400" />
            <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em]">Signal Composition</h3>
          </div>
          <div className="h-[320px] min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={top5Trends}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="techName" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} />
                <Radar name="Adoption" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                <Radar name="Demand" dataKey="demand" stroke="#ec4899" fill="#ec4899" fillOpacity={0.2} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-2 mb-3">
          <Info size={12} className="text-rose-400" />
          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Market Read</h4>
        </div>
        <p className="text-sm text-slate-300 font-bold leading-relaxed">
          {leader.techName} leads adoption in {currentCategory.label}, but {fastest.techName} shows the strongest real-time momentum.
          Prioritize near-term investment where high momentum and high demand overlap.
        </p>
      </div>
    </motion.div>
  )
}

export default GlobalTrends
