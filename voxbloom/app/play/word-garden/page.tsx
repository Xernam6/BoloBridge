'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Languages, Mic, CheckCircle, RotateCcw, Trophy } from 'lucide-react';
import exercisesData from '@/data/exercises.json';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { AnimatedTabs } from '@/components/ui/AnimatedTabs';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';

const exercises = exercisesData['word-garden'] as Array<{
  id: string;
  word: string;
  wordHindi?: string;
  wordSpanish?: string;
  wordAfrikaans?: string;
  wordBengali?: string;
  wordTagalog?: string;
  imageEmoji: string;
  difficulty: string;
  category: string;
}>;

const CATEGORIES = [
  { key: 'Animals', emoji: '🐾', label: 'Animals' },
  { key: 'Food', emoji: '🍎', label: 'Food' },
  { key: 'Colors', emoji: '🎨', label: 'Colors' },
  { key: 'Family', emoji: '👨\u200D👩\u200D👧\u200D👦', label: 'Family' },
  { key: 'Actions', emoji: '🏃', label: 'Actions' },
  { key: 'Feelings', emoji: '😊', label: 'Feelings' },
  { key: 'Nature', emoji: '🌿', label: 'Nature' },
  { key: 'Body', emoji: '🫀', label: 'Body' },
  { key: 'Vehicles', emoji: '🚗', label: 'Vehicles' },
  { key: 'School', emoji: '📚', label: 'School' },
];

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  af: 'Afrikaans',
  bn: 'Bengali',
  tl: 'Tagalog',
};

interface CardResult {
  score: number;
  matched: boolean;
  transcript: string;
}

function getTranslation(exercise: Record<string, unknown>, lang: string): string | undefined {
  const keyMap: Record<string, string> = {
    hi: 'wordHindi', es: 'wordSpanish', af: 'wordAfrikaans',
    bn: 'wordBengali', tl: 'wordTagalog',
  };
  const key = keyMap[lang];
  if (key && typeof exercise[key] === 'string') return exercise[key] as string;
  return undefined;
}

