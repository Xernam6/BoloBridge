'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  User,
  Calendar,
  Activity,
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  ChevronRight,
  Info,
  GraduationCap,
  AlertTriangle,
  Lock,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { NeuralPaths } from '@/components/ui/background-patterns';
import { MATCH_THRESHOLD } from '@/lib/speech';
import type {
  AssessmentResult,
  CycleProgress,
  DailyChallengeResult,
  ChildProfile,
  ProgressData,
  PhonemeResult,
} from '@/types';

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const ALL_PHONEMES = [
  'p', 'b', 'm', 'd', 'n', 't', 'k', 'g',
  'f', 'v', 's', 'z', 'sh', 'ch', 'th', 'r', 'l',
] as const;

const PHONEME_LABELS: Record<string, string> = {
  p: '/p/', b: '/b/', m: '/m/', d: '/d/',
  n: '/n/', t: '/t/', k: '/k/', g: '/g/',
  f: '/f/', v: '/v/', s: '/s/', z: '/z/',
  sh: '/sh/', ch: '/ch/', th: '/th/', r: '/r/', l: '/l/',
};

const CYCLE_LENGTH_WEEKS = 6;

/* ================================================================== */
/*  PCC Calculation (aggregate from Daily Challenge data)              */
/* ================================================================== */

interface PCCResult {
  pcc: number;
  totalPassed: number;
  totalTested: number;
  perPhoneme: { sound: string; score: number; passed: boolean }[];
}

function calculatePCC(assessmentResults: AssessmentResult[]): PCCResult | null {
  if (assessmentResults.length === 0) return null;

  const latest = assessmentResults[assessmentResults.length - 1];
  const allPhonemes: PhonemeResult[] = latest.categories.flatMap(
    (cat) => cat.phonemes
  );

  const tested = allPhonemes.filter((p) => !p.skipped);
  if (tested.length === 0) return null;

  const passed = tested.filter((p) => p.score >= MATCH_THRESHOLD);

  const perPhoneme = tested.map((p) => ({
    sound: p.sound,
    score: p.score,
    passed: p.score >= MATCH_THRESHOLD,
  }));

  return {
    pcc: (passed.length / tested.length) * 100,
    totalPassed: passed.length,
    totalTested: tested.length,
    perPhoneme,
  };
}

function getPCCTrend(assessmentResults: AssessmentResult[]): 'up' | 'down' | 'stable' {
  if (assessmentResults.length < 2) return 'stable';

  const prev = assessmentResults[assessmentResults.length - 2];
  const curr = assessmentResults[assessmentResults.length - 1];

  const prevPhonemes = prev.categories.flatMap((c) => c.phonemes).filter((p) => !p.skipped);
  const currPhonemes = curr.categories.flatMap((c) => c.phonemes).filter((p) => !p.skipped);

  if (prevPhonemes.length === 0 || currPhonemes.length === 0) return 'stable';

  const prevPCC = prevPhonemes.filter((p) => p.score >= MATCH_THRESHOLD).length / prevPhonemes.length;
  const currPCC = currPhonemes.filter((p) => p.score >= MATCH_THRESHOLD).length / currPhonemes.length;

  const diff = currPCC - prevPCC;
  if (diff > 0.02) return 'up';
  if (diff < -0.02) return 'down';
  return 'stable';
}

function getPCCLabel(pcc: number): { label: string; color: string } {
  if (pcc >= 85) return { label: 'Strong', color: 'text-success' };
  if (pcc >= 65) return { label: 'Developing', color: 'text-teal' };
  if (pcc >= 50) return { label: 'Needs Focus', color: 'text-orange' };
  return { label: 'Priority Area', color: 'text-rose' };
}

/* ================================================================== */
/*  Animation Variants                                                 */
/* ================================================================== */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ================================================================== */
/*  Stagger-in-view wrapper                                            */
/* ================================================================== */

function StaggerSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================== */
/*  Main Page Component                                                */
/* ================================================================== */

