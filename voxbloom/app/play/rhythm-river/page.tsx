'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Mic, CheckCircle, Volume2, RotateCcw, Trophy } from 'lucide-react';
import exercisesData from '@/data/exercises.json';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD, speakText } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';
import { VoicePoweredOrb } from '@/components/ui/voice-powered-orb';

type Difficulty = 'easy' | 'medium' | 'hard';

const exercises = exercisesData['rhythm-river'];

const DIFFICULTY_TABS: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

export default function RhythmRiverPage() {
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('easy');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [sentenceResults, setSentenceResults] = useState<
    Record<string, { score: number; matched: boolean; transcript: string }>
  >({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [breathCount, setBreathCount] = useState(0);

  const {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    error: micError,
    startListening,
    resetTranscript,
  } = useSpeechRecognition();

  const [showMicModal, setShowMicModal] = useState(false);
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  const addXP = useAppStore((s) => s.addXP);
  const addExerciseResult = useAppStore((s) => s.addExerciseResult);

  const filtered = exercises.filter(
    (e) => e.difficulty === activeDifficulty
  );

  const allCompleted = filtered.length > 0 && filtered.every(
    (e) => sentenceResults[e.id]?.matched
  );
  const completedCount = filtered.filter(
    (e) => sentenceResults[e.id]?.matched
  ).length;

  // Breathing counter
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathCount((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleListen = useCallback(
    async (sentence: string) => {
      setIsSpeaking(true);
      try {
        await speakText(sentence);
      } catch {
        // speech synthesis not supported
      } finally {
        setIsSpeaking(false);
      }
    },
    []
  );

  const handleTryIt = useCallback(
    (idx: number) => {
      resetTranscript();
      setActiveSpeechIdx(idx);
      startListening();
    },
    [resetTranscript, startListening]
  );

  useEffect(() => {
    if (transcript && activeSpeechIdx !== null) {
      const exercise = filtered[activeSpeechIdx];
      if (!exercise) return;

      const score = compareSpeech(exercise.sentence, transcript);
      const matched = score >= MATCH_THRESHOLD;

      setSentenceResults((prev) => ({
        ...prev,
        [exercise.id]: { score, matched, transcript },
      }));

      if (matched) {
        addXP(10);
        addExerciseResult({
          exerciseId: exercise.id,
          gameType: 'rhythm-river',
          score: Math.round(score * 100),
          maxScore: 100,
          completedAt: new Date().toISOString(),
          soundsTargeted: exercise.sentence
            .toLowerCase()
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w.replace(/[^a-z]/g, '').charAt(0))
            .filter(Boolean),
        });
      }

      setActiveSpeechIdx(null);
    }
  }, [transcript, activeSpeechIdx, filtered, addXP, addExerciseResult]);

  const handleReplay = useCallback(() => {
    const filteredIds = new Set(filtered.map((e) => e.id));
    setSentenceResults((prev) => {
      const next = { ...prev };
      for (const id of filteredIds) {
        delete next[id];
      }
      return next;
    });
    setActiveIndex(null);
    setActiveSpeechIdx(null);
    resetTranscript();
    setRoundNumber((prev) => prev + 1);
  }, [filtered, resetTranscript]);

  // Floating elements - gentle, slow leaf/nature motifs
  const floatingElements = [
    { emoji: '🍃', top: '15%', left: '8%', dur: 8 },
    { emoji: '🍂', top: '35%', left: '85%', dur: 10 },
    { emoji: '🌿', top: '60%', left: '12%', dur: 9 },
    { emoji: '🍀', top: '75%', left: '90%', dur: 11 },
  ];

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Film grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]">
        <svg className="w-full h-full">
          <filter id="grain-rr">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-rr)" />
        </svg>
      </div>

      {/* Floating decorative elements */}
      {floatingElements.map((el, i) => (
        <motion.span
          key={i}
          className="fixed text-2xl opacity-15 pointer-events-none"
          style={{ top: el.top, left: el.left }}
          animate={{
            y: [0, -12, 4, -8, 0],
            x: [0, 6, -4, 8, 0],
            rotate: [0, 8, -5, 3, 0],
          }}
          transition={{
            duration: el.dur,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {el.emoji}
        </motion.span>
      ))}

      {/* Decorative blurred circles */}
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-teal/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-32 -right-32 w-80 h-80 bg-violet/5 rounded-full blur-[100px] pointer-events-none" />

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

            <div className="flex items-center gap-4">
              <div className="font-body text-sm text-muted font-medium bg-mint px-4 py-1.5 rounded-full">
                {completedCount}/{filtered.length} complete
              </div>
              <div className="bg-violet/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="text-violet text-sm">&#9889;</span>
                <span className="text-violet font-body font-bold text-sm">
                  {completedCount * 10} XP
                </span>
              </div>
              {roundNumber > 1 && (
                <span className="text-xs bg-teal/8 text-teal font-body font-semibold px-3 py-1 rounded-full">
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
              Rhythm River
            </h1>
            <p className="font-body text-muted text-lg max-w-lg">
              Float down the river and practice speaking with natural rhythm.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-10 sm:py-14">
        {/* Difficulty tabs — editorial pill selectors */}
        <div className="flex items-center gap-3 mb-10">
          {DIFFICULTY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveDifficulty(tab.key);
                setActiveIndex(null);
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-body font-semibold transition-all duration-500 ease-out ${
                activeDifficulty === tab.key
                  ? 'bg-teal text-white shadow-[0_4px_16px_rgba(92,77,154,0.2)]'
                  : 'bg-mint text-muted hover:bg-teal/8 hover:text-teal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* All completed banner */}
        {allCompleted && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 mb-10 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="text-coral" size={24} />
              <h3 className="font-heading italic font-semibold text-navy text-xl">
                Difficulty Complete!
              </h3>
            </div>
            <p className="text-sm font-body text-muted mb-5">
              You&apos;ve mastered all {filtered.length} sentences at the {activeDifficulty} level.
            </p>
            <MagneticButton
              onClick={handleReplay}
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal text-white rounded-xl font-body font-medium text-sm"
            >
              <RotateCcw size={16} />
              Play Again
            </MagneticButton>
          </motion.div>
        )}

        {/* Breathing exercise */}
        <motion.section
          className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 sm:p-10 mb-10 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
        >
          <h3 className="font-heading italic font-semibold text-navy text-lg mb-2">
            Take a Deep Breath
          </h3>
          <p className="text-sm font-body text-muted mb-6 max-w-md mx-auto">
            Before you start, take a slow deep breath in... and out. This helps your voice flow smoothly.
          </p>

          {/* Voice-reactive orb breathing guide */}
          <div className="relative w-40 h-40 mx-auto mb-4">
            <VoicePoweredOrb
              enableVoiceControl={false}
              hue={0}
              className="rounded-full overflow-hidden"
            />
            {/* Breathing label overlay — centered inside the orb */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-white text-sm font-body font-bold tracking-wide drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {breathCount % 2 === 0 ? 'Breathe In' : 'Breathe Out'}
              </span>
            </motion.div>
            {/* Pulsing ring synced to breath */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-teal/30 pointer-events-none"
              animate={{ scale: breathCount % 2 === 0 ? [1, 1.15] : [1.15, 1], opacity: [0.4, 0.1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-xs font-body text-muted">Follow the orb</p>
        </motion.section>

        {/* Sentence cards — expandable accordion rows */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeDifficulty}-${roundNumber}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-4"
          >
            {filtered.map((exercise, idx) => {
              const isActive = activeIndex === idx;
              const words = exercise.sentence.split(' ');
              const result = sentenceResults[exercise.id];
              const isCurrentlyListening = isListening && activeSpeechIdx === idx;

              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5, ease: 'easeOut' }}
                  className={`bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out cursor-pointer ${
                    result?.matched
                      ? 'ring-1 ring-success/30 bg-success/3'
                      : isActive
                        ? 'shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-0.5'
                        : 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-0.5'
                  }`}
                  onClick={() => setActiveIndex(isActive ? null : idx)}
                >
                  <div className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Sentence with word-by-word entrance */}
                        <p className="font-heading italic text-xl sm:text-2xl font-semibold text-navy leading-relaxed">
                          {words.map((word, wi) => (
                            <motion.span
                              key={wi}
                              className="inline-block mr-2"
                              initial={isActive ? { opacity: 0, y: 6 } : {}}
                              animate={isActive ? { opacity: 1, y: 0 } : {}}
                              transition={{ delay: wi * 0.08, duration: 0.5, ease: 'easeOut' }}
                            >
                              {word}
                            </motion.span>
                          ))}
                        </p>

                        {/* Syllable dots with gentle pulse */}
                        <div className="flex items-center gap-2 mt-4">
                          {[...Array(exercise.syllables)].map((_, si) => (
                            <motion.div
                              key={si}
                              className="w-2.5 h-2.5 rounded-full bg-teal/25"
                              animate={
                                isActive
                                  ? {
                                      backgroundColor: [
                                        'rgba(92,77,154,0.15)',
                                        'rgba(92,77,154,0.7)',
                                        'rgba(92,77,154,0.15)',
                                      ],
                                    }
                                  : {}
                              }
                              transition={{
                                duration: 0.8,
                                delay: si * 0.25,
                                repeat: isActive ? Infinity : 0,
                                repeatDelay: exercise.syllables * 0.25,
                                ease: 'easeInOut',
                              }}
                            />
                          ))}
                          <span className="text-xs font-body text-muted ml-1">
                            {exercise.syllables} beats
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {result?.matched && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, duration: 0.5 }}
                          >
                            <CheckCircle size={20} className="text-success" />
                          </motion.div>
                        )}
                        <span className="text-xs font-body font-semibold px-3 py-1.5 rounded-full bg-teal/8 text-teal">
                          {exercise.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Expanded controls — accordion content */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-teal/8">
                            {/* Listen button */}
                            <MagneticButton
                              onClick={() => handleListen(exercise.sentence)}
                              disabled={isSpeaking}
                              className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-xl font-body font-medium text-sm disabled:opacity-60"
                            >
                              {isSpeaking ? (
                                <motion.span
                                  animate={{ scale: [1, 1.15, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                  <Volume2 size={16} />
                                </motion.span>
                              ) : (
                                <Play size={16} />
                              )}
                              {isSpeaking ? 'Speaking...' : 'Listen'}
                            </MagneticButton>

                            {/* Try It button */}
                            {isSupported ? (
                              <MagneticButton
                                onClick={() => handleTryIt(idx)}
                                disabled={isCurrentlyListening}
                                className="flex items-center gap-2 px-5 py-2.5 bg-coral text-white rounded-xl font-body font-medium text-sm disabled:opacity-60"
                              >
                                {isCurrentlyListening ? (
                                  <motion.span
                                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                  >
                                    <Mic size={16} />
                                  </motion.span>
                                ) : (
                                  <Mic size={16} />
                                )}
                                {isCurrentlyListening ? 'Listening...' : 'Try It!'}
                              </MagneticButton>
                            ) : (
                              <span className="text-xs font-body text-muted italic">
                                Speech recognition requires Chrome or Edge browser
                              </span>
                            )}

                            {micError && (
                              <div className="bg-rose/8 rounded-xl px-4 py-2 mt-1">
                                <p className="text-rose text-xs font-body">{micError}</p>
                              </div>
                            )}

                            {/* Retry button */}
                            {result?.matched && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSentenceResults((prev) => {
                                    const next = { ...prev };
                                    delete next[exercise.id];
                                    return next;
                                  });
                                  resetTranscript();
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-mint text-muted rounded-xl font-body font-medium text-sm hover:bg-slate/10 transition-all duration-500"
                              >
                                <RotateCcw size={14} />
                                Retry
                              </button>
                            )}

                            {/* Result badge */}
                            {result && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className={`flex items-center gap-1.5 text-sm font-body font-semibold px-4 py-2 rounded-full ${
                                  result.matched
                                    ? 'bg-success/10 text-success'
                                    : 'bg-coral/10 text-coral'
                                }`}
                              >
                                {result.matched ? (
                                  <>
                                    <CheckCircle size={14} />
                                    +10 XP
                                  </>
                                ) : (
                                  <>Almost! Try again ({Math.round(result.score * 100)}%)</>
                                )}
                              </motion.span>
                            )}
                          </div>

                          {/* Word-by-word comparison display */}
                          {result && (
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.5, ease: 'easeOut' }}
                              className="mt-5 pt-5 border-t border-teal/8"
                            >
                              <p className="text-xs font-body text-muted mb-3 font-medium uppercase tracking-wide">
                                Word match
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {words.map((word, wi) => {
                                  const normalizedWord = word
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]/gi, '');
                                  const normalizedTranscript = result.transcript
                                    .toLowerCase()
                                    .replace(/[^a-z0-9\s]/gi, '');
                                  const wordFound =
                                    normalizedTranscript.includes(normalizedWord);

                                  return (
                                    <span
                                      key={wi}
                                      className={`px-3 py-1 rounded-lg text-sm font-body font-semibold transition-all duration-500 ${
                                        wordFound
                                          ? 'bg-success/10 text-success'
                                          : 'bg-rose/10 text-rose'
                                      }`}
                                    >
                                      {word}
                                    </span>
                                  );
                                })}
                              </div>
                              <p className="text-xs font-body text-muted mt-3 italic">
                                You said: &quot;{result.transcript}&quot;
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </main>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
    </div>
  );
}
