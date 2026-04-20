'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { ChatMessage } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n';

export default function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { t, lang } = useTranslation();
  const { chatHistory, addChatMessage, clearChatHistory } = useAppStore();

  const starterQAs = useMemo(
    () =>
      ([1, 2, 3, 4, 5, 6] as const).map((n) => ({
        question: t(`chat.q${n}` as TranslationKey),
        answer: t(`chat.a${n}` as TranslationKey),
      })),
    [t, lang]
  );

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
            locale: lang,
          }),
        });

        let assistantContent: string;
        if (!res.ok) {
          assistantContent = '__unavailable__';
        } else {
          const data = await res.json();
          assistantContent = data.unavailable || !data.response ? '__unavailable__' : data.response;
        }

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(36),
          role: 'assistant',
          content: assistantContent,
          timestamp: new Date().toISOString(),
        };

        addChatMessage(assistantMessage);
      } catch {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(36),
          role: 'assistant',
          content: '__unavailable__',
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

  const handleStarterQA = useCallback(
    (question: string, answer: string) => {
      const userMsg: ChatMessage = {
        id: Date.now().toString(36),
        role: 'user',
        content: question,
        timestamp: new Date().toISOString(),
      };
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(36),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toISOString(),
      };
      addChatMessage(userMsg);
      addChatMessage(assistantMsg);
    },
    [addChatMessage]
  );

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
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal rounded-2xl shadow-lg shadow-teal/30 flex items-center justify-center text-white cursor-pointer"
            aria-label={t('chat.ariaChat' as TranslationKey)}
          >
            <MessageCircle size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tooltip */}
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
              {t('chat.tooltip' as TranslationKey)}
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
            <div className="bg-[#2D3142] px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal/20 flex items-center justify-center shrink-0">
                  <MessageCircle size={16} className="text-teal" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-white text-sm">
                    Vivi
                  </h3>
                  <p className="text-white/60 text-xs">{t('chat.subtitle' as TranslationKey)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChatHistory}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={t('chat.ariaClear' as TranslationKey)}
                  title={t('chat.ariaClear' as TranslationKey)}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label={t('chat.ariaClose' as TranslationKey)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-ice/30">
              {/* Welcome message if empty */}
              {chatHistory.length === 0 && (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle size={20} className="text-teal" />
                  </div>
                  <h4 className="font-heading italic font-bold text-navy mb-2">
                    {t('chat.welcomeTitle' as TranslationKey)}
                  </h4>
                  <p className="text-sm text-muted max-w-[240px] mx-auto mb-4">
                    {t('chat.welcomeBody' as TranslationKey)}
                  </p>
                  {/* Starter Q&As — injected locally, no API call */}
                  <div className="flex flex-col gap-1.5 text-left">
                    {starterQAs.map(({ question, answer }) => (
                      <button
                        key={question}
                        onClick={() => handleStarterQA(question, answer)}
                        className="text-xs px-3 py-2 bg-teal/8 text-teal rounded-xl hover:bg-teal/15 transition-colors cursor-pointer font-medium text-left"
                      >
                        {question}
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
                        ? 'bg-teal text-white rounded-tr-sm'
                        : msg.content === '__unavailable__'
                        ? 'bg-coral/10 border border-coral/20 text-coral rounded-tl-sm'
                        : 'bg-white shadow-sm border border-gray-100 text-body rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.content !== '__unavailable__' && (
                      <span className="text-xs block mb-1 text-muted font-medium">Vivi</span>
                    )}
                    {msg.content === '__unavailable__' ? (
                      <p className="text-sm">{t('chat.unavailableBody' as TranslationKey)}</p>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
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
                    <span className="text-xs block mb-1 text-muted font-medium">Vivi</span>
                    <div className="flex items-center gap-2 text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">{t('chat.thinking' as TranslationKey)}</span>
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
                placeholder={t('chat.inputPlaceholder' as TranslationKey)}
                className="flex-1 px-4 py-2.5 bg-ice/50 rounded-xl text-sm text-body placeholder:text-muted/50 outline-none focus:ring-2 focus:ring-teal/30 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-teal text-white rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-teal/90 transition-colors cursor-pointer shrink-0"
                aria-label={t('chat.ariaSend' as TranslationKey)}
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
