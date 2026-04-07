import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar, Legend } from 'recharts'
import html2canvas from 'html2canvas'

function App() {
  const [tech, setTech] = useState('')
  const [tech2, setTech2] = useState('')
  const [isVersus, setIsVersus] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [result2, setResult2] = useState(null)
  const [error, setError] = useState(null)
  const [streamingText, setStreamingText] = useState('')
  const [streamingText2, setStreamingText2] = useState('')
  const [history, setHistory] = useState([])
  const [feed, setFeed] = useState([])
  const [pulseIndex, setPulseIndex] = useState(0)
  const [savedArticles, setSavedArticles] = useState([])
  const [trends, setTrends] = useState([])
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('tp_token'))
  const [authMode, setAuthMode] = useState(null)
  const [authData, setAuthData] = useState({ email: '', password: '' })
  const [activeTab, setActiveTab] = useState('feed')
  const [activeFeedTab, setActiveFeedTab] = useState('For You')
  const [summary, setSummary] = useState(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [dbOffline, setDbOffline] = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    fetchFeed()
    fetchAnalytics()
    fetchHistory()
    if (token) fetchSavedArticles()

    const ticker = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % (feed.length || 1))
    }, 8000)
    return () => clearInterval(ticker)
  }, [token, feed.length])

  const fetchFeed = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/feed')
      const data = await res.json()
      if (data.success) setFeed(data.feed)
    } catch (e) { console.error("Feed fetch failed") }
  }

  const fetchSavedArticles = async () => {
    if (!token) return
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/saved-articles?token=${token}`)
      const data = await res.json()
      if (data.success) {
        setSavedArticles(data.articles)
        setDbOffline(false)
      } else if (data.error === "Database offline") {
        setDbOffline(true)
      }
    } catch (e) { console.error("Saved articles fetch failed") }
  }

  const handleSaveArticle = async (article) => {
    if (!token) { setAuthMode('signup'); return }
    try {
      const res = await fetch('http://127.0.0.1:5000/api/save-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, token })
      })
      const data = await res.json()
      if (data.success) fetchSavedArticles()
      else setError(data.message)
    } catch (e) { setError("Save failed") }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/history${token ? `?token=${token}` : ''}`)
      const data = await res.json()
      if (data.success) {
        setHistory(data.history)
        if (data.error === "Database offline") setDbOffline(true)
        else setDbOffline(false)
      }
    } catch (e) { console.error("History fetch failed") }
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/metrics')
      const data = await res.json()
      if (data.success) {
        setTrends(data.trends.map(t => ({ name: t.techName, score: t.metrics.github_score })))
        setDbOffline(false)
      } else {
        setDbOffline(true)
      }
    } catch (e) { console.error("Analytics fetch failed") }
  }

  const handleSummarize = async (article) => {
    setIsSummarizing(true)
    setSummary(null)
    // Add a slight delay to show the scanning animation if the API is too fast
    const minWait = new Promise(resolve => setTimeout(resolve, 1500))
    try {
      const res = await fetch('http://127.0.0.1:5000/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: article.title, description: article.description, url: article.url })
      })
      const data = await res.json()
      await minWait
      if (data.success) setSummary({ ...data, article })
    } catch (e) { setError("Summarization failed") }
    finally { setIsSummarizing(false) }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    try {
      const endpoint = authMode === 'login' ? 'login' : 'signup'
      const res = await fetch(`http://127.0.0.1:5000/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      })
      const data = await res.json()
      if (data.success) {
        setToken(data.token); setUser(data.user); localStorage.setItem('tp_token', data.token); setAuthMode(null)
      } else { setError(data.message) }
    } catch (e) { setError("Auth failed") }
  }

  const handleLogout = () => {
    setToken(null); setUser(null); localStorage.removeItem('tp_token')
  }

  const exportReport = async () => {
    if (!token) { setAuthMode('signup'); return }
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0f172a', scale: 2 })
    const link = document.createElement('a')
    link.download = `techpulse-${tech}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const analyzeTech = async (targetTech, setResultFn, setStreamFn) => {
    setTech(targetTech)
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/analyze/stream?tech=${encodeURIComponent(targetTech)}`)
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.status === 'streaming') { accumulatedText += data.chunk; setStreamFn(accumulatedText) }
            if (data.done) { 
              setResultFn(data);
              if (token) {
                fetch('http://127.0.0.1:5000/api/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ techName: targetTech, token })
                }).then(() => fetchHistory())
              }
              return data 
            }
          }
        }
      }
    } catch (err) { setError(err.message); throw err }
  }

  const startQuickAnalyze = async (techName) => {
    setLoading(true); setError(null); setResult(null); setResult2(null); setTech(techName); setActiveTab('analysis')
    try { await analyzeTech(techName, setResult, setStreamingText) }
    finally { setLoading(false) }
  }

  const handleAnalyze = async (e) => {
    e?.preventDefault()
    if (!tech.trim()) return
    if (isVersus && !tech2.trim()) return
    setLoading(true); setError(null); setResult(null); setResult2(null); setStreamingText(''); setStreamingText2('')
    setActiveTab('analysis') // Ensure we switch to analysis view
    try {
      if (isVersus) { await Promise.all([analyzeTech(tech, setResult, setStreamingText), analyzeTech(tech2, setResult2, setStreamingText2)]) }
      else { await analyzeTech(tech, setResult, setStreamingText) }
    } finally { setLoading(false) }
  }

  const chartData = result?.done ? [
    { name: 'GitHub', [result.technology]: result.raw_metrics?.github_score || 0, [result2?.technology || 'Compare']: result2?.raw_metrics?.github_score || 0 },
    { name: 'Jobs', [result.technology]: result.raw_metrics?.job_score || 0, [result2?.technology || 'Compare']: result2?.raw_metrics?.job_score || 0 },
    { name: 'Stability', [result.technology]: result.raw_metrics?.stability_score || 0, [result2?.technology || 'Compare']: result2?.raw_metrics?.stability_score || 0 }
  ] : []

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-300 flex font-sans overflow-hidden">
      
      {/* AI Scanning Animation Overlay */}
      {isSummarizing && (
        <>
          <div className="full-screen-scan-overlay"></div>
          <div className="full-screen-scan"></div>
        </>
      )}

      {/* Sidebar - Discovery Focus */}
      <aside className="w-64 bg-[#0b0e14] border-r border-white/5 p-4 flex flex-col hidden lg:flex">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-lg">T</div>
          <h2 className="text-lg font-black text-white tracking-tighter uppercase">TechPulse</h2>
        </div>

        {dbOffline && (
          <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
             <div className="flex justify-between items-center mb-1">
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Offline Mode</div>
                <button onClick={() => {fetchFeed(); fetchAnalytics(); fetchHistory()}} className="text-[8px] font-black text-amber-500 hover:text-white uppercase underline">Retry</button>
             </div>
             <p className="text-[9px] text-amber-500/70 leading-relaxed font-bold">Personalization features are limited as the database is unreachable.</p>
          </div>
        )}

        <nav className="flex-1 space-y-1">
          <button onClick={() => {setActiveTab('feed'); setSummary(null); setResult(null); setResult2(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'feed' ? 'bg-white/5 text-blue-400' : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'}`}>
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></span> Memory fuel
          </button>
          <button onClick={() => setActiveTab('saved')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'saved' ? 'bg-white/5 text-blue-400' : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'}`}>
            <span>🖊️</span> Reading List
          </button>
          <button onClick={() => {setActiveTab('trends'); setSummary(null); setResult(null); setResult2(null)}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'trends' ? 'bg-white/5 text-blue-400' : 'hover:bg-white/5 text-slate-500 hover:text-slate-200'}`}>
            <span>📊</span> Global Trends
          </button>
          <div className="pt-6 pb-2 px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">New interests</div>
          {['React', 'Rust', 'LLMs'].map(t => (
            <button key={t} onClick={() => startQuickAnalyze(t)} className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></span> {t}
            </button>
          ))}

          <div className="pt-8 pb-4 px-4">
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden group min-h-[120px]">
               <div className="absolute -right-4 -top-4 w-12 h-12 bg-blue-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Pulse</span>
               </div>
               {feed.length > 0 ? (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-700" key={pulseIndex}>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2">
                      {feed[pulseIndex]?.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[8px] text-slate-600 font-black uppercase">{feed[pulseIndex]?.source}</span>
                      <button onClick={() => handleSummarize(feed[pulseIndex])} className="text-[9px] font-black text-white uppercase tracking-widest underline decoration-blue-500/50 hover:text-blue-400 transition-colors">AI Brief</button>
                    </div>
                 </div>
               ) : (
                 <p className="text-[10px] text-slate-500 italic">Listening for market signals...</p>
               )}
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5">
          {token ? (
            <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-black text-white">{user?.email?.[0].toUpperCase()}</div>
              <div className="flex-1 overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{user?.email}</div>
                <button onClick={handleLogout} className="text-[9px] text-slate-500 hover:text-rose-400 uppercase font-black">Sign Out</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAuthMode('signup')} className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Join TechPulse</button>
          )}
        </div>
      </aside>

      {/* Main Content - News Grid style */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative bg-[#0b0e14]">
        <header className="px-8 py-4 flex justify-between items-center sticky top-0 bg-[#0b0e14]/90 backdrop-blur-md z-30 border-b border-white/5">
          <div className="max-w-2xl w-full flex gap-3">
             <div className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">🔍</span>
                  <input
                    type="text" value={tech} onChange={(e) => setTech(e.target.value)}
                    placeholder={isVersus ? "Tech 1..." : "Search any tech or topic..."}
                    className="w-full bg-[#1a1d23] border border-white/5 pl-10 pr-5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm placeholder:text-slate-600"
                  />
                </div>
                {isVersus && (
                  <div className="relative flex-1 animate-in slide-in-from-left duration-300">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">🔍</span>
                    <input
                      type="text" value={tech2} onChange={(e) => setTech2(e.target.value)}
                      placeholder="Tech 2..."
                      className="w-full bg-[#1a1d23] border border-white/5 pl-10 pr-5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm placeholder:text-slate-600"
                    />
                  </div>
                )}
             </div>
             <button onClick={handleAnalyze} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-500 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20">
               {loading ? '...' : 'Analysis'}
             </button>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsVersus(!isVersus)} className={`p-2.5 rounded-xl border transition-all text-xs font-bold ${isVersus ? 'bg-blue-600 text-white' : 'bg-[#1a1d23] border-white/5 text-slate-400'}`}>
               {isVersus ? '✕' : '⇄'}
             </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Analysis View (if triggered) */}
          {(result?.done || loading) && activeTab === 'analysis' && (
            <div ref={reportRef} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
               {loading && !result && (
                 <div className="bg-[#1a1d23] border border-white/10 rounded-[3rem] p-20 text-center space-y-6">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Deep Diving into {tech}...</h2>
                    <p className="text-slate-500 font-bold">Scanning market telemetry and AI insights</p>
                 </div>
               )}

               {/* Main Metrics Card */}
               {result?.done && (
                 <div className="bg-[#1a1d23] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl p-10">
                  <div className="flex flex-col lg:flex-row gap-12">
                     <div className="flex-1 space-y-8">
                        <div className="flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Tech Intelligence Report</div>
                              <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{result.technology}</h2>
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black text-slate-600 uppercase mb-1">Pulse Verdict</div>
                              <div className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20">{result.ai_insight.verdict}</div>
                           </div>
                        </div>

                        <p className="text-lg text-slate-400 leading-relaxed font-medium italic">
                           {streamingText || `"${result.ai_insight.explanation}"`}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {[
                             { label: 'GitHub Momentum', value: result.raw_metrics?.github_score, value2: result2?.raw_metrics?.github_score, color: '#3b82f6' },
                             { label: 'Job Market', value: result.raw_metrics?.job_score, value2: result2?.raw_metrics?.job_score, color: '#6366f1' },
                             { label: 'Ecosystem Stability', value: result.raw_metrics?.stability_score, value2: result2?.raw_metrics?.stability_score, color: '#8b5cf6' }
                           ].map((m, i) => (
                             <div key={i} className="bg-black/20 p-6 rounded-3xl border border-white/5 space-y-3">
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{m.label}</div>
                                <div className="flex items-end gap-2 justify-between">
                                   <div className="flex items-end gap-1">
                                      <div className="text-3xl font-black text-white">{m.value}</div>
                                      {m.value2 !== undefined && <div className="text-sm font-black text-slate-600 mb-1">vs {m.value2}</div>}
                                   </div>
                                   <div className="text-[10px] text-slate-600 font-bold mb-1">/100</div>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                                   <div className="h-full bg-blue-600" style={{ width: `${m.value}%` }}></div>
                                   {m.value2 !== undefined && <div className="h-full bg-indigo-500 opacity-50 border-l border-white/20" style={{ width: `${m.value2}%` }}></div>}
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="p-8 bg-gradient-to-br from-blue-600/10 to-transparent rounded-3xl border border-blue-500/10">
                           <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Future Outlook</h4>
                           <p className="text-sm text-slate-300 leading-relaxed">{result.ai_insight.future_outlook}</p>
                        </div>
                     </div>

                     <div className="w-full lg:w-80 space-y-8 border-l border-white/5 pl-0 lg:pl-12">
                        <div>
                           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Strategic Stack</h4>
                           <div className="space-y-3">
                              {result.ai_insight.tech_stack?.map((s, i) => (
                                 <button key={i} onClick={() => startQuickAnalyze(s.name)} className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group text-left">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-xs font-black text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">{s.name[0]}</div>
                                    <div>
                                       <div className="text-xs font-black text-white">{s.name}</div>
                                       <div className="text-[9px] text-slate-500 uppercase">{s.role}</div>
                                    </div>
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={exportReport} className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-all">Export Analysis</button>
                           <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=Check out this ${result.technology} analysis on TechPulse!`, '_blank')} className="px-5 py-4 bg-white/5 hover:bg-blue-400/20 border border-white/5 rounded-2xl text-lg transition-all">𝕏</button>
                        </div>
                     </div>
                  </div>
               </div>
               )}

               {/* Roadmap Section */}
               {result?.done && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Ecosystem Breakdown - Pie Chart */}
                    <div className="bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-10 space-y-6">
                       <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Ecosystem Composition</h3>
                       <div className="h-64">
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
                                   innerRadius={60}
                                   outerRadius={80}
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
                       <div className="grid grid-cols-2 gap-4">
                          {['Core Engine', 'Tooling', 'Community', 'Enterprise'].map((label, i) => (
                             <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'][i] }}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Related Tech Pulse - Radar Chart */}
                    <div className="bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-10 space-y-6">
                       <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Related Domain Affinity</h3>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'DevEx', A: 120, B: 110, fullMark: 150 },
                                { subject: 'Performance', A: 98, B: 130, fullMark: 150 },
                                { subject: 'Safety', A: 86, B: 130, fullMark: 150 },
                                { subject: 'Cloud Native', A: 99, B: 100, fullMark: 150 },
                                { subject: 'AI Integration', A: 85, B: 90, fullMark: 150 }
                             ]}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                                <Radar name={result.technology} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                {result2 && <Radar name={result2.technology} dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />}
                                <Tooltip contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                             </RadarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
               )}

               {/* Market Heatmap Section */}
               {result?.done && (
                 <div className="bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-10 space-y-8">
                    <div className="flex justify-between items-end">
                       <div>
                          <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">Ecosystem Health Heatmap</h3>
                          <p className="text-xs text-slate-500 font-bold">Real-time status of critical dependency vectors</p>
                       </div>
                       <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                             <span className="text-[8px] font-black text-slate-600 uppercase">Optimal</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                             <span className="text-[8px] font-black text-slate-600 uppercase">Warning</span>
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                       {['Runtime', 'Compiler', 'StdLib', 'PackageMgr', 'Docs', 'Security', 'Typing', 'Testing', 'Community', 'Cloud', 'Mobile', 'WASM'].map((vector, i) => (
                          <div key={i} className={`p-4 rounded-2xl border transition-all hover:scale-105 cursor-help ${i % 5 === 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                             <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{vector}</div>
                             <div className={`text-xs font-black uppercase ${i % 5 === 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{i % 5 === 0 ? 'Review' : 'Healthy'}</div>
                          </div>
                       ))}
                    </div>
                 </div>
               )}

               {/* Roadmap Section */}
               {result?.done && (
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {result.ai_insight.roadmap?.map((step, i) => (
                      <div key={i} className="bg-[#1a1d23] border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                         <div className="absolute -right-4 -top-4 text-8xl font-black text-white/5 group-hover:text-blue-500/10 transition-colors">{step.week}</div>
                         <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Week {step.week}</div>
                         <h5 className="text-lg font-black text-white mb-3">{step.topic}</h5>
                         <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* Discovery Grid - daily.dev style with REAL News */}
          {!result && activeTab === 'feed' && (
            <div className="space-y-8">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex gap-6">
                     {['For You', 'Trending', 'Recent'].map(tab => (
                        <button key={tab} onClick={() => setActiveFeedTab(tab)} className={`text-sm font-black uppercase tracking-widest pb-4 border-b-2 transition-all ${activeFeedTab === tab ? 'border-blue-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-400'}`}>{tab}</button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {feed
                    .filter(item => {
                      if (activeFeedTab === 'Trending') return item.points > 0
                      if (activeFeedTab === 'Recent') return true 
                      return true 
                    })
                  .sort((a, b) => {
                    if (activeFeedTab === 'Trending') return b.points - a.points
                    if (activeFeedTab === 'Recent') return new Date(b.createdAt) - new Date(a.createdAt)
                    return 0 // default mix
                  })
                  .map((item, i) => (
                   <div key={i} className="bg-[#1a1d23] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col group news-card-hover shadow-xl relative cursor-pointer" onClick={() => window.open(item.url, '_blank')}>
                     {item.image ? (
                       <div className="h-48 overflow-hidden relative">
                          <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d23] via-transparent to-transparent opacity-60"></div>
                          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">{item.source}</div>
                       </div>
                     ) : (
                       <div className="h-48 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 pointer-events-none">
                             {Array(20).fill(0).map((_, j) => <span key={j} className="text-[8px] font-black text-white">010110</span>)}
                          </div>
                          <span className="text-4xl">📰</span>
                          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">{item.source}</div>
                       </div>
                     )}
                     <div className="p-8 flex-1 flex flex-col">
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-2">
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] font-black text-slate-400">
                                <span className="text-blue-500 text-[10px]">🔥</span> {item.points}
                             </div>
                             {item.tags?.slice(0, 2).map((tag, j) => (
                               <span key={j} className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">#{tag}</span>
                             ))}
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{new Date(item.createdAt).toLocaleDateString()}</span>
                       </div>
                       
                       <h3 className="text-xl font-black text-white leading-tight mb-4 group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[3rem]">{item.title}</h3>
                       <p className="text-xs text-slate-500 line-clamp-3 mb-8 leading-relaxed flex-1">{item.description}</p>
                       
                       <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2">
                             <button onClick={(e) => {e.stopPropagation(); handleSummarize(item)}} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                                AI SUMMARY
                             </button>
                             <button 
                               onClick={(e) => {e.stopPropagation(); handleSaveArticle(item)}} 
                               disabled={dbOffline}
                               className={`p-2 rounded-xl border transition-all ${dbOffline ? 'opacity-20 cursor-not-allowed' : ''} ${savedArticles.some(s => s.url === item.url) ? 'bg-white/10 border-white/10 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'}`}
                               title={dbOffline ? "Saving unavailable in offline mode" : "Save for later"}
                             >
                                <span className="text-[10px]">�️</span>
                             </button>
                          </div>
                          <div className="text-right">
                             <div className="text-[8px] font-black text-slate-600 uppercase mb-0.5">Author</div>
                             <div className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{item.author}</div>
                          </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* Reading List View */}
          {!result && activeTab === 'saved' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Reading List</h2>
               </div>

               {savedArticles.length === 0 ? (
                 <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <div className="text-4xl mb-4">📚</div>
                    <p className="text-slate-500 font-bold">No saved articles yet. Start exploring the feed!</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {savedArticles.map((item, i) => (
                      <div key={i} className="bg-[#1a1d23] border border-white/5 rounded-3xl p-6 flex gap-6 hover:border-blue-500/30 transition-all group">
                         {item.image && <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-black/20"><img src={item.image} className="w-full h-full object-cover" /></div>}
                         <div className="flex-1 flex flex-col justify-between">
                            <div>
                               <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">{item.source}</div>
                               <h3 className="text-lg font-black text-white leading-tight group-hover:text-blue-400 transition-colors line-clamp-2">{item.title}</h3>
                            </div>
                            <div className="flex gap-3 mt-4">
                               <button onClick={() => handleSummarize({ ...item, description: 'Saved from your reading list.' })} className="text-[9px] font-black text-white uppercase tracking-widest bg-blue-600 px-3 py-1.5 rounded-lg">✨ Summarize</button>
                               <a href={item.url} target="_blank" rel="noreferrer" className="text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest pt-2">Read Original</a>
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* Global Trends View */}
          {!result && activeTab === 'trends' && (
            <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex justify-between items-start">
                  <div>
                     <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Global Market Intelligence</h2>
                     <p className="text-slate-500 font-bold">Aggregated telemetry from GitHub, Job Markets, and Ecosystem Health</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Main Market Comparison Chart */}
                  <div className="space-y-6">
                     <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Market Share Overview</h3>
                     <div className="h-80 bg-black/20 rounded-[2rem] p-8 border border-white/5">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={trends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                              <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                              <YAxis hide />
                              <Tooltip 
                                 contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                                 cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                              />
                              <Bar dataKey="score" radius={[8, 8, 0, 0]} barSize={40}>
                                 {trends.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5]} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
 
                  {/* Growth Vectors Chart */}
                  <div className="space-y-6">
                     <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Growth Vectors</h3>
                     <div className="h-80 bg-black/20 rounded-[2rem] p-8 border border-white/5">
                        <ResponsiveContainer width="100%" height="100%">
                           <AreaChart data={trends}>
                              <defs>
                                 <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                 </linearGradient>
                              </defs>
                              <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                              <Tooltip contentStyle={{ background: '#11141a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                           </AreaChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
 
               {/* Developer Mindshare - Radial Bar Chart */}
               <div className="space-y-8 pt-12 border-t border-white/5">
                  <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Developer Mindshare Concentration</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                     <div className="h-80 lg:col-span-2 bg-black/20 rounded-[2rem] p-8 border border-white/5 relative">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={20} data={trends}>
                              <RadialBar
                                 minAngle={15}
                                 label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                                 background
                                 clockWise
                                 dataKey="score"
                              >
                                 {trends.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5]} />
                                 ))}
                              </RadialBar>
                              <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                           </RadialBarChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="space-y-6">
                        <div className="p-8 bg-rose-500/5 rounded-3xl border border-rose-500/10">
                           <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4">Saturation Alert</h4>
                           <p className="text-xs text-slate-400 leading-relaxed font-bold">The ecosystem is showing high concentration in {trends[0]?.name || 'core technologies'}. Diversity of tooling is essential for long-term stability.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                              <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Total Signals</div>
                              <div className="text-lg font-black text-white">4.2M</div>
                           </div>
                           <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                              <div className="text-[8px] font-black text-slate-600 uppercase mb-1">Growth Index</div>
                              <div className="text-lg font-black text-green-500">+14%</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  {trends.slice(0, 3).map((t, i) => (
                     <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                        <div>
                           <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Trending #{i+1}</div>
                           <div className="text-sm font-black text-white uppercase">{t.name}</div>
                        </div>
                        <div className="text-xl font-black text-blue-500">{t.score}%</div>
                     </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Summary Sidebar */}
      {(summary || isSummarizing) && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           {/* Backdrop */}
           <div className="absolute inset-0 bg-black/40" onClick={() => setSummary(null)}></div>
           
           <div className="relative w-full max-w-lg bg-[#11141a] border-l border-white/10 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
              <div className="p-8 flex items-center justify-between border-b border-white/5 bg-[#11141a]/80 backdrop-blur-md sticky top-0 z-20">
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                   <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">✨</span>
                   AI Intel
                 </h2>
                 <button onClick={() => setSummary(null)} className="text-slate-500 hover:text-white transition-all text-xl">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                 {isSummarizing ? (
                   <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-50">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-black uppercase tracking-widest text-blue-400">Scanning Intelligence...</p>
                   </div>
                 ) : (
                   <>
                     <div className="space-y-4">
                        <h3 className="text-2xl font-black text-white leading-tight">{summary.article.title}</h3>
                        <div className="flex gap-2">
                           <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black uppercase border border-blue-500/20">{summary.article.source}</span>
                           <span className="px-2 py-1 bg-white/5 text-slate-500 rounded text-[8px] font-black uppercase border border-white/5">Sentiment: {summary.sentiment_score}%</span>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Brief Summary</h4>
                        <div className="space-y-4">
                           {summary.summary.map((point, i) => (
                             <div key={i} className="flex gap-4 group">
                                <span className="text-blue-500 font-black text-xs pt-1">0{i+1}</span>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">{point}</p>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-500/10 space-y-3">
                        <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Impact Verdict</h4>
                        <p className="text-sm text-slate-200 font-bold leading-relaxed">{summary.impact_verdict}</p>
                     </div>

                     <div className="space-y-4 pt-4 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sentiment Cloud</h4>
                        <div className="flex flex-wrap gap-2">
                           {summary.summary[0].split(' ').slice(0, 8).map((word, i) => (
                              <span key={i} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-110 cursor-default ${i % 3 === 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                                 {word.replace(/[^a-zA-Z]/g, '')}
                              </span>
                           ))}
                        </div>
                     </div>

                     {summary.techMetrics && (
                       <div className="space-y-6 pt-4 border-t border-white/5">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Telemetry</h4>
                          <div className="h-40 w-full bg-black/20 rounded-2xl p-4 border border-white/5">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                  { name: 'GitHub', score: summary.techMetrics.github_score },
                                  { name: 'Jobs', score: summary.techMetrics.job_score },
                                  { name: 'Stability', score: summary.techMetrics.stability_score }
                                ]}>
                                   <XAxis dataKey="name" hide />
                                   <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                   <Tooltip contentStyle={{ background: '#1a1d23', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                                </BarChart>
                             </ResponsiveContainer>
                          </div>
                       </div>
                     )}

                     <div className="space-y-3 pt-6 border-t border-white/5">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Discovery Options</h4>
                        <button onClick={() => {setSummary(null); startQuickAnalyze(summary.main_tech)}} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-600 rounded-2xl transition-all group">
                           <div className="text-left">
                              <div className="text-xs font-black text-white group-hover:text-white uppercase tracking-tight">Search {summary.main_tech} Deeply</div>
                              <div className="text-[9px] text-slate-500 group-hover:text-blue-100">AI-powered deep dive & metrics</div>
                           </div>
                           <span>🔍</span>
                        </button>
                        <button onClick={() => {setSummary(null); setTech(summary.main_tech); setIsVersus(true)}} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-600 rounded-2xl transition-all group">
                           <div className="text-left">
                              <div className="text-xs font-black text-white group-hover:text-white uppercase tracking-tight">Compare Tech</div>
                              <div className="text-[9px] text-slate-500 group-hover:text-blue-100">Analyze against similar technologies</div>
                           </div>
                           <span>⇄</span>
                        </button>
                        <a href={summary.article.url} target="_blank" rel="noreferrer" className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-blue-600 rounded-2xl transition-all group">
                           <div className="text-left">
                              <div className="text-xs font-black text-white group-hover:text-white uppercase tracking-tight">Read Full Article</div>
                              <div className="text-[9px] text-slate-500 group-hover:text-blue-100">Open source coverage in new tab</div>
                           </div>
                           <span>🔗</span>
                        </a>
                     </div>
                   </>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Auth Modal */}
      {authMode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
           <div className="max-w-md w-full bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-xl shadow-blue-500/20">T</div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{authMode === 'login' ? 'Sign In' : 'Join Pro'}</h2>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                 <input type="email" required placeholder="Email Address" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 px-5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm" />
                 <input type="password" required placeholder="Password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} className="w-full bg-[#0b0e14] border border-white/5 px-5 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm" />
                 <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/10">Continue</button>
              </form>
              <button onClick={() => setAuthMode(null)} className="absolute top-8 right-8 text-slate-600 hover:text-white transition-all text-xl">✕</button>
           </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-10 right-10 bg-rose-600 text-white px-6 py-3 rounded-xl shadow-2xl shadow-rose-900/50 font-black text-xs uppercase tracking-widest animate-bounce z-50">
          ⚠️ Error: {error}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::selection { background: #3b82f6; color: white; }
      ` }} />
    </div>
  )
}

export default App
