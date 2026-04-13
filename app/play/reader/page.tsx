'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Upload,
  Mic,
  CheckCircle,
  Clock,
  Target,
  RotateCcw,
  Pause,
  Play,
  SkipForward,
  FileText,
} from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { compareSpeech, MATCH_THRESHOLD } from '@/lib/speech';
import { useAppStore } from '@/lib/store';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { MicPermissionModal } from '@/components/ui/MicPermissionModal';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WordState {
  text: string;         // Display text (with punctuation)
  clean: string;        // Cleaned text for comparison
  status: 'pending' | 'active' | 'correct' | 'skipped';
  attempts: number;
}

interface SentenceState {
  words: WordState[];
  originalText: string;
}

type Phase = 'input' | 'reading' | 'paused' | 'results';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

// Short function words that are hard for speech recognition
const EASY_WORDS = new Set(['a', 'an', 'i', 'am', 'is', 'in', 'it', 'of', 'or', 'to', 'so', 'no', 'on', 'at', 'be', 'by', 'do', 'go', 'he', 'if', 'me', 'my', 'oh', 'ok', 'up', 'us', 'we']);
const LOWER_THRESHOLD = 0.4; // More lenient for short words

const SAMPLE_TEXTS = [
  {
    title: 'The Wind and the Sun',
    level: 'Beginner',
    text: 'The Wind and the Sun had a fight. They wanted to see who was stronger. They saw a man walking on the road. The Sun said I can make him take off his coat. The Wind blew and blew. The man held his coat tight. Then the Sun came out and shone warm and bright. The man smiled and took off his coat. The Sun had won.',
  },
  {
    title: 'The Little Garden',
    level: 'Intermediate',
    text: 'Maria planted seeds in her garden every spring. She watered them each morning before school. The tiny green sprouts pushed through the dark soil. Sunflowers grew tall and faced the bright sun. Tomatoes turned from green to red on the vine. Maria shared her vegetables with neighbors who smiled with thanks. She learned that small acts of care can grow into something beautiful.',
  },
  {
    title: 'Ocean Discovery',
    level: 'Advanced',
    text: 'Deep beneath the surface of the ocean lies a world that few people have ever seen. Coral reefs stretch across the seafloor like underwater cities. Thousands of species of fish swim through tunnels and caves formed by ancient volcanic activity. Scientists use submarines and robots to explore these mysterious depths. Every expedition brings new discoveries that change our understanding of life on Earth.',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function cleanWord(w: string): string {
  return w
    .toLowerCase()
    .replace(/[^a-z0-9']/gi, '')
    .replace(/^'+|'+$/g, '') // strip leading/trailing apostrophes
    .trim();
}

function parseText(raw: string): SentenceState[] {
  // Split on sentence boundaries or double newlines
  const lines = raw
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const rawWords = line.split(/\s+/).filter(Boolean);
    return {
      originalText: line,
      words: rawWords
        .map((w) => ({
          text: w,
          clean: cleanWord(w),
          status: 'pending' as const,
          attempts: 0,
        }))
        .filter((w) => w.clean.length > 0), // drop punctuation-only tokens
    };
  }).filter((s) => s.words.length > 0);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Compare a single target word against a transcript that may contain multiple words.
 * Returns the highest match score across all words in the transcript.
 * This handles the common case where the speech recogniser captures more than
 * one word (e.g. "the wind") when we only want to match "the".
 */
function bestMatch(target: string, transcript: string): number {
  // Full-transcript comparison first (handles single-word case)
  let best = compareSpeech(target, transcript);
  // Also check each individual word in the transcript
  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  for (const w of words) {
    const score = compareSpeech(target, w);
    if (score > best) best = score;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Academic Sources Component                                         */
/* ------------------------------------------------------------------ */

function AcademicSources() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-ice dark:bg-white/5 rounded-2xl p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-body font-semibold text-navy dark:text-white cursor-pointer w-full text-left"
      >
        <BookOpen size={16} className="text-teal" />
        Why reading aloud?
        <span className="ml-auto text-muted text-xs">{expanded ? 'Hide' : 'Show'} research</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3 text-xs font-body text-muted leading-relaxed">
              <p>
                Oral reading fluency (ORF) is one of the most evidence-backed interventions in speech-language pathology.
                Research shows it improves articulation, phonological awareness, vocabulary, and comprehension.
              </p>
              <ul className="space-y-2 list-none">
                <li>
                  <strong>Hasbrouck & Tindal (2006)</strong> — ORF norms predict reading competence in grades 1-8.
                  <em> The Reading Teacher, 59(7).</em>
                </li>
                <li>
                  <strong>National Reading Panel (2000)</strong> — Repeated oral reading significantly improves fluency, word recognition, and comprehension.
                  <em> NICHD.</em>
                </li>
                <li>
                  <strong>Catts et al. (2002)</strong> — Children with speech sound disorders are at elevated risk for reading difficulties; integrated interventions benefit both.
                  <em> JSLHR, 45(6).</em>
                </li>
                <li>
                  <strong>ASHA (2001)</strong> — Official position: oral reading is an appropriate therapeutic modality for children with speech and language disorders.
                </li>
                <li>
                  <strong>Project LISTEN, Carnegie Mellon (2006)</strong> — Word-by-word highlighting improves fluency in struggling readers.
                </li>
                <li>
                  <strong>Kuhn et al. (2010)</strong> — Prosodic oral reading supports comprehension and natural-sounding speech.
                  <em> Journal of Literacy Research, 42(1).</em>
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ReaderPage() {
  const [phase, setPhase] = useState<Phase>('input');
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [sentences, setSentences] = useState<SentenceState[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [accumulatedTime, setAccumulatedTime] = useState(0); // time before last pause
  const [showMicModal, setShowMicModal] = useState(false);
  const savedRef = useRef(false); // prevent double-saving XP

  const addXP = useAppStore((s) => s.addXP);
  const addExerciseResult = useAppStore((s) => s.addExerciseResult);

  const {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    error: micError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeSentenceRef = useRef<HTMLDivElement>(null);

  // Show mic modal on error
  useEffect(() => {
    if (micError) setShowMicModal(true);
  }, [micError]);

  // Timer — uses accumulatedTime so pauses don't inflate the clock
  useEffect(() => {
    if (phase === 'reading') {
      timerRef.current = setInterval(() => {
        setElapsed(accumulatedTime + Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, startTime, accumulatedTime]);

  // Scroll active sentence into view
  useEffect(() => {
    activeSentenceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentSentenceIdx]);

  // Auto-save XP and exercise result when reading completes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'results' || savedRef.current) return;
    savedRef.current = true;

    const correct = sentences.flatMap((s) => s.words).filter((w) => w.status === 'correct').length;
    const total = sentences.flatMap((s) => s.words).length;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const xp = Math.min(correct * 2, 50);

    if (xp > 0) addXP(xp);
    if (correct > 0) {
      addExerciseResult({
        exerciseId: `reader-${Date.now()}`,
        gameType: 'reader',
        score: acc,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        soundsTargeted: [],
      });
    }
  }, [phase]);

  // ── Word matching logic ──
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (phase !== 'reading' || !transcript) return;

    const sentence = sentences[currentSentenceIdx];
    if (!sentence) return;
    const word = sentence.words[currentWordIdx];
    if (!word || word.status !== 'active') return;

    const threshold = EASY_WORDS.has(word.clean) || word.clean.length <= 2
      ? LOWER_THRESHOLD
      : MATCH_THRESHOLD;

    // Use bestMatch to handle multi-word transcripts from the recogniser
    const score = bestMatch(word.clean, transcript);
    const matched = score >= threshold;

    if (matched) {
      advanceWord('correct');
    } else {
      // Increment attempt count
      setSentences((prev) => {
        const updated = [...prev];
        const s = { ...updated[currentSentenceIdx] };
        const w = [...s.words];
        w[currentWordIdx] = { ...w[currentWordIdx], attempts: w[currentWordIdx].attempts + 1 };
        s.words = w;
        updated[currentSentenceIdx] = s;
        return updated;
      });
      // Stop old session, then restart for retry
      stopListening();
      resetTranscript();
      setTimeout(() => { if (phase === 'reading') startListening(); }, 300);
    }
  }, [transcript]);

  // ── Advance to next word ──
  const advanceWord = useCallback((status: 'correct' | 'skipped') => {
    // Stop any in-flight recognition to prevent late transcripts causing double-advance
    stopListening();

    // Mark current word + activate next word in a single functional update
    const sentence = sentences[currentSentenceIdx];
    const hasNextWord = currentWordIdx + 1 < sentence.words.length;
    const hasNextSentence = currentSentenceIdx + 1 < sentences.length;

    setSentences((prev) => {
      const updated = [...prev];

      // Mark current word
      const s = { ...updated[currentSentenceIdx] };
      const w = [...s.words];
      w[currentWordIdx] = { ...w[currentWordIdx], status };
      s.words = w;
      updated[currentSentenceIdx] = s;

      // Activate next word in same sentence
      if (hasNextWord) {
        const w2 = [...updated[currentSentenceIdx].words];
        w2[currentWordIdx + 1] = { ...w2[currentWordIdx + 1], status: 'active' };
        updated[currentSentenceIdx] = { ...updated[currentSentenceIdx], words: w2 };
      } else if (hasNextSentence) {
        // Activate first word of next sentence
        const nextS = { ...updated[currentSentenceIdx + 1] };
        const nw = [...nextS.words];
        nw[0] = { ...nw[0], status: 'active' };
        nextS.words = nw;
        updated[currentSentenceIdx + 1] = nextS;
      }

      return updated;
    });

    // Advance indices and restart listening
    if (hasNextWord) {
      setCurrentWordIdx(currentWordIdx + 1);
      resetTranscript();
      setTimeout(() => startListening(), 400);
    } else if (hasNextSentence) {
      setCurrentSentenceIdx(currentSentenceIdx + 1);
      setCurrentWordIdx(0);
      resetTranscript();
      setTimeout(() => startListening(), 600);
    } else {
      // Done!
      setPhase('results');
    }
  }, [currentSentenceIdx, currentWordIdx, sentences, resetTranscript, startListening, stopListening]);

  // ── File upload handler ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setPdfLoading(true);
      try {
        const { extractTextFromPDF } = await import('@/lib/pdf');
        const text = await extractTextFromPDF(file);
        setInputText(text);
        setFileName(file.name);
      } catch {
        setInputText('Could not extract text from this PDF. Please try pasting the text instead.');
      } finally {
        setPdfLoading(false);
      }
    } else {
      // Plain text file
      const text = await file.text();
      setInputText(text);
      setFileName(file.name);
    }
  };

  // ── Start reading ──
  const handleStart = () => {
    if (!inputText.trim()) return;
    const parsed = parseText(inputText);
    if (parsed.length === 0 || parsed[0].words.length === 0) return;

    // Set first word as active
    parsed[0].words[0].status = 'active';
    setSentences(parsed);
    setCurrentSentenceIdx(0);
    setCurrentWordIdx(0);
    setStartTime(Date.now());
    setElapsed(0);
    setAccumulatedTime(0);
    savedRef.current = false;
    setPhase('reading');

    // Start listening
    setTimeout(() => startListening(), 500);
  };

  // ── Pause / Resume ──
  const handlePause = () => {
    stopListening();
    // Freeze elapsed time so paused duration isn't counted
    setAccumulatedTime(accumulatedTime + Math.floor((Date.now() - startTime) / 1000));
    setPhase('paused');
  };

  const handleResume = () => {
    setStartTime(Date.now()); // reset anchor so only running time is added
    setPhase('reading');
    setTimeout(() => startListening(), 300);
  };

  // ── Skip word ──
  const handleSkip = () => {
    resetTranscript();
    stopListening();
    advanceWord('skipped');
  };

  // ── Compute stats ──
  const allWords = sentences.flatMap((s) => s.words);
  const totalWords = allWords.length;
  const correctWords = allWords.filter((w) => w.status === 'correct').length;
  const skippedWords = allWords.filter((w) => w.status === 'skipped').length;
  const completedWords = correctWords + skippedWords;
  const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
  const progressPercent = totalWords > 0 ? Math.round((completedWords / totalWords) * 100) : 0;

  // ── Reset ──
  const handleReset = () => {
    stopListening();
    resetTranscript();
    setSentences([]);
    setCurrentSentenceIdx(0);
    setCurrentWordIdx(0);
    setPhase('input');
    setElapsed(0);
    setAccumulatedTime(0);
    savedRef.current = false;
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1A1A2E]">
      {/* Header */}
      <header className="bg-cream dark:bg-[#1A1A2E] border-b border-ice dark:border-white/5 pt-10 pb-8 px-6 sm:px-10">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 text-muted hover:text-teal text-sm font-body font-medium mb-8 transition-colors duration-300"
          >
            <ArrowLeft size={16} />
            Back to Games
          </Link>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="space-y-4"
          >
            <h1 className="font-heading italic text-3xl md:text-4xl text-navy dark:text-white">
              Reader
            </h1>
            <p className="font-body text-muted text-base max-w-lg leading-relaxed">
              Practice reading aloud. Each word highlights as you go — say it clearly to advance.
            </p>
          </motion.div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        <AnimatePresence mode="wait">
          {/* ══════════════════════════════════════════════════════════ */}
          {/*  INPUT PHASE                                              */}
          {/* ══════════════════════════════════════════════════════════ */}
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              {/* Upload / Paste area */}
              <div className="space-y-4">
                <label className="block">
                  <span className="font-body text-sm font-semibold text-navy dark:text-white mb-2 block">
                    Paste text or upload a file
                  </span>
                  <textarea
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); setFileName(null); }}
                    placeholder="Type or paste any text here..."
                    rows={8}
                    className="w-full bg-white dark:bg-white/5 border border-ice dark:border-white/10 rounded-2xl p-5 font-body text-sm text-navy dark:text-white placeholder:text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-teal/30 transition-all"
                  />
                </label>

                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 bg-ice dark:bg-white/5 text-navy dark:text-white px-5 py-3 rounded-xl font-body text-sm font-medium hover:bg-teal/10 transition-colors">
                      <Upload size={16} />
                      {pdfLoading ? 'Extracting...' : 'Upload PDF or Text'}
                    </span>
                  </label>
                  {fileName && (
                    <span className="flex items-center gap-1.5 text-sm font-body text-muted">
                      <FileText size={14} />
                      {fileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Sample texts */}
              <div className="space-y-3">
                <p className="font-body text-sm font-semibold text-navy dark:text-white">
                  Or choose a sample passage:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SAMPLE_TEXTS.map((sample) => (
                    <TiltCard key={sample.title} tiltAmount={4}>
                      <button
                        onClick={() => { setInputText(sample.text); setFileName(null); }}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                          inputText === sample.text
                            ? 'border-teal bg-teal/5'
                            : 'border-ice dark:border-white/10 bg-white dark:bg-white/5 hover:border-teal/30'
                        }`}
                      >
                        <p className="font-heading italic text-navy dark:text-white text-sm mb-1">
                          {sample.title}
                        </p>
                        <span className="text-xs font-body text-muted">{sample.level}</span>
                      </button>
                    </TiltCard>
                  ))}
                </div>
              </div>

              {/* Start button */}
              <MagneticButton
                onClick={handleStart}
                disabled={!inputText.trim() || !isSupported}
                className={`w-full flex items-center justify-center gap-3 font-body font-semibold py-4 rounded-xl transition-all duration-500 ${
                  inputText.trim() && isSupported
                    ? 'bg-teal text-white'
                    : 'bg-ice text-muted cursor-not-allowed'
                }`}
              >
                <BookOpen size={20} />
                Start Reading
              </MagneticButton>

              {!isSupported && (
                <p className="text-center text-sm font-body text-coral">
                  Speech recognition requires Chrome, Edge, or Safari.
                </p>
              )}

              {/* Academic sources */}
              <AcademicSources />
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/*  READING PHASE                                            */}
          {/* ══════════════════════════════════════════════════════════ */}
          {(phase === 'reading' || phase === 'paused') && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Progress bar + stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-body text-muted">
                  <span className="flex items-center gap-1.5">
                    <Target size={14} />
                    {completedWords} / {totalWords} words
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {formatTime(elapsed)}
                  </span>
                </div>
                <div className="h-2 bg-ice dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <MagneticButton
                  onClick={phase === 'paused' ? handleResume : handlePause}
                  className="flex items-center gap-2 bg-ice dark:bg-white/10 text-navy dark:text-white px-4 py-2.5 rounded-xl font-body text-sm font-medium"
                >
                  {phase === 'paused' ? <Play size={16} /> : <Pause size={16} />}
                  {phase === 'paused' ? 'Resume' : 'Pause'}
                </MagneticButton>
                <MagneticButton
                  onClick={handleSkip}
                  disabled={phase === 'paused'}
                  className="flex items-center gap-2 bg-ice dark:bg-white/10 text-navy dark:text-white px-4 py-2.5 rounded-xl font-body text-sm font-medium"
                >
                  <SkipForward size={16} />
                  Skip Word
                </MagneticButton>
                <div className="ml-auto flex items-center gap-2">
                  {isListening && (
                    <motion.div
                      className="flex items-center gap-1.5 text-coral text-sm font-body font-medium"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Mic size={14} />
                      Listening
                    </motion.div>
                  )}
                  {isProcessing && (
                    <span className="text-muted text-sm font-body">Connecting...</span>
                  )}
                </div>
              </div>

              {/* Sentence display */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-8 min-h-[300px] space-y-6">
                {sentences.map((sentence, si) => {
                  const isCurrent = si === currentSentenceIdx;
                  const isPast = si < currentSentenceIdx;
                  const isFuture = si > currentSentenceIdx;

                  return (
                    <div
                      key={si}
                      ref={isCurrent ? activeSentenceRef : undefined}
                      className={`leading-loose transition-opacity duration-500 ${
                        isFuture ? 'opacity-30' : isPast ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      {sentence.words.map((word, wi) => {
                        const isActive = word.status === 'active';
                        const isCorrect = word.status === 'correct';
                        const isSkipped = word.status === 'skipped';

                        return (
                          <span
                            key={`${si}-${wi}`}
                            className={`inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded-lg font-body text-lg md:text-xl transition-all duration-300 ${
                              isActive
                                ? 'bg-teal text-white scale-110 shadow-lg shadow-teal/20'
                                : isCorrect
                                ? 'text-success'
                                : isSkipped
                                ? 'text-coral/60 line-through'
                                : 'text-navy/40 dark:text-white/30'
                            }`}
                            aria-current={isActive ? 'true' : undefined}
                          >
                            {word.text}
                          </span>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Current word hint */}
              {sentences[currentSentenceIdx]?.words[currentWordIdx] && (
                <div className="text-center space-y-2">
                  <p className="font-body text-sm text-muted">
                    Say:
                  </p>
                  <p className="font-heading italic text-3xl text-navy dark:text-white">
                    &ldquo;{sentences[currentSentenceIdx].words[currentWordIdx].text}&rdquo;
                  </p>
                  {sentences[currentSentenceIdx].words[currentWordIdx].attempts >= 3 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-body text-muted"
                    >
                      Having trouble? Try saying it slowly, or
                      <button
                        onClick={handleSkip}
                        className="text-teal underline ml-1 cursor-pointer"
                      >
                        skip this word
                      </button>
                    </motion.p>
                  )}
                </div>
              )}

              {/* Mic error banner */}
              {micError && (
                <button
                  onClick={() => setShowMicModal(true)}
                  className="bg-coral/10 rounded-xl px-4 py-3 w-full cursor-pointer hover:bg-coral/20 transition-colors"
                >
                  <p className="text-coral text-sm font-body">Microphone error. Tap here for help.</p>
                </button>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/*  RESULTS PHASE                                            */}
          {/* ══════════════════════════════════════════════════════════ */}
          {phase === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                >
                  <CheckCircle size={48} className="text-success mx-auto" />
                </motion.div>
                <h2 className="font-heading italic text-3xl text-navy dark:text-white">
                  Reading Complete!
                </h2>
                <p className="font-body text-muted text-sm">
                  Great practice session. Here are your results:
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Words Read', value: correctWords.toString(), icon: BookOpen, color: 'text-teal' },
                  { label: 'Accuracy', value: `${accuracy}%`, icon: Target, color: 'text-success' },
                  { label: 'Time', value: formatTime(elapsed), icon: Clock, color: 'text-violet' },
                  { label: 'Skipped', value: skippedWords.toString(), icon: SkipForward, color: 'text-coral' },
                ].map((stat) => (
                  <TiltCard key={stat.label} tiltAmount={4}>
                    <div className="bg-white dark:bg-white/5 rounded-2xl p-5 text-center">
                      <stat.icon size={20} className={`${stat.color} mx-auto mb-2`} />
                      <p className="font-heading italic text-2xl text-navy dark:text-white">
                        {stat.value}
                      </p>
                      <p className="font-body text-xs text-muted mt-1">{stat.label}</p>
                    </div>
                  </TiltCard>
                ))}
              </div>

              {/* XP award */}
              {correctWords > 0 && (
                <div className="text-center">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-body text-success font-medium"
                  >
                    +{Math.min(correctWords * 2, 50)} XP earned!
                  </motion.p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <MagneticButton
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 bg-teal text-white font-body font-semibold py-4 rounded-xl"
                >
                  <RotateCcw size={18} />
                  Read Something New
                </MagneticButton>
                <Link
                  href="/play"
                  className="flex-1 flex items-center justify-center gap-2 bg-ice dark:bg-white/10 text-navy dark:text-white font-body font-semibold py-4 rounded-xl"
                >
                  Back to Games
                </Link>
              </div>

              {/* Academic sources */}
              <AcademicSources />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MicPermissionModal
        isOpen={showMicModal}
        onClose={() => setShowMicModal(false)}
        onRetry={() => startListening()}
        errorMessage={micError}
      />
    </div>
  );
}
