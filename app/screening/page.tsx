'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD } from '@/lib/speech';
import { MOUTH_HINTS } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';
import { NeuralPaths } from '@/components/ui/background-patterns';
import milestones from '@/data/milestones.json';
import type { AssessmentResult, PhonemeResult, RiskLevel } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types for internal wizard state                                     */
/* ------------------------------------------------------------------ */

interface TestableCategory {
  id: string;
  name: string;
  description: string;
  phonemes: TestablePhoneme[];
}

interface TestablePhoneme {
  sound: string;
  ageExpected: number;
  word: string;
  emoji: string;
  sentence: string;
}

interface PhonemeAttemptState {
  bestScore: number;
  attempts: number;
  skipped: boolean;
  lastTranscript: string;
  /** Dynamic Assessment (test-teach-retest) */
  preHintScore?: number;
  postHintScore?: number;
  hintProvided?: boolean;
  phase: 'test' | 'hint' | 'retest' | 'done';
}

/* ------------------------------------------------------------------ */
/*  Slide animation variants                                            */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const MAX_ATTEMPTS = 2;

const AGE_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ScreeningPage() {
  const router = useRouter();
  const { profile, addAssessmentResult, appLanguage } = useAppStore();
  const { t } = useTranslation();

  /* -- Screening age: use profile age if available, or let user pick -- */
  const [screeningAge, setScreeningAge] = useState<number | null>(
    profile?.age ?? null
  );

  // Sync screeningAge when Zustand hydrates profile from localStorage
  const hasHydratedAge = useRef(false);
  useEffect(() => {
    if (!hasHydratedAge.current && profile?.age != null) {
      setScreeningAge(profile.age);
      hasHydratedAge.current = true;
    }
  }, [profile?.age]);

  const speechLang = profile?.language ?? appLanguage ?? 'en';

  const {
    isListening,
    isProcessing,
    transcript,
    confidence,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useSpeechRecognition(speechLang);

  const [showMicModal, setShowMicModal] = useState(false);
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  /* -- Wizard step management -- */
  const [wizardStep, setWizardStep] = useState(0); // 0 = intro, last = results
  const [direction, setDirection] = useState(1);

  /* -- Build testable categories from milestones -- */
  const testableCategories: TestableCategory[] = useMemo(() => {
    if (screeningAge === null) return [];
    return milestones.categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        phonemes: cat.phonemes.filter((p) => p.ageExpected <= screeningAge),
      }))
      .filter((cat) => cat.phonemes.length > 0);
  }, [screeningAge]);

  const totalSteps = 1 + testableCategories.length + 1; // intro + categories + results

  /* -- Per-phoneme state tracking -- */
  const [phonemeStates, setPhonemeStates] = useState<
    Record<string, PhonemeAttemptState>
  >({});

  /* -- Current phoneme index within current category -- */
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);

  /* -- Track when a result has been received for the current attempt -- */
  const [hasResult, setHasResult] = useState(false);
  const processedTranscriptRef = useRef('');

  /* -- Get current category (only valid during assessment steps) -- */
  const currentCategoryIndex = wizardStep - 1;
  const currentCategory =
    currentCategoryIndex >= 0 && currentCategoryIndex < testableCategories.length
      ? testableCategories[currentCategoryIndex]
      : null;
  const currentPhoneme = currentCategory
    ? currentCategory.phonemes[currentPhonemeIndex] ?? null
    : null;

  /* -- Phoneme state key helper -- */
  const phonemeKey = useCallback(
    (catId: string, sound: string) => `${catId}::${sound}`,
    []
  );

  const getPhonemeState = useCallback(
    (catId: string, sound: string): PhonemeAttemptState => {
      const key = phonemeKey(catId, sound);
      return (
        phonemeStates[key] ?? {
          bestScore: 0,
          attempts: 0,
          skipped: false,
          lastTranscript: '',
          phase: 'test' as const,
        }
      );
    },
    [phonemeStates, phonemeKey]
  );

  /* -- Process speech recognition result (test-teach-retest) -- */
  useEffect(() => {
    if (
      !transcript ||
      !currentPhoneme ||
      !currentCategory ||
      isListening ||
      processedTranscriptRef.current === transcript
    ) {
      return;
    }
    processedTranscriptRef.current = transcript;

    const score = compareSpeech(currentPhoneme.word, transcript);
    const key = phonemeKey(currentCategory.id, currentPhoneme.sound);
    const prev = getPhonemeState(currentCategory.id, currentPhoneme.sound);

    const soundLower = currentPhoneme.sound.replace(/\//g, '').toLowerCase();
    const hasHint = soundLower in MOUTH_HINTS;

    if (prev.phase === 'test' || prev.phase === undefined) {
      // Initial test phase
      const needsHint = score < MATCH_THRESHOLD && hasHint && prev.attempts < MAX_ATTEMPTS - 1;
      setPhonemeStates((s) => ({
        ...s,
        [key]: {
          bestScore: Math.max(prev.bestScore, score),
          attempts: prev.attempts + 1,
          skipped: false,
          lastTranscript: transcript,
          preHintScore: score,
          phase: needsHint ? 'hint' : 'done',
          hintProvided: needsHint,
        },
      }));
    } else if (prev.phase === 'retest') {
      // Retest after hint
      const stimulable = score - (prev.preHintScore ?? 0) >= 0.15;
      setPhonemeStates((s) => ({
        ...s,
        [key]: {
          ...prev,
          bestScore: Math.max(prev.bestScore, score),
          attempts: prev.attempts + 1,
          lastTranscript: transcript,
          postHintScore: score,
          phase: 'done',
          hintProvided: true,
        },
      }));
    } else {
      // Fallback
      setPhonemeStates((s) => ({
        ...s,
        [key]: {
          ...prev,
          bestScore: Math.max(prev.bestScore, score),
          attempts: prev.attempts + 1,
          lastTranscript: transcript,
          phase: 'done',
        },
      }));
    }

    setHasResult(true);
  }, [
    transcript,
    isListening,
    currentPhoneme,
    currentCategory,
    phonemeKey,
    getPhonemeState,
  ]);

  /* -- Cleanup: stop listening on unmount -- */
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  /* -- Navigation helpers -- */
  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > wizardStep ? 1 : -1);
      setWizardStep(step);
      setCurrentPhonemeIndex(0);
      setHasResult(false);
      processedTranscriptRef.current = '';
      resetTranscript();
    },
    [wizardStep, resetTranscript]
  );

  const handleBeginScreening = () => {
    if (testableCategories.length === 0) return;
    goToStep(1);
  };

  const handleNextSound = () => {
    if (!currentCategory) return;
    setHasResult(false);
    processedTranscriptRef.current = '';
    resetTranscript();

    if (currentPhonemeIndex < currentCategory.phonemes.length - 1) {
      setCurrentPhonemeIndex((i) => i + 1);
    } else {
      // Move to next category or results
      goToStep(wizardStep + 1);
    }
  };

  const handleSkip = () => {
    if (!currentCategory || !currentPhoneme) return;
    const key = phonemeKey(currentCategory.id, currentPhoneme.sound);
    setPhonemeStates((s) => ({
      ...s,
      [key]: {
        ...(s[key] ?? { bestScore: 0, attempts: 0, lastTranscript: '', phase: 'test' as const }),
        skipped: true,
      },
    }));
    handleNextSound();
  };

  /** Accept hint and move to retest phase */
  const handleAcceptHint = () => {
    if (!currentCategory || !currentPhoneme) return;
    const key = phonemeKey(currentCategory.id, currentPhoneme.sound);
    setPhonemeStates((s) => ({
      ...s,
      [key]: {
        ...(s[key]!),
        phase: 'retest',
      },
    }));
    setHasResult(false);
    processedTranscriptRef.current = '';
    resetTranscript();
  };

  /** Skip the hint/retest and move to next sound */
  const handleSkipHint = () => {
    if (!currentCategory || !currentPhoneme) return;
    const key = phonemeKey(currentCategory.id, currentPhoneme.sound);
    setPhonemeStates((s) => ({
      ...s,
      [key]: {
        ...(s[key]!),
        phase: 'done',
      },
    }));
    handleNextSound();
  };

  const handleRecord = () => {
    setHasResult(false);
    processedTranscriptRef.current = '';
    resetTranscript();
    startListening();
  };

  /* -- Compute & save results, then redirect -- */
  useEffect(() => {
    if (wizardStep !== totalSteps - 1 || screeningAge === null) return;

    const timer = setTimeout(() => {
      // Build category results
      const categoryResults = testableCategories.map((cat) => {
        const phonemeResults: PhonemeResult[] = cat.phonemes.map((p) => {
          const state = getPhonemeState(cat.id, p.sound);
          const isStimulable = state.hintProvided && state.postHintScore !== undefined && state.preHintScore !== undefined
            ? state.postHintScore - state.preHintScore >= 0.15
            : undefined;
          return {
            sound: p.sound,
            word: p.word,
            score: state.skipped ? 0 : state.bestScore,
            attempts: state.attempts,
            skipped: state.skipped,
            stimulable: isStimulable,
            preHintScore: state.preHintScore,
            postHintScore: state.postHintScore,
            hintProvided: state.hintProvided,
          };
        });

        const scored = phonemeResults.filter((r) => !r.skipped);
        const averageScore =
          scored.length > 0
            ? scored.reduce((sum, r) => sum + r.score, 0) / scored.length
            : 0;

        let riskLevel: RiskLevel = 'on-track';
        if (averageScore < 0.4) {
          riskLevel = 'consult';
        } else if (averageScore < MATCH_THRESHOLD) {
          riskLevel = 'monitor';
        }

        return {
          id: cat.id,
          name: cat.name,
          phonemes: phonemeResults,
          riskLevel,
          averageScore,
        };
      });

      // Overall risk
      const totalCats = categoryResults.length;
      const consultCount = categoryResults.filter(
        (c) => c.riskLevel === 'consult'
      ).length;
      const monitorCount = categoryResults.filter(
        (c) => c.riskLevel === 'monitor'
      ).length;

      let overallRisk: RiskLevel = 'on-track';
      if (consultCount / totalCats > 0.3) {
        overallRisk = 'consult';
      } else if (monitorCount / totalCats > 0.3) {
        overallRisk = 'monitor';
      }

      const overallScore =
        categoryResults.length > 0
          ? categoryResults.reduce((s, c) => s + c.averageScore, 0) /
            categoryResults.length
          : 0;

      const resultId = Date.now().toString(36);

      const result: AssessmentResult = {
        id: resultId,
        childAge: screeningAge,
        completedAt: new Date().toISOString(),
        categories: categoryResults,
        overallRisk,
        overallScore,
      };

      addAssessmentResult(result);
      router.push(`/screening/results?id=${resultId}`);
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    wizardStep,
    totalSteps,
    screeningAge,
    testableCategories,
    getPhonemeState,
    addAssessmentResult,
    router,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                    */
  /* ---------------------------------------------------------------- */

  const currentPState =
    currentCategory && currentPhoneme
      ? getPhonemeState(currentCategory.id, currentPhoneme.sound)
      : null;

  const scoreColor = (score: number) => {
    if (score >= MATCH_THRESHOLD) return 'text-success';
    if (score >= 0.4) return 'text-orange';
    return 'text-red-500';
  };

  const scoreIcon = (score: number) => {
    if (score >= MATCH_THRESHOLD) return '\u2713';
    if (score >= 0.4) return '~';
    return '\u2717';
  };

  const scoreBg = (score: number) => {
    if (score >= MATCH_THRESHOLD) return 'bg-success/10 border-success';
    if (score >= 0.4) return 'bg-orange/10 border-orange';
    return 'bg-red-50 border-red-400';
  };

  /* ---------------------------------------------------------------- */
  /*  STEP: Intro / Consent                                             */
  /* ---------------------------------------------------------------- */

  const renderIntro = () => (
    <motion.div
      key="intro"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Hero Banner — Deep Violet gradient, editorial feel */}
      <section className="relative rounded-3xl overflow-hidden bg-teal py-24 px-8 md:px-16 text-center mb-12">
        {/* Subtle tonal overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="text-5xl mb-6">&#x1FA7A;</div>
          <h1 className="font-heading italic text-4xl md:text-6xl text-white tracking-tight leading-tight mb-4">
            {t('screening.title')}
          </h1>
          <p className="font-body text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-16">
            {t('screening.introDescription')}
          </p>

          {/* 4 Info Cards — 2x2 grid, glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-left">
            {[
              {
                icon: '\uD83E\uDD16',
                title: t('screening.aiPowered'),
                desc: t('screening.aiPoweredDesc'),
              },
              {
                icon: '\uD83C\uDF82',
                title: t('screening.ageAppropriate'),
                desc: t('screening.ageAppropriateDesc'),
              },
              {
                icon: '\uD83D\uDCDA',
                title: t('screening.researchBased'),
                desc: t('screening.researchBasedDesc'),
              },
              {
                icon: '\u2139\uFE0F',
                title: t('screening.notDiagnosis'),
                desc: t('screening.notDiagnosisDesc'),
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="glass p-6 rounded-2xl transition-colors duration-500 hover:bg-white/15"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h3 className="font-heading italic text-lg text-white">{item.title}</h3>
                </div>
                <p className="text-white/60 text-sm font-body leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Disclaimer bar inside hero */}
          <div className="mt-12 max-w-3xl mx-auto bg-white/5 border-l-4 border-white/30 p-4 flex items-start gap-4 text-left rounded-r-xl">
            <span className="text-white/60 text-lg flex-shrink-0">&#x2139;</span>
            <p className="text-white/70 text-xs md:text-sm font-body leading-relaxed">
              {t('screening.disclaimer')}
            </p>
          </div>
        </div>
      </section>

      {/* Age selector — shown when no profile exists */}
      {!profile && (
        <section className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 md:p-10 mb-8">
          <h2 className="font-heading italic text-2xl text-navy mb-2">
            {t('screening.childAge')}
          </h2>
          <p className="font-body text-muted text-sm mb-6">
            {t('screening.selectAge')}
          </p>

          {/* Age display */}
          <div className="text-center mb-6">
            <span className="text-6xl font-heading italic text-teal">
              {screeningAge ?? '?'}
            </span>
            <span className="text-lg text-muted ml-2 font-body">
              {screeningAge === 1 ? t('common.year') : t('common.years')}
            </span>
          </div>

          {/* Range slider */}
          <div className="max-w-sm mx-auto mb-4">
            <input
              type="range"
              min={2}
              max={12}
              value={screeningAge ?? 5}
              onChange={(e) => setScreeningAge(parseInt(e.target.value))}
              className="w-full h-2 bg-ice rounded-lg appearance-none cursor-pointer accent-teal"
            />
            <div className="flex justify-between text-xs text-muted mt-1 font-body">
              <span>2</span>
              <span>12</span>
            </div>
          </div>

          {/* Manual text input */}
          <div className="max-w-[120px] mx-auto">
            <label className="block text-xs text-muted mb-1 font-body text-center">{t('screening.orTypeAge')}</label>
            <input
              type="number"
              min={2}
              max={12}
              value={screeningAge ?? ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 2 && val <= 12) setScreeningAge(val);
              }}
              placeholder="Age"
              className="w-full text-center text-lg font-heading font-semibold text-navy border-2 border-ice rounded-xl py-2 px-3 focus:border-teal focus:ring-0 outline-none transition-colors bg-cream"
            />
          </div>
        </section>
      )}

      {/* Encourage profile creation */}
      {!profile && (
        <section className="bg-ice rounded-3xl p-6 mb-8 flex items-start gap-4">
          <span className="text-2xl flex-shrink-0">&#x1F4A1;</span>
          <div>
            <p className="font-body text-sm text-navy">
              <strong>{t('screening.tip')}</strong> {t('screening.tipProfile')}
            </p>
            <Link
              href="/profile"
              className="inline-block mt-2 text-sm text-teal font-semibold hover:underline font-body"
            >
              {t('screening.createProfile')} &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* No-speech guard */}
      {!isSupported && (
        <div className="bg-red-50 rounded-2xl p-6 text-center mb-8 border border-red-200">
          <p className="font-body text-red-700">
            {t('screening.browserNotSupported')}
          </p>
        </div>
      )}

      {/* No testable phonemes guard */}
      {screeningAge !== null && testableCategories.length === 0 && (
        <div className="bg-ice rounded-2xl p-6 text-center mb-8">
          <p className="font-body text-navy">
            {t('screening.noSoundsForAge')}
          </p>
        </div>
      )}

      {/* Begin button — flat solid, rounded-xl */}
      {screeningAge !== null && testableCategories.length > 0 && (
        <div className="text-center pt-4">
          <MagneticButton
            onClick={handleBeginScreening}
            disabled={!isSupported}
            className="bg-teal text-white font-heading italic text-xl py-4 px-12 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-500 ease-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-0.5"
          >
            {t('screening.begin')}
          </MagneticButton>
        </div>
      )}
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /*  STEP: Phoneme Assessment (per category)                           */
  /* ---------------------------------------------------------------- */

  const renderPhonemeStep = () => {
    if (!currentCategory || !currentPhoneme) return null;

    const totalInCat = currentCategory.phonemes.length;
    const progressPct = ((currentPhonemeIndex + 1) / totalInCat) * 100;

    const canRetry =
      currentPState !== null &&
      currentPState.attempts < MAX_ATTEMPTS &&
      currentPState.phase !== 'hint' &&
      currentPState.phase !== 'done' &&
      hasResult;
    const hasDoneAttempt = currentPState !== null && currentPState.attempts > 0;
    const showResult = hasResult && !isListening && hasDoneAttempt;
    const showHintPhase = currentPState?.phase === 'hint';
    const isRetestPhase = currentPState?.phase === 'retest';
    const soundLower = currentPhoneme.sound.replace(/\//g, '').toLowerCase();
    const hintData = MOUTH_HINTS[soundLower];

    return (
      <motion.div
        key={`cat-${currentCategory.id}-${currentPhonemeIndex}`}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Category context bar */}
        <div className="bg-ice rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="font-body text-teal uppercase tracking-[0.2em] text-[10px] font-semibold mb-1 block">
                Level {currentCategoryIndex + 1}
              </span>
              <h2 className="font-heading italic text-3xl text-navy leading-tight">
                {currentCategory.name}
              </h2>
              <p className="text-muted font-body text-sm mt-1 max-w-md">
                {currentCategory.description}
              </p>
            </div>

            {/* Progress bloom */}
            <div className="w-full md:w-64">
              <div className="flex justify-between items-end mb-2">
                <span className="font-body text-[10px] uppercase tracking-[0.15em] text-muted font-medium">
                  {t('screening.soundOf').replace('{current}', String(currentPhonemeIndex + 1)).replace('{total}', String(totalInCat))}
                </span>
                <span className="font-heading italic text-lg text-teal">
                  {Math.round(progressPct)}%
                </span>
              </div>
              <div className="h-3 w-full bg-white rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-teal rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Central Phoneme Card */}
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 md:p-12 flex flex-col items-center text-center mb-8 relative transition-transform duration-500 ease-out hover:rotate-[0.5deg]">
          {/* Success check indicator */}
          {showResult && currentPState && currentPState.bestScore >= MATCH_THRESHOLD && currentPState.phase !== 'hint' && (
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-success rounded-full flex items-center justify-center text-white shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <span className="text-lg font-bold">{'\u2713'}</span>
            </div>
          )}

          {/* Large emoji */}
          <motion.span
            key={currentPhoneme.emoji}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-[100px] leading-none mb-4 block"
          >
            {currentPhoneme.emoji}
          </motion.span>

          {/* Word + phonetic symbol */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-heading italic text-4xl text-navy">
              {currentPhoneme.word}
            </h3>
            <span className="bg-grape/10 text-grape px-3 py-1 rounded-full font-body font-bold text-sm">
              {currentPhoneme.sound}
            </span>
          </div>

          {/* Sentence */}
          <p className="font-heading italic text-xl text-muted mb-10">
            &ldquo;{currentPhoneme.sentence}&rdquo;
          </p>

          {/* Mic button with pulse rings */}
          <div className="relative group mb-4">
            {isListening && (
              <>
                <motion.div
                  className="absolute inset-0 bg-teal/20 rounded-full"
                  animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-0 bg-teal/10 rounded-full"
                  animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                />
              </>
            )}
            <button
              onClick={handleRecord}
              disabled={
                isListening ||
                (currentPState !== null &&
                  currentPState.attempts >= MAX_ATTEMPTS &&
                  hasResult)
              }
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-500 ease-out shadow-[0_8px_32px_rgba(0,0,0,0.06)] disabled:opacity-40 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-orange text-white'
                  : 'bg-teal text-white hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]'
              }`}
            >
              <span>{isListening ? '\uD83C\uDFA4' : '\uD83C\uDF99\uFE0F'}</span>
            </button>
          </div>

          <p className="font-body text-muted uppercase tracking-[0.2em] text-[10px] font-bold">
            {isListening
              ? t('screening.listening')
              : hasDoneAttempt && !hasResult
              ? t('screening.processing')
              : canRetry
              ? t('screening.tryAgain')
              : hasDoneAttempt && currentPState && currentPState.attempts >= MAX_ATTEMPTS
              ? t('screening.maxAttempts')
              : t('screening.tapMic')}
          </p>

          {/* Microphone error message */}
          {micError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 max-w-sm mt-4"
            >
              <p className="text-red-700 text-sm font-body">{micError}</p>
            </motion.div>
          )}

          {/* Attempts indicator */}
          {currentPState && currentPState.attempts > 0 && (
            <p className="text-xs text-muted font-body mt-3">
              {t('screening.attemptOf').replace('{current}', String(Math.min(currentPState.attempts, MAX_ATTEMPTS))).replace('{max}', String(MAX_ATTEMPTS))}
            </p>
          )}

          {/* Score result */}
          {showResult && currentPState && currentPState.phase !== 'hint' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`mt-6 inline-flex items-center gap-2 py-2 px-4 rounded-xl border ${scoreBg(
                currentPState.bestScore
              )}`}
            >
              <span className={`text-xl font-bold ${scoreColor(currentPState.bestScore)}`}>
                {scoreIcon(currentPState.bestScore)}
              </span>
              <span className={`font-heading font-bold ${scoreColor(currentPState.bestScore)}`}>
                {Math.round(currentPState.bestScore * 100)}%
              </span>
              {currentPState.lastTranscript && (
                <span className="text-muted text-sm font-body ml-2">
                  {t('screening.heard')} &ldquo;{currentPState.lastTranscript}&rdquo;
                </span>
              )}
            </motion.div>
          )}

          {/* Stimulability badge for retest results */}
          {currentPState?.phase === 'done' && currentPState.hintProvided && currentPState.postHintScore !== undefined && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`mt-3 inline-flex items-center gap-2 py-1.5 px-3 rounded-xl text-xs font-body ${
                (currentPState.postHintScore - (currentPState.preHintScore ?? 0)) >= 0.15
                  ? 'bg-success/10 text-success'
                  : 'bg-orange/10 text-orange'
              }`}
            >
              {(currentPState.postHintScore - (currentPState.preHintScore ?? 0)) >= 0.15
                ? `${t('screening.stimulable')}`
                : `${t('screening.limitedStimulability')}`}
            </motion.div>
          )}
        </div>

        {/* Hint Phase Card (Dynamic Assessment) */}
        {showHintPhase && hintData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-xl mx-auto bg-grape/5 rounded-3xl border border-grape/15 p-8 mb-8"
          >
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">{hintData.emoji}</span>
              <h4 className="font-heading italic text-xl text-navy mb-1">
                {t('screening.letsTryTip')}
              </h4>
              <p className="font-body text-muted text-sm">
                {t('screening.hintFor')} <strong className="text-grape">/{soundLower}/</strong> {t('screening.sound')}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 mb-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <p className="font-body text-navy text-base font-medium">
                {hintData.tip}
              </p>
            </div>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleSkipHint}
                className="text-muted text-sm font-body hover:text-navy transition-colors duration-500 py-2 px-4"
              >
                {t('common.skip')}
              </button>
              <button
                onClick={handleAcceptHint}
                className="bg-teal text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
              >
                {t('screening.tryAgainWithHint')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Retest phase label */}
        {isRetestPhase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto bg-grape/10 rounded-2xl p-4 mb-8 text-center"
          >
            <p className="font-body text-grape text-sm font-medium">
              {t('screening.retestInstruction')}
            </p>
          </motion.div>
        )}

        {/* Action buttons */}
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-muted text-sm font-body hover:text-navy transition-colors duration-500 py-2 px-4"
          >
            {t('screening.skipSound')}
          </button>

          <button
            onClick={handleNextSound}
            disabled={isListening || showHintPhase}
            className="bg-teal text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {currentPhonemeIndex < currentCategory.phonemes.length - 1
              ? t('screening.nextSound')
              : t('screening.nextCategory')}
          </button>
        </div>
      </motion.div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  STEP: Generating Results (loading)                                */
  /* ---------------------------------------------------------------- */

  const renderResults = () => (
    <motion.div
      key="results"
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-32"
    >
      <div className="bg-ice rounded-3xl p-16 flex flex-col items-center max-w-md mx-auto">
        {/* Animated emoji */}
        <motion.span
          className="text-7xl block mb-8"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 3, -3, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {'\uD83E\uDDE0'}
        </motion.span>

        <h2 className="font-heading italic text-2xl text-navy mb-4">
          {t('screening.analyzing')}
        </h2>

        {/* Dots animation */}
        <div className="flex gap-3 mb-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 bg-teal rounded-full"
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        <p className="font-body text-muted text-sm text-center">
          {t('screening.personalizedReport')}
        </p>
      </div>
    </motion.div>
  );

  /* ---------------------------------------------------------------- */
  /*  Global step indicator                                             */
  /* ---------------------------------------------------------------- */

  const renderStepIndicator = () => {
    const labels = [
      t('screening.intro'),
      ...testableCategories.map((c) => c.name),
      t('screening.results'),
    ];

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-10 flex-wrap">
        {labels.map((label, index) => {
          const isActive = index === wizardStep;
          const isDone = index < wizardStep;
          return (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ease-out ${
                  isDone
                    ? 'bg-success text-white'
                    : isActive
                    ? 'bg-teal text-white scale-110'
                    : 'bg-ice text-muted'
                }`}
              >
                {isDone ? '\u2713' : index + 1}
              </div>
              {index < labels.length - 1 && (
                <div
                  className={`w-4 sm:w-6 h-0.5 transition-colors duration-500 ${
                    isDone ? 'bg-success' : 'bg-ice'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Layout                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="relative min-h-screen pb-12 sm:pb-16 px-4 pt-8 overflow-hidden">
      <div className="fixed inset-0 text-teal opacity-[0.15] pointer-events-none z-0">
        <NeuralPaths />
      </div>
      <div className="max-w-4xl mx-auto">
        {/* Back to setup button — visible during assessment steps */}
        {wizardStep > 0 && wizardStep < totalSteps - 1 && (
          <button
            onClick={() => { setDirection(-1); setWizardStep(0); setCurrentPhonemeIndex(0); setHasResult(false); }}
            className="flex items-center gap-2 text-sm font-body font-medium text-muted hover:text-navy transition-colors duration-300 mb-6"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Setup
          </button>
        )}

        {/* Step indicator (visible from step 1 onward) */}
        {wizardStep > 0 && wizardStep < totalSteps - 1 && renderStepIndicator()}

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {wizardStep === 0 && renderIntro()}
          {wizardStep > 0 &&
            wizardStep <= testableCategories.length &&
            renderPhonemeStep()}
          {wizardStep === totalSteps - 1 && renderResults()}
        </AnimatePresence>
      </div>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
    </div>
  );
}
