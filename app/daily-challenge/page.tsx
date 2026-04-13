'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Timer, Mic, Star, Trophy, ArrowRight, CheckCircle, Clock, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import exercisesData from '@/data/exercises.json';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { GitHubCalendar } from '@/components/ui/git-hub-calendar';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';
import { NumberTicker } from '@/components/ui/NumberTicker';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { subDays, format } from 'date-fns';
import { buildCycles, getTargetPhonemesForDay, getDayNumber } from '@/lib/cycles';
import { ExerciseResult, GameType } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types for the mixed exercise pool                                   */
/* ------------------------------------------------------------------ */

interface ChallengeExercise {
  id: string;
  gameType: GameType;
  prompt: string;
  promptHindi?: string;
  emoji: string;
  expectedSpeech: string;
  difficulty: string;
  soundsTargeted: string[];
  category: string;
}

type ChallengePhase = 'intro' | 'active' | 'results' | 'completed-today';

const CHALLENGE_DURATION_SECONDS = 5 * 60; // 5 minutes

/* ------------------------------------------------------------------ */
/*  15 rotating daily tips                                              */
/* ------------------------------------------------------------------ */
const DAILY_TIPS = [
  { title: 'Consistency is your superpower', body: 'Just 5 minutes a day makes a real difference. Research shows that short, daily speech practice sessions are more effective than longer, infrequent ones. Your voice grows stronger with every session. Keep showing up!' },
  { title: 'Slow down to speed up', body: 'Rushing through words can reinforce errors. Encourage slow, careful pronunciation first. Speed comes naturally once the motor pattern is solid. Think of it like learning to ride a bike: balance first, then go fast!' },
  { title: 'Make it a game, not a chore', body: 'Children learn best when they are having fun. Weave speech practice into playtime, story reading, or silly games. The more positive the experience, the more they will want to practice on their own.' },
  { title: 'Celebrate the effort, not just the result', body: 'Praise your child for trying, not only for getting it right. "I love how hard you tried that tricky sound!" builds confidence and motivation far more than correcting every mistake.' },
  { title: 'Model, don\'t correct', body: 'Instead of saying "No, say it like this," simply repeat the word back correctly. If your child says "wabbit," respond naturally: "Yes, that\'s a rabbit!" This gentle modeling is the most effective teaching tool.' },
  { title: 'Read aloud together every day', body: 'Shared reading exposes children to rich vocabulary and correct pronunciation in a warm, low-pressure setting. Point at pictures, ask open-ended questions, and let them fill in familiar words.' },
  { title: 'Hydration helps your voice', body: 'A well-hydrated body produces smoother speech. Make sure your child drinks water regularly, especially before practice. Dry vocal cords work harder and tire faster.' },
  { title: 'Breathing is the foundation', body: 'Strong, controlled breathing supports clear speech. Practice blowing bubbles, pinwheels, or blowing out candles to build breath control in a fun way.' },
  { title: 'Mirror practice builds awareness', body: 'Watching themselves in a mirror while practicing helps children understand how their mouth, tongue, and lips move to make sounds. It turns an invisible skill into something they can see and correct.' },
  { title: 'One sound at a time', body: 'Focus on mastering one target sound before moving to the next. Spreading effort across too many sounds at once can slow progress. Depth beats breadth in speech therapy.' },
  { title: 'Sing your way to better speech', body: 'Singing slows down speech naturally and emphasizes rhythm and melody. Nursery rhymes, action songs, and even silly made-up tunes are excellent speech practice disguised as music.' },
  { title: 'Be patient with plateaus', body: 'Progress in speech development is not always linear. Plateaus are normal; they often mean the brain is consolidating what it has learned. Keep practicing and breakthroughs will come.' },
  { title: 'Use real-life moments', body: 'The grocery store, the park, and mealtimes are all opportunities. Name objects, describe actions, and ask questions. Real-world context makes new words stick faster than flashcards.' },
  { title: 'Sleep powers learning', body: 'During sleep, the brain consolidates motor patterns learned during the day, including speech. A well-rested child retains more from practice and is more engaged during sessions.' },
  { title: 'Every voice is unique', body: 'Comparison steals joy. Your child\'s speech journey is their own, and every small step forward matters. Focus on their personal growth and celebrate the milestones they reach at their own pace.' },
];
const TARGET_EXERCISE_COUNT = 10;
const XP_PER_CORRECT = 10;
const BONUS_XP_ALL_CORRECT = 50;
const BONUS_XP_COMPLETION = 25;

/* ------------------------------------------------------------------ */
/*  Helper: get translated word for any supported language              */
/* ------------------------------------------------------------------ */

function getWordForLang(
  ex: Record<string, unknown> & { word: string },
  lang: string,
): string {
  const keyMap: Record<string, string> = {
    hi: 'wordHindi', es: 'wordSpanish', af: 'wordAfrikaans',
    bn: 'wordBengali', tl: 'wordTagalog', pt: 'wordPortuguese',
    ar: 'wordArabic', ru: 'wordRussian', vi: 'wordVietnamese',
  };
  const key = keyMap[lang];
  if (key && typeof ex[key] === 'string') return ex[key] as string;
  return ex.word;
}

/* ------------------------------------------------------------------ */
/*  Helper: build the mixed exercise pool                              */
/* ------------------------------------------------------------------ */