export default function EducatorDashboardPage() {
  const {
    clinicianCode,
    profile,
    assessmentResults,
    cycleProgress,
    setCycleProgress,
    progress,
    dailyChallengeResults,
  } = useAppStore();

  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleCodeSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const normalized = enteredCode.trim().toUpperCase();

      if (normalized === clinicianCode) {
        setIsAuthenticated(true);
        setCodeError(false);
      } else {
        setCodeError(true);
      }
    },
    [enteredCode, clinicianCode]
  );

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    setEnteredCode('');
    setCodeError(false);
  }, []);

  if (!isAuthenticated) {
    return (
      <CodeEntryScreen
        enteredCode={enteredCode}
        setEnteredCode={setEnteredCode}
        codeError={codeError}
        onSubmit={handleCodeSubmit}
        hasCode={!!clinicianCode}
      />
    );
  }

  return (
    <EducatorDashboard
      profile={profile}
      assessmentResults={assessmentResults}
      cycleProgress={cycleProgress}
      setCycleProgress={setCycleProgress}
      progress={progress}
      dailyChallengeResults={dailyChallengeResults}
      onLogout={handleLogout}
    />
  );
}

/* ================================================================== */
/*  Code Entry Screen — Editorial, Centered                            */
/* ================================================================== */

function CodeEntryScreen({
  enteredCode,
  setEnteredCode,
  codeError,
  onSubmit,
  hasCode,
}: {
  enteredCode: string;
  setEnteredCode: (code: string) => void;
  codeError: boolean;
  onSubmit: (e: React.FormEvent) => void;
  hasCode: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.slice(-1).toUpperCase();
    if (!/^[A-Z0-9]$/.test(char) && value !== '') return;

    const newCode = enteredCode.split('');
    newCode[index] = char;
    setEnteredCode(newCode.join(''));

    // Auto-focus next
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !enteredCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setEnteredCode(pasted.padEnd(6, '').slice(0, 6).replace(/ /g, ''));
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-cloud flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="fixed inset-0 text-rose opacity-[0.08] pointer-events-none z-0">
        <NeuralPaths />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-ice rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 sm:p-12 w-full max-w-md text-center relative z-10"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-rose/10 rounded-2xl flex items-center justify-center mx-auto mb-8">
          <GraduationCap size={28} className="text-rose" />
        </div>

        {/* Headline */}
        <h1 className="font-heading italic text-3xl text-navy dark:text-white mb-3">
          Clinician Portal
        </h1>
        <p className="text-muted dark:text-white/60 font-body text-base leading-relaxed mb-10">
          Enter the 6-character access code provided by the child&apos;s parent or guardian to view home practice data.
        </p>

        {/* No code warning */}
        {!hasCode && (
          <div className="bg-orange/5 rounded-xl p-5 mb-8">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-orange mt-0.5 shrink-0" />
              <p className="text-sm text-orange font-body text-left leading-relaxed">
                No access code has been generated yet. Ask the parent/guardian to generate one from the Parent Dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Segmented OTP-style code input */}
        <form onSubmit={onSubmit}>
          <div className="flex justify-center gap-2 sm:gap-3 mb-5" onPaste={handlePaste}>
            {Array.from({ length: 6 }, (_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={enteredCode[i] || ''}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-14 sm:w-13 sm:h-16 rounded-xl border-2 font-heading italic text-xl text-center uppercase outline-none transition-all duration-300 ${
                  codeError
                    ? 'border-rose bg-rose/5 dark:bg-rose/10'
                    : enteredCode[i]
                    ? 'border-teal bg-teal/5 dark:bg-teal/10'
                    : 'border-navy/10 dark:border-white/10 bg-ice dark:bg-white/5 focus:border-teal'
                } text-navy dark:text-white`}
                autoComplete="off"
                spellCheck={false}
              />
            ))}
          </div>

          <AnimatePresence>
            {codeError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-rose text-sm font-body mb-5"
              >
                Invalid code. Please check with the parent/guardian and try again.
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={enteredCode.replace(/ /g, '').length !== 6}
            className="w-full bg-teal hover:bg-teal-dark disabled:bg-navy/15 dark:disabled:bg-white/10 text-white disabled:text-navy/30 dark:disabled:text-white/30 font-body font-semibold py-4 rounded-xl transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(92,77,154,0.3)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            Access Practice Data
          </button>
        </form>

        {/* Trust indicators */}
        <div className="flex items-center justify-center gap-6 mt-8 text-muted dark:text-white/40">
          <div className="flex items-center gap-1.5">
            <Lock size={12} />
            <span className="font-body text-xs">Local Data Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye size={12} />
            <span className="font-body text-xs">HIPAA-Aware</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            <span className="font-body text-xs">Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================== */
/*  Educator Dashboard — Calm Analog Editorial Layout                  */
/* ================================================================== */

function EducatorDashboard({
  profile,
  assessmentResults,
  cycleProgress,
  setCycleProgress,
  progress,
  dailyChallengeResults,
  onLogout,
}: {
  profile: ChildProfile | null;
  assessmentResults: AssessmentResult[];
  cycleProgress: CycleProgress | null;
  setCycleProgress: (progress: CycleProgress) => void;
  progress: ProgressData;
  dailyChallengeResults: DailyChallengeResult[];
  onLogout: () => void;
}) {
  const pccResult = useMemo(() => calculatePCC(assessmentResults), [assessmentResults]);
  const pccTrend = useMemo(() => getPCCTrend(assessmentResults), [assessmentResults]);

  const recentChallenges = useMemo(() => {
    return [...dailyChallengeResults]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14);
  }, [dailyChallengeResults]);

  const weeklyPCCSummary = useMemo(() => {
    if (dailyChallengeResults.length === 0) return [];
    const sorted = [...dailyChallengeResults].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const weeks: { weekLabel: string; challenges: DailyChallengeResult[] }[] = [];
    let currentWeekStart: Date | null = null;
    sorted.forEach((ch) => {
      const date = new Date(ch.date);
      if (!currentWeekStart || (date.getTime() - currentWeekStart.getTime()) >= 7 * 24 * 60 * 60 * 1000) {
        currentWeekStart = date;
        weeks.push({
          weekLabel: `Week ${weeks.length + 1}`,
          challenges: [],
        });
      }
      weeks[weeks.length - 1].challenges.push(ch);
    });
    return weeks.slice(-CYCLE_LENGTH_WEEKS).map((w) => ({
      weekLabel: w.weekLabel,
      sessionsCompleted: w.challenges.filter((c) => c.completed).length,
      totalSessions: w.challenges.length,
      avgScore: w.challenges.length > 0
        ? Math.round(w.challenges.reduce((s, c) => s + c.totalScore, 0) / w.challenges.length)
        : 0,
    }));
  }, [dailyChallengeResults]);

  const currentCycleTargets = useMemo(() => {
    if (!cycleProgress || !cycleProgress.cycles.length) return [];
    const idx = cycleProgress.currentCycleIndex % cycleProgress.cycles.length;
    return cycleProgress.cycles[idx] || [];
  }, [cycleProgress]);

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Header Bar — Editorial, warm ── */}
      <header className="bg-white/80 backdrop-blur-sm shadow-[0_4px_24px_rgba(0,0,0,0.04)] sticky top-0 z-40">
        <div className="flex justify-between items-center w-full px-6 sm:px-8 py-5 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose/10 flex items-center justify-center">
              <GraduationCap size={22} className="text-rose" />
            </div>
            <div>
              <h1 className="font-heading italic text-xl text-navy leading-tight">
                Clinician Dashboard
              </h1>
              <p className="font-body text-xs text-muted mt-0.5">
                Home practice data: aggregate view
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-navy font-body font-medium text-sm rounded-xl border border-navy/10 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-500"
          >
            <LogOut size={15} />
            Exit
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 py-24">

        {/* Disclaimer Banner */}
        <StaggerSection className="mb-12">
          <motion.div variants={fadeUp}>
            <div className="bg-ice rounded-2xl p-5 flex items-start gap-4">
              <AlertTriangle size={18} className="text-rose mt-0.5 shrink-0" />
              <p className="text-sm text-muted font-body leading-relaxed">
                <span className="font-semibold text-navy">Wellness Tool Disclaimer:</span>{' '}
                BoloBridge is an educational and wellness tool, not an FDA-regulated medical device. Data shown here reflects
                automated speech recognition results from home practice sessions. All scores should be interpreted alongside
                professional clinical judgment. No automated diagnostic claims are made.
              </p>
            </div>
          </motion.div>
        </StaggerSection>

        {/* Overview Cards — 4-column stat row */}
        <StaggerSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <OverviewCard
            icon={User}
            label="Child"
            value={profile?.name || 'Not set'}
            detail={profile ? `Age: ${profile.age} yrs` : 'Set up profile to begin'}
            accentBg="bg-rose/10"
            accentText="text-rose"
          />
          <OverviewCard
            icon={Calendar}
            label="Age"
            value={profile ? `${profile.age} yrs` : '--'}
            detail={profile ? 'Developmental stage tracked' : 'Awaiting profile'}
            accentBg="bg-grape/10"
            accentText="text-grape"
          />
          <OverviewCard
            icon={Activity}
            label="Challenge Sessions"
            value={String(dailyChallengeResults.length)}
            detail={dailyChallengeResults.length > 0 ? `${dailyChallengeResults.filter(c => c.completed).length} completed` : 'No sessions yet'}
            accentBg="bg-orange/10"
            accentText="text-orange"
          />
          <OverviewCard
            icon={Flame}
            label="Current Streak"
            value={`${progress.currentStreak} days`}
            detail={progress.currentStreak > 0 ? 'Keep it going!' : 'Start a streak today'}
            accentBg="bg-rose/10"
            accentText="text-rose"
          />
        </StaggerSection>

        {/* PCC + 6-Week Cycle Row */}
        <StaggerSection className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.div variants={scaleIn}>
            <PCCCard pccResult={pccResult} trend={pccTrend} />
          </motion.div>
          <motion.div variants={scaleIn}>
            <WeeklyCycleSummary weeks={weeklyPCCSummary} />
          </motion.div>
        </StaggerSection>

        {/* Session History Table */}
        <StaggerSection className="mb-16">
          <motion.div variants={fadeUp}>
            <SessionHistoryTable challenges={recentChallenges} />
          </motion.div>
        </StaggerSection>

        {/* Target Sound Selection */}
        <StaggerSection className="mb-16">
          <motion.div variants={fadeUp}>
            <SelectTargetSounds
              cycleProgress={cycleProgress}
              setCycleProgress={setCycleProgress}
              currentTargets={currentCycleTargets}
            />
          </motion.div>
        </StaggerSection>

        {/* Data Interoperability Note */}
        <StaggerSection>
          <motion.div variants={fadeUp}>
            <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
              <div className="flex items-start gap-4">
                <ShieldCheck size={20} className="text-rose mt-0.5 shrink-0" />
                <div className="text-sm text-muted font-body leading-relaxed space-y-3">
                  <p>
                    <span className="font-semibold text-navy">Data Interoperability:</span>{' '}
                    All data is stored locally on the family&apos;s device. This dashboard provides a read-only aggregate view
                    of the child&apos;s Daily Challenge performance over a 6-week cycle. Target sound selections are written
                    back to guide the next day&apos;s challenge content.
                  </p>
                  <p>
                    <span className="font-semibold text-navy">Intended Use:</span>{' '}
                    This tool supplements, but does not replace, professional speech-language assessment and treatment.
                    PCC values are derived from automated speech recognition and may differ from formal articulation testing.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </StaggerSection>
      </main>
    </div>
  );
}

/* ================================================================== */
/*  Overview Card — Stitch 46 editorial stat card                      */
/* ================================================================== */

function OverviewCard({
  icon: Icon,
  label,
  value,
  detail,
  accentBg,
  accentText,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  accentBg: string;
  accentText: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-ice rounded-3xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-500"
    >
      <div className="flex items-center justify-between mb-5">
        <div className={`w-11 h-11 rounded-2xl ${accentBg} flex items-center justify-center`}>
          <Icon size={20} className={accentText} />
        </div>
      </div>
      <p className="font-heading italic text-2xl text-navy mb-1 truncate">
        {value}
      </p>
      <p className="font-body text-sm text-muted mb-2">
        {label}
      </p>
      <p className="font-body text-xs text-muted/60">
        {detail}
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/*  PCC Card — Calm Analog                                             */
/* ================================================================== */

function PCCCard({
  pccResult,
  trend,
}: {
  pccResult: PCCResult | null;
  trend: 'up' | 'down' | 'stable';
}) {
  if (!pccResult) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 h-full flex flex-col items-center justify-center">
        <BarChart3 size={32} className="text-muted mb-4" />
        <p className="text-muted font-body text-center leading-relaxed">
          No assessment data available yet.
          <br />
          Complete a screening to see PCC metrics.
        </p>
      </div>
    );
  }

  const label = getPCCLabel(pccResult.pcc);
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : TrendingUp;
  const trendColor =
    trend === 'up'
      ? 'text-success'
      : trend === 'down'
      ? 'text-rose'
      : 'text-muted';

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading italic text-xl text-navy">
          PCC (Percent Consonants Correct)
        </h2>
        <div className={`flex items-center gap-1.5 ${trendColor}`}>
          <TrendIcon size={16} />
          <span className="text-xs font-body capitalize">{trend}</span>
        </div>
      </div>

      <div className="flex items-end gap-4 mb-6">
        <p className="font-heading italic text-5xl text-navy">
          {pccResult.pcc.toFixed(1)}
          <span className="text-2xl text-muted">%</span>
        </p>
        <p className={`font-body text-sm font-semibold mb-2 ${label.color}`}>
          {label.label}
        </p>
      </div>

      {/* Progress bar — flat, no gradient */}
      <div className="w-full bg-navy/5 rounded-full h-3 mb-5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pccResult.pcc, 100)}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-teal rounded-full"
        />
      </div>

      <p className="text-sm text-muted font-body mb-6">
        {pccResult.totalPassed} of {pccResult.totalTested} consonants produced correctly
      </p>

      {/* Per-phoneme breakdown */}
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {pccResult.perPhoneme.map((p) => (
          <motion.div
            key={p.sound}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`text-center py-2 px-1 rounded-xl text-xs font-heading italic font-semibold cursor-default transition-shadow duration-500 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] ${
              p.passed
                ? 'bg-success/10 text-success'
                : 'bg-rose/10 text-rose'
            }`}
          >
            <span className="block">{PHONEME_LABELS[p.sound] || `/${p.sound}/`}</span>
            <span className="block text-[10px] opacity-70 font-body">
              {Math.round(p.score * 100)}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  6-Week Cycle Summary                                               */
/* ================================================================== */

function WeeklyCycleSummary({
  weeks,
}: {
  weeks: { weekLabel: string; sessionsCompleted: number; totalSessions: number; avgScore: number }[];
}) {
  if (weeks.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 h-full flex flex-col items-center justify-center">
        <Target size={32} className="text-muted mb-4" />
        <p className="text-muted font-body text-center leading-relaxed">
          No Daily Challenge data available yet.
          <br />
          Complete daily challenges to see the 6-week cycle summary.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 h-full">
      <h2 className="font-heading italic text-xl text-navy mb-3">
        {CYCLE_LENGTH_WEEKS}-Week Cycle Overview
      </h2>
      <p className="text-sm text-muted font-body mb-6">
        Aggregate Daily Challenge performance over the current cycle.
      </p>

      <div className="space-y-4">
        {weeks.map((week) => {
          const completionRate = week.totalSessions > 0
            ? (week.sessionsCompleted / week.totalSessions) * 100
            : 0;
          return (
            <motion.div
              key={week.weekLabel}
              className="flex items-center gap-4"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <span className="font-heading italic font-semibold text-sm text-navy w-16 shrink-0">
                {week.weekLabel}
              </span>
              <div className="flex-1">
                <div className="w-full bg-navy/5 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-teal rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted font-body">
                  {week.sessionsCompleted}/{week.totalSessions} done
                </span>
                <span className="font-heading italic font-bold text-sm text-navy min-w-[40px] text-right">
                  {week.avgScore}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {weeks.length < CYCLE_LENGTH_WEEKS && (
        <p className="text-xs text-muted font-body mt-5">
          Showing {weeks.length} of {CYCLE_LENGTH_WEEKS} weeks in the current cycle.
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Session History Table                                              */
/* ================================================================== */

function SessionHistoryTable({
  challenges,
}: {
  challenges: DailyChallengeResult[];
}) {
  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-navy" />
          <h2 className="font-heading italic text-xl text-navy">
            Daily Challenge History
          </h2>
        </div>
        <span className="text-xs text-muted font-body">
          Last 14 sessions
        </span>
      </div>

      {challenges.length === 0 ? (
        <p className="text-muted font-body text-center py-12">
          No daily challenge sessions completed yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-navy/5">
                <th className="py-3 px-4 text-xs text-muted font-body font-semibold uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-4 text-xs text-muted font-body font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-xs text-muted font-body font-semibold uppercase tracking-wider">
                  Score
                </th>
                <th className="py-3 px-4 text-xs text-muted font-body font-semibold uppercase tracking-wider">
                  Exercises
                </th>
                <th className="py-3 px-4 text-xs text-muted font-body font-semibold uppercase tracking-wider">
                  Duration
                </th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch, idx) => {
                const exerciseCount = ch.exercises.length;
                const durationMin = Math.round(ch.timeSpentSeconds / 60);

                return (
                  <motion.tr
                    key={ch.date + idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04, duration: 0.5 }}
                    className="border-b border-navy/5 hover:bg-ice/50 transition-colors duration-500"
                  >
                    <td className="py-4 px-4 text-sm font-body text-navy">
                      {new Date(ch.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-4">
                      {ch.completed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
                          <CheckCircle2 size={12} />
                          Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-body font-semibold text-orange bg-orange/10 px-3 py-1 rounded-full">
                          <XCircle size={12} />
                          Partial
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm font-heading italic font-semibold text-navy">
                      {ch.totalScore}
                    </td>
                    <td className="py-4 px-4 text-sm font-body text-muted">
                      {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                    </td>
                    <td className="py-4 px-4 text-sm font-body text-muted">
                      {durationMin} min
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Select Target Sounds (manual SLP selection)                        */
/* ================================================================== */

function SelectTargetSounds({
  cycleProgress,
  setCycleProgress,
  currentTargets,
}: {
  cycleProgress: CycleProgress | null;
  setCycleProgress: (progress: CycleProgress) => void;
  currentTargets: { phoneme: string; score: number }[];
}) {
  const clinicianTargets = cycleProgress?.clinicianTargets || [];

  const togglePhoneme = useCallback(
    (phoneme: string) => {
      if (!cycleProgress) return;

      const current = cycleProgress.clinicianTargets || [];
      const next = current.includes(phoneme)
        ? current.filter((p) => p !== phoneme)
        : [...current, phoneme];

      setCycleProgress({
        ...cycleProgress,
        clinicianTargets: next,
      });
    },
    [cycleProgress, setCycleProgress]
  );

  return (
    <div className="bg-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
      <div className="flex items-center gap-3 mb-3">
        <Target size={18} className="text-teal" />
        <h2 className="font-heading italic text-xl text-navy">
          Select Target Sounds for Next Challenge
        </h2>
      </div>
      <p className="text-sm text-muted font-body mb-8 leading-relaxed">
        Manually select which phonemes should be prioritized in the child&apos;s next Daily Challenge.
        These selections override the automatic cycle scheduling.
      </p>

      {!cycleProgress ? (
        <div className="text-center py-10">
          <p className="text-muted font-body leading-relaxed">
            Cycle progress must be initialized before targets can be adjusted. The child needs to
            complete a screening assessment first.
          </p>
        </div>
      ) : (
        <>
          {/* Current auto-targets info */}
          {currentTargets.length > 0 && (
            <div className="bg-ice rounded-2xl p-5 mb-8">
              <p className="text-xs text-muted font-body uppercase tracking-wider mb-3 font-semibold">
                Current Auto-Scheduled Targets
              </p>
              <div className="flex flex-wrap gap-2">
                {currentTargets.map((target) => (
                  <span
                    key={target.phoneme}
                    className="inline-flex items-center gap-2 bg-teal/10 text-teal rounded-xl px-3 py-1.5 text-xs font-heading italic font-semibold"
                  >
                    {PHONEME_LABELS[target.phoneme] || `/${target.phoneme}/`}
                    <span className="text-muted font-body font-normal">
                      {Math.round(target.score * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted font-body mb-4 uppercase tracking-wider font-semibold">
            Manual Target Selection
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
            {ALL_PHONEMES.map((phoneme) => {
              const isSelected = clinicianTargets.includes(phoneme);
              return (
                <motion.button
                  key={phoneme}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  onClick={() => togglePhoneme(phoneme)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 font-heading italic font-bold transition-all duration-500 ${
                    isSelected
                      ? 'bg-teal/10 border-teal text-teal'
                      : 'bg-ice border-transparent text-navy hover:border-navy/15 hover:-translate-y-0.5'
                  }`}
                >
                  <span className="text-base">
                    {PHONEME_LABELS[phoneme]}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                      <CheckCircle2 size={14} className="text-teal mt-1" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {clinicianTargets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-6 pt-5 border-t border-navy/5"
            >
              <div className="flex items-center gap-2">
                <ChevronRight size={14} className="text-teal" />
                <p className="text-sm font-body text-navy">
                  <span className="font-semibold">{clinicianTargets.length}</span> phoneme
                  {clinicianTargets.length === 1 ? '' : 's'} selected for the next challenge:{' '}
                  <span className="font-heading italic font-semibold text-teal">
                    {clinicianTargets.map((p) => PHONEME_LABELS[p] || `/${p}/`).join(', ')}
                  </span>
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
