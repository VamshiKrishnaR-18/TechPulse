import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // This lifecycle method catches the error before the screen goes white
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // This logs the error so you can see it in your console
  componentDidCatch(error, errorInfo) {
    console.error('💥 TechPulse UI Crash Intercepted:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // The Fallback UI when the app crashes
      return (
        <div className="h-screen w-full bg-tp-dark text-slate-200 flex flex-col items-center justify-center p-6 font-tp-sans selection:bg-tp-accent/30">
          <div className="bg-[#1a1d23] border border-red-500/20 rounded-[2.5rem] p-10 max-w-lg w-full text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <AlertTriangle size={120} />
            </div>
            
            <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] border border-red-500/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/10">
              <AlertTriangle size={36} className="text-red-500" />
            </div>
            
            <div className="space-y-2 relative z-10">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Anomaly</h2>
                <p className="text-slate-400 font-bold text-[11px] leading-relaxed uppercase tracking-widest">
                  The frontend encountered an unexpected critical error.
                </p>
            </div>

            <div className="bg-black/40 rounded-2xl p-4 text-left overflow-auto max-h-32 border border-white/5 relative z-10">
                <code className="text-[10px] text-red-400 font-mono">{this.state.error?.toString()}</code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 w-full border border-white/5 group relative z-10"
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              Reboot Interface
            </button>
          </div>
        </div>
      );
    }

    // If there is no error, just render the app normally
    return this.props.children;
  }
}

export default ErrorBoundary;