function buildChallengePool(
  weakSounds: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  language: string,
): ChallengeExercise[] {
  const pool: ChallengeExercise[] = [];

  // Sound Safari exercises
  const safariExercises = exercisesData['sound-safari'];
  for (const ex of safariExercises) {
    const word = getWordForLang(ex, language);
    pool.push({
      id: ex.id,
      gameType: 'sound-safari',
      prompt: ex.word,
      promptHindi: ex.wordHindi,
      emoji: ex.imageEmoji,
      expectedSpeech: word,
      difficulty: ex.difficulty,
      soundsTargeted: [ex.targetSound],
      category: `Sound Safari - ${ex.environment}`,
    });
  }

  // Word Garden exercises
  const gardenExercises = exercisesData['word-garden'];
  for (const ex of gardenExercises) {
    const word = getWordForLang(ex, language);
    pool.push({
      id: ex.id,
      gameType: 'word-garden',
      prompt: ex.word,
      promptHindi: ex.wordHindi,
      emoji: ex.imageEmoji,
      expectedSpeech: word,
      difficulty: ex.difficulty,
      soundsTargeted: ex.word
        .toLowerCase()
        .split('')
        .filter((c, i, arr) => arr.indexOf(c) === i && /[a-z]/.test(c))
        .slice(0, 2),
      category: `Word Garden - ${ex.category}`,
    });
  }

  // Rhythm River exercises
  const rhythmExercises = exercisesData['rhythm-river'];
  for (const ex of rhythmExercises) {
    pool.push({
      id: ex.id,
      gameType: 'rhythm-river',
      prompt: ex.sentence,
      emoji: '\u{1F30A}',
      expectedSpeech: ex.sentence,
      difficulty: ex.difficulty,
      soundsTargeted: ex.sentence
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.replace(/[^a-z]/g, '').charAt(0))
        .filter(Boolean),
      category: 'Rhythm River',
    });
  }

  // Tongue Gym exercises
  const tongueExercises = exercisesData['tongue-gym'];
  for (const ex of tongueExercises) {
    pool.push({
      id: ex.id,
      gameType: 'tongue-gym',
      prompt: ex.word,
      emoji: ex.imageEmoji,
      expectedSpeech: ex.description ?? ex.word,
      difficulty: ex.difficulty,
      soundsTargeted: ex.word
        .toLowerCase()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.replace(/[^a-z]/g, '').charAt(0))
        .filter(Boolean),
      category: 'Tongue Gym',
    });
  }

  // Story Studio exercises
  const storyExercises: ChallengeExercise[] = [
    {
      id: 'dc-story-1',
      gameType: 'story-studio',
      prompt: 'Once upon a time...',
      emoji: '\u{1F4D6}',
      expectedSpeech: 'Once upon a time',
      difficulty: 'medium',
      soundsTargeted: ['s', 't'],
      category: 'Story Studio',
    },
    {
      id: 'dc-story-2',
      gameType: 'story-studio',
      prompt: 'The brave knight saved the day!',
      emoji: '\u{1F3F0}',
      expectedSpeech: 'The brave knight saved the day',
      difficulty: 'medium',
      soundsTargeted: ['b', 'r'],
      category: 'Story Studio',
    },
    {
      id: 'dc-story-3',
      gameType: 'story-studio',
      prompt: 'A friendly dragon flew over the hills.',
      emoji: '\u{1F409}',
      expectedSpeech: 'A friendly dragon flew over the hills',
      difficulty: 'hard',
      soundsTargeted: ['f', 'l'],
      category: 'Story Studio',
    },
  ];
  pool.push(...storyExercises);

  // Emotion Echo exercises
  const emotionExercises: ChallengeExercise[] = [
    {
      id: 'dc-emotion-1',
      gameType: 'emotion-echo',
      prompt: 'Show a happy voice!',
      emoji: '\u{1F60A}',
      expectedSpeech: 'I am so happy',
      difficulty: 'easy',
      soundsTargeted: ['h', 'p'],
      category: 'Emotion Echo',
    },
    {
      id: 'dc-emotion-2',
      gameType: 'emotion-echo',
      prompt: 'Use a surprised voice!',
      emoji: '\u{1F632}',
      expectedSpeech: 'Oh wow that is amazing',
      difficulty: 'medium',
      soundsTargeted: ['s', 'z'],
      category: 'Emotion Echo',
    },
    {
      id: 'dc-emotion-3',
      gameType: 'emotion-echo',
      prompt: 'Speak in a calm, gentle voice.',
      emoji: '\u{1F60C}',
      expectedSpeech: 'Everything is going to be okay',
      difficulty: 'medium',
      soundsTargeted: ['k', 'g'],
      category: 'Emotion Echo',
    },
  ];
  pool.push(...emotionExercises);

  // Score each exercise
  const scored = pool.map((ex) => {
    let score = 0;
    const overlapCount = ex.soundsTargeted.filter((s) =>
      weakSounds.includes(s),
    ).length;
    score += overlapCount * 30;
    if (ex.difficulty === difficulty) {
      score += 20;
    } else if (
      (difficulty === 'easy' && ex.difficulty === 'medium') ||
      (difficulty === 'medium' && ex.difficulty === 'easy') ||
      (difficulty === 'medium' && ex.difficulty === 'hard') ||
      (difficulty === 'hard' && ex.difficulty === 'medium')
    ) {
      score += 10;
    }
    score += Math.random() * 15;
    return { exercise: ex, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected: ChallengeExercise[] = [];
  const typeCounts: Record<string, number> = {
    'sound-safari': 0,
    'tongue-gym': 0,
    'word-garden': 0,
    'rhythm-river': 0,
    'story-studio': 0,
    'emotion-echo': 0,
  };
  const typeMax: Record<string, number> = {
    'sound-safari': 2,
    'tongue-gym': 2,
    'word-garden': 2,
    'rhythm-river': 2,
    'story-studio': 1,
    'emotion-echo': 1,
  };

  for (const { exercise } of scored) {
    if (selected.length >= TARGET_EXERCISE_COUNT) break;
    if (typeCounts[exercise.gameType] < typeMax[exercise.gameType]) {
      selected.push(exercise);
      typeCounts[exercise.gameType]++;
    }
  }

  if (selected.length < TARGET_EXERCISE_COUNT) {
    for (const { exercise } of scored) {
      if (selected.length >= TARGET_EXERCISE_COUNT) break;
      if (!selected.find((s) => s.id === exercise.id)) {
        selected.push(exercise);
      }
    }
  }

  const safari = selected.filter((e) => e.gameType === 'sound-safari');
  const tongue = selected.filter((e) => e.gameType === 'tongue-gym');
  const garden = selected.filter((e) => e.gameType === 'word-garden');
  const rhythm = selected.filter((e) => e.gameType === 'rhythm-river');
  const story = selected.filter((e) => e.gameType === 'story-studio');
  const emotion = selected.filter((e) => e.gameType === 'emotion-echo');
  const interleaved: ChallengeExercise[] = [];
  const buckets = [safari, tongue, garden, rhythm, story, emotion];
  const maxLen = Math.max(...buckets.map((b) => b.length));

  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (i < bucket.length) interleaved.push(bucket[i]);
    }
  }

  return interleaved.slice(0, TARGET_EXERCISE_COUNT);
}

