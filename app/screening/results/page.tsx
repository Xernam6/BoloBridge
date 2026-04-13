'use client';

import { Suspense, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowLeft,
  RefreshCw,
  Gamepad2,
  BarChart3,
  Shield,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  BookOpen,
  Calendar,
  Target,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import exercisesData from '@/data/exercises.json';
import type { AssessmentResult, RiskLevel } from '@/types';

/* ------------------------------------------------------------------ */
/*  Risk-level display helpers                                          */
/* ------------------------------------------------------------------ */

const riskConfig: Record<
  RiskLevel,
  {
    gradient: string;
    label: string;
    emoji: string;
    badgeBg: string;
    pillBg: string;
    pillText: string;
    icon: typeof CheckCircle;
    description: string;
    colorBarBg: string;
    phonemeCircle: string;
    conicColor: string;
  }
> = {
  'on-track': {
    gradient: 'from-green-500 to-emerald-600',
    label: 'On Track',
    emoji: '\u2705',
    badgeBg: 'bg-green-100 text-green-800',
    pillBg: 'bg-success/10',
    pillText: 'text-success',
    icon: CheckCircle,
    description:
      'Your child is producing speech sounds at or above the expected level for their age. Keep up the great work!',
    colorBarBg: 'bg-success',
    phonemeCircle: 'border-success text-success',
    conicColor: '#6B8F71',
  },
  monitor: {
    gradient: 'from-amber-500 to-orange-500',
    label: 'Monitor',
    emoji: '\u26A0\uFE0F',
    badgeBg: 'bg-amber-100 text-amber-800',
    pillBg: 'bg-orange/10',
    pillText: 'text-orange',
    icon: AlertTriangle,
    description:
      'Some speech sounds are developing but may need a bit more practice. We recommend re-screening in a few months.',
    colorBarBg: 'bg-orange',
    phonemeCircle: 'border-orange text-orange',
    conicColor: '#C2956B',
  },
  consult: {
    gradient: 'from-red-500 to-rose-600',
    label: 'Consult Professional',
    emoji: '\uD83D\uDD34',
    badgeBg: 'bg-red-100 text-red-800',
    pillBg: 'bg-rose/10',
    pillText: 'text-rose',
    icon: XCircle,
    description:
      'Several speech sounds scored below expected levels. We recommend speaking with a speech-language pathologist for a full evaluation.',
    colorBarBg: 'bg-rose',
    phonemeCircle: 'border-rose text-rose',
    conicColor: '#D16D6D',
  },
};

/* ------------------------------------------------------------------ */
/*  Score bar component with animated width                             */
/* ------------------------------------------------------------------ */

function ScoreBar({ score, skipped }: { score: number; skipped: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-20px' });
  const { t } = useTranslation();

  if (skipped) {
    return (
      <div ref={ref} className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-ice rounded-full" />
        <span className="text-xs font-body text-muted">{t('results.skipped')}</span>
      </div>
    );
  }

  const barColor =
    score >= 0.7
      ? 'bg-success'
      : score >= 0.4
        ? 'bg-orange'
        : 'bg-rose';

  return (
    <div ref={ref} className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-ice rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${Math.round(score * 100)}%` } : { width: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-heading font-bold text-navy w-10 text-right">
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category card — Stitch 17 style with color bar + phoneme circles    */
/* ------------------------------------------------------------------ */

function CategoryCard({
  category,
  index,
}: {
  category: AssessmentResult['categories'][number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const { t } = useTranslation();
  const config = riskConfig[category.riskLevel];
  const riskLabelMap: Record<RiskLevel, string> = {
    'on-track': t('results.onTrack'),
    'monitor': t('results.monitor'),
    'consult': t('results.consultProfessional'),
  };
  const hasStimulableSounds = category.phonemes.some(
    (p) => p.hintProvided && p.stimulable
  );

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${config.colorBarBg}`} />

      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-heading italic text-xl text-navy">
              {category.name}
            </h3>
            <span
              className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold font-body tracking-wide ${config.pillBg} ${config.pillText}`}
            >
              {riskLabelMap[category.riskLevel]}
            </span>
          </div>
          <div className="text-4xl font-heading italic text-teal opacity-80">
            {Math.round(category.averageScore * 100)}%
          </div>
        </div>

        {/* Phoneme circles */}
        <div className="flex flex-wrap gap-2 mt-4">
          {category.phonemes.map((phoneme) => (
            <div
              key={phoneme.sound}
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-body font-medium text-sm ${
                phoneme.skipped
                  ? 'border-ice text-muted opacity-40'
                  : config.phonemeCircle
              }`}
            >
              {phoneme.sound}
            </div>
          ))}
        </div>

        {/* Phoneme detail list */}
        <div className="space-y-3 pt-2">
          {category.phonemes.map((phoneme) => (
            <div key={phoneme.sound}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`inline-block text-xs font-heading font-bold py-0.5 px-2 rounded-full ${
                    phoneme.skipped
                      ? 'bg-ice text-muted'
                      : 'bg-grape/10 text-grape'
                  }`}
                >
                  {phoneme.sound}
                </span>
                <span className="font-body text-sm text-navy">
                  {phoneme.word}
                </span>
                {/* Stimulability badge */}
                {phoneme.hintProvided && phoneme.stimulable && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-body font-semibold py-0.5 px-2 rounded-full bg-success/10 text-success">
                    {t('results.stimulable')}
                  </span>
                )}
                {phoneme.hintProvided && !phoneme.stimulable && (
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-body font-semibold py-0.5 px-2 rounded-full bg-orange/10 text-orange">
                    {t('results.needsPractice')}
                  </span>
                )}
              </div>
              <ScoreBar score={phoneme.score} skipped={phoneme.skipped} />
              {/* Pre/post hint scores */}
              {phoneme.hintProvided &&
                phoneme.preHintScore != null &&
                phoneme.postHintScore != null && (
                  <p className="text-[11px] font-body text-muted mt-1 ml-1">
                    {t('results.beforeHint')} {Math.round(phoneme.preHintScore * 100)}% &rarr; {t('results.afterHint')} {Math.round(phoneme.postHintScore * 100)}%
                  </p>
                )}
            </div>
          ))}
        </div>

        {/* Stimulability note */}
        {hasStimulableSounds && (
          <p className="mt-4 text-xs font-body text-success bg-success/5 rounded-xl p-3 border border-success/15 leading-relaxed">
            {t('results.stimulableNote')}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recommendations — Stitch 17 left text + right activity cards        */
/* ------------------------------------------------------------------ */

function Recommendations({ result }: { result: AssessmentResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const { t } = useTranslation();
  const risk = result.overallRisk;

  // Find weak categories for game suggestions
  const weakCategories = result.categories.filter(
    (c) => c.riskLevel === 'consult' || c.riskLevel === 'monitor'
  );

  const gameSuggestions: { name: string; description: string; emoji: string; icon: string }[] = [];

  if (weakCategories.length > 0) {
    gameSuggestions.push({
      name: t('game.soundSafari'),
      description: t('results.soundSafariDesc'),
      emoji: '\uD83E\uDD81',
      icon: 'search',
    });
    gameSuggestions.push({
      name: t('game.wordGarden'),
      description: t('results.wordGardenDesc'),
      emoji: '\uD83C\uDF3B',
      icon: 'potted_plant',
    });
  }

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="py-24"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Left: text content */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="font-heading italic text-3xl md:text-4xl text-navy">
            {t('results.recommendations')}
          </h2>

          {/* Main recommendation */}
          <div
            className={`rounded-2xl p-5 ${
              risk === 'on-track'
                ? 'bg-success/5 border border-success/15'
                : risk === 'monitor'
                  ? 'bg-orange/5 border border-orange/15'
                  : 'bg-rose/5 border border-rose/15'
            }`}
          >
            <p className="font-body text-navy leading-relaxed text-sm">
              {risk === 'on-track' && t('results.onTrackRec')}
              {risk === 'monitor' && t('results.monitorRec')}
              {risk === 'consult' && t('results.consultRec')}
            </p>
          </div>

          {/* Find Help button */}
          {(risk === 'consult' || risk === 'monitor') && (
            <Link
              href="/find-help"
              className="inline-flex items-center gap-3 bg-teal text-white font-body font-medium py-4 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
            >
              Find Help
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          )}
        </div>

        {/* Right: activity cards */}
        {gameSuggestions.length > 0 && (
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {gameSuggestions.map((game) => (
              <motion.div
                key={game.name}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-white p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] cursor-pointer border border-ice"
              >
                <div className="w-14 h-14 bg-ice rounded-full flex items-center justify-center mb-5">
                  <span className="text-2xl">{game.emoji}</span>
                </div>
                <h4 className="font-heading italic text-lg text-navy mb-2">
                  {game.name}
                </h4>
                <p className="text-sm font-body text-muted leading-relaxed">
                  {game.description}
                </p>
                <div className="mt-4 flex items-center text-teal font-body font-medium text-sm">
                  View Activity
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Home Practice Plan — personalized exercises for weak sounds         */
/* ------------------------------------------------------------------ */

interface PracticeDayPlan {
  day: number;
  focus: string;
  exercises: { word: string; sound: string; game: string; tip: string }[];
}

function buildPracticePlan(result: AssessmentResult): PracticeDayPlan[] {
  // Find sounds that need work (score < 0.7)
  const weakSounds: { sound: string; score: number; category: string }[] = [];
  result.categories.forEach((cat) => {
    cat.phonemes.forEach((p) => {
      if (!p.skipped && p.score < 0.7) {
        weakSounds.push({ sound: p.sound, score: p.score, category: cat.name });
      }
    });
  });

  if (weakSounds.length === 0) return [];

  // Pull matching exercises from Sound Safari (has targetSound) and Word Garden (word-only, for vocabulary)
  const safariExercises = exercisesData['sound-safari'] as { word: string; targetSound: string }[];
  const gardenWords = exercisesData['word-garden'] as { word: string; category?: string }[];

  // Group exercises by target sound
  const exercisesBySound: Record<string, { word: string; game: string }[]> = {};
  safariExercises.forEach((ex) => {
    const s = ex.targetSound.toLowerCase();
    if (!exercisesBySound[s]) exercisesBySound[s] = [];
    exercisesBySound[s].push({ word: ex.word, game: 'Sound Safari' });
  });
  // Also add word garden words that start with target sounds
  gardenWords.forEach((ex) => {
    const firstChar = ex.word[0]?.toLowerCase();
    if (firstChar && !exercisesBySound[firstChar]) exercisesBySound[firstChar] = [];
    if (firstChar) exercisesBySound[firstChar].push({ word: ex.word, game: 'Word Garden' });
  });

  // Practice tips per sound position
  const tips: Record<string, string> = {
    s: 'Place tongue behind top teeth, blow air out gently like a snake.',
    z: 'Same as /s/ but turn your voice on. Feel the buzz in your throat.',
    r: 'Curl tongue tip up and back, keep sides of tongue against back teeth.',
    l: 'Touch tongue tip right behind top front teeth, let air flow around sides.',
    th: 'Gently bite the tip of your tongue and blow air out.',
    sh: 'Round your lips slightly and push air through with tongue pulled back.',
    ch: 'Start with tongue behind top teeth, then push air out quickly.',
    k: 'Lift the back of your tongue to touch the roof of your mouth.',
    g: 'Same as /k/ but turn your voice on.',
    f: 'Gently bite your lower lip and blow air through.',
    v: 'Same as /f/ but turn your voice on.',
    b: 'Press lips together, then pop them open with a voice.',
    p: 'Press lips together, then pop them open without voice.',
    m: 'Press lips together and hum. Feel the vibration.',
    n: 'Touch tongue tip behind top teeth and hum through your nose.',
    d: 'Touch tongue tip behind top teeth, then tap it down quickly.',
    t: 'Same as /d/ but without turning your voice on.',
    w: 'Round your lips into a small circle, then open while making a sound.',
    j: 'Lift the middle of your tongue toward the roof of your mouth.',
  };

  // Build 5-day plan, cycling through weak sounds
  const days: PracticeDayPlan[] = [];
  const sortedWeak = [...weakSounds].sort((a, b) => a.score - b.score);

  for (let day = 1; day <= 5; day++) {
    const soundIdx = (day - 1) % sortedWeak.length;
    const target = sortedWeak[soundIdx];
    const matching = exercisesBySound[target.sound.toLowerCase().replace(/\//g, '')] || [];
    const picked = matching.slice(0, 4).map((ex) => ({
      word: ex.word,
      sound: target.sound,
      game: ex.game,
      tip: tips[target.sound.toLowerCase().replace(/\//g, '')] || 'Say the word slowly and clearly, then repeat faster.',
    }));

    // Fill with generic exercises if not enough
    while (picked.length < 3) {
      picked.push({
        word: `Practice "${target.sound}" words`,
        sound: target.sound,
        game: 'Any',
        tip: tips[target.sound.toLowerCase().replace(/\//g, '')] || 'Say the word slowly and clearly, then repeat faster.',
      });
    }

    days.push({
      day,
      focus: `${target.sound} sound (${target.category})`,
      exercises: picked,
    });
  }

  return days;
}

function HomePracticePlan({ result }: { result: AssessmentResult }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const plan = useMemo(() => buildPracticePlan(result), [result]);

  if (plan.length === 0) return null;

  const DAY_COLORS = [
    { accent: 'bg-teal', light: 'bg-teal/5', text: 'text-teal', border: 'border-teal/20' },
    { accent: 'bg-coral', light: 'bg-coral/5', text: 'text-coral', border: 'border-coral/20' },
    { accent: 'bg-grape', light: 'bg-grape/5', text: 'text-grape', border: 'border-grape/20' },
    { accent: 'bg-success', light: 'bg-success/5', text: 'text-success', border: 'border-success/20' },
    { accent: 'bg-orange', light: 'bg-orange/5', text: 'text-orange', border: 'border-orange/20' },
  ];

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="py-16"
      id="practice-plan"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
          <BookOpen size={20} className="text-teal" />
        </div>
        <h2 className="font-heading italic text-3xl md:text-4xl text-navy dark:text-white">
          Your Home Practice Plan
        </h2>
      </div>
      <p className="text-muted font-body text-sm mb-10 ml-[52px]">
        A personalized 5-day plan based on the sounds that need extra practice.
        Aim for 5-10 minutes per day for the best results.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plan.map((day, i) => {
          const colors = DAY_COLORS[i % DAY_COLORS.length];
          return (
            <TiltCard key={day.day} tiltAmount={4}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' }}
                className={`bg-white dark:bg-[#2D3142] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] border ${colors.border} relative overflow-hidden`}
              >
                {/* Day number accent */}
                <div className={`absolute top-0 left-0 w-full h-1 ${colors.accent}`} />

                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center`}>
                    <Calendar size={16} className={colors.text} />
                  </div>
                  <div>
                    <span className={`font-heading italic text-lg ${colors.text}`}>Day {day.day}</span>
                    <p className="text-xs text-muted font-body">{day.focus}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {day.exercises.map((ex, j) => (
                    <div key={j} className={`${colors.light} rounded-xl p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Target size={12} className={colors.text} />
                        <span className="font-body font-semibold text-sm text-navy dark:text-white">{ex.word}</span>
                        <span className="text-[10px] font-body text-muted bg-ice dark:bg-white/10 px-2 py-0.5 rounded-full">{ex.game}</span>
                      </div>
                      <p className="text-xs text-muted font-body leading-relaxed">{ex.tip}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </TiltCard>
          );
        })}
      </div>

      <div className="mt-8 bg-teal/5 dark:bg-teal/10 rounded-2xl p-6 border border-teal/15">
        <h3 className="font-heading italic text-lg text-navy dark:text-white mb-2">Parent Tips</h3>
        <ul className="space-y-2 text-sm font-body text-muted">
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">1.</span>
            <span>Keep sessions short (5-10 min) and positive. Praise effort, not just accuracy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">2.</span>
            <span>Model the correct sound naturally. Say &quot;Yes, that&apos;s a <strong>snake</strong>!&quot; instead of &quot;Say it again&quot;</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">3.</span>
            <span>Practice during daily routines: bath time, meals, car rides</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">4.</span>
            <span>If your child gets frustrated, take a break. Consistency matters more than duration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-teal mt-0.5">5.</span>
            <span>Use BoloBridge games to make practice feel like play, not work</span>
          </li>
        </ul>
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Inner results component (uses useSearchParams)                      */
/* ------------------------------------------------------------------ */

function ScreeningResultsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const store = useAppStore();
  const { t, lang } = useTranslation();
  const result = store.assessmentResults.find((r) => r.id === id);

  const sectionRef = useRef<HTMLDivElement>(null);
  const radarRef = useRef<HTMLDivElement>(null);
  const radarInView = useInView(radarRef, { once: true, margin: '-40px' });

  const handleDownloadPDF = useCallback(() => {
    window.print();
  }, []);

  /* ---- Not found state ---- */
  if (!result) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="text-center">
          <span className="text-6xl block mb-6">{'\uD83D\uDD0D'}</span>
          <h1 className="font-heading italic text-2xl text-navy mb-3">
            {t('results.notFound')}
          </h1>
          <p className="font-body text-muted mb-8">
            {t('results.notFoundDesc')}
          </p>
          <Link
            href="/screening"
            className="inline-flex items-center gap-2 bg-teal text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('results.backToScreening')}
          </Link>
        </div>
      </div>
    );
  }

  const config = riskConfig[result.overallRisk];
  const RiskIcon = config.icon;
  const riskLabelMap: Record<RiskLevel, string> = {
    'on-track': t('results.onTrack'),
    'monitor': t('results.monitor'),
    'consult': t('results.consultProfessional'),
  };
  const riskDescMap: Record<RiskLevel, string> = {
    'on-track': t('results.onTrackDesc'),
    'monitor': t('results.monitorDesc'),
    'consult': t('results.consultDesc'),
  };
  const completedDate = new Date(result.completedAt).toLocaleDateString(
    lang,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  /* ---- Radar chart data ---- */
  const radarData = result.categories.map((cat) => ({
    category: cat.name,
    score: Math.round(cat.averageScore * 100),
    fullMark: 100,
  }));

  const overallPct = Math.round(result.overallScore * 100);

  return (
    <div className="min-h-screen bg-cream" ref={sectionRef}>
      {/* ============================================================= */}
      {/*  Celebration Header — Stitch 17 style                          */}
      {/* ============================================================= */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative px-6 pt-20 pb-28 overflow-hidden"
      >
        {/* Subtle tonal background wash */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-grape/5 -z-10" />

        {/* Back link */}
        <div className="max-w-6xl mx-auto mb-10">
          <Link
            href="/screening"
            className="inline-flex items-center gap-2 text-muted hover:text-navy text-sm font-body transition-colors duration-500"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('results.backToScreening')}
          </Link>
        </div>

        <div className="flex flex-col items-center text-center space-y-6 max-w-6xl mx-auto">
          <span className="text-sm font-body font-medium tracking-[0.2em] text-teal uppercase">
            Assessment Complete
          </span>
          <h1 className="font-heading italic text-4xl md:text-6xl text-navy leading-tight">
            {t('results.title')}
          </h1>
          <p className="font-body text-muted text-sm mb-4">
            {t('results.completed')} {completedDate} &middot; {t('screening.childAge')} {result.childAge}{' '}
            {result.childAge === 1 ? t('common.year') : t('common.years')}
          </p>

          {/* Download Report Button */}
          <MagneticButton
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 bg-navy dark:bg-white/10 text-white font-body font-medium py-2.5 px-6 rounded-xl text-sm print:hidden"
          >
            <Download size={16} />
            Download Report (PDF)
          </MagneticButton>

          {/* Overall Score Ring — conic-gradient */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="relative mt-10"
          >
            <div
              className="w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center p-4"
              style={{
                background: `conic-gradient(${config.conicColor} ${overallPct}%, #F5F1EB ${overallPct}%)`,
              }}
            >
              <div className="w-full h-full rounded-full bg-cream flex flex-col items-center justify-center shadow-inner">
                <span className="text-5xl md:text-6xl font-heading italic text-navy leading-none">
                  {overallPct}<span className="text-2xl md:text-3xl">%</span>
                </span>
                <span className="text-[10px] font-body font-medium text-muted tracking-[0.2em] mt-1 uppercase">
                  {t('results.overallScore')}
                </span>
              </div>
            </div>

            {/* Risk Level Badge — positioned below ring */}
            <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 ${config.colorBarBg} text-white px-8 py-2 rounded-full font-body font-medium text-sm shadow-[0_8px_32px_rgba(0,0,0,0.06)]`}>
              {riskLabelMap[result.overallRisk]}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ============================================================= */}
      {/*  Main content area                                              */}
      {/* ============================================================= */}
      <div className="max-w-6xl mx-auto px-6">
        {/* AI Summary (optional) */}
        {result.aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="bg-grape/5 rounded-3xl p-8 border border-grape/10 mb-12"
          >
            <h2 className="font-heading italic text-lg text-navy mb-2 flex items-center gap-2">
              <span className="text-xl">{'\uD83E\uDD16'}</span>
              AI Summary
            </h2>
            <p className="font-body text-muted leading-relaxed text-sm">
              {result.aiSummary}
            </p>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/*  Category Breakdown — 2-column grid, Stitch 17 style        */}
        {/* ========================================================= */}
        <section className="bg-ice rounded-t-[3rem] px-6 md:px-12 py-20 -mx-6 mb-0">
          <h2 className="font-heading italic text-3xl text-navy mb-12">
            Deep Dive by Sound Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {result.categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/*  Radar Chart                                                 */}
        {/* ========================================================= */}
        <motion.div
          ref={radarRef}
          initial={{ opacity: 0, y: 30 }}
          animate={radarInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 md:p-10 my-12"
        >
          <h2 className="font-heading italic text-xl text-navy mb-8 text-center">
            Skill Overview
          </h2>
          <div className="w-full h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#F5F1EB" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{
                    fill: '#2D3142',
                    fontSize: 12,
                    fontFamily: 'var(--font-heading)',
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#78716C', fontSize: 10 }}
                  tickCount={5}
                />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#5C4D9A"
                  fill="#5C4D9A"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/*  Home Practice Plan — personalized exercises                 */}
        {/* ========================================================= */}
        <HomePracticePlan result={result} />

        {/* ========================================================= */}
        {/*  Recommendations — Stitch 17 style                          */}
        {/* ========================================================= */}
        <Recommendations result={result} />

        {/* ========================================================= */}
        {/*  Disclaimer Bar — Stitch 17 style                           */}
        {/* ========================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="bg-orange/5 border-l-4 border-orange p-6 rounded-r-2xl flex items-start gap-5">
            <Shield className="w-6 h-6 text-orange flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <div>
                <h3 className="font-heading italic text-sm text-navy mb-1">
                  Sources
                </h3>
                <p className="font-body text-muted text-sm leading-relaxed">
                  Based on ASHA (American Speech-Language-Hearing Association)
                  developmental norms for speech sound acquisition.
                </p>
              </div>
              <div>
                <h3 className="font-heading italic text-sm text-navy mb-1">
                  Disclaimer
                </h3>
                <p className="font-body text-muted text-sm leading-relaxed">
                  This is a screening tool, not a diagnosis. Results are indicative
                  only and should not replace a professional evaluation. Consult a
                  licensed speech-language pathologist (SLP) for clinical evaluation
                  and personalized recommendations.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ========================================================= */}
        {/*  Action Buttons — flat, solid, rounded-xl                   */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-24 flex-wrap print:hidden">
          <Link
            href="/screening"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-teal text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
          >
            <RefreshCw className="w-4 h-4" />
            Retake Screening
          </Link>
          {(result.overallRisk === 'consult' || result.overallRisk === 'monitor') && (
            <Link
              href="/find-help"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-rose text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
            >
              <ExternalLink className="w-4 h-4" />
              Find Help Near You
            </Link>
          )}
          <Link
            href="/play"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
          >
            <Gamepad2 className="w-4 h-4" />
            Continue Playing
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-navy text-white font-heading italic py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
          >
            <BarChart3 className="w-4 h-4" />
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page export with Suspense boundary                                  */
/* ------------------------------------------------------------------ */

export default function ScreeningResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="font-body text-muted text-sm">Loading results...</p>
          </div>
        </div>
      }
    >
      <ScreeningResultsContent />
    </Suspense>
  );
}