export default function WordGardenPage() {
  const [activeCategory, setActiveCategory] = useState('Animals');
  const [showTranslation, setShowTranslation] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [grownWords, setGrownWords] = useState<Set<string>>(new Set());
  const [speakingCardId, setSpeakingCardId] = useState<string | null>(null);
  const [cardResults, setCardResults] = useState<Record<string, CardResult>>({});
  const [roundNumber, setRoundNumber] = useState(1);

  const [showMicModal, setShowMicModal] = useState(false);

  const { isSupported, isListening, isProcessing, transcript, error: micError, startListening, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  const addXP = useAppStore((s) => s.addXP);
  const appLanguage = useAppStore((s) => s.appLanguage);
  const profile = useAppStore((s) => s.profile);

  const displayLang = profile?.language || appLanguage || 'en';

  const filteredExercises = exercises.filter(
    (e) => e.category === activeCategory
  );

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setGrownWords((g) => new Set(g).add(id));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!transcript || !speakingCardId) return;

    const exercise = exercises.find((e) => e.id === speakingCardId);
    if (!exercise) return;

    const score = compareSpeech(exercise.word, transcript);
    const matched = score >= MATCH_THRESHOLD;

    setCardResults((prev) => ({
      ...prev,
      [speakingCardId]: { score, matched, transcript },
    }));

    if (matched) {
      setGrownWords((g) => new Set(g).add(speakingCardId));
      addXP(5);
    }

    setSpeakingCardId(null);
    resetTranscript();
  }, [transcript, speakingCardId, addXP, resetTranscript]);

  const handleMicClick = (e: React.MouseEvent, exerciseId: string) => {
    e.stopPropagation();
    setSpeakingCardId(exerciseId);
    setCardResults((prev) => {
      const next = { ...prev };
      delete next[exerciseId];
      return next;
    });
    resetTranscript();
    startListening();
  };

  const handleReplay = useCallback(() => {
    setFlippedCards(new Set());
    setGrownWords(new Set());
    setCardResults({});
    setSpeakingCardId(null);
    resetTranscript();
    setRoundNumber((prev) => prev + 1);
  }, [resetTranscript]);

  const gardenSize = grownWords.size;
  const gardenFlowers = ['🌱', '🌿', '🌷', '🌸', '🌻', '🌺', '🌹', '💐'];
  const allFlipped = filteredExercises.every((e) => grownWords.has(e.id));

  return (
    <div className="min-h-screen bg-cream">
      {/* Film grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
        <svg className="w-full h-full">
          <filter id="grain-wg">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-wg)" />
        </svg>
      </div>

      {/* Header */}
      <header className="bg-cream border-b border-teal/5">
        <div className="max-w-5xl mx-auto px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 text-muted hover:text-teal transition-colors duration-500"
            >
              <ArrowLeft size={18} />
              <span className="font-body text-sm font-medium">Back to Games</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="bg-teal/8 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-teal text-sm">&#9733;</span>
                <span className="text-teal font-body font-semibold text-sm">
                  {gardenSize * 5} XP
                </span>
              </div>
              {roundNumber > 1 && (
                <span className="text-xs bg-violet/10 text-violet font-body font-semibold px-3 py-1 rounded-full">
                  Round {roundNumber}
                </span>
              )}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="font-heading italic text-4xl sm:text-5xl text-teal mb-2">
              Word Garden
            </h1>
            <p className="font-body text-muted text-lg max-w-lg">
              Grow a beautiful garden by learning new words. Tap a card to reveal it, then say it aloud.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 sm:py-14">
        {/* Speech recognition browser note */}
        {!isSupported && (
          <div className="mb-6 px-5 py-3 rounded-xl bg-coral/8 text-coral text-sm text-center font-body">
            Speech recognition requires Chrome or Edge
          </div>
        )}

        {/* Garden visualization */}
        <motion.section
          className="bg-mint rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 sm:p-10 mb-12 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
        >
          {/* 4x4 garden grid */}
          <div className="flex justify-center mb-6" style={{ perspective: '800px' }}>
            <div
              className="grid grid-cols-4 gap-3 p-6 bg-cream/60 rounded-2xl"
              style={{ transform: 'rotateX(12deg) rotateZ(-1deg)' }}
            >
              {[...Array(16)].map((_, i) => {
                const isPlanted = i < gardenSize;
                const isCurrent = i === gardenSize && gardenSize < 16;
                return (
                  <div
                    key={i}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      isPlanted
                        ? 'bg-teal/8'
                        : isCurrent
                          ? 'bg-teal/5 border-2 border-dashed border-teal/30'
                          : 'bg-slate/5 opacity-40'
                    }`}
                  >
                    {isPlanted && (
                      <motion.span
                        className="text-2xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                      >
                        {gardenFlowers[i % gardenFlowers.length]}
                      </motion.span>
                    )}
                    {isCurrent && (
                      <motion.span
                        className="text-teal/40 text-xl"
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        🌱
                      </motion.span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-sm font-body font-medium text-muted bg-cream/50 px-6 py-3 rounded-full inline-flex mx-auto">
            <span>🌱 {gardenSize} Planted</span>
            <span>🌸 {Math.floor(gardenSize * 0.7)} Bloomed</span>
            <span className="font-semibold text-teal">
              🌻 {Math.max(0, filteredExercises.length - gardenSize)} to Go
            </span>
          </div>

          {/* Replay button when all cards in category are done */}
          {allFlipped && filteredExercises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-6 space-y-3"
            >
              <div className="flex items-center justify-center gap-2 text-success font-body font-semibold">
                <Trophy size={18} />
                Category complete!
              </div>
              <MagneticButton
                onClick={handleReplay}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-xl text-sm font-body font-medium"
              >
                <RotateCcw size={14} />
                Play Again
              </MagneticButton>
            </motion.div>
          )}
        </motion.section>

        {/* Controls row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 mb-10">
          {/* Category tabs — animated pill selectors */}
          <AnimatedTabs
            tabs={CATEGORIES.map((cat) => ({ key: cat.key, label: cat.label, icon: cat.emoji }))}
            activeTab={activeCategory}
            onTabChange={(key) => setActiveCategory(key)}
          />

          {/* Language toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-500 ${
              showTranslation
                ? 'bg-teal/10 text-teal'
                : 'bg-mint text-muted hover:text-teal'
            }`}
          >
            <Languages size={16} />
            {showTranslation
              ? `${LANGUAGE_LABELS[displayLang] || displayLang} On`
              : `Show ${LANGUAGE_LABELS[displayLang] || displayLang}`}
          </button>
        </div>

        {/* Word cards grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${roundNumber}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5"
          >
            {filteredExercises.map((exercise, idx) => {
              const isFlipped = flippedCards.has(exercise.id);
              const isGrown = grownWords.has(exercise.id);
              const isSpeaking = speakingCardId === exercise.id && isListening;
              const result = cardResults[exercise.id];
              const translation = getTranslation(exercise, displayLang);

              return (
                <TiltCard key={exercise.id} tiltAmount={6} className="group">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.06, duration: 0.5, ease: 'easeOut' }}
                    onClick={() => toggleFlip(exercise.id)}
                    className="relative w-full aspect-square"
                    style={{ perspective: '800px' }}
                    aria-label={`Word card: ${exercise.word}`}
                  >
                    <motion.div
                      className="w-full h-full"
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Front face */}
                      <div
                        className={`absolute inset-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col items-center justify-center p-4 transition-all duration-500 ${
                          isGrown
                            ? 'bg-success/5 border border-success/15'
                            : 'bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
                        }`}
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-5xl mb-3">{exercise.imageEmoji}</span>
                        {isGrown && (
                          <span className="absolute top-3 right-3 text-lg">🌻</span>
                        )}
                        <span className="text-xs font-body text-muted/60">Tap to reveal</span>
                      </div>

                      {/* Back face */}
                      <div
                        className="absolute inset-0 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] bg-white flex flex-col items-center justify-center p-4"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <span className="text-3xl mb-2">{exercise.imageEmoji}</span>
                        <span className="font-heading italic font-semibold text-navy text-lg">
                          {exercise.word}
                        </span>
                        {(showTranslation || isFlipped) && translation && (
                          <span className="text-sm font-body text-violet mt-1">
                            {translation}
                          </span>
                        )}

                        {/* Speech recognition mic button */}
                        {isSupported && (
                          <div className="mt-2 flex flex-col items-center gap-1">
                            {result?.matched ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, duration: 0.5 }}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle size={18} className="text-success" />
                                <span className="text-xs font-body font-medium text-success">
                                  Great!
                                </span>
                              </motion.div>
                            ) : (
                              <>
                                <motion.div
                                  className={`rounded-full p-2 cursor-pointer transition-colors duration-500 ${
                                    isSpeaking
                                      ? 'bg-coral/15 text-coral'
                                      : 'bg-teal/8 text-teal hover:bg-teal/15'
                                  }`}
                                  onClick={(e) => handleMicClick(e, exercise.id)}
                                  animate={
                                    isSpeaking
                                      ? { scale: [1, 1.15, 1] }
                                      : { scale: 1 }
                                  }
                                  transition={
                                    isSpeaking
                                      ? {
                                          duration: 1.5,
                                          repeat: Infinity,
                                          ease: 'easeInOut',
                                        }
                                      : {}
                                  }
                                  role="button"
                                  aria-label={`Say ${exercise.word}`}
                                >
                                  <Mic size={16} />
                                </motion.div>
                                {result && !result.matched && (
                                  <span className="text-[10px] font-body font-medium text-coral">
                                    Try again
                                  </span>
                                )}
                                {!result && !isSpeaking && (
                                  <span className="text-[10px] font-body text-muted">
                                    Say it
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.button>
                </TiltCard>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Upcoming word seed token */}
        {filteredExercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-4 mt-12"
          >
            <div className="bg-teal/6 px-5 py-3 rounded-full flex items-center gap-3 font-body">
              <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                <span className="text-teal text-sm">&#10044;</span>
              </div>
              <span className="font-medium text-teal text-sm">
                Next: {filteredExercises.find(e => !grownWords.has(e.id))?.word || 'All done!'}
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-30">
              {[...Array(Math.min(4, Math.max(0, filteredExercises.filter(e => !grownWords.has(e.id)).length - 1)))].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-slate/10 flex items-center justify-center"
                >
                  <span className="text-slate/40 text-xs">&#8226;</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {micError && (
          <button
            onClick={() => setShowMicModal(true)}
            className="bg-coral/10 rounded-xl px-5 py-3 mt-6 max-w-sm mx-auto block cursor-pointer hover:bg-coral/20 transition-colors"
          >
            <p className="text-coral text-sm font-body text-center">Microphone error. Tap here for help.</p>
          </button>
        )}
      </main>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} onRetry={() => startListening()} errorMessage={micError} />
    </div>
  );
}
