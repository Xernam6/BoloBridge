'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, Mic, CheckCircle } from 'lucide-react';
import exercises from '@/data/exercises.json';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { AnimatedTabs } from '@/components/ui/AnimatedTabs';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';

interface SafariExercise {
  id: string;
  targetSound: string;
  word: string;
  wordHindi?: string;
  wordSpanish?: string;
  wordAfrikaans?: string;
  wordBengali?: string;
  wordTagalog?: string;
  imageEmoji: string;
  difficulty: string;
  environment: string;
}

function getTranslatedWord(ex: SafariExercise, lang: string): string | undefined {
  switch (lang) {
    case 'hi': return ex.wordHindi;
    case 'es': return ex.wordSpanish;
    case 'af': return ex.wordAfrikaans;
    case 'bn': return ex.wordBengali;
    case 'tl': return ex.wordTagalog;
    default: return undefined;
  }
}

interface MatchResult {
  score: number;
  matched: boolean;
  transcript: string;
}

const ENVIRONMENTS = [
  { name: 'Jungle', emoji: '🌴' },
  { name: 'Ocean', emoji: '🌊' },
  { name: 'Mountain', emoji: '⛰️' },
  { name: 'Space', emoji: '🚀' },
  { name: 'Farm', emoji: '🐄' },
  { name: 'Arctic', emoji: '🧊' },
];

const MOUTH_HINTS: Record<string, string> = {
  s: 'Keep your teeth close together and blow air through the small gap. Your tongue tip is behind your top teeth.',
  m: 'Press your lips together gently. Hum and feel the vibration on your lips!',
  t: 'Touch the tip of your tongue to the bumpy ridge behind your top teeth. Then let it pop away!',
  p: 'Press your lips together, then pop them apart with a puff of air!',
  b: 'Just like "p" but with your voice buzzing. Press lips together and let them pop!',
  f: 'Gently bite your bottom lip with your top teeth and blow air out.',
  d: 'Touch your tongue tip behind your top teeth and let your voice buzz as you pull away.',
  sh: 'Round your lips slightly and push air through. Your tongue is flat in the middle of your mouth.',
  w: 'Round your lips into a small circle, like blowing out a candle!',
  k: 'The back of your tongue touches the back roof of your mouth. Then let it pop!',
  g: 'Like "k" but with your voice buzzing. Back of tongue touches back of mouth roof.',
  r: 'Curl the tip of your tongue up slightly. Your tongue does not touch the roof!',
  l: 'Put the tip of your tongue on the bumpy ridge behind your top teeth and let air flow around it.',
  n: 'Touch your tongue tip behind your top teeth and hum through your nose.',
  h: 'Open your mouth and breathe out gently, like fogging up a mirror!',
  st: 'Start with "s" (teeth together, blow air) then quickly move to "t" (tongue tip pops from ridge).',
  th: 'Put the tip of your tongue gently between your top and bottom teeth and blow air.',
};

const DIFFICULTY_LABELS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'bg-success/10', text: 'text-success' },
  medium: { bg: 'bg-coral/10', text: 'text-coral' },
  hard: { bg: 'bg-violet/10', text: 'text-violet' },
};

