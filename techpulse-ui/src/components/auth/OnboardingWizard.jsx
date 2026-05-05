import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Mail, Lock, ShieldCheck, Zap, Globe, Cpu } from 'lucide-react';
import { SignUp, useUser } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';

const TAGS = ['React', 'Node.js', 'Rust', 'Python', 'AI/ML', 'System Design', 'Cloud Native', 'Cybersecurity', 'Go', 'TypeScript'];
const CONTENT_TYPES = [
  { id: 'news', title: 'Breaking News', desc: 'High-signal technical updates', icon: <Zap size={20} /> },
  { id: 'tutorials', title: 'Deep Dives', desc: 'Step-by-step technical guides', icon: <Cpu size={20} /> },
  { id: 'releases', title: 'Major Releases', desc: 'Framework and library updates', icon: <Globe size={20} /> }
];

const OnboardingWizard = ({ onComplete, onCancel }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync preferences once signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && user && step === 3) {
      handleFinalize(user);
    }
  }, [isLoaded, isSignedIn, user, step]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleType = (id) => {
    setSelectedTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const handleFinalize = async (clerkUser) => {
    setIsLoading(true);
    // Bundle the preferences and Clerk user info
    await onComplete({
      clerkId: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      interestedTags: selectedTags,
      contentPreferences: selectedTypes
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-[#0d1117] border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden my-8">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-tp-accent to-purple-500"
            animate={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Build Your Stack</h2>
                <p className="text-slate-500 font-bold">Select the technologies you want to track.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                      selectedTags.includes(tag)
                        ? 'bg-tp-accent border-tp-accent text-white shadow-lg shadow-tp-accent/20'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedTags.length === 0}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-tp-accent hover:text-white transition-all disabled:opacity-20"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Content Preferences</h2>
                <p className="text-slate-500 font-bold">How do you prefer to consume intelligence?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleType(type.id)}
                    className={`p-6 rounded-[2rem] border text-left transition-all group ${
                      selectedTypes.includes(type.id)
                        ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50'
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                      selectedTypes.includes(type.id) ? 'bg-purple-500 text-white' : 'bg-white/5 text-slate-500'
                    }`}>
                      {type.icon}
                    </div>
                    <h3 className="text-sm font-black text-white uppercase mb-1">{type.title}</h3>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">{type.desc}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-4 text-slate-500 font-black uppercase tracking-widest hover:text-white transition-all"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={selectedTypes.length === 0}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-tp-accent hover:text-white transition-all disabled:opacity-20"
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Finalize Profile</h2>
                <p className="text-slate-500 font-bold">Secure your account with GitHub or Magic Link.</p>
              </div>

              <div className="w-full flex justify-center">
                <SignUp 
                  routing="virtual"
                  appearance={{
                    baseTheme: dark,
                    elements: {
                      card: "bg-slate-900 border border-white/10 shadow-none",
                      headerTitle: "text-white uppercase font-black tracking-tighter",
                      headerSubtitle: "text-slate-500 font-bold",
                      socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold",
                      formButtonPrimary: "bg-purple-600 hover:bg-purple-700 text-white font-black uppercase tracking-widest",
                      footerActionLink: "text-purple-400 hover:text-purple-300 font-bold",
                      identityPreviewText: "text-white",
                      formFieldLabel: "text-slate-400 uppercase text-[10px] font-black tracking-widest",
                      formFieldInput: "bg-black/40 border-white/5 text-white",
                      dividerLine: "bg-white/5",
                      dividerText: "text-slate-600 font-black text-[10px]"
                    }
                  }}
                />
              </div>

              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-widest hover:text-white transition-all"
              >
                <ChevronLeft size={18} /> Back
              </button>

              <div className="flex items-center gap-2 text-[8px] font-black text-slate-600 uppercase tracking-widest justify-center">
                <ShieldCheck size={12} /> Secure Intelligence Network
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={onCancel}
          className="absolute top-8 right-8 text-slate-700 hover:text-slate-400 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default OnboardingWizard;