function getWeakSoundsFromAssessments(
  assessmentResults: { categories: { phonemes: { sound: string; score: number }[] }[] }[],
): string[] {
  if (assessmentResults.length === 0) return [];
  const latest = assessmentResults[assessmentResults.length - 1];
  const weakSounds: string[] = [];
  for (const category of latest.categories) {
    for (const phoneme of category.phonemes) {
      if (phoneme.score < 0.7) {
        weakSounds.push(phoneme.sound);
      }
    }
  }
  return weakSounds;
}

function getDifficultyForAge(age: number): 'easy' | 'medium' | 'hard' {
  if (age <= 4) return 'easy';
  if (age <= 7) return 'medium';
  return 'hard';
}

/* ------------------------------------------------------------------ */
/*  Game type display config                                            */
/* ------------------------------------------------------------------ */

const GAME_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; tonalBg: string; icon: string; instruction: string }
> = {
  'sound-safari': {
    label: 'Sound Safari',
    color: 'text-success',
    bg: 'bg-success/5',
    tonalBg: 'bg-success/10',
    icon: '\u{1F981}',
    instruction: 'Say the word!',
  },
  'word-garden': {
    label: 'Word Garden',
    color: 'text-grape',
    bg: 'bg-grape/5',
    tonalBg: 'bg-grape/10',
    icon: '\u{1F33B}',
    instruction: 'Say the word!',
  },
  'rhythm-river': {
    label: 'Rhythm River',
    color: 'text-teal',
    bg: 'bg-teal/5',
    tonalBg: 'bg-teal/10',
    icon: '\u{1F30A}',
    instruction: 'Repeat the sentence!',
  },
  'tongue-gym': {
    label: 'Tongue Gym',
    color: 'text-rose',
    bg: 'bg-rose/5',
    tonalBg: 'bg-rose/10',
    icon: '\u{1F4AA}',
    instruction: 'Follow the exercise!',
  },
  'story-studio': {
    label: 'Story Studio',
    color: 'text-violet',
    bg: 'bg-violet/5',
    tonalBg: 'bg-violet/10',
    icon: '\u{1F4D6}',
    instruction: 'Tell the story!',
  },
  'emotion-echo': {
    label: 'Emotion Echo',
    color: 'text-coral',
    bg: 'bg-coral/5',
    tonalBg: 'bg-coral/10',
    icon: '\u{1F3AD}',
    instruction: 'Express the emotion!',
  },
};

/* ------------------------------------------------------------------ */
/*  Timer formatting                                                    */
/* ------------------------------------------------------------------ */

function buildRealContributions(
  exerciseHistory: { completedAt: string }[],
  dailyChallengeResults: { date: string }[],
): { date: string; count: number }[] {
  // Count activity per day from real data
  const countsByDate: Record<string, number> = {};

  for (const ex of exerciseHistory) {
    const day = format(new Date(ex.completedAt), 'yyyy-MM-dd');
    countsByDate[day] = (countsByDate[day] || 0) + 1;
  }
  for (const dc of dailyChallengeResults) {
    const day = dc.date;
    countsByDate[day] = (countsByDate[day] || 0) + 1;
  }

  // Build 365-day array, capping at 4 for color intensity
  const today = new Date();
  const contributions: { date: string; count: number }[] = [];
  for (let i = 0; i < 365; i++) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    contributions.push({ date, count: Math.min(countsByDate[date] || 0, 4) });
  }
  return contributions;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ */
