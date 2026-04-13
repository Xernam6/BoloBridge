'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MicOff, Volume2, Send, Award } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAppStore } from '@/lib/store';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';

/* ------------------------------------------------------------------ */
/*  Scenario data                                                      */
/* ------------------------------------------------------------------ */

interface Scenario {
  id: string;
  title: string;
  emoji: string;
  description: string;
  accent: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'restaurant',
    title: 'Restaurant',
    emoji: '🍕',
    description: 'Order food at a fun restaurant!',
    accent: 'bg-coral',
  },
  {
    id: 'park',
    title: 'Park',
    emoji: '🌳',
    description: 'Make a friend at the playground!',
    accent: 'bg-success',
  },
  {
    id: 'school',
    title: 'School',
    emoji: '🏫',
    description: 'Be a student in a fun classroom!',
    accent: 'bg-teal',
  },
  {
    id: 'space-adventure',
    title: 'Space Adventure',
    emoji: '🚀',
    description: 'Explore outer space as an astronaut!',
    accent: 'bg-violet',
  },
];

const XP_PER_EXCHANGE = 15;
const MAX_EXCHANGES = 10;

/* ------------------------------------------------------------------ */
/*  Conversation message type                                          */
/* ------------------------------------------------------------------ */

interface Message {
  role: 'child' | 'character';
  text: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = 'select-scenario' | 'playing' | 'summary';

export default function StoryStudioPage() {
  const addXP = useAppStore((s) => s.addXP);
  const profile = useAppStore((s) => s.profile);
  const appLanguage = useAppStore((s) => s.appLanguage);

  const [phase, setPhase] = useState<Phase>('select-scenario');
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const lang = profile?.language ?? appLanguage ?? 'en';
  const { isSupported, isListening, isProcessing, transcript, error: micError, startListening, stopListening, resetTranscript } =
    useSpeechRecognition(lang);

  const [showMicModal, setShowMicModal] = useState(false);
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Speak the AI character's response
  const speakResponse = useCallback(async (text: string) => {
    setIsSpeaking(true);
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.pitch = 1.2;
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // Fetch AI response from API
  const fetchAIResponse = useCallback(
    async (
      scenarioId: string,
      childSpeech: string | null,
      history: Message[],
      getOpener = false,
    ) => {
      setIsAiThinking(true);
      try {
        const res = await fetch('/api/story-studio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario: scenarioId,
            childSpeech,
            conversationHistory: history,
            childAge: profile?.age ?? 5,
            getOpener,
          }),
        });
        const data = await res.json();
        return data.response as string;
      } catch {
        return "Hmm, I'm not sure what to say! Can you try again?";
      } finally {
        setIsAiThinking(false);
      }
    },
    [profile?.age],
  );

  // Start a scenario
  const startScenario = useCallback(
    async (s: Scenario) => {
      setScenario(s);
      setConversation([]);
      setExchangeCount(0);
      setPhase('playing');

      const opener = await fetchAIResponse(s.id, null, [], true);
      const msg: Message = { role: 'character', text: opener };
      setConversation([msg]);
      speakResponse(opener);
    },
    [fetchAIResponse, speakResponse],
  );

