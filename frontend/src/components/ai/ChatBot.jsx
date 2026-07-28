import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import aiService from '@services/aiService';

const QUICK_CHIPS = [
  'Track my order',
  'Best deals today',
  'Return policy',
  'Recommend products',
];

const BOT_INTRO = {
  id:   Date.now(),
  role: 'bot',
  text: "👋 Hi! I'm ShopEasy AI. I can help you find products, track orders, and answer questions!",
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const ChatBot = memo(() => {
  const [open,     setOpen]     = useState(false);
  const [input,    setInput]    = useState('');
  const [messages, setMessages] = useState([BOT_INTRO]);
  const [loading,  setLoading]  = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = {
      id:   Date.now(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.text }));
      const response = await aiService.sendMessage(text, history);
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'bot',
        text: response.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id:   Date.now() + 1,
        role: 'bot',
        text: "I'm having trouble connecting right now. Please try again in a moment.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-dark-surface1 border border-dark-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{ height: 440 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border-b border-dark-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles size={14} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--text)]">ShopEasy AI</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                  Online
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => sendMessage(chip)}
                  className="text-xs px-2.5 py-1 bg-dark-surface2 border border-dark-border rounded-full text-[var(--text2)] hover:border-brand-500/50 hover:text-brand-500 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-brand-500 to-purple-600 text-white rounded-br-sm'
                      : 'bg-dark-surface2 border border-dark-border text-[var(--text)] rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-xs text-[var(--text3)] mt-1">{msg.time}</span>
                </div>
              ))}
              {loading && (
                <div className="self-start bg-dark-surface2 border border-dark-border rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i*150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-dark-border bg-dark-surface2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask me anything..."
                className="flex-1 bg-dark-surface1 border border-dark-border rounded-xl px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--text3)] outline-none focus:border-brand-500/60 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-9 h-9 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(o => !o)}
        className="chat-toggle w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/40 text-white"
        aria-label="Open AI chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
});

ChatBot.displayName = 'ChatBot';
export default ChatBot;