export default function SoundSafariPage() {
  const safariExercises = exercises['sound-safari'] as SafariExercise[];
  const [selectedEnv, setSelectedEnv] = useState('Jungle');
  const [selectedAnimal, setSelectedAnimal] = useState<SafariExercise | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [showMicModal, setShowMicModal] = useState(false);

  const [attemptCount, setAttemptCount] = useState(0);
  const { isSupported, isListening, isProcessing, transcript, error: micError, startListening, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  const addXP = useAppStore((s) => s.addXP);
  const addExerciseResult = useAppStore((s) => s.addExerciseResult);
  const appLanguage = useAppStore((s) => s.appLanguage);
  const profile = useAppStore((s) => s.profile);
  const displayLang = profile?.language || appLanguage || 'en';

  const filtered = safariExercises.filter((ex) => ex.environment === selectedEnv);

  // When a transcript comes back, compute the match
  useEffect(() => {
    if (!transcript || !selectedAnimal) return;

    const score = compareSpeech(selectedAnimal.word, transcript);
    const matched = score >= MATCH_THRESHOLD;

    setMatchResult({ score, matched, transcript });
    if (!matched) setAttemptCount((c) => c + 1);

    if (matched) {
      setAttemptCount(0);
      addXP(10);
      addExerciseResult({
        exerciseId: selectedAnimal.id,
        gameType: 'sound-safari',
        score: Math.round(score * 100),
        maxScore: 100,
        completedAt: new Date().toISOString(),
        soundsTargeted: [selectedAnimal.targetSound],
      });
    }
  }, [transcript, selectedAnimal, addXP, addExerciseResult]);

  const handleTryAgain = () => {
    setMatchResult(null);
    resetTranscript();
    startListening();
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-cream border-b border-ice pt-10 pb-8 px-6 sm:px-10">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 text-muted hover:text-teal text-sm font-body font-medium mb-6 transition-colors duration-300"
          >
            <ArrowLeft size={16} />
            Back to Games
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="font-heading italic text-3xl md:text-4xl text-navy mb-2">
              Sound Safari
            </h1>
            <p className="font-body text-muted text-base max-w-lg">
              Explore environments and collect animals by saying their sounds correctly.
            </p>
            {filtered.length > 0 && (
              <p className="font-body text-sm text-teal mt-3">
                {filtered.length} animals in {selectedEnv}
              </p>
            )}
          </motion.div>
        </div>
      </header>

      {/* Environment pill selectors */}
      <section className="px-6 sm:px-10 pt-8 pb-2">
        <div className="max-w-4xl mx-auto">
          <AnimatedTabs
            tabs={ENVIRONMENTS.map((env) => ({ key: env.name, label: env.name, icon: env.emoji }))}
            activeTab={selectedEnv}
            onTabChange={(key) => {
              setSelectedEnv(key);
              setSelectedAnimal(null);
              setMatchResult(null);
              resetTranscript();
            }}
          />
        </div>
      </section>

      {/* Animal Grid */}
      <section className="px-6 sm:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5"
            initial="hidden"
            animate="show"
            key={selectedEnv}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.1 },
              },
            }}
          >
            {filtered.map((animal) => {
              const diff = DIFFICULTY_LABELS[animal.difficulty] || DIFFICULTY_LABELS.easy;
              return (
                <motion.div
                  key={animal.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: 'easeOut' },
                    },
                  }}
                >
                  <TiltCard tiltAmount={6}>
                    <button
                      onClick={() => {
                        setSelectedAnimal(animal);
                        setMatchResult(null);
                        setAttemptCount(0);
                        resetTranscript();
                      }}
                      aria-label={`Practice saying ${animal.word} with the /${animal.targetSound}/ sound`}
                      className="group w-full bg-white dark:bg-navy/40 rounded-3xl p-5 min-h-[120px] text-center cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500 focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 outline-none"
                    >
                      <span className="text-5xl block mb-4 group-hover:scale-110 transition-transform duration-500">
                        {animal.imageEmoji}
                      </span>
                      <p className="font-heading italic text-navy text-sm mb-2">
                        {animal.word}
                      </p>
                      <span
                        className={`inline-block text-xs font-body font-medium px-3 py-1 rounded-full ${diff.bg} ${diff.text}`}
                      >
                        /{animal.targetSound}/
                      </span>
                    </button>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="font-heading italic text-xl text-muted">
                No animals found in this environment yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Animal Detail Modal */}
      <AnimatePresence>
        {selectedAnimal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              onClick={() => {
                setSelectedAnimal(null);
                setMatchResult(null);
                resetTranscript();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Panel */}
            <motion.div
              className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.12)] overflow-hidden"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {/* Header area */}
              <div className="bg-ice px-8 py-10 text-center relative">
                <button
                  onClick={() => {
                    setSelectedAnimal(null);
                    setMatchResult(null);
                    resetTranscript();
                  }}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/60 text-muted hover:bg-white hover:text-navy transition-colors duration-300 cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>

                <motion.span
                  className="text-7xl block mb-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                >
                  {selectedAnimal.imageEmoji}
                </motion.span>
                <h2 className="font-heading italic text-3xl text-navy">
                  {selectedAnimal.word}
                </h2>
                {getTranslatedWord(selectedAnimal, displayLang) && (
                  <p className="font-body text-muted text-sm mt-2">
                    {getTranslatedWord(selectedAnimal, displayLang)}
                  </p>
                )}
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Target sound + difficulty */}
                <div className="flex items-center justify-center gap-3 mb-6">
                  <span className="text-sm font-body text-muted">Target Sound:</span>
                  <span className="bg-teal/10 text-teal font-heading italic text-lg px-4 py-1.5 rounded-full">
                    /{selectedAnimal.targetSound}/
                  </span>
                  {(() => {
                    const diff = DIFFICULTY_LABELS[selectedAnimal.difficulty] || DIFFICULTY_LABELS.easy;
                    return (
                      <span className={`text-xs font-body font-medium px-3 py-1 rounded-full ${diff.bg} ${diff.text}`}>
                        {selectedAnimal.difficulty}
                      </span>
                    );
                  })()}
                </div>

                {/* Mouth Position Hint */}
                <div className="bg-ice rounded-2xl p-5 mb-6">
                  <h3 className="font-heading italic text-navy text-base mb-2">
                    Mouth Position
                  </h3>
                  <p className="text-sm font-body text-muted leading-relaxed">
                    {MOUTH_HINTS[selectedAnimal.targetSound] ||
                      'Place your tongue and lips in the correct position and try saying the sound clearly!'}
                  </p>
                </div>

                {/* Speech Recognition Section */}
                {!isSupported ? (
                  <div className="text-center py-3 px-4 bg-coral/10 text-coral rounded-xl text-sm font-body font-medium">
                    Speech recognition requires Chrome or Edge browser
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Say It / Listening / Processing Button */}
                    {!matchResult && (
                      <MagneticButton
                        onClick={() => startListening()}
                        disabled={isListening || isProcessing}
                        aria-label={isListening ? 'Listening for your voice' : isProcessing ? 'Requesting microphone access' : `Say the word ${selectedAnimal.word}`}
                        className={`w-full flex items-center justify-center gap-3 font-body font-semibold py-4 rounded-xl transition-all duration-500 ${
                          isListening
                            ? 'bg-coral text-white'
                            : isProcessing
                            ? 'bg-coral/60 text-white opacity-80'
                            : 'bg-teal text-white'
                        } ${(isListening || isProcessing) ? 'opacity-90 cursor-wait' : ''}`}
                      >
                        {isProcessing ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="flex items-center justify-center"
                            >
                              <Mic size={20} />
                            </motion.div>
                            Connecting...
                          </>
                        ) : isListening ? (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                              className="flex items-center justify-center"
                            >
                              <Mic size={20} />
                            </motion.div>
                            Listening...
                          </>
                        ) : (
                          <>
                            <Mic size={20} />
                            Say it!
                          </>
                        )}
                      </MagneticButton>
                    )}
                    {micError && (
                      <button
                        onClick={() => setShowMicModal(true)}
                        className="bg-coral/10 rounded-xl px-4 py-3 w-full cursor-pointer hover:bg-coral/20 transition-colors"
                      >
                        <p className="text-coral text-sm font-body">Microphone error. Tap here for help.</p>
                      </button>
                    )}

                    {/* Match Result */}
                    {matchResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="text-center space-y-3"
                      >
                        {matchResult.matched ? (
                          <>
                            <div className="flex items-center justify-center gap-2 text-success">
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: [0, 1.2, 0.95, 1] }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                              >
                                <CheckCircle size={28} />
                              </motion.div>
                              <span className="font-heading italic text-xl">
                                Great job!
                              </span>
                            </div>
                            <p className="text-sm font-body text-muted">
                              You said{' '}
                              <span className="font-semibold text-navy">
                                &ldquo;{matchResult.transcript}&rdquo;
                              </span>
                            </p>
                            <p className="text-xs font-body text-success font-medium">
                              +10 XP earned!
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-heading italic text-coral text-xl">
                              Almost! Try again
                            </p>
                            <p className="text-sm font-body text-muted">
                              You said{' '}
                              <span className="font-semibold text-navy dark:text-white">
                                &ldquo;{matchResult.transcript}&rdquo;
                              </span>
                            </p>
                            <p className="text-xs font-body text-muted">
                              Score: {Math.round(matchResult.score * 100)}%
                            </p>
                            {attemptCount >= 2 && selectedAnimal && MOUTH_HINTS[selectedAnimal.targetSound] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-teal/10 rounded-xl p-4 mt-2"
                              >
                                <p className="text-xs font-body text-teal font-semibold mb-1">
                                  Hint: /{selectedAnimal.targetSound}/ sound
                                </p>
                                <p className="text-xs font-body text-muted leading-relaxed">
                                  {MOUTH_HINTS[selectedAnimal.targetSound]}
                                </p>
                              </motion.div>
                            )}
                          </>
                        )}

                        <MagneticButton
                          onClick={handleTryAgain}
                          className="mt-3 w-full flex items-center justify-center gap-2 bg-teal text-white font-body font-semibold py-4 rounded-xl"
                        >
                          <Mic size={18} />
                          Try Again
                        </MagneticButton>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} onRetry={() => startListening()} errorMessage={micError} />
    </div>
  );
}
