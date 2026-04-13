'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, RotateCcw, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAppStore } from '@/lib/store';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';

/* ------------------------------------------------------------------ */
/*  Emotion clip data                                                  */
/* ------------------------------------------------------------------ */

interface EmotionClip {
  id: string;
  text: string;
  emotion: string;
  emoji: string;
  pitch: number;
  rate: number;
  level: 1 | 2 | 3;
}

const EMOTION_CLIPS: EmotionClip[] = [
  // Level 1: Basic — happy, sad, angry
  { id: 'e1', text: 'I got a new puppy today!', emotion: 'happy', emoji: '😊', pitch: 1.4, rate: 1.1, level: 1 },
  { id: 'e2', text: 'My toy is broken.', emotion: 'sad', emoji: '😢', pitch: 0.7, rate: 0.7, level: 1 },
  { id: 'e3', text: 'Someone took my cookie!', emotion: 'angry', emoji: '😠', pitch: 0.9, rate: 1.3, level: 1 },
  { id: 'e4', text: 'We are going to the zoo!', emotion: 'happy', emoji: '😊', pitch: 1.4, rate: 1.15, level: 1 },
  { id: 'e5', text: 'I lost my favorite book.', emotion: 'sad', emoji: '😢', pitch: 0.65, rate: 0.75, level: 1 },
  { id: 'e6', text: 'That is not fair at all!', emotion: 'angry', emoji: '😠', pitch: 0.85, rate: 1.35, level: 1 },

  // Level 2: +surprised, scared
  { id: 'e7', text: 'There is a spider on my arm!', emotion: 'scared', emoji: '😨', pitch: 1.5, rate: 1.4, level: 2 },
  { id: 'e8', text: 'Wait, is that a dinosaur?', emotion: 'surprised', emoji: '😲', pitch: 1.6, rate: 1.2, level: 2 },
  { id: 'e9', text: 'I just won first place!', emotion: 'happy', emoji: '😊', pitch: 1.45, rate: 1.2, level: 2 },
  { id: 'e10', text: 'Nobody came to my party.', emotion: 'sad', emoji: '😢', pitch: 0.6, rate: 0.65, level: 2 },
  { id: 'e11', text: 'You stepped on my painting!', emotion: 'angry', emoji: '😠', pitch: 0.85, rate: 1.25, level: 2 },
  { id: 'e12', text: 'Did the lights just go out?', emotion: 'scared', emoji: '😨', pitch: 1.45, rate: 1.35, level: 2 },

  // Level 3: +sarcastic, excited, confused
  { id: 'e13', text: 'Oh sure, that sounds like a great idea.', emotion: 'sarcastic', emoji: '😏', pitch: 0.8, rate: 0.85, level: 3 },
  { id: 'e14', text: 'We are going to the amusement park!', emotion: 'excited', emoji: '🤩', pitch: 1.55, rate: 1.3, level: 3 },
  { id: 'e15', text: 'Wait, what just happened?', emotion: 'confused', emoji: '🤔', pitch: 1.1, rate: 0.9, level: 3 },
  { id: 'e16', text: 'Wow, that was so much fun.', emotion: 'sarcastic', emoji: '😏', pitch: 0.75, rate: 0.8, level: 3 },
  { id: 'e17', text: 'I cannot believe we won the game!', emotion: 'excited', emoji: '🤩', pitch: 1.5, rate: 1.35, level: 3 },
  { id: 'e18', text: 'But I do not understand the rules.', emotion: 'confused', emoji: '🤔', pitch: 1.05, rate: 0.85, level: 3 },
];

/* ------------------------------------------------------------------ */
/*  Emotion options per level                                          */
/* ------------------------------------------------------------------ */

const EMOTION_OPTIONS: Record<number, { emotion: string; emoji: string; label: string }[]> = {
  1: [
    { emotion: 'happy', emoji: '😊', label: 'Happy' },
    { emotion: 'sad', emoji: '😢', label: 'Sad' },
    { emotion: 'angry', emoji: '😠', label: 'Angry' },
  ],
  2: [
    { emotion: 'happy', emoji: '😊', label: 'Happy' },
    { emotion: 'sad', emoji: '😢', label: 'Sad' },
    { emotion: 'angry', emoji: '😠', label: 'Angry' },
    { emotion: 'surprised', emoji: '😲', label: 'Surprised' },
    { emotion: 'scared', emoji: '😨', label: 'Scared' },
  ],
  3: [
    { emotion: 'happy', emoji: '😊', label: 'Happy' },
    { emotion: 'sad', emoji: '😢', label: 'Sad' },
    { emotion: 'angry', emoji: '😠', label: 'Angry' },
    { emotion: 'surprised', emoji: '😲', label: 'Surprised' },
    { emotion: 'sarcastic', emoji: '😏', label: 'Sarcastic' },
    { emotion: 'excited', emoji: '🤩', label: 'Excited' },
    { emotion: 'confused', emoji: '🤔', label: 'Confused' },
  ],
};

