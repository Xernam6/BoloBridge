'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import exercises from '@/data/exercises.json';

interface TongueExercise {
  id: string;
  word: string;
  imageEmoji: string;
  difficulty: string;
  description: string;
}

const DIFFICULTY_SECONDS: Record<string, number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-success/10 text-success',
  medium: 'bg-orange/10 text-orange',
  hard: 'bg-grape/10 text-grape',
};

const ENCOURAGEMENTS = [
  'Great job! Keep going!',
  'You are doing amazing!',
  'Way to go, superstar!',
  'Fantastic effort!',
  'Keep it up, champion!',
];

const VIVI_TIPS: Record<string, string> = {
  'tg-1': 'Try holding for the full time! Your tongue is getting stronger!',
  'tg-2': 'Big smile, tiny pucker! Like a happy fish!',
  'tg-3': 'Can you hold the air in for 3 seconds? Challenge yourself!',
  'tg-4': 'Go slowly at first, then try to go faster!',
  'tg-5': 'Keep your teeth together while you slide. Easy does it!',
  'tg-6': 'Imagine your tongue is a wave in the ocean!',
  'tg-7': 'Try making different sounds: pa, ba, ma!',
  'tg-8': 'Start with the front teeth and work your way back!',
  'tg-9': 'Open wide like a roaring lion! RAWR!',
  'tg-10': 'The louder the buzz, the better the workout!',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardAnim = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 22 },
  },
};

export default function TongueGymPage() {
  const tongueExercises = exercises['tongue-gym'] as TongueExercise[];
  const [selectedExercise, setSelectedExercise] = useState<TongueExercise | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerComplete, setTimerComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = selectedExercise
    ? DIFFICULTY_SECONDS[selectedExercise.difficulty] || 5
    : 5;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimerRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    setTimerComplete(false);
    setTimeLeft(totalTime);
    setTimerRunning(true);
  }, [totalTime]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(totalTime);
    setTimerComplete(false);
  }, [stopTimer, totalTime]);

  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerRunning, timeLeft]);

  useEffect(() => {
    if (timerRunning && timeLeft === 0) {
      stopTimer();
      setTimerComplete(true);
    }
  }, [timerRunning, timeLeft, stopTimer]);

  // Reset timer when exercise changes
  useEffect(() => {
    stopTimer();
    if (selectedExercise) {
      setTimeLeft(DIFFICULTY_SECONDS[selectedExercise.difficulty] || 5);
      setTimerComplete(false);
    }
  }, [selectedExercise, stopTimer]);

  const progress = selectedExercise
    ? 1 - timeLeft / totalTime
    : 0;

  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference * (1 - progress);

  const encouragement = ENCOURAGEMENTS[selectedExercise ? tongueExercises.indexOf(selectedExercise) % ENCOURAGEMENTS.length : 0];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-gradient-to-r from-orange-400 to-red-500 pt-10 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Games
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <span className="text-4xl md:text-5xl">💪</span>
              Tongue Gym
            </h1>
            <p className="text-white/80 text-base">
              Fun workouts for your tongue, lips, and jaw!
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Exercise List */}
          <div>
            <h2 className="font-heading text-lg font-bold text-navy mb-4">
              Choose an Exercise
            </h2>
            <motion.div
              className="space-y-3"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {tongueExercises.map((exercise) => (
                <motion.button
                  key={exercise.id}
                  variants={cardAnim}
                  onClick={() => setSelectedExercise(exercise)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedExercise?.id === exercise.id
                      ? 'bg-white shadow-lg border-orange-300 ring-2 ring-orange-200'
                      : 'bg-white border-gray-100 hover:shadow-md hover:border-gray-200'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-4xl shrink-0">{exercise.imageEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-navy text-sm">
                        {exercise.word}
                      </h3>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          DIFFICULTY_COLORS[exercise.difficulty]
                        }`}
                      >
                        {exercise.difficulty}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {exercise.description}
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Exercise Detail / Timer */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              {selectedExercise ? (
                <motion.div
                  key={selectedExercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6"
                >
                  {/* Exercise Info */}
                  <div className="text-center mb-6">
                    <span className="text-6xl block mb-3">{selectedExercise.imageEmoji}</span>
                    <h2 className="font-heading text-xl font-bold text-navy mb-2">
                      {selectedExercise.word}
                    </h2>
                    <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
                      {selectedExercise.description}
                    </p>
                  </div>

                  {/* Circular Timer */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-36 h-36">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 120 120"
                      >
                        {/* Background circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="#f3f4f6"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke={timerComplete ? '#2ECC71' : '#F97316'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                      {/* Center text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-heading text-3xl font-bold text-navy">
                          {timeLeft}
                        </span>
                        <span className="text-xs text-muted font-medium">seconds</span>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex gap-3 justify-center mb-6">
                    {!timerRunning && !timerComplete && (
                      <motion.button
                        onClick={startTimer}
                        className="flex items-center gap-2 bg-gradient-to-r from-orange-400 to-red-500 text-white font-semibold px-6 py-3 rounded-xl shadow-md cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play size={18} />
                        Start
                      </motion.button>
                    )}
                    <motion.button
                      onClick={resetTimer}
                      className="flex items-center gap-2 border-2 border-gray-200 text-body font-semibold px-6 py-3 rounded-xl cursor-pointer hover:border-gray-300 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <RotateCcw size={18} />
                      Reset
                    </motion.button>
                  </div>

                  {/* Encouragement */}
                  <AnimatePresence>
                    {(timerRunning || timerComplete) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`text-center py-3 px-4 rounded-xl ${
                          timerComplete
                            ? 'bg-success/10 text-success'
                            : 'bg-orange/10 text-orange'
                        }`}
                      >
                        <p className="font-semibold text-sm">
                          {timerComplete
                            ? '🎉 Amazing! You did it!'
                            : encouragement}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Vivi Tip */}
                  <div className="mt-5 flex gap-3 items-start">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shrink-0 text-xl">
                      🦜
                    </div>
                    <div className="bg-ice rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                      <p className="text-sm text-body leading-relaxed">
                        {VIVI_TIPS[selectedExercise.id] ||
                          'Take it easy and have fun! Practice makes perfect!'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 text-center"
                >
                  <span className="text-6xl block mb-4">👆</span>
                  <h3 className="font-heading text-lg font-bold text-navy mb-2">
                    Pick an Exercise
                  </h3>
                  <p className="text-sm text-muted">
                    Select an exercise from the list to start your tongue workout!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
