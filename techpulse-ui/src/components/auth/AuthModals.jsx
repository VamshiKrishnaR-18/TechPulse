import React, { useState } from 'react'

const SUGGESTED_INTERESTS = ['React', 'Node.js', 'AI', 'Rust', 'Go', 'Cloud', 'Cybersecurity', 'DevOps'];

const AUTH_REASONS = {
  chat: {
    title: 'Intelligence Chat',
    description: 'Sign in to use the Intelligence Chat and save your research history.'
  },
  save: {
    title: 'Curate Your Intel',
    description: 'Create an account to sync your Reading List and custom filters.'
  },
  'for-you': {
    title: 'Personalized Feed',
    description: 'To see why these trends matter to your specific tech stack, tell us what you use.'
  }
};

const AuthModals = ({ authMode, setAuthMode, authReason, setAuthReason, authData, setAuthData, handleAuth, error }) => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);

  if (!authMode) return null;

  const reasonInfo = authReason ? AUTH_REASONS[authReason] : null;

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest) 
        : [...prev, interest]
    );
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (authMode === 'signup' && step === 1) {
      setStep(2);
    } else {
      handleAuth(e, selectedInterests);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
       <div className="max-w-md w-full bg-[#1a1d23] border border-white/10 rounded-[2.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">
            {reasonInfo ? reasonInfo.title : authMode === 'login' ? 'Welcome Back' : step === 1 ? 'Create Account' : 'Tailor Your Feed'}
          </h2>
          <p className="text-slate-500 font-bold mb-8">
            {reasonInfo ? reasonInfo.description : authMode === 'login' ? 'Join the intelligence network.' : step === 1 ? 'Join the intelligence network.' : 'Select technologies you track.'}
          </p>
          
          <form onSubmit={handleNext} className="space-y-4">
             {step === 1 || authMode === 'login' ? (
               <>
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
               </>
             ) : (
               <div className="grid grid-cols-2 gap-2 py-4">
                 {SUGGESTED_INTERESTS.map(interest => (
                   <button
                     key={interest}
                     type="button"
                     onClick={() => toggleInterest(interest)}
                     className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                       selectedInterests.includes(interest)
                         ? 'bg-blue-600 border-blue-500 text-white'
                         : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                     }`}
                   >
                     {interest}
                   </button>
                 ))}
               </div>
             )}

             {error && <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
             
             <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
               {authMode === 'login' ? 'Sign In' : step === 1 ? 'Continue' : 'Start Analyzing'}
             </button>
          </form>

          {step === 1 && (
            <div className="mt-8 text-center">
               <button onClick={() => {
                 setAuthMode(authMode === 'login' ? 'signup' : 'login');
                 setStep(1);
               }} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all">
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
               </button>
            </div>
          )}
          
          <button onClick={() => {
            setAuthMode(null);
            setStep(1);
          }} className="mt-4 w-full text-[10px] font-black text-slate-700 hover:text-slate-400 uppercase tracking-widest transition-all">Close</button>
       </div>
    </div>
  )
}

export default AuthModals