const LEVEL_INFO = [
  { level: 1, name: 'Beginner', emotions: 'Happy, Sad, Angry', count: 3 },
  { level: 2, name: 'Intermediate', emotions: '+ Surprised, Scared', count: 5 },
  { level: 3, name: 'Advanced', emotions: '+ Sarcastic, Excited, Confused', count: 7 },
];

const LEVEL_ICONS = ['🌱', '🌿', '🌳'];

const XP_PER_CORRECT = 10;
const BONUS_XP_PERFECT = 30;
const BONUS_XP_RECORDING = 10;

/* ------------------------------------------------------------------ */
/*  TTS with emotion                                                   */
/* ------------------------------------------------------------------ */

function speakWithEmotion(text: string, pitch: number, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('Speech synthesis error'));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

/* ------------------------------------------------------------------ */
/*  Waveform bar component                                             */
/* ------------------------------------------------------------------ */

function WaveformBars({ active }: { active: boolean }) {
  const bars = [16, 28, 40, 52, 36, 48, 32, 56, 44, 24, 36, 48, 20, 12];
  const durations = [1.2, 1.0, 0.9, 1.1, 1.3, 0.85, 1.15, 0.95, 1.05, 1.25, 0.9, 1.0, 1.2, 1.1];
  const delays = [0, 0.1, 0.2, 0.05, 0.15, 0.25, 0.1, 0.2, 0.08, 0.18, 0.12, 0.22, 0.05, 0.15];
  const opacities = [0.4, 0.5, 0.6, 1, 0.7, 1, 0.6, 1, 0.7, 0.5, 0.6, 1, 0.5, 0.4];

  return (
    <div className="w-full flex items-end justify-center gap-[3px] h-14 px-4">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[5px] rounded-full bg-teal"
          style={{
            height: `${h}px`,
            opacity: opacities[i],
            animation: active ? `wave-bar ${durations[i]}s ease-in-out ${delays[i]}s infinite` : 'none',
            transform: active ? undefined : 'scaleY(0.3)',
            transition: 'transform 0.5s ease-out',
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Emotion face SVGs                                                  */
/* ------------------------------------------------------------------ */

function EmotionFace({ emotion }: { emotion: string }) {
  switch (emotion) {
    case 'happy':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#FAE3B0" opacity="0.5" />
          <circle cx="48" cy="52" r="42" fill="#F5D99A" opacity="0.3" />
          <circle cx="50" cy="50" r="38" fill="#FCECC7" stroke="#E8C96A" strokeWidth="2" />
          <path d="M32 42 Q37 36 42 42" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 42 Q63 36 68 42" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M33 58 Q50 72 67 58" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="30" cy="55" r="5" fill="#E8A0A0" opacity="0.4" />
          <circle cx="70" cy="55" r="5" fill="#E8A0A0" opacity="0.4" />
        </svg>
      );
    case 'sad':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#B8CCE0" opacity="0.4" />
          <circle cx="52" cy="48" r="42" fill="#A3BDD6" opacity="0.25" />
          <circle cx="50" cy="50" r="38" fill="#C8DAE8" stroke="#8BAFC8" strokeWidth="2" />
          <circle cx="37" cy="42" r="3" fill="#2D3142" />
          <circle cx="63" cy="42" r="3" fill="#2D3142" />
          <path d="M30 36 L40 38" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M70 36 L60 38" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 64 Q50 54 65 64" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="63" cy="52" rx="2" ry="3" fill="#8BAFC8" opacity="0.6" />
        </svg>
      );
    case 'angry':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#E8B8B8" opacity="0.4" />
          <circle cx="52" cy="48" r="42" fill="#DCA0A0" opacity="0.25" />
          <circle cx="50" cy="50" r="38" fill="#F0D0D0" stroke="#D16D6D" strokeWidth="2" />
          <ellipse cx="37" cy="43" rx="4" ry="2.5" fill="#2D3142" />
          <ellipse cx="63" cy="43" rx="4" ry="2.5" fill="#2D3142" />
          <path d="M28 34 L42 38" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M72 34 L58 38" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M36 62 L50 58 L64 62" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'surprised':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#D4B8E8" opacity="0.35" />
          <circle cx="48" cy="52" r="42" fill="#C4A6DA" opacity="0.2" />
          <circle cx="50" cy="50" r="38" fill="#E3D4EF" stroke="#B89AD4" strokeWidth="2" />
          <circle cx="37" cy="40" r="5" fill="#FFFFFF" stroke="#2D3142" strokeWidth="2" />
          <circle cx="37" cy="40" r="2.5" fill="#2D3142" />
          <circle cx="63" cy="40" r="5" fill="#FFFFFF" stroke="#2D3142" strokeWidth="2" />
          <circle cx="63" cy="40" r="2.5" fill="#2D3142" />
          <path d="M30 30 Q37 26 44 30" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M56 30 Q63 26 70 30" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="50" cy="62" rx="8" ry="10" fill="#C4A6DA" opacity="0.4" stroke="#2D3142" strokeWidth="2" />
        </svg>
      );
    case 'scared':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#C8D8C8" opacity="0.35" />
          <circle cx="48" cy="52" r="42" fill="#B0C8B0" opacity="0.2" />
          <circle cx="50" cy="50" r="38" fill="#D8E8D8" stroke="#8CB88C" strokeWidth="2" />
          <circle cx="37" cy="40" r="5.5" fill="#FFFFFF" stroke="#2D3142" strokeWidth="2" />
          <circle cx="37" cy="41" r="2" fill="#2D3142" />
          <circle cx="63" cy="40" r="5.5" fill="#FFFFFF" stroke="#2D3142" strokeWidth="2" />
          <circle cx="63" cy="41" r="2" fill="#2D3142" />
          <path d="M30 32 Q37 28 44 34" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M56 34 Q63 28 70 32" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 62 Q44 58 50 62 Q56 66 62 62" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'excited':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#F5D4B8" opacity="0.4" />
          <circle cx="48" cy="48" r="42" fill="#EABC96" opacity="0.25" />
          <circle cx="50" cy="50" r="38" fill="#FAE8D4" stroke="#C2956B" strokeWidth="2" />
          <polygon points="37,36 38.5,40 43,40 39.5,43 41,47 37,44.5 33,47 34.5,43 31,40 35.5,40" fill="#2D3142" transform="scale(0.8) translate(9,5)" />
          <polygon points="63,36 64.5,40 69,40 65.5,43 67,47 63,44.5 59,47 60.5,43 57,40 61.5,40" fill="#2D3142" transform="scale(0.8) translate(14,5)" />
          <path d="M32 55 Q50 74 68 55" fill="#C2956B" opacity="0.3" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="28" cy="54" r="5" fill="#E8A0A0" opacity="0.35" />
          <circle cx="72" cy="54" r="5" fill="#E8A0A0" opacity="0.35" />
        </svg>
      );
    case 'sarcastic':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#D8D0E8" opacity="0.35" />
          <circle cx="48" cy="52" r="42" fill="#C8BED8" opacity="0.2" />
          <circle cx="50" cy="50" r="38" fill="#E8E0F0" stroke="#A898C8" strokeWidth="2" />
          <circle cx="37" cy="42" r="3" fill="#2D3142" />
          <ellipse cx="63" cy="40" rx="4" ry="2.5" fill="#2D3142" />
          <path d="M30 36 L40 34" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M70 34 L60 36" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M38 60 Q50 66 62 58" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'confused':
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="44" fill="#D0D8E0" opacity="0.35" />
          <circle cx="48" cy="52" r="42" fill="#C0C8D8" opacity="0.2" />
          <circle cx="50" cy="50" r="38" fill="#E0E4F0" stroke="#98A8C0" strokeWidth="2" />
          <circle cx="37" cy="42" r="3.5" fill="#2D3142" />
          <circle cx="63" cy="42" r="3.5" fill="#2D3142" />
          <path d="M30 36 Q35 32 42 36" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M58 36 Q65 32 70 36" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <path d="M40 62 Q46 58 52 62 Q58 66 62 60" fill="none" stroke="#2D3142" strokeWidth="2" strokeLinecap="round" />
          <text x="70" y="30" fontSize="14" fill="#2D3142" fontWeight="bold">?</text>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="38" fill="#E8E4DE" stroke="#C8C4BE" strokeWidth="2" />
          <circle cx="37" cy="42" r="3" fill="#2D3142" />
          <circle cx="63" cy="42" r="3" fill="#2D3142" />
          <path d="M38 60 L62 60" fill="none" stroke="#2D3142" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

type Phase = 'select-level' | 'playing' | 'bonus' | 'results';

interface Answer {
  clip: EmotionClip;
  chosen: string;
  correct: boolean;
}

export default function EmotionEchoPage() {
  const addXP = useAppStore((s) => s.addXP);

  const [phase, setPhase] = useState<Phase>('select-level');
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [correctEmotion, setCorrectEmotion] = useState<string | null>(null);

  // Bonus mode state
  const [bonusClip, setBonusClip] = useState<EmotionClip | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  const { isSupported, isListening, isProcessing, error: micError, startListening, stopListening, resetTranscript } =
    useSpeechRecognition('en');

  const [showMicModal, setShowMicModal] = useState(false);
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  // Get clips for selected level
  const levelClips = useMemo(
    () => EMOTION_CLIPS.filter((c) => c.level <= level).sort(() => Math.random() - 0.5).slice(0, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, phase],
  );

  const currentClip = levelClips[currentClipIndex] ?? null;
  const options = EMOTION_OPTIONS[level] ?? EMOTION_OPTIONS[1];

  const score = useMemo(() => answers.filter((a) => a.correct).length, [answers]);

  // Streak tracking
  const streak = useMemo(() => {
    let count = 0;
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].correct) count++;
      else break;
    }
    return count;
  }, [answers]);

  // Play the current clip
  const playClip = useCallback(async () => {
    if (!currentClip || isPlaying) return;
    setIsPlaying(true);
    try {
      await speakWithEmotion(currentClip.text, currentClip.pitch, currentClip.rate);
    } catch {
      // ignore TTS errors
    }
    setIsPlaying(false);
    setHasPlayed(true);
  }, [currentClip, isPlaying]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (chosenEmotion: string) => {
      if (!currentClip || showFeedback) return;

      const correct = chosenEmotion === currentClip.emotion;
      const answer: Answer = { clip: currentClip, chosen: chosenEmotion, correct };
      setAnswers((prev) => [...prev, answer]);

      if (correct) {
        addXP(XP_PER_CORRECT);
        setShowFeedback('correct');
      } else {
        setCorrectEmotion(currentClip.emotion);
        setShowFeedback('wrong');
      }

      // Auto-advance after feedback
      setTimeout(() => {
        setShowFeedback(null);
        setCorrectEmotion(null);
        setHasPlayed(false);

        if (currentClipIndex + 1 >= levelClips.length) {
          // Round complete — offer bonus mode
          const randomClip = levelClips[Math.floor(Math.random() * levelClips.length)];
          setBonusClip(randomClip);
          setPhase('bonus');

          // Award perfect score bonus
          const finalAnswers = [...answers, answer];
          if (finalAnswers.every((a) => a.correct)) {
            addXP(BONUS_XP_PERFECT);
          }
        } else {
          setCurrentClipIndex((i) => i + 1);
        }
      }, 1500);
    },
    [currentClip, showFeedback, currentClipIndex, levelClips, answers, addXP],
  );

  // Start a level
  const startLevel = useCallback((lv: 1 | 2 | 3) => {
    setLevel(lv);
    setCurrentClipIndex(0);
    setAnswers([]);
    setHasPlayed(false);
    setShowFeedback(null);
    setCorrectEmotion(null);
    setHasRecorded(false);
    setPhase('playing');
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Render: Level selection                                          */
  /* ---------------------------------------------------------------- */

  if (phase === 'select-level') {
    return (
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <header className="bg-cream/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.06)] sticky top-0 z-40">
          <div className="flex justify-between items-center w-full px-6 md:px-10 py-5 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/play"
                className="flex items-center gap-1.5 text-coral hover:text-coral-light transition-colors duration-500 p-2 rounded-2xl hover:bg-mint"
              >
                <ArrowLeft size={20} />
                <span className="font-body font-medium text-sm hidden sm:inline">Play</span>
              </Link>
              <h1 className="text-xl md:text-2xl font-heading italic text-teal font-semibold">Emotion Echo</h1>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
          {/* Instruction banner */}
          <div className="bg-mint rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-8 py-6 flex items-center gap-4">
            <span className="text-3xl">🎭</span>
            <div>
              <p className="font-heading italic text-xl md:text-2xl text-navy">Listen and feel the emotion</p>
              <p className="font-body text-sm text-navy/50 mt-1">
                Hear a voice clip, then pick the emoji that matches how the voice sounds. Try recording your own at the end!
              </p>
            </div>
          </div>

          {/* Level cards */}
          <div className="space-y-4">
            {LEVEL_INFO.map((info, i) => (
              <TiltCard key={info.level} tiltAmount={6}>
                <motion.button
                  onClick={() => startLevel(info.level as 1 | 2 | 3)}
                  className="w-full bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-6 text-left cursor-pointer hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading italic text-xl text-navy font-semibold mb-1">
                        Level {info.level}: {info.name}
                      </h3>
                      <p className="text-sm text-muted font-body">
                        {info.count} emotions: {info.emotions}
                      </p>
                    </div>
                    <span className="text-4xl">{LEVEL_ICONS[i]}</span>
                  </div>
                </motion.button>
              </TiltCard>
            ))}
          </div>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Bonus mode                                               */
  /* ---------------------------------------------------------------- */

  if (phase === 'bonus') {
    return (
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <header className="bg-cream/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.06)] sticky top-0 z-40">
          <div className="flex justify-between items-center w-full px-6 md:px-10 py-5 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-heading italic text-teal font-semibold">Bonus Round</h1>
            </div>
            <div className="bg-mint px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-lg">🎤</span>
              <span className="font-body font-semibold text-teal text-sm">Your turn!</span>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-6 md:px-10 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <TiltCard tiltAmount={4}>
              <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 text-center space-y-6">
                <span className="text-6xl block">{bonusClip?.emoji}</span>
                <div>
                  <h2 className="font-heading italic text-2xl text-navy mb-2">
                    Say it like you&apos;re <span className="text-teal">{bonusClip?.emotion}</span>!
                  </h2>
                  <div className="bg-mint rounded-2xl p-4 mt-4">
                    <p className="font-heading italic text-lg text-navy/80">
                      &quot;{bonusClip?.text}&quot;
                    </p>
                  </div>
                </div>

                {/* Replay button */}
                <MagneticButton
                  onClick={() => {
                    if (bonusClip) speakWithEmotion(bonusClip.text, bonusClip.pitch, bonusClip.rate);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-mint text-navy/60 rounded-xl text-sm font-body font-medium hover:bg-ice transition-colors duration-500"
                >
                  <Volume2 size={16} /> Hear it again
                </MagneticButton>

                {!hasRecorded ? (
                  <div className="space-y-4">
                    {/* Mic button */}
                    <div className="flex justify-center">
                      <motion.button
                        onClick={() => {
                          if (isListening) {
                            stopListening();
                            setHasRecorded(true);
                            addXP(BONUS_XP_RECORDING);
                          } else {
                            resetTranscript();
                            startListening();
                          }
                        }}
                        disabled={!isSupported}
                        className={`w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 ${
                          isListening
                            ? 'bg-rose text-white'
                            : 'bg-teal text-white shadow-[0_8px_32px_rgba(92,77,154,0.3)]'
                        } disabled:opacity-50`}
                        animate={isListening ? { scale: [1, 1.06, 1] } : {}}
                        transition={isListening ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                      >
                        {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                      </motion.button>
                    </div>
                    <p className="font-body text-sm text-muted">
                      {isListening ? 'Tap to stop recording' : 'Tap to record your voice'}
                    </p>
                    {micError && (
                      <div className="bg-rose/10 rounded-xl px-4 py-2.5">
                        <p className="text-rose text-sm text-center font-body">{micError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="bg-success/10 rounded-2xl p-5"
                  >
                    <p className="text-success font-body font-semibold">
                      Amazing job! +{BONUS_XP_RECORDING} bonus XP!
                    </p>
                    <p className="text-success/70 text-sm mt-1 font-body">
                      Great effort expressing that emotion!
                    </p>
                  </motion.div>
                )}

                <MagneticButton
                  onClick={() => setPhase('results')}
                  className="w-full py-4 bg-white text-navy font-body font-semibold rounded-xl border-2 border-navy/10 hover:border-teal/30 transition-colors duration-500"
                >
                  {hasRecorded ? 'See Results' : 'Skip to Results'}
                </MagneticButton>
              </div>
            </TiltCard>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Results                                                  */
  /* ---------------------------------------------------------------- */

  if (phase === 'results') {
    const totalClips = answers.length;
    const percentage = totalClips > 0 ? Math.round((score / totalClips) * 100) : 0;
    const totalXP = score * XP_PER_CORRECT + (score === totalClips ? BONUS_XP_PERFECT : 0) + (hasRecorded ? BONUS_XP_RECORDING : 0);

    return (
      <div className="min-h-screen bg-cream">
        {/* Header */}
        <header className="bg-cream/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.06)] sticky top-0 z-40">
          <div className="flex justify-between items-center w-full px-6 md:px-10 py-5 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/play"
                className="flex items-center gap-1.5 text-coral hover:text-coral-light transition-colors duration-500 p-2 rounded-2xl hover:bg-mint"
              >
                <ArrowLeft size={20} />
                <span className="font-body font-medium text-sm hidden sm:inline">Play</span>
              </Link>
              <h1 className="text-xl md:text-2xl font-heading italic text-teal font-semibold">Round Complete</h1>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-6 md:px-10 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 text-center space-y-6">
              {/* Big emoji */}
              <motion.div
                className="text-6xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              >
                {percentage >= 80 ? '🌟' : percentage >= 50 ? '👏' : '💪'}
              </motion.div>

              <h2 className="font-heading italic text-2xl text-navy">
                {percentage >= 80
                  ? 'Fantastic!'
                  : percentage >= 50
                    ? 'Great effort!'
                    : 'Keep practicing!'}
              </h2>

              <p className="font-body text-muted">
                You matched {score} out of {totalClips} emotions correctly!
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-teal/10 rounded-2xl p-4">
                  <p className="text-2xl font-heading italic text-teal font-bold">{percentage}%</p>
                  <p className="text-xs text-teal/70 font-body font-semibold mt-1">Accuracy</p>
                </div>
                <div className="bg-coral/10 rounded-2xl p-4">
                  <p className="text-2xl font-heading italic text-coral font-bold">{score}/{totalClips}</p>
                  <p className="text-xs text-coral/70 font-body font-semibold mt-1">Correct</p>
                </div>
                <div className="bg-violet/10 rounded-2xl p-4">
                  <p className="text-2xl font-heading italic text-violet font-bold">+{totalXP}</p>
                  <p className="text-xs text-violet/70 font-body font-semibold mt-1">XP</p>
                </div>
              </div>

              {/* Answer breakdown - emoji comparison grid */}
              <div className="space-y-2 text-left">
                {answers.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-body ${
                      a.correct ? 'bg-success/8' : 'bg-rose/8'
                    }`}
                  >
                    <span className="text-lg">{a.correct ? '✅' : '❌'}</span>
                    <span className="flex-1 truncate text-navy/70">
                      &quot;{a.clip.text}&quot;
                    </span>
                    <span className="text-lg">
                      {a.correct
                        ? a.clip.emoji
                        : `${EMOTION_OPTIONS[level]?.find((e) => e.emotion === a.chosen)?.emoji ?? '?'} → ${a.clip.emoji}`}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <MagneticButton
                  onClick={() => startLevel(level)}
                  className="w-full py-4 bg-teal text-white font-body font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-500"
                >
                  <RotateCcw size={18} /> Try Again
                </MagneticButton>
                {level < 3 && (
                  <MagneticButton
                    onClick={() => startLevel((level + 1) as 1 | 2 | 3)}
                    className="w-full py-4 bg-violet text-white font-body font-semibold rounded-xl transition-all duration-500"
                  >
                    Next Level →
                  </MagneticButton>
                )}
                <Link
                  href="/play"
                  className="w-full py-4 bg-white text-navy font-body font-semibold rounded-xl border-2 border-navy/10 text-center hover:border-teal/30 transition-colors duration-500"
                >
                  Back to Games
                </Link>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render: Playing                                                  */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-cream">
      {/* CSS for wave animation */}
      <style>{`
        @keyframes wave-bar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes mic-pulse {
          0% { box-shadow: 0 0 0 0 rgba(92, 77, 154, 0.3); }
          50% { box-shadow: 0 0 0 20px rgba(92, 77, 154, 0); }
          100% { box-shadow: 0 0 0 0 rgba(92, 77, 154, 0); }
        }
      `}</style>

      {/* Header */}
      <header className="bg-cream/95 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.06)] sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-6 md:px-10 py-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPhase('select-level')}
              className="flex items-center gap-1.5 text-coral hover:text-coral-light transition-colors duration-500 p-2 rounded-2xl hover:bg-mint cursor-pointer"
            >
              <ArrowLeft size={20} />
              <span className="font-body font-medium text-sm hidden sm:inline">Play</span>
            </button>
            <h1 className="text-xl md:text-2xl font-heading italic text-teal font-semibold">Emotion Echo</h1>
          </div>

          {/* Center: Level badge */}
          <div className="hidden md:flex items-center gap-3">
            <span className="bg-mint px-4 py-2 rounded-full font-heading italic text-base text-navy/70">
              Level {level}
            </span>
          </div>

          {/* Right: Score */}
          <div className="flex items-center gap-3">
            <div className="bg-mint px-4 py-2 rounded-full flex items-center gap-2">
              <span className="text-lg">⭐</span>
              <span className="font-body font-bold text-navy text-sm">{score * XP_PER_CORRECT}</span>
            </div>
            <div className="bg-teal/10 px-4 py-2 rounded-full flex items-center gap-2">
              <span className="font-body font-semibold text-teal text-sm">
                Score: {score}/{answers.length}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 md:px-10 py-8 md:py-12 space-y-8">
        {/* Instruction banner */}
        <motion.div
          className="bg-mint rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-8 py-6 flex items-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="text-3xl">🎙️</span>
          <div>
            <p className="font-heading italic text-xl md:text-2xl text-navy">
              {hasPlayed ? 'What emotion did you hear?' : 'Listen carefully to the voice'}
            </p>
            <p className="font-body text-sm text-navy/50 mt-1">
              {hasPlayed
                ? 'Pick the face that matches the emotion in the voice.'
                : 'Tap the speaker button to hear the clip, then choose the matching emotion.'}
            </p>
          </div>
        </motion.div>

        {/* Main game layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Emotion cards grid */}
          <section className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {hasPlayed && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
                >
                  <div className={`grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5`}>
                    {options.map((opt) => {
                      const isCorrectAnswer = showFeedback === 'wrong' && opt.emotion === correctEmotion;
                      const isWrongAnswer = showFeedback === 'wrong' && answers[answers.length - 1]?.chosen === opt.emotion;
                      const isRightAnswer = showFeedback === 'correct' && opt.emotion === currentClip?.emotion;

                      const isHighlighted = isRightAnswer || isCorrectAnswer;

                      return (
                        <TiltCard key={opt.emotion} tiltAmount={6}>
                          <button
                            onClick={() => handleAnswer(opt.emotion)}
                            disabled={!!showFeedback}
                            className={`w-full bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-5 flex flex-col items-center gap-3 transition-all duration-500 cursor-pointer ${
                              isRightAnswer
                                ? 'ring-3 ring-success ring-offset-2 ring-offset-cream'
                                : isCorrectAnswer
                                  ? 'ring-3 ring-success/50 ring-offset-2 ring-offset-cream'
                                  : isWrongAnswer
                                    ? 'ring-3 ring-rose ring-offset-2 ring-offset-cream opacity-70'
                                    : 'hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
                            } ${!isHighlighted && !isWrongAnswer && showFeedback ? 'opacity-50' : ''} disabled:cursor-default`}
                            style={isHighlighted ? { animation: 'gentle-float 3s ease-in-out infinite' } : undefined}
                          >
                            <div className="w-20 h-20 md:w-24 md:h-24 relative">
                              <EmotionFace emotion={opt.emotion} />
                            </div>
                            <span className="font-heading italic text-base md:text-lg text-navy font-semibold">
                              {opt.label}
                            </span>
                            {isRightAnswer && (
                              <span className="bg-success/10 text-success text-xs font-body font-semibold px-3 py-1 rounded-full">
                                Correct!
                              </span>
                            )}
                            {isCorrectAnswer && (
                              <span className="bg-success/10 text-success text-xs font-body font-semibold px-3 py-1 rounded-full">
                                This one!
                              </span>
                            )}
                          </button>
                        </TiltCard>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt when not yet played */}
            {!hasPlayed && (
              <motion.div
                className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 text-center"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <p className="font-heading italic text-xl text-navy/50 mb-2">
                  Tap the speaker to hear the voice clip
                </p>
                <p className="font-body text-sm text-muted">
                  Clip {currentClipIndex + 1} of {levelClips.length}
                </p>
              </motion.div>
            )}
          </section>

          {/* Recording & Controls sidebar */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            {/* Microphone + Waveform Card */}
            <TiltCard tiltAmount={4}>
              <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 flex flex-col items-center text-center space-y-6">
                {/* Speaker / Play button */}
                <div className="relative">
                  <motion.button
                    onClick={playClip}
                    disabled={isPlaying}
                    className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 cursor-pointer ${
                      isPlaying
                        ? 'bg-teal text-white shadow-[0_8px_32px_rgba(92,77,154,0.3)]'
                        : hasPlayed
                          ? 'bg-teal/10 text-teal hover:bg-teal/20'
                          : 'bg-teal text-white shadow-[0_8px_32px_rgba(92,77,154,0.3)]'
                    }`}
                    style={isPlaying ? { animation: 'mic-pulse 2.5s ease-in-out infinite' } : undefined}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Volume2 size={40} />
                  </motion.button>
                </div>
                <p className="font-body text-sm text-navy/50">
                  {isPlaying ? 'Playing...' : hasPlayed ? 'Tap to replay' : 'Tap to listen'}
                </p>

                {/* Waveform */}
                <WaveformBars active={isPlaying} />

                {/* Progress Bar */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-sm text-navy/50">Progress</span>
                    <span className="font-body text-sm font-semibold text-navy">
                      {currentClipIndex + 1} of {levelClips.length} emotions
                    </span>
                  </div>
                  <div className="w-full h-3 bg-mint rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-teal rounded-full"
                      animate={{ width: `${((currentClipIndex + 1) / levelClips.length) * 100}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </TiltCard>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <MagneticButton
                onClick={playClip}
                disabled={isPlaying}
                className="flex-1 py-4 bg-violet text-white font-body font-semibold rounded-xl transition-colors duration-500 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Volume2 size={18} />
                {hasPlayed ? 'Replay' : 'Listen'}
              </MagneticButton>
              <MagneticButton
                onClick={() => {
                  if (currentClipIndex + 1 >= levelClips.length) {
                    const randomClip = levelClips[Math.floor(Math.random() * levelClips.length)];
                    setBonusClip(randomClip);
                    setPhase('bonus');
                  } else {
                    setCurrentClipIndex((i) => i + 1);
                    setHasPlayed(false);
                    setShowFeedback(null);
                    setCorrectEmotion(null);
                  }
                }}
                className="flex-1 py-4 bg-transparent text-coral font-body font-semibold rounded-xl border-2 border-coral transition-colors duration-500 flex items-center justify-center gap-2 hover:bg-coral/5"
              >
                Skip
              </MagneticButton>
            </div>
          </aside>
        </div>

        {/* Streak indicator */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <div className="bg-mint rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] px-8 py-5 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span className="font-heading italic text-xl text-navy font-semibold">{streak} in a row!</span>
                </div>
                <div className="h-6 w-px bg-navy/10" />
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(streak, 5) }).map((_, i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-teal" />
                  ))}
                  {Array.from({ length: Math.max(0, 5 - streak) }).map((_, i) => (
                    <div key={`e-${i}`} className="w-3 h-3 rounded-full bg-ice border border-navy/10" />
                  ))}
                </div>
                <span className="font-body text-sm text-navy/40">Keep going!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback toast */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex justify-center"
            >
              <div
                className={`px-8 py-4 rounded-2xl font-body font-semibold text-sm ${
                  showFeedback === 'correct'
                    ? 'bg-success/10 text-success'
                    : 'bg-rose/10 text-rose'
                }`}
              >
                {showFeedback === 'correct'
                  ? 'Correct! Great ear!'
                  : `Not quite, it was ${correctEmotion}! Keep trying!`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <MicPermissionModal isOpen={showMicModal} onClose={() => setShowMicModal(false)} errorMessage={micError} onRetry={() => startListening()} />
    </div>
  );
}
