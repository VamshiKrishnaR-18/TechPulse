import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare, User, Bot, Loader2, Sparkles } from 'lucide-react'

const IntelligenceChat = ({ article, isOpen, onClose, user, triggerAuth }) => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || isChatLoading) return;

    if (!user) {
      triggerAuth('signup', 'chat');
      return;
    }

    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          message: userMsg,
          history: chatHistory.slice(-6)
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setChatHistory(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.chunk) {
                assistantMsg += data.chunk;
                setChatHistory(prev => {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1].content = assistantMsg;
                  return newHistory;
                });
              }
            } catch (e) {
              console.error("Parse error in stream", e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: '⚠️ Analysis failed. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && article && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />

          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-[500px] bg-[#0b0f1a] border-l border-white/5 flex flex-col fixed right-0 top-0 h-screen z-[70] shadow-[-20px_0_40px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0b0f1a]/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-tp-accent/10 flex items-center justify-center text-tp-accent border border-tp-accent/20">
                   <MessageSquare size={16} />
                 </div>
                 <div>
                    <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Intelligence Query</h2>
                    <p className="text-[8px] font-bold text-slate-500 uppercase truncate max-w-[300px] mt-1">{article.title}</p>
                 </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6 bg-black/20">
              {chatHistory.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-12 space-y-6">
                    <div className="w-16 h-16 rounded-3xl bg-tp-accent/5 flex items-center justify-center text-tp-accent border border-tp-accent/10">
                      <Sparkles size={32} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[11px] font-black text-white uppercase tracking-widest">Awaiting Direct Query</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Ask about implementation risks, strategic impact, or architecture trade-offs for this specific signal.</p>
                    </div>
                 </div>
              ) : (
                 chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                       <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-[10px] ${msg.role === 'user' ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-tp-accent/10 border-tp-accent/20 text-tp-accent'}`}>
                          {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                       </div>
                       <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-tp-accent text-black' : 'bg-white/5 text-slate-200 border border-white/5 shadow-xl'}`}>
                          {msg.content}
                          {msg.role === 'assistant' && !msg.content && <Loader2 size={12} className="animate-spin" />}
                       </div>
                    </div>
                 ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-white/5 bg-[#0b0f1a]">
               <form onSubmit={handleSendChat} className="relative group">
                  <input 
                     value={chatMessage}
                     onChange={(e) => setChatMessage(e.target.value)}
                     placeholder="Type strategic query..."
                     className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-[13px] font-medium text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-tp-accent/30 focus:border-tp-accent/30 transition-all"
                  />
                  <button 
                    type="submit" 
                    disabled={!chatMessage.trim() || isChatLoading} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-tp-accent text-black rounded-xl flex items-center justify-center disabled:opacity-20 hover:scale-105 transition-all shadow-lg shadow-tp-accent/20"
                  >
                     {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
               </form>
               <p className="mt-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.2em] text-center italic">Secured Intelligence Session</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default IntelligenceChat;