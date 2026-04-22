import React, { useMemo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, CartesianGrid, LabelList } from 'recharts'
import { TrendingUp, Activity, BarChart3, Info, Zap, Globe, Cpu, Layers, ChevronDown } from 'lucide-react'

const GlobalTrends = ({ trends, category, setCategory }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-12">
      {/* 1. Market Overview Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-tp-accent/10 rounded-2xl flex items-center justify-center text-tp-accent border border-tp-accent/20">
               <Globe size={20} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Market Intel</h2>
          </div>
          <p className="text-slate-500 font-bold uppercase text-[9px] tracking-[0.2em] ml-1">Real-time developer signals & industry activity</p>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="glass-card px-5 py-2.5 border-white/10 flex items-center gap-4 hover:border-tp-accent/40 transition-all min-w-[200px]"
          >
            <div className="text-tp-accent">{currentCategory.icon}</div>
            <div className="text-left">
              <div className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Category</div>
              <div className="text-[12px] font-black text-white uppercase italic tracking-tighter">{currentCategory.label}</div>
            </div>
            <ChevronDown size={14} className={`text-slate-500 ml-auto transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${category === cat.id ? 'bg-tp-accent/20 border border-tp-accent/30' : 'hover:bg-white/5 border border-transparent'}`}
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

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem] relative group border-tp-accent/20 bg-tp-accent/5">
          <div className="text-[9px] font-black text-tp-accent uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <TrendingUp size={12} /> Market Leader
          </div>
          <div className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{leader.techName}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             Dominating {currentCategory.label} • {leader.score.toFixed(1)}% Score
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] relative group border-emerald-500/20 bg-emerald-500/5">
          <div className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <Zap size={12} /> Rising Star
          </div>
          <div className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{fastest.techName}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
             Accelerating Momentum • +{fastest.momentum.toFixed(1)} Rate
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] relative group border-indigo-500/20 bg-indigo-500/5">
          <div className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <Activity size={12} /> Industry Demand
          </div>
          <div className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">{avgDemand}%</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Avg hiring signal in this sector
          </div>
        </div>
      </div>

      {/* 3. The Core Market Read */}
      <div className="glass-card p-10 rounded-[3rem] border border-white/5 bg-gradient-to-br from-tp-accent/10 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
           <div>
              <div className="text-[10px] font-black text-tp-accent uppercase tracking-[0.3em] mb-3">AI Market Verdict</div>
              <h3 className="text-2xl font-black text-white leading-tight uppercase italic tracking-tighter">
                 {leader.techName} leads adoption, but {fastest.techName} is the current momentum play.
              </h3>
           </div>
           <div className="shrink-0 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Signal Confidence</div>
              <div className="text-lg font-black text-emerald-400">HIGH (98%)</div>
           </div>
        </div>
        <p className="text-base text-slate-400 font-bold leading-relaxed max-w-4xl italic">
          Prioritize {fastest.techName} for near-term technical exploration where momentum and demand overlap. 
          {leader.techName} remains the strategic benchmark for stable {currentCategory.label} projects.
        </p>
      </div>

      {/* 4. Visual Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-tp-accent/10 rounded-xl flex items-center justify-center text-tp-accent">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Market Adoption</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Combined share of active usage</p>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={normalizedTrends} margin={{ bottom: 40 }}>
                <XAxis 
                  dataKey="techName" 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={32} animationDuration={1000}>
                  {normalizedTrends.map((entry, index) => <Cell key={entry.techName || index} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                <TrendingUp size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Momentum Pulse</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Growth velocity in developer interest</p>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentMomentum} margin={{ bottom: 40 }}>
                <XAxis 
                  dataKey="techName" 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} 
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Bar dataKey="momentum" radius={[6, 6, 0, 0]} barSize={32} fill="#10b981" animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default GlobalTrends
