import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function App() {
  const [tech, setTech] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    if (!tech.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tech: tech })
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.message)
      } else {
        setResult(data)
      }
    } catch (err) {
      setError("Failed to connect to the server. Is your backend running?")
    } finally {
      setLoading(false)
    }
  }

  // Format data for Recharts
  const chartData = result ? [
    { name: 'GitHub Trend', score: result.raw_metrics.github_score, color: '#3b82f6' },
    { name: 'Job Demand', score: result.raw_metrics.job_score, color: '#10b981' },
    { name: 'Stability', score: result.raw_metrics.stability_score, color: '#6366f1' }
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4 font-sans pb-20">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Tech<span className="text-blue-600">Pulse</span> AI
        </h1>
        <p className="text-lg text-gray-600">
          Data-driven career intelligence. Stop guessing, start building.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleAnalyze} className="w-full max-w-2xl flex gap-3 mb-10">
        <input
          type="text"
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          placeholder="e.g., React, Python, Web3..."
          className="flex-1 px-6 py-4 rounded-xl border border-gray-300 shadow-sm text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md transition-all disabled:opacity-70"
        >
          {loading ? "Analyzing..." : "Evaluate"}
        </button>
      </form>

      {/* Error State */}
      {error && (
        <div className="w-full max-w-2xl bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-xl mb-6 shadow-sm">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center mt-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500 font-medium animate-pulse">Fetching live telemetry & running AI analysis...</p>
        </div>
      )}

      {/* Results Card */}
      {result && !loading && (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 animate-fade-in">
          
          {/* AI Verdict Header */}
          <div className="bg-blue-600 text-white p-6 text-center relative overflow-hidden">
             {/* Dynamic Source Badge */}
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-mono backdrop-blur-sm">
               {result.source === "database_cache" ? "⚡ Cached Response" : "📡 Live API Analysis"}
            </div>
            
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-1 opacity-80 mt-4">AI Verdict for {result.technology}</h2>
            <h3 className="text-4xl font-black tracking-tight">{result.ai_insight.verdict}</h3>
          </div>

          <div className="p-8">
            
            {/* The Data Visualization (Recharts) */}
            <div className="mb-10 border-b pb-10">
               <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 text-center">Telemetry Metrics</h4>
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 14, fontWeight: 500}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af'}} domain={[0, 100]} />
                      <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]} animationDuration={1500}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* AI Explanations */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  🧠 AI Analysis
                </h4>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {result.ai_insight.explanation}
                </p>
              </div>
              
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-inner">
                <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                   🔮 Future Outlook
                </h4>
                <p className="text-gray-600 italic">
                  "{result.ai_insight.future_outlook}"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App