  // Handle transcript result
  useEffect(() => {
    if (!transcript || phase !== 'playing' || isAiThinking) return;

    const childMsg: Message = { role: 'child', text: transcript };
    const updatedConv = [...conversation, childMsg];
    setConversation(updatedConv);
    setExchangeCount((c) => c + 1);
    resetTranscript();

    (async () => {
      const response = await fetchAIResponse(
        scenario!.id,
        transcript,
        updatedConv,
      );
      const aiMsg: Message = { role: 'character', text: response };
      setConversation((prev) => [...prev, aiMsg]);
      speakResponse(response);

      addXP(XP_PER_EXCHANGE);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  // End the story
  const endStory = useCallback(() => {
    stopListening();
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
    setPhase('summary');
  }, [stopListening]);

  const totalXP = exchangeCount * XP_PER_EXCHANGE;

  /* ---------------------------------------------------------------- */
  /*  Render: Scenario selection                                       */
  /* ---------------------------------------------------------------- */

  if (phase === 'select-scenario') {
    return (
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <header className="bg-cream border-b border-ice pt-10 pb-8 px-6 sm:px-10">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 text-muted hover:text-teal text-sm font-body font-medium mb-6 transition-colors duration-300"
            >
              <ArrowLeft size={16} /> Back to Games
            </Link>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <h1 className="font-heading italic text-3xl md:text-4xl text-navy mb-2">
                Story Studio
              </h1>
              <p className="font-body text-muted text-base max-w-lg">
                Pick a scenario and chat with a fun character. The conversation
                flows naturally, gently modeling correct speech along the way.
              </p>
            </motion.div>
          </div>
        </header>

        <section className="px-6 sm:px-10 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading italic text-xl text-navy mb-8">
              Choose your scene
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {SCENARIOS.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: 'easeOut' }}
                >
                  <TiltCard tiltAmount={6}>
                    <button
                      onClick={() => startScenario(s)}
                      className="group w-full text-left bg-white rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500 cursor-pointer"
                    >
                      <div className={`w-14 h-14 ${s.accent} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                        {s.emoji}
                      </div>
                      <h3 className="font-heading italic text-xl text-navy mb-2 group-hover:text-teal transition-colors duration-300">
                        {s.title}
                      </h3>
                      <p className="font-body text-sm text-muted leading-relaxed">
                        {s.description}
                      </p>
                    </button>
                  </TiltCard>
                </motion.div>
              ))}
            </div>

            {!isSupported && (
              <div className="mt-8 px-5 py-4 bg-coral/10 text-coral rounded-xl text-sm font-body font-medium text-center">
                Speech recognition requires Chrome or Edge browser
              </div>
            )}

            <div className="mt-10 px-6 py-5 bg-ice rounded-2xl text-sm font-body text-muted text-center leading-relaxed">
              <span className="font-heading italic text-navy text-base block mb-1">How it works</span>
              A character will talk to you. Press the mic button and speak back.
              The character will respond naturally, and gently model correct speech along the way.
            </div>
          </div>
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Summary                                                  */
  /* ---------------------------------------------------------------- */

  if (phase === 'summary') {
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-cream border-b border-ice pt-10 pb-8 px-6 sm:px-10">
          <div className="max-w-2xl mx-auto">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 text-muted hover:text-teal text-sm font-body font-medium mb-6 transition-colors duration-300"
            >
              <ArrowLeft size={16} /> Back to Games
            </Link>
            <h1 className="font-heading italic text-3xl text-navy flex items-center gap-3">
              <Award size={28} className="text-coral" /> Story Complete
            </h1>
          </div>
        </header>

        <section className="px-6 py-12 sm:py-16">
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 sm:p-10 text-center">
              <motion.div
                className="text-5xl mb-5"
                animate={{ rotate: [0, 6, -6, 0] }}
                transition={{ duration: 2, repeat: 2, ease: 'easeInOut' }}
              >
                {scenario?.emoji}
              </motion.div>

              <h2 className="font-heading italic text-2xl text-navy mb-2">
                Great conversation!
              </h2>
              <p className="font-body text-muted mb-8">
                You had {exchangeCount} exchanges in the{' '}
                <strong className="text-navy">{scenario?.title}</strong> scenario.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-ice rounded-2xl p-5">
                  <p className="text-2xl font-heading italic text-teal">
                    {exchangeCount}
                  </p>
                  <p className="text-xs font-body text-muted font-medium mt-1">
                    Exchanges
                  </p>
                </div>
                <div className="bg-ice rounded-2xl p-5">
                  <p className="text-2xl font-heading italic text-coral">
                    +{totalXP}
                  </p>
                  <p className="text-xs font-body text-muted font-medium mt-1">
                    XP Earned
                  </p>
                </div>
              </div>

              {/* Conversation recap */}
              <div className="mb-8 max-h-52 overflow-y-auto text-left space-y-2 pr-1">
                {conversation.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm font-body px-4 py-3 rounded-2xl ${
                      msg.role === 'character'
                        ? 'bg-ice text-navy'
                        : 'bg-teal/10 text-teal ml-8'
                    }`}
                  >
                    <span className="font-medium text-xs block mb-0.5 opacity-60">
                      {msg.role === 'character' ? 'Character' : 'You'}
                    </span>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <MagneticButton
                  onClick={() => {
                    setPhase('select-scenario');
                    setConversation([]);
                    setExchangeCount(0);
                  }}
                  className="w-full py-4 bg-teal text-white font-body font-semibold rounded-xl hover:shadow-[0_8px_32px_rgba(92,77,154,0.2)] transition-shadow duration-500"
                >
                  Play Again
                </MagneticButton>
                <Link
                  href="/play"
                  className="w-full py-4 bg-ice text-navy font-body font-semibold rounded-xl text-center hover:bg-mint transition-colors duration-300"
                >
                  Back to Games
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Playing                                                  */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-ice sticky top-0 z-40 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-ice rounded-xl flex items-center justify-center text-xl">
              {scenario?.emoji}
            </div>
            <div>
              <h1 className="font-heading italic text-lg text-navy">
                {scenario?.title}
              </h1>
              <p className="text-xs font-body text-muted">
                Exchange {exchangeCount} of {MAX_EXCHANGES}
              </p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex gap-1.5">
              {Array.from({ length: MAX_EXCHANGES }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    i < exchangeCount
                      ? 'w-2 bg-teal'
                      : i === exchangeCount
                        ? 'w-5 bg-coral'
                        : 'w-2 bg-ice'
                  }`}
                />
              ))}
            </div>
          </div>

          <MagneticButton
            onClick={endStory}
            className="px-5 py-2.5 bg-ice text-navy text-sm font-body font-medium rounded-xl hover:bg-mint transition-colors duration-300"
          >
            End Story
          </MagneticButton>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {conversation.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={`flex ${msg.role === 'child' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-5 py-4 text-sm font-body leading-relaxed ${
                    msg.role === 'character'
                      ? 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] text-navy rounded-3xl rounded-bl-lg'
                      : 'bg-teal text-white rounded-3xl rounded-br-lg'
                  }`}
                >
                  {msg.role === 'character' && (
                    <span className="text-xs font-medium text-teal block mb-1.5 opacity-70">
                      Character
                    </span>
                  )}
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isAiThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-start"
            >
              <div className="bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] px-5 py-4 rounded-3xl rounded-bl-lg">
                <span className="text-xs font-medium text-teal block mb-1.5 opacity-70">
                  Character
                </span>
                <motion.span
                  className="text-sm font-body text-muted"
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  Thinking...
                </motion.span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-ice bg-white px-6 py-5">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {/* Replay last character message */}
          {conversation.length > 0 && (
            <button
              onClick={() => {
                const lastCharMsg = [...conversation]
                  .reverse()
                  .find((m) => m.role === 'character');
                if (lastCharMsg) speakResponse(lastCharMsg.text);
              }}
              disabled={isSpeaking}
              className="p-3.5 rounded-xl bg-ice text-muted hover:bg-mint hover:text-navy transition-colors duration-300 cursor-pointer disabled:opacity-50"
              title="Replay"
            >
              <Volume2 size={20} />
            </button>
          )}

          {/* Mic button */}
          <button
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                resetTranscript();
                startListening();
              }
            }}
            disabled={isAiThinking || !isSupported}
            className={`relative flex-1 flex items-center justify-center gap-3 py-4 rounded-xl font-body font-semibold text-base cursor-pointer transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-coral text-white'
                : 'bg-teal text-white'
            }`}
          >
            {/* Pulse rings when listening */}
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-coral"
                  animate={{ scale: [1, 1.06], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-coral"
                  animate={{ scale: [1, 1.12], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                />
              </>
            )}
            {isListening ? (
              <>
                <MicOff size={20} /> Listening...
              </>
            ) : (
              <>
                <Mic size={20} /> Tap to Speak
              </>
            )}
          </button>

          {/* End / Exchange counter */}
          {exchangeCount >= MAX_EXCHANGES && (
            <button
              onClick={endStory}
              className="p-3.5 rounded-xl bg-coral/10 text-coral hover:bg-coral/20 transition-colors duration-300 cursor-pointer"
              title="Finish"
            >
              <Send size={20} />
            </button>
          )}
        </div>

        {micError && (
          <div className="max-w-2xl mx-auto mt-3 bg-coral/10 rounded-xl px-4 py-2.5">
            <p className="text-coral text-sm font-body text-center">{micError}</p>
          </div>
        )}

        {isListening && (
          <motion.p
            className="text-center text-xs font-body text-teal mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Speak now... tap again to stop
          </motion.p>
        )}
      </div>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
    </div>
  );
}
