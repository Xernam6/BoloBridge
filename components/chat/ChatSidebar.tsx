'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ChatMessage } from '@/types';

export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { chatHistory, addChatMessage, clearChatHistory } = useAppStore();

  // Auto-dismiss tooltip after 12 seconds
  useEffect(() => {
    if (!showTooltip) return;
    const timer = setTimeout(() => setShowTooltip(false), 12000);
    return () => clearTimeout(timer);
  }, [showTooltip]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(36),
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      addChatMessage(userMessage);
      setInput('');
      setIsLoading(true);

      try {
        const historyForAPI = chatHistory.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            history: historyForAPI,
          }),
        });

        const data = await res.json();

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(36),
          role: 'assistant',
          content: data.response || "I'm having trouble responding right now. Please try again!",
          timestamp: new Date().toISOString(),
        };

        addChatMessage(assistantMessage);
      } catch {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(36),
          role: 'assistant',
          content: "Oops! I'm having trouble connecting right now. Please try again in a moment! 🦜",
          timestamp: new Date().toISOString(),
        };
        addChatMessage(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [chatHistory, addChatMessage, isLoading]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setIsOpen(true);
              setShowTooltip(false);
            }}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-teal to-violet rounded-2xl shadow-lg shadow-teal/30 flex items-center justify-center text-white cursor-pointer"
            aria-label="Chat with Vivi"
          >
            <span className="text-2xl">🦜</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat unread indicator */}
      <AnimatePresence>
        {!isOpen && chatHistory.length === 0 && showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 2 }}
            className="fixed bottom-22 right-6 z-50 bg-white rounded-xl shadow-lg px-4 py-2 max-w-xs"
          >
            <p className="text-sm text-body">
              Hi! I&apos;m <strong>Vivi</strong> 🦜 Ask me anything about speech!
            </p>
            <div className="absolute bottom-0 right-6 translate-y-full w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 to-teal-700 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🦜</span>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm">
                    Vivi
                  </h3>
                  <p className="text-white/60 text-xs">Speech Buddy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChatHistory}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Clear chat"
                  title="Clear chat"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-ice/30">
              {/* Welcome message if empty */}
              {chatHistory.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl block mb-3">🦜</span>
                  <h4 className="font-heading font-bold text-navy mb-2">
                    Hi! I&apos;m Vivi!
                  </h4>
                  <p className="text-sm text-muted max-w-[240px] mx-auto mb-4">
                    I can help with speech tips, answer questions, or just chat!
                  </p>
                  {/* Quick actions */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      'Speech tips',
                      'Practice ideas',
                      'About screening',
                      'Game help',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs px-3 py-1.5 bg-cyan/10 text-cyan rounded-full hover:bg-cyan/20 transition-colors cursor-pointer font-medium"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {chatHistory.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-cyan text-white rounded-tr-sm'
                        : 'bg-white shadow-sm border border-gray-100 text-body rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <span className="text-xs block mb-1 text-muted">🦜 Vivi</span>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                    <span className="text-xs block mb-1 text-muted">🦜 Vivi</span>
                    <div className="flex items-center gap-2 text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Vivi anything..."
                className="flex-1 px-4 py-2.5 bg-ice/50 rounded-xl text-sm text-body placeholder:text-muted/50 outline-none focus:ring-2 focus:ring-cyan/30 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-cyan text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan/90 transition-colors cursor-pointer shrink-0"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
