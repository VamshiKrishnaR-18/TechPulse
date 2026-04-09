import React, { useState, useEffect } from 'react'
import { Zap, Activity } from 'lucide-react'

const Header = ({ activeTab, setActiveTab }) => {
  const [pulseTech, setPulseTech] = useState('React')
  
  useEffect(() => {
    const techs = ['Rust', 'LLMs', 'Next.js', 'Go', 'PyTorch', 'Vue 3.5', 'Bun', 'Vite']
    let i = 0
    const interval = setInterval(() => {
      setPulseTech(techs[i])
      i = (i + 1) % techs.length
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="px-8 py-4 flex justify-between items-center sticky top-0 bg-tp-dark/90 backdrop-blur-md z-30 border-b border-tp-border">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 bg-tp-accent/10 rounded-xl flex items-center justify-center text-tp-accent border border-tp-accent/20">
            <Zap size={20} />
         </div>
         <div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">TechPulse</h1>
            <div className="flex items-center gap-2">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Market Intelligence v2.5</p>
               <span className="w-1 h-1 rounded-full bg-slate-800"></span>
               <div className="flex items-center gap-1.5 overflow-hidden h-3">
                  <Activity size={8} className="text-emerald-500 shrink-0" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse whitespace-nowrap">
                     Pulse: {pulseTech} Trending
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-center gap-6">
         <div className="flex gap-4">
            {['feed', 'analysis', 'trends'].map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-tp-accent' : 'text-slate-500 hover:text-white'}`}
               >
                  {tab}
               </button>
            ))}
         </div>
      </div>
    </header>
  )
}

export default Header
