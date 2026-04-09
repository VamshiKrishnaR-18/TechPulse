import React from 'react'

const AuthModals = ({ authMode, setAuthMode, authData, setAuthData, handleAuth, error }) => {
  if (!authMode) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
       <div className="max-w-md w-full bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 font-bold mb-8">Join the intelligence network.</p>
          <form onSubmit={handleAuth} className="space-y-4">
             <input 
               type="email" placeholder="Email" required 
               value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})}
               className="w-full bg-black/20 border border-white/5 p-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-bold"
             />
             <input 
               type="password" placeholder="Password" required 
               value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})}
               className="w-full bg-black/20 border border-white/5 p-4 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-white font-bold"
             />
             {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
             <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
               {authMode === 'login' ? 'Sign In' : 'Create Account'}
             </button>
          </form>
          <div className="mt-8 text-center">
             <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">
                {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
             </button>
          </div>
          <button onClick={() => setAuthMode(null)} className="mt-4 w-full text-[10px] font-black text-slate-700 hover:text-slate-400 uppercase tracking-widest transition-all">Close</button>
       </div>
    </div>
  )
}

export default AuthModals
