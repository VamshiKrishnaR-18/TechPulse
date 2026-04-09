import React from 'react'
import { motion } from 'framer-motion'
import { 
  Zap, LayoutDashboard, TrendingUp, Sparkles, ArrowRight, 
  Shield, Activity, Target, Globe, Cpu, Layers, 
  Search, MessageSquare, Code, BarChart3, Database, 
  Terminal, Share2, Rocket
} from 'lucide-react'

const LandingPage = ({ onStart, user }) => {
  const navLinks = [
    { label: 'Feed', id: 'feed' },
    { label: 'Lab', id: 'analysis' },
    { label: 'Trends', id: 'trends' },
  ]
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
  }

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" }
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-tp-accent/30 overflow-x-hidden font-tp-sans">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-tp-accent/10 blur-[150px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-tp-indigo/10 blur-[130px] rounded-full"></div>
        <div className="absolute top-[30%] left-[25%] w-[2px] h-[40%] bg-gradient-to-b from-transparent via-tp-accent/20 to-transparent"></div>
        <div className="absolute top-[10%] right-[20%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-tp-indigo/20 to-transparent"></div>
      </div>

      {/* Nav Section */}
      <nav className="relative z-50 px-10 py-8 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-tp-accent/10 rounded-2xl flex items-center justify-center text-tp-accent border border-tp-accent/20 group-hover:rotate-12 transition-transform duration-500">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">TechPulse</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Market Insights</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map(link => (
            <button 
              key={link.id} 
              onClick={() => onStart(link.id)} 
              className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-tp-accent transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onStart}
            className="px-8 py-3 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-tp-accent hover:text-black transition-all active:scale-95"
          >
            {user ? 'Dashboard' : 'Explore'}
          </button>
        </div>
      </nav>

      {/* Hero: The Hook */}
      <section className="relative z-10 max-w-7xl mx-auto px-10 pt-28 pb-32">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center"
        >
          <div className="space-y-10 text-left">
            <motion.h2 variants={itemVariants} className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85]">
              Real-time <span className="text-transparent bg-clip-text bg-gradient-to-r from-tp-accent to-tp-indigo">Tech</span> <br />
              <span className="text-white">Insights</span>.
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg text-slate-400 font-medium max-w-xl leading-relaxed">
              TechPulse aggregates news and trends from GitHub, HackerNews, and Dev.to. Stay updated with AI summaries and visualizations.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8">
              <button 
                onClick={() => onStart('feed')}
                className="group px-12 py-6 bg-tp-accent text-black font-black uppercase text-xs tracking-[0.2em] rounded-[2rem] transition-all flex items-center gap-4 hover:scale-105 active:scale-95"
              >
                Start Exploring
                <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </div>

          <motion.div 
            variants={floatingVariants}
            animate="animate"
            className="relative hidden lg:block"
          >
            <div className="relative glass-card p-8 rounded-[3rem] border-white/5 bg-white/[0.02] space-y-8 overflow-hidden group">
               <div className="flex items-center justify-between">
                  <div className="text-[10px] font-black text-tp-accent uppercase tracking-widest">Active Signals</div>
                  <Activity size={16} className="text-tp-accent animate-pulse" />
               </div>
               <div className="space-y-4">
                  {[
                    { label: 'GitHub Trending', val: 'High Activity', color: 'text-emerald-400' },
                    { label: 'Market Sentiment', val: 'Bullish', color: 'text-tp-accent' },
                    { label: 'New Releases', val: '14 detected', color: 'text-tp-indigo' }
                  ].map((s, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.val}</span>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Unified Features & Sources Section */}
      <section id="ecosystem" className="relative z-10 py-32 bg-white/[0.01] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
             <div className="lg:col-span-1 space-y-6">
                <h3 className="text-[11px] font-black text-tp-accent uppercase tracking-[0.5em]">The Platform</h3>
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none text-white">Unified <span className="text-slate-500">Intelligence</span></h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs leading-relaxed">
                  We bridge the gap between raw developer signals and high-level market trends.
                </p>
                <div className="pt-8 grid grid-cols-2 gap-4 opacity-40 grayscale group-hover:opacity-100 transition-all">
                   <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase"><Globe size={14}/> GitHub</div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase"><MessageSquare size={14}/> Reddit</div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase"><Zap size={14}/> Dev.to</div>
                   <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase"><Share2 size={14}/> HackerNews</div>
                </div>
             </div>

             <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: LayoutDashboard, title: 'Strategic Feed', desc: 'AI-curated news from the best developer sources.' },
                  { icon: Zap, title: 'Analysis Lab', desc: 'Deep-dive into tech stacks, health, and roadmaps.' },
                  { icon: TrendingUp, title: 'Market Trends', desc: 'Real-time adoption and sentiment visualization.' },
                  { icon: Shield, title: 'Reading List', desc: 'Save and summarize articles for later research.' }
                ].map((f, i) => (
                  <div key={i} className="p-8 bg-[#0b0f1a] border border-white/5 rounded-[2.5rem] space-y-4 hover:border-tp-accent/30 transition-all group">
                     <div className="w-10 h-10 rounded-xl bg-tp-accent/10 flex items-center justify-center text-tp-accent group-hover:bg-tp-accent group-hover:text-black transition-all">
                        <f.icon size={18} />
                     </div>
                     <h4 className="text-sm font-black text-white uppercase italic">{f.title}</h4>
                     <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-widest">{f.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="lab" className="relative z-10 py-40 max-w-7xl mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="space-y-12">
             <div className="space-y-6">
                <h3 className="text-[11px] font-black text-tp-indigo uppercase tracking-[0.5em]">Features</h3>
                <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Research <span className="text-tp-indigo">Tools</span></h2>
                <p className="text-lg text-slate-400 font-medium leading-relaxed">
                  Deep-dive into any technology. Get a full report on ecosystem health, comparisons, and roadmaps.
                </p>
             </div>

             <div className="space-y-8">
                {[
                  { icon: Layers, title: 'Health Metrics', desc: 'Detailed breakdown of technology stability.' },
                  { icon: Share2, title: 'Comparison', desc: 'Evaluate two technologies side-by-side.' },
                  { icon: Terminal, title: 'Roadmaps', desc: 'AI-generated learning paths.' }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-12 h-12 bg-tp-indigo/10 rounded-2xl flex items-center justify-center text-tp-indigo shrink-0 group-hover:bg-tp-indigo group-hover:text-white transition-all">
                      <feature.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase italic text-white mb-2">{feature.title}</h4>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="relative">
             <div className="absolute inset-0 bg-tp-indigo/20 blur-[120px] rounded-full" />
             <div className="relative grid grid-cols-2 gap-6">
                <div className="space-y-6 pt-12">
                   <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] space-y-4 hover:border-tp-indigo/30 transition-all">
                      <BarChart3 className="text-tp-indigo" size={24} />
                      <div className="h-2 w-full bg-white/5 rounded-full" />
                      <div className="h-2 w-3/4 bg-tp-indigo/20 rounded-full" />
                   </div>
                   <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] space-y-4 hover:border-tp-indigo/30 transition-all">
                      <Database className="text-tp-indigo" size={24} />
                      <div className="h-2 w-full bg-white/5 rounded-full" />
                      <div className="h-2 w-1/2 bg-tp-indigo/20 rounded-full" />
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="glass-card p-8 rounded-[2.5rem] border-tp-indigo/30 bg-tp-indigo/5 space-y-4 shadow-2xl shadow-tp-indigo/10">
                      <Shield className="text-tp-indigo" size={24} />
                      <div className="text-[10px] font-black text-white uppercase">Security Audit Pass</div>
                      <div className="h-2 w-full bg-tp-indigo/20 rounded-full" />
                   </div>
                   <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] space-y-4 hover:border-tp-indigo/30 transition-all">
                      <Globe className="text-tp-indigo" size={24} />
                      <div className="h-2 w-full bg-white/5 rounded-full" />
                      <div className="h-2 w-2/3 bg-tp-indigo/20 rounded-full" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Global Intelligence Section */}
      <section id="trends" className="relative z-10 py-40 bg-[#0b0f1a]/50 border-y border-white/5">
         <div className="max-w-7xl mx-auto px-10 flex flex-col items-center text-center space-y-12">
            <div className="space-y-6 max-w-3xl">
               <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.5em]">Trends</h3>
               <h2 className="text-6xl font-black uppercase italic tracking-tighter">Market <span className="text-emerald-400">Trends</span></h2>
               <p className="text-lg text-slate-400 font-medium leading-relaxed">
                  Track adoption rates and developer sentiment across multiple categories.
               </p>
            </div>
            <div className="w-full h-80 bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 relative group overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-around px-20">
                  {[40, 70, 45, 90, 60, 80, 50, 65].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ duration: 1.5, delay: i * 0.1 }}
                      className="w-8 bg-gradient-to-t from-emerald-500/20 to-emerald-500/60 rounded-full"
                    />
                  ))}
               </div>
               <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent opacity-60" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <button 
                    onClick={() => onStart('trends')}
                    className="px-10 py-5 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    Enter Trends Engine
                  </button>
               </div>
            </div>
         </div>
      </section>

      {/* Call to Action: The Closer */}
      <section className="relative z-10 py-60 text-center">
         <div className="max-w-4xl mx-auto px-10 space-y-12">
            <h2 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-none">
               Get <br /> <span className="text-tp-accent">Started</span>.
            </h2>
            <p className="text-xl text-slate-400 font-bold uppercase tracking-[0.2em] max-w-2xl mx-auto">
               Join the platform and start exploring the tech ecosystem.
            </p>
            <button 
              onClick={() => onStart('feed')}
              className="px-16 py-8 bg-white text-black font-black uppercase text-sm tracking-[0.3em] rounded-[2.5rem] hover:bg-tp-accent hover:scale-110 transition-all shadow-[0_0_60px_rgba(255,255,255,0.15)] active:scale-95"
            >
               Open Dashboard
            </button>
         </div>
      </section>

      {/* Footer: Standard Legitimacy */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 py-24 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3">
              <Zap className="text-tp-accent" size={24} />
              <span className="text-xl font-black uppercase italic tracking-tighter">TechPulse</span>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase leading-relaxed tracking-widest">
              A modern news and market intelligence platform for software engineers.
            </p>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-slate-600">
             <button onClick={() => onStart('feed')} className="hover:text-tp-accent transition-colors">Market Feed</button>
             <button onClick={() => onStart('analysis')} className="hover:text-tp-accent transition-colors">Intelligence Lab</button>
             <button onClick={() => onStart('trends')} className="hover:text-tp-accent transition-colors">Global Trends</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-10 mt-24 pt-8 border-t border-white/5 flex justify-between items-center opacity-30">
           <span className="text-[9px] font-black uppercase tracking-widest">© 2026 TechPulse. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