/*  Circular Timer SVG Component                                        */
/* ------------------------------------------------------------------ */

function CircularTimer({ timeRemaining, total }: { timeRemaining: number; total: number }) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = timeRemaining / total;
  const offset = circumference * (1 - progress);

  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3"
          className="text-teal/10"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-teal transition-all duration-1000 ease-out"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <div className="text-center">
        <span className="block font-heading italic text-5xl md:text-6xl text-white">
          {formatTime(timeRemaining)}
        </span>
        <span className="block text-white/80 text-xs uppercase tracking-widest font-body mt-1">
          Minutes Left
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function DailyChallengePage() {
  // Store
  const profile = useAppStore((s) => s.profile);
  const assessmentResults = useAppStore((s) => s.assessmentResults);
  const addXP = useAppStore((s) => s.addXP);
  const addExerciseResult = useAppStore((s) => s.addExerciseResult);
  const updateStreak = useAppStore((s) => s.updateStreak);
  const addDailyChallengeResult = useAppStore((s) => s.addDailyChallengeResult);
  const hasCompletedDailyChallenge = useAppStore((s) => s.hasCompletedDailyChallenge);
  const appLanguage = useAppStore((s) => s.appLanguage);
  const progress = useAppStore((s) => s.progress);
  const dailyChallengeResults = useAppStore((s) => s.dailyChallengeResults);
  const cycleProgress = useAppStore((s) => s.cycleProgress);
  const setCycleProgress = useAppStore((s) => s.setCycleProgress);
  const incrementTrialCount = useAppStore((s) => s.incrementTrialCount);

  const [targetPhonemes, setTargetPhonemes] = useState<string[]>([]);

  // Speech recognition
  const { isSupported, isListening, isProcessing: micProcessing, transcript, error: micError, startListening, stopListening, resetTranscript } =
    useSpeechRecognition(appLanguage || 'en');

  // State
  const [phase, setPhase] = useState<ChallengePhase>('intro');
  const [exercises, setExercises] = useState<ChallengeExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(CHALLENGE_DURATION_SECONDS);
  const [results, setResults] = useState<(ExerciseResult & { matched: boolean })[]>([]);
  const [currentResult, setCurrentResult] = useState<{
    score: number;
    matched: boolean;
    transcript: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [showMicModal, setShowMicModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Show mic permission modal when a mic error occurs
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  // Build real heatmap contributions from store
  const heatmapData = useMemo(
    () => buildRealContributions(progress.exerciseHistory, dailyChallengeResults),
    [progress.exerciseHistory, dailyChallengeResults],
  );

  // Check if already completed today on mount
  useEffect(() => {
    if (hasCompletedDailyChallenge()) {
      setPhase('completed-today');
    }
  }, [hasCompletedDailyChallenge]);

  // Generate exercises
  const generateExercises = useCallback(() => {
    const age = profile?.age ?? 5;
    const language = profile?.language ?? appLanguage ?? 'en';
    const difficulty = getDifficultyForAge(age);

    if (assessmentResults.length > 0) {
      const latest = assessmentResults[assessmentResults.length - 1];
      const cycles = buildCycles(latest);

      if (cycles.length > 0) {
        const startDate = cycleProgress?.startDate ?? new Date().toISOString().split('T')[0];
        if (!cycleProgress) {
          setCycleProgress({
            currentCycleIndex: 0,
            dayWithinCycle: 0,
            trialCount: 0,
            cycles,
            startDate,
          });
        }

        const dayNumber = getDayNumber(startDate);
        const todaysTargets = getTargetPhonemesForDay(cycles, dayNumber);
        setTargetPhonemes(todaysTargets);

        const challengeExercises = buildChallengePool(todaysTargets, difficulty, language);
        setExercises(challengeExercises);
        return;
      }
    }

    const weakSounds = getWeakSoundsFromAssessments(assessmentResults);
    setTargetPhonemes([]);
    const challengeExercises = buildChallengePool(weakSounds, difficulty, language);
    setExercises(challengeExercises);
  }, [profile, assessmentResults, appLanguage, cycleProgress, setCycleProgress]);

  const startChallenge = useCallback(() => {
    generateExercises();
    setCurrentIndex(0);
    setResults([]);
    setCurrentResult(null);
    setTimeRemaining(CHALLENGE_DURATION_SECONDS);
    startTimeRef.current = Date.now();
    setPhase('active');
  }, [generateExercises]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active') return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Process transcript
  useEffect(() => {
    if (!transcript || phase !== 'active' || isProcessing) return;

    const exercise = exercises[currentIndex];
    if (!exercise) return;

    setIsProcessing(true);

    const score = compareSpeech(exercise.expectedSpeech, transcript);
    const matched = score >= MATCH_THRESHOLD;
    const roundedScore = Math.round(score * 100);

    setCurrentResult({ score: roundedScore, matched, transcript });

    const exerciseResult: ExerciseResult & { matched: boolean } = {
      exerciseId: exercise.id,
      gameType: exercise.gameType,
      score: roundedScore,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      soundsTargeted: exercise.soundsTargeted,
      matched,
    };

    setResults((prev) => [...prev, exerciseResult]);

    addExerciseResult({
      exerciseId: exercise.id,
      gameType: exercise.gameType,
      score: roundedScore,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      soundsTargeted: exercise.soundsTargeted,
    });

    if (matched) {
      addXP(XP_PER_CORRECT);
    }

    incrementTrialCount();
    setIsProcessing(false);
  }, [transcript, phase, exercises, currentIndex, addExerciseResult, addXP, isProcessing, incrementTrialCount]);

  const goToNext = useCallback(() => {
    setCurrentResult(null);
    resetTranscript();

    if (currentIndex + 1 >= exercises.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('results');
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, exercises.length, resetTranscript]);

  const skipExercise = useCallback(() => {
    const exercise = exercises[currentIndex];
    if (!exercise) return;

    const exerciseResult: ExerciseResult & { matched: boolean } = {
      exerciseId: exercise.id,
      gameType: exercise.gameType,
      score: 0,
      maxScore: 100,
      completedAt: new Date().toISOString(),
      soundsTargeted: exercise.soundsTargeted,
      matched: false,
    };

    setResults((prev) => [...prev, exerciseResult]);
    goToNext();
  }, [exercises, currentIndex, goToNext]);

  const totalScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  }, [results]);

  const correctCount = useMemo(
    () => results.filter((r) => r.matched).length,
    [results],
  );

  const totalXPEarned = useMemo(() => {
    let xp = correctCount * XP_PER_CORRECT;
    if (results.length > 0 && correctCount === results.length) {
      xp += BONUS_XP_ALL_CORRECT;
    }
    if (results.length > 0) {
      xp += BONUS_XP_COMPLETION;
    }
    return xp;
  }, [correctCount, results.length]);

  // Save daily challenge result
  useEffect(() => {
    if (phase !== 'results') return;
    if (results.length === 0) return;

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    addXP(BONUS_XP_COMPLETION);
    if (correctCount === results.length && results.length > 0) {
      addXP(BONUS_XP_ALL_CORRECT);
    }

    updateStreak();

    const challengeResult = {
      date: new Date().toISOString().split('T')[0],
      exercises: results.map(({ matched: _matched, ...rest }) => rest),
      totalScore,
      timeSpentSeconds: timeSpent,
      completed: true,
    };

    addDailyChallengeResult(challengeResult);
    toast.success('Daily challenge complete!', { description: `Score: ${totalScore} · ${exercises.length} exercises` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const currentExercise = exercises[currentIndex] ?? null;
  const gameConfig = currentExercise
    ? GAME_TYPE_CONFIG[currentExercise.gameType]
    : null;

  /* ---------------------------------------------------------------- */
  /*  Render: Already completed today                                   */
  /* ---------------------------------------------------------------- */

  if (phase === 'completed-today') {
    return (
      <div className="min-h-screen bg-cream">
        {/* Film grain */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
          <svg width="100%" height="100%">
            <filter id="grain-dc-done">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-dc-done)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-navy text-sm font-body font-medium mb-8 transition-colors duration-500"
          >
            <ArrowLeft size={16} />
            Home
          </Link>

          <motion.div
            className="max-w-md mx-auto text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-24 h-24 mx-auto mb-6 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h2 className="font-heading italic text-3xl text-navy mb-3">
              Already completed today!
            </h2>
            <p className="text-muted font-body mb-10">
              Great work! You&apos;ve already finished today&apos;s daily challenge.
              Come back tomorrow for a new one!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/play"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-teal text-white font-body font-semibold rounded-xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
              >
                Play More Games
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-navy font-body font-semibold rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
              >
                View Progress
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Intro / Bento grid                                       */
  /* ---------------------------------------------------------------- */

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-cream">
        {/* Film grain */}
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
          <svg width="100%" height="100%">
            <filter id="grain-dc-intro">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-dc-intro)" />
          </svg>
        </div>

        <main className="pb-32 pt-8">
          {/* Hero Section — Bento hero with circular timer */}
          <section className="max-w-7xl mx-auto px-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-16 flex flex-col md:flex-row items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.06)]" style={{ backgroundColor: '#2D3142' }}
            >
              {/* Soft background shapes */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-5%] w-64 h-64 bg-teal rounded-full blur-[80px]" />
                <div className="absolute bottom-[-20%] right-[10%] w-96 h-96 bg-grape rounded-full blur-[100px]" />
              </div>

              {/* Hero Content */}
              <div className="relative z-10 max-w-2xl text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                  <Timer size={32} className="text-teal-light" />
                  <h1 className="font-heading italic text-4xl md:text-6xl text-white tracking-tight">
                    Today&apos;s Challenge
                  </h1>
                </div>
                <p className="text-white/90 text-lg md:text-xl font-body mb-10 max-w-lg">
                  A curated 5-minute mix of speech exercises just for you.
                </p>

                {/* Cycles info */}
                {assessmentResults.length > 0 && (() => {
                  const latest = assessmentResults[assessmentResults.length - 1];
                  const cycles = buildCycles(latest);
                  if (cycles.length > 0) {
                    const startDate = cycleProgress?.startDate ?? new Date().toISOString().split('T')[0];
                    const dayNumber = getDayNumber(startDate);
                    const todaysTargets = getTargetPhonemesForDay(cycles, dayNumber);
                    if (todaysTargets.length > 0) {
                      return (
                        <div className="mb-6 px-4 py-3 bg-white/10 rounded-2xl">
                          <p className="text-sm font-body font-semibold text-white/90 mb-1">
                            Today&apos;s Focus: /{todaysTargets[0]}/ sound
                          </p>
                          <p className="text-xs text-white/80 font-body">
                            Exercises tailored to your screening results
                          </p>
                          {cycleProgress && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs text-white/80 mb-1 font-body">
                                <span>Practice trials</span>
                                <span>{cycleProgress.trialCount.toLocaleString()} / 5,000</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full">
                                <div
                                  className="h-full bg-teal rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((cycleProgress.trialCount / 5000) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {!isSupported && (
                  <div className="mb-6 px-4 py-3 bg-coral/20 text-white rounded-xl text-sm font-body font-medium">
                    Speech recognition requires Chrome or Edge browser
                  </div>
                )}

                <MagneticButton
                  onClick={startChallenge}
                  className="bg-teal text-white px-10 py-4 rounded-xl font-body font-semibold text-lg hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-500 flex items-center gap-3 cursor-pointer"
                >
                  Start Challenge
                  <ArrowRight size={20} />
                </MagneticButton>
              </div>

              {/* Circular Timer Graphic */}
              <div className="relative z-10 mt-12 md:mt-0">
                <CircularTimer timeRemaining={CHALLENGE_DURATION_SECONDS} total={CHALLENGE_DURATION_SECONDS} />
              </div>
            </motion.div>
          </section>

          {/* Practice Journey — Adherence Heatmap  */}
          <section className="max-w-7xl mx-auto px-6">
            <TiltCard tiltAmount={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              className="bg-white dark:bg-[#2D3142] rounded-2xl p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-teal" />
                </div>
                <div>
                  <h2 className="font-heading italic text-2xl md:text-3xl text-navy dark:text-white">
                    Your Practice Journey
                  </h2>
                  <p className="text-muted text-sm font-body">
                    Every green square is a day you showed up for yourself
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div style={{ display: 'table', margin: '0 auto' }}>
                  <GitHubCalendar
                    data={heatmapData}
                    colors={["#ebedf0", "#b2dfdb", "#4db6ac", "#00897b", "#004d40"]}
                  />
                </div>
              </div>

              {/* Streak stats inline */}
              <div className="mt-6 pt-6 border-t border-ice dark:border-white/10 flex flex-wrap justify-center md:justify-around gap-8 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                    <span className="text-lg">&#x1F525;</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-navy dark:text-white font-heading italic font-bold text-lg">{progress.currentStreak} {progress.currentStreak === 1 ? 'day' : 'days'}</span>
                    <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted">Current streak</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-ice dark:bg-white/10 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-grape/10 rounded-xl flex items-center justify-center">
                    <Star size={18} className="text-grape" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-navy dark:text-white font-heading italic font-bold text-lg">{progress.longestStreak} {progress.longestStreak === 1 ? 'day' : 'days'}</span>
                    <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted">Best streak</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-ice dark:bg-white/10 hidden md:block" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
                    <Trophy size={18} className="text-teal" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-navy dark:text-white font-heading italic font-bold text-lg">{progress.xp.toLocaleString()} XP</span>
                    <span className="text-[10px] font-body font-medium uppercase tracking-widest text-muted">Total XP earned</span>
                  </div>
                </div>
              </div>
            </motion.div>
            </TiltCard>
          </section>

          {/* Daily Encouragement Card */}
          <section className="max-w-7xl mx-auto px-6 mt-8">
            <TiltCard tiltAmount={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-[#2D3142] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col md:flex-row"
            >
              {/* Image side */}
              <div className="md:w-2/5 h-48 md:h-auto relative bg-teal/5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-[-20%] left-[-10%] w-48 h-48 bg-teal rounded-full blur-[60px]" />
                  <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-grape rounded-full blur-[80px]" />
                </div>
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                    <Heart size={36} className="text-coral" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal font-body">
                    Daily Tip
                  </span>
                </div>
              </div>

              {/* Content side */}
              <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                {(() => {
                  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
                  const tip = DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
                  return (
                    <>
                      <h3 className="font-heading italic text-2xl md:text-3xl text-navy dark:text-white mb-3">
                        {tip.title}
                      </h3>
                      <p className="text-muted font-body text-base leading-relaxed mb-6">
                        {tip.body}
                      </p>
                    </>
                  );
                })()}
                {progress.currentStreak > 0 && (
                  <div className="flex items-center gap-2 text-sm text-teal font-body font-semibold">
                    <Sparkles size={16} />
                    <span>You&apos;ve practiced {progress.currentStreak} {progress.currentStreak === 1 ? 'day' : 'days'} in a row!</span>
                  </div>
                )}
              </div>
            </motion.div>
            </TiltCard>
          </section>
        </main>
        <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Results screen                                            */
  /* ---------------------------------------------------------------- */

  if (phase === 'results') {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const percentage = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-cream">
        <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
          <svg width="100%" height="100%">
            <filter id="grain-dc-results">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            </filter>
            <rect width="100%" height="100%" filter="url(#grain-dc-results)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-muted hover:text-navy text-sm font-body font-medium mb-8 transition-colors duration-500"
          >
            <ArrowLeft size={16} />
            Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mb-10"
          >
            <h1 className="font-heading italic text-4xl md:text-5xl text-navy mb-2 flex items-center gap-3">
              <Trophy size={36} className="text-coral" />
              Challenge Complete!
            </h1>
            <p className="text-muted font-body text-lg">Here&apos;s how you did today</p>
          </motion.div>

          <div className="max-w-lg mx-auto space-y-6">
            {/* Score summary */}
            <motion.div
              className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                className="mx-auto mb-4 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              >
                <ProgressRing
                  progress={totalScore}
                  size={112}
                  strokeWidth={6}
                  className={totalScore >= 70 ? 'text-success' : totalScore >= 40 ? 'text-coral' : 'text-grape'}
                  delay={0.4}
                  showLabel={false}
                />
                <span className="absolute font-heading italic text-4xl font-bold text-coral">
                  <NumberTicker value={totalScore} suffix="%" duration={1000} delay={400} />
                </span>
              </motion.div>

              <h2 className="font-heading italic text-xl text-navy mb-1">
                {percentage === 100
                  ? 'Perfect Score!'
                  : percentage >= 70
                    ? 'Great Job!'
                    : percentage >= 40
                      ? 'Good Effort!'
                      : 'Keep Practicing!'}
              </h2>

              <p className="text-muted text-sm font-body mb-6">
                {correctCount} of {results.length} exercises correct
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-teal/5 rounded-2xl p-3">
                  <Star size={20} className="text-teal mx-auto mb-1" />
                  <p className="font-heading italic font-bold text-navy text-lg"><NumberTicker value={totalXPEarned} delay={500} /></p>
                  <p className="text-xs text-muted font-body">XP Earned</p>
                </div>
                <div className="bg-success/5 rounded-2xl p-3">
                  <CheckCircle size={20} className="text-success mx-auto mb-1" />
                  <p className="font-heading italic font-bold text-navy text-lg">{correctCount}/{results.length}</p>
                  <p className="text-xs text-muted font-body">Correct</p>
                </div>
                <div className="bg-grape/5 rounded-2xl p-3">
                  <Clock size={20} className="text-grape mx-auto mb-1" />
                  <p className="font-heading italic font-bold text-navy text-lg">{formatTime(timeSpent)}</p>
                  <p className="text-xs text-muted font-body">Time</p>
                </div>
              </div>

              {percentage === 100 && (
                <motion.div
                  className="bg-coral/5 rounded-2xl px-4 py-3 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <p className="text-coral font-body font-semibold text-sm">
                    +{BONUS_XP_ALL_CORRECT} bonus XP for a perfect score!
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Exercise breakdown */}
            <motion.div
              className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            >
              <h3 className="font-heading italic text-navy text-lg mb-4">
                Exercise Breakdown
              </h3>
              <div className="space-y-3">
                {results.map((result, idx) => {
                  const exercise = exercises[idx];
                  if (!exercise) return null;
                  const config = GAME_TYPE_CONFIG[exercise.gameType];

                  return (
                    <motion.div
                      key={`${result.exerciseId}-${idx}`}
                      className={`flex items-center gap-3 p-3 rounded-2xl ${config.bg}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.05, duration: 0.5, ease: 'easeOut' }}
                    >
                      <span className="text-xl flex-shrink-0">{exercise.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-navy text-sm truncate">
                          {exercise.prompt}
                        </p>
                        <p className={`text-xs font-body ${config.color}`}>
                          {config.label}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-sm font-body font-bold ${
                            result.matched ? 'text-success' : 'text-muted'
                          }`}
                        >
                          {result.score}%
                        </span>
                        {result.matched ? (
                          <CheckCircle size={18} className="text-success" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-muted/30" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            >
              <Link
                href="/play"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal text-white font-body font-semibold rounded-xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
              >
                Play More Games
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-navy font-body font-semibold rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
              >
                Back Home
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Active challenge                                          */
  /* ---------------------------------------------------------------- */

  const isTimerWarning = timeRemaining <= 60;

  return (
    <div className="min-h-screen bg-cream">
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
        <svg width="100%" height="100%">
          <filter id="grain-dc-active">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-dc-active)" />
        </svg>
      </div>

      {/* Sticky header with timer */}
      <header className="sticky top-0 z-30 bg-navy py-5 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <motion.div
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-heading italic font-bold text-lg ${
                isTimerWarning
                  ? 'bg-rose/20 text-white'
                  : 'bg-white/10 text-white'
              }`}
              animate={isTimerWarning ? { scale: [1, 1.03, 1] } : {}}
              transition={isTimerWarning ? { duration: 1, repeat: Infinity, ease: 'easeOut' } : {}}
            >
              <Timer size={18} />
              {formatTime(timeRemaining)}
            </motion.div>

            <span className="text-white/80 text-sm font-body font-semibold">
              {currentIndex + 1} / {exercises.length}
            </span>
          </div>

          {/* Timer progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isTimerWarning ? 'bg-rose/60' : 'bg-white/50'
              }`}
              style={{ width: `${(timeRemaining / CHALLENGE_DURATION_SECONDS) * 100}%` }}
            />
          </div>

          {/* Exercise progress dots */}
          <div className="flex items-center gap-1.5 mt-3 justify-center">
            {exercises.map((_, idx) => (
              <div
                key={idx}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  idx < results.length
                    ? results[idx]?.matched
                      ? 'bg-success scale-100'
                      : 'bg-rose scale-100'
                    : idx === currentIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/20 scale-100'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Exercise card */}
      <section className="px-6 py-10">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {currentExercise && gameConfig && (
              <motion.div
                key={currentExercise.id + '-' + currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden"
              >
                {/* Exercise type header */}
                <div className={`px-6 py-3 ${gameConfig.bg} flex items-center gap-2`}>
                  <span className="text-lg">{gameConfig.icon}</span>
                  <span className={`font-body font-semibold text-sm ${gameConfig.color}`}>
                    {gameConfig.label}
                  </span>
                  <span className={`ml-auto text-xs font-body font-medium px-2 py-0.5 rounded-full ${
                    currentExercise.difficulty === 'easy'
                      ? 'bg-success/10 text-success'
                      : currentExercise.difficulty === 'medium'
                        ? 'bg-coral/10 text-coral'
                        : 'bg-rose/10 text-rose'
                  }`}>
                    {currentExercise.difficulty}
                  </span>
                </div>

                {/* Exercise content */}
                <div className="p-8 text-center">
                  <motion.span
                    className="text-7xl block mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                  >
                    {currentExercise.emoji}
                  </motion.span>

                  <motion.h2
                    className="font-heading italic text-2xl md:text-3xl text-navy mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
                  >
                    {currentExercise.prompt}
                  </motion.h2>

                  {currentExercise.promptHindi && appLanguage === 'hi' && (
                    <p className="text-muted text-sm font-body mb-2">{currentExercise.promptHindi}</p>
                  )}

                  <p className="text-muted text-sm font-body mb-8">{gameConfig.instruction}</p>

                  {/* Speech recognition controls */}
                  {!isSupported ? (
                    <div className="px-4 py-3 bg-coral/5 text-coral rounded-xl text-sm font-body font-medium">
                      Speech recognition requires Chrome or Edge
                    </div>
                  ) : !currentResult ? (
                    <div className="space-y-3">
                      <motion.button
                        onClick={() => {
                          resetTranscript();
                          startListening();
                        }}
                        disabled={isListening}
                        className={`w-full flex items-center justify-center gap-2 font-body font-bold py-4 rounded-xl cursor-pointer transition-all duration-500 text-lg ${
                          isListening
                            ? 'bg-coral text-white shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                            : 'bg-teal text-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]'
                        }`}
                        whileHover={!isListening ? { y: -1 } : undefined}
                        whileTap={!isListening ? { scale: 0.98 } : undefined}
                      >
                        {isListening ? (
                          <>
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'easeOut' }}
                              className="flex items-center justify-center"
                            >
                              <Mic size={22} />
                            </motion.div>
                            Listening...
                          </>
                        ) : (
                          <>
                            <Mic size={22} />
                            Say it!
                          </>
                        )}
                      </motion.button>

                      {micError && (
                        <button
                          onClick={() => setShowMicModal(true)}
                          className="bg-coral/10 rounded-xl px-4 py-2 cursor-pointer hover:bg-coral/20 transition-colors"
                        >
                          <p className="text-coral text-sm text-center font-body">Microphone error. Tap here for help.</p>
                        </button>
                      )}

                      <button
                        onClick={skipExercise}
                        className="text-sm text-muted hover:text-navy transition-colors duration-500 cursor-pointer font-body"
                      >
                        Skip this one
                      </button>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="space-y-4"
                    >
                      {currentResult.matched ? (
                        <div className="space-y-2">
                          <motion.div
                            className="flex items-center justify-center gap-2 text-success"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                          >
                            <CheckCircle size={28} />
                            <span className="font-heading italic font-bold text-xl">
                              Great job!
                            </span>
                          </motion.div>
                          <p className="text-sm text-muted font-body">
                            You said{' '}
                            <span className="font-semibold text-navy">
                              &ldquo;{currentResult.transcript}&rdquo;
                            </span>
                          </p>
                          <motion.p
                            className="text-success font-body font-bold text-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                          >
                            +{XP_PER_CORRECT} XP
                          </motion.p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="font-heading italic font-bold text-coral text-xl">
                            Almost!
                          </p>
                          <p className="text-sm text-muted font-body">
                            You said{' '}
                            <span className="font-semibold text-navy">
                              &ldquo;{currentResult.transcript}&rdquo;
                            </span>
                          </p>
                          <p className="text-xs text-muted font-body">
                            Score: {currentResult.score}%
                          </p>
                        </div>
                      )}

                      <motion.button
                        onClick={goToNext}
                        className="w-full flex items-center justify-center gap-2 bg-teal text-white font-body font-bold py-4 rounded-xl cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {currentIndex + 1 >= exercises.length ? (
                          <>
                            See Results
                            <Trophy size={20} />
                          </>
                        ) : (
                          <>
                            Next Exercise
                            <ArrowRight size={20} />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score ticker */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-6 text-sm font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle size={16} />
              <span className="font-semibold">
                {results.filter((r) => r.matched).length} correct
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-coral">
              <Star size={16} />
              <span className="font-semibold">
                {results.filter((r) => r.matched).length * XP_PER_CORRECT} XP
              </span>
            </div>
          </motion.div>
        </div>
      </section>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
    </div>
  );
}
