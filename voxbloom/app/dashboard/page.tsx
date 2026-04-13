'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { GeometricPaths } from '@/components/ui/background-patterns';
import { motion, AnimatePresence, useInView, useSpring, useMotionValue, useTransform } from 'framer-motion';
import {
  Lock,
  Unlock,
  Activity,
  ArrowLeft,
  Flame,
  Volume2,
  Star,
  ShieldCheck,
  Delete,
  Mic,
  Copy,
  Check,
  Stethoscope,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { XP_PER_LEVEL } from '@/lib/constants';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { AchievementsBadges } from '@/components/dashboard/AchievementsBadges';
import type { ProgressData, ChildProfile, VocalBiomarkerData, AssessmentResult } from '@/types';

/* ========== Animated Counter ========== */

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 80, damping: 20 });
  const display = useTransform(springValue, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [display]);

  return (
    <span>
      {displayValue}{suffix}
    </span>
  );
}

/* ========== Section Wrapper with useInView ========== */

function AnimatedSection({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ========== PCC (Percent Consonants Correct) from screening data ========== */

function buildPCCData(assessments: AssessmentResult[]) {
  if (assessments.length === 0) return [];

  return assessments
    .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
    .map((assessment) => {
      let totalPhonemes = 0;
      let correctPhonemes = 0;

      assessment.categories.forEach((cat) => {
        cat.phonemes.forEach((p) => {
          if (!p.skipped) {
            totalPhonemes++;
            if (p.score >= 0.7) correctPhonemes++;
          }
        });
      });

      const pcc = totalPhonemes > 0 ? Math.round((correctPhonemes / totalPhonemes) * 100) : 0;
      const date = new Date(assessment.completedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      return { date, pcc, age: assessment.childAge };
    });
}

/* ========== Build chart data from real exercise history ========== */

function buildWeeklyProgress(history: { completedAt: string; score: number; maxScore: number }[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  // Bucket exercises by day of week for the current week
  const buckets: Record<string, { scores: number[]; count: number }> = {};
  days.forEach((d) => (buckets[d] = { scores: [], count: 0 }));

  history.forEach((entry) => {
    const entryDate = new Date(entry.completedAt);
    if (entryDate >= weekStart) {
      const dayName = days[entryDate.getDay()];
      const pct = entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
      buckets[dayName].scores.push(pct);
      buckets[dayName].count += 1;
    }
  });

  return days.map((day) => ({
    day,
    score: buckets[day].scores.length
      ? Math.round(buckets[day].scores.reduce((a, b) => a + b, 0) / buckets[day].scores.length)
      : 0,
    exercises: buckets[day].count,
  }));
}

/* ========== Stat Card Accent Colors ========== */

const STAT_ACCENTS = [
  { accent: 'bg-amber', iconBg: 'bg-amber/10', iconColor: 'text-amber', valueColor: 'text-amber' },
  { accent: 'bg-[#C2956B]', iconBg: 'bg-[#C2956B]/10', iconColor: 'text-[#C2956B]', valueColor: 'text-[#C2956B]' },
  { accent: 'bg-[#8B7EC8]', iconBg: 'bg-[#8B7EC8]/10', iconColor: 'text-[#8B7EC8]', valueColor: 'text-[#8B7EC8]' },
  { accent: 'bg-[#6B8F71]', iconBg: 'bg-[#6B8F71]/10', iconColor: 'text-[#6B8F71]', valueColor: 'text-[#6B8F71]' },
];

export default function DashboardPage() {
  const {
    verifyDashboardPin,
    isDashboardUnlocked,
    unlockDashboard,
    lockDashboard,
    progress,
    profile,
    vocalBiomarkers,
    clinicianCode,
    generateClinicianCode,
    assessmentResults,
    completedModules,
    dailyChallengeResults,
  } = useAppStore();

  if (!isDashboardUnlocked) {
    return <PinEntryScreen verifyPin={verifyDashboardPin} onUnlock={unlockDashboard} />;
  }

  return (
    <DashboardContent
      progress={progress}
      profile={profile}
      onLock={lockDashboard}
      vocalBiomarkers={vocalBiomarkers}
      clinicianCode={clinicianCode}
      onGenerateCode={generateClinicianCode}
      assessmentResults={assessmentResults}
      completedModules={completedModules}
      dailyChallengeResults={dailyChallengeResults}
    />
  );
}

/* ========== PIN Entry ========== */

function PinEntryScreen({
  verifyPin,
  onUnlock,
}: {
  verifyPin: (pin: string) => Promise<boolean>;
  onUnlock: () => void;
}) {
  const { t } = useTranslation();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (index === 3 && value) {
      const entered = newPin.join('');
      setVerifying(true);
      const valid = await verifyPin(entered);
      setVerifying(false);

      if (valid) {
        onUnlock();
      } else {
        setError(true);
        setShake(true);
        setTimeout(() => {
          setPin(['', '', '', '']);
          setShake(false);
          inputRefs.current[0]?.focus();
        }, 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleNumberPad = (digit: string) => {
    const nextEmpty = pin.findIndex((d) => d === '');
    if (nextEmpty === -1) return;
    handleChange(nextEmpty, digit);
  };

  const handleBackspace = () => {
    const lastFilled = pin.reduce((last, d, i) => (d ? i : last), -1);
    if (lastFilled >= 0) {
      const newPin = [...pin];
      newPin[lastFilled] = '';
      setPin(newPin);
      setError(false);
      inputRefs.current[lastFilled]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1A1A2E] flex items-center justify-center px-4 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 w-full max-w-sm text-center relative z-10"
      >
        <div className="w-16 h-16 bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <Lock size={28} className="text-[#2D3142] dark:text-white" />
        </div>

        <h1 className="font-heading italic text-3xl text-[#2D3142] dark:text-white mb-2">
          {t('dashboard.title')}
        </h1>
        <p className="text-[#64748B] dark:text-white/60 font-body mb-10">
          {t('dashboard.enterPin')}
        </p>

        {/* PIN Inputs */}
        <motion.div
          animate={shake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-4 mb-6"
        >
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-14 text-center text-2xl font-heading font-bold rounded-xl border-2 outline-none transition-all duration-500 ease-out dark:text-white ${
                error
                  ? 'border-[#D16D6D] bg-[#D16D6D]/5'
                  : digit
                  ? 'border-amber bg-amber/5'
                  : 'border-[#E5E7EB] bg-[#FAF8F5] dark:bg-[#1A1A2E] dark:border-white/10'
              } focus:border-amber focus:ring-0`}
            />
          ))}
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-[#D16D6D] text-sm font-body mb-4"
            >
              {t('dashboard.incorrectPin')}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'].map(
            (key) => {
              if (key === '') return <div key="empty" />;
              if (key === 'back') {
                return (
                  <button
                    key="back"
                    onClick={handleBackspace}
                    className="w-full aspect-square rounded-xl bg-[#F5F1EB] hover:bg-[#E8E4DE] dark:bg-[#1A1A2E] dark:hover:bg-[#2D3142] flex items-center justify-center transition-colors duration-500 ease-out"
                  >
                    <Delete size={20} className="text-[#64748B] dark:text-white/60" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleNumberPad(key)}
                  className="w-full aspect-square rounded-xl bg-[#FAF8F5] hover:bg-amber/10 dark:bg-[#1A1A2E] dark:hover:bg-amber/10 text-[#2D3142] dark:text-white font-heading font-bold text-lg transition-colors duration-500 ease-out"
                >
                  {key}
                </button>
              );
            }
          )}
        </div>

        <p className="text-xs text-[#64748B] dark:text-white/60 mt-8 font-body">
          {t('dashboard.defaultPin')}
        </p>
      </motion.div>
    </div>
  );
}

/* ========== Dashboard Content ========== */

function DashboardContent({
  progress,
  profile,
  onLock,
  vocalBiomarkers,
  clinicianCode,
  onGenerateCode,
  assessmentResults,
  completedModules,
  dailyChallengeResults,
}: {
  progress: ProgressData;
  profile: ChildProfile | null;
  onLock: () => void;
  vocalBiomarkers: VocalBiomarkerData[];
  clinicianCode: string | null;
  onGenerateCode: () => string;
  assessmentResults: AssessmentResult[];
  completedModules: string[];
  dailyChallengeResults: { completed: boolean }[];
}) {
  const { t } = useTranslation();
  const [codeCopied, setCodeCopied] = useState(false);

  const handleGenerateCode = () => {
    const code = onGenerateCode();
    navigator.clipboard?.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const handleCopyCode = () => {
    if (clinicianCode) {
      navigator.clipboard?.writeText(clinicianCode).then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      });
    }
  };

  const latestBiomarker = vocalBiomarkers.length > 0
    ? vocalBiomarkers[vocalBiomarkers.length - 1]
    : null;

  const skillData = [
    { skill: 'Articulation', value: progress.skillScores.articulation, fullMark: 100 },
    { skill: 'Vocabulary', value: progress.skillScores.vocabulary, fullMark: 100 },
    { skill: 'Fluency', value: progress.skillScores.fluency, fullMark: 100 },
    { skill: 'Oral Motor', value: progress.skillScores.oralMotor, fullMark: 100 },
  ];
  const hasSkillData = skillData.some((s) => s.value > 0);

  const weeklyProgress = buildWeeklyProgress(progress.exerciseHistory);
  const hasProgressData = weeklyProgress.some((d) => d.score > 0 || d.exercises > 0);

  const statCards = [
    {
      label: t('dashboard.totalExercises'),
      value: progress.totalExercises || 0,
      icon: Activity,
      isNumeric: true,
    },
    {
      label: t('dashboard.currentStreak'),
      value: `${progress.currentStreak || 0} ${t('dashboard.days')}`,
      icon: Flame,
      isNumeric: false,
    },
    {
      label: t('dashboard.soundsMastered'),
      value: progress.soundsMastered?.length || 0,
      icon: Volume2,
      isNumeric: true,
    },
    {
      label: `${t('dashboard.level')} ${progress.level || 1}`,
      value: `${progress.xp || 0} XP`,
      icon: Star,
      isNumeric: false,
    },
  ];

  const xpPercent = ((progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 text-amber opacity-[0.13] pointer-events-none z-0">
        <GeometricPaths />
      </div>
      <main className="relative z-10 pt-32 pb-24 max-w-7xl mx-auto px-6">

        {/* ─── Header Section ─── */}
        <AnimatedSection className="mb-16">
          <section className="flex justify-between items-end">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F5F1EB] dark:bg-[#2D3142] text-amber font-medium text-sm font-body mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6B8F71]" />
                Parent Dashboard
              </span>
              <h1 className="font-heading italic text-5xl sm:text-6xl text-amber mb-2 tracking-tight">
                {profile ? `${profile.name}'s Progress` : t('dashboard.title')}
              </h1>
              <p className="text-[#64748B] dark:text-white/60 text-lg font-body">
                {t('dashboard.trackingFor') || 'Tracking speech development journey with gentle steps.'}
              </p>
            </div>
            <MagneticButton
              onClick={onLock}
              className="group flex items-center justify-center w-12 h-12 rounded-full border border-[#C2C8BF] dark:border-white/20 hover:border-amber transition-all duration-500 ease-out active:scale-90"
            >
              <Lock size={18} className="text-[#64748B] group-hover:text-amber transition-colors duration-500" />
            </MagneticButton>
          </section>
        </AnimatedSection>

        {/* ─── 2x2 Stat Cards with Left Accent Bar ─── */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {statCards.map((stat, i) => {
            const colors = STAT_ACCENTS[i];
            const numericValue = stat.isNumeric && typeof stat.value === 'number' ? stat.value : null;

            return (
              <AnimatedSection key={stat.label} delay={i * 0.08}>
                <div className="bg-white dark:bg-[#2D3142] p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center gap-4 relative overflow-hidden group transition-all duration-500 ease-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] hover:-translate-y-0.5">
                  {/* Left accent bar */}
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 w-[3px] ${colors.accent}`}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originY: 0 }}
                  />

                  {/* Icon circle */}
                  <div className={`w-12 h-12 rounded-full ${colors.iconBg} dark:bg-white/5 flex items-center justify-center flex-shrink-0`}>
                    <stat.icon size={22} className={colors.iconColor} />
                  </div>

                  {/* Label + value */}
                  <div>
                    <p className="text-[#64748B] dark:text-white/60 text-sm font-medium font-body">
                      {stat.label}
                    </p>
                    <p className={`text-3xl font-bold font-heading ${colors.valueColor}`}>
                      {numericValue !== null ? (
                        <AnimatedCounter value={numericValue} />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </section>

        {/* ─── Charts Row: 2-Column Grid ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Progress Over Time */}
          <AnimatedSection delay={0.1}>
            <div className="bg-white dark:bg-[#2D3142] p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h2 className="font-heading italic text-2xl text-amber mb-6">
                {t('dashboard.progressOverTime')}
              </h2>
              {hasProgressData ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12, fill: '#64748B' }}
                          axisLine={{ stroke: '#E8E4DE' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#64748B' }}
                          axisLine={{ stroke: '#E8E4DE' }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                            fontFamily: 'var(--font-body)',
                            background: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#C47C3E"
                          strokeWidth={3}
                          dot={{ fill: '#C47C3E', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6 }}
                          name="Score %"
                        />
                        <Line
                          type="monotone"
                          dataKey="exercises"
                          stroke="#8B7EC8"
                          strokeWidth={3}
                          strokeDasharray="8 4"
                          dot={{ fill: '#8B7EC8', r: 4, strokeWidth: 0 }}
                          activeDot={{ r: 6 }}
                          name="Exercises"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-6 mt-6 justify-center">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber" />
                      <span className="text-xs text-[#64748B] font-body">Avg. Score %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#8B7EC8]" />
                      <span className="text-xs text-[#64748B] font-body">Exercises Completed</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <Activity size={32} className="text-[#E8E4DE] dark:text-white/20 mx-auto mb-3" />
                    <p className="text-[#64748B] dark:text-white/60 text-sm font-body">
                      No activity this week yet. Complete exercises to see your progress here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Skill Breakdown Radar */}
          <AnimatedSection delay={0.2}>
            <div className="bg-white dark:bg-[#2D3142] p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col items-center">
              <h2 className="font-heading italic text-2xl text-amber mb-6 self-start w-full">
                {t('dashboard.skillBreakdown')}
              </h2>
              {hasSkillData ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={skillData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#E8E4DE" />
                      <PolarAngleAxis
                        dataKey="skill"
                        tick={{ fontSize: 12, fill: '#C47C3E', fontWeight: 600 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 10, fill: '#64748B' }}
                      />
                      <Radar
                        name="Skill Level"
                        dataKey="value"
                        stroke="#C47C3E"
                        fill="#C47C3E"
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <div className="text-center">
                    <Star size={32} className="text-[#E8E4DE] dark:text-white/20 mx-auto mb-3" />
                    <p className="text-[#64748B] dark:text-white/60 text-sm font-body">
                      No skill data yet. Play games to build your skill profile.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AnimatedSection>
        </section>

        {/* ─── XP Progress Bar (flat, no shimmer) ─── */}
        <AnimatedSection delay={0.15} className="mb-16">
          <div className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Thin color accent strip at top */}
            <div className="h-[3px] w-full flex">
              <div className="flex-1 bg-amber" />
              <div className="flex-1 bg-[#8B7EC8]" />
              <div className="flex-1 bg-[#C2956B]" />
            </div>

            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber/10 dark:bg-amber/20 flex items-center justify-center">
                    <Zap size={20} className="text-amber" />
                  </div>
                  <h2 className="font-heading italic text-2xl text-amber">
                    {t('dashboard.levelProgress')}
                  </h2>
                </div>
                <span className="text-amber font-bold font-body">
                  Level {progress.level || 1}
                  <span className="text-[#64748B] dark:text-white/60 font-normal px-2">&rarr;</span>
                  Level {(progress.level || 1) + 1}
                </span>
              </div>

              {/* Progress bar - flat solid, no shimmer */}
              <div className="relative w-full h-6 bg-[#F5F1EB] dark:bg-[#1A1A2E] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${xpPercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-0 left-0 h-full bg-amber rounded-full"
                />
              </div>

              <div className="flex justify-between mt-3 text-sm text-[#64748B] dark:text-white/60 font-body">
                <span>Current: {progress.xp % XP_PER_LEVEL} XP</span>
                <span>{Math.round(xpPercent)}% Completed</span>
                <span>Next Level: {XP_PER_LEVEL} XP</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* ─── PCC (Percent Consonants Correct) Tracking ─── */}
        <AnimatedSection delay={0.18} className="mb-16">
          <div className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#6B8F71]/10 dark:bg-[#6B8F71]/20 rounded-full flex items-center justify-center">
                <Activity size={20} className="text-[#6B8F71]" />
              </div>
              <div>
                <h2 className="font-heading italic text-2xl text-amber">
                  Speech Accuracy (PCC)
                </h2>
                <p className="text-sm text-[#64748B] dark:text-white/60 font-body">
                  Percent Consonants Correct across screening sessions
                </p>
              </div>
            </div>

            {(() => {
              const pccData = buildPCCData(assessmentResults);
              if (pccData.length === 0) {
                return (
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                      <Stethoscope size={32} className="text-[#E8E4DE] dark:text-white/20 mx-auto mb-3" />
                      <p className="text-[#64748B] dark:text-white/60 text-sm font-body">
                        Complete a screening to see your PCC trend here.
                      </p>
                      <Link
                        href="/screening"
                        className="inline-flex items-center gap-2 text-teal font-body font-medium text-sm mt-3 hover:underline"
                      >
                        Take Screening
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                      </Link>
                    </div>
                  </div>
                );
              }

              const latestPCC = pccData[pccData.length - 1].pcc;
              const pccChange = pccData.length > 1 ? latestPCC - pccData[0].pcc : 0;

              return (
                <>
                  {/* PCC summary stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-4 text-center">
                      <p className="text-xs text-[#64748B] dark:text-white/60 font-body mb-1">Latest PCC</p>
                      <p className="font-heading italic text-2xl font-bold text-[#6B8F71]">
                        {latestPCC}%
                      </p>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-4 text-center">
                      <p className="text-xs text-[#64748B] dark:text-white/60 font-body mb-1">Change</p>
                      <p className={`font-heading italic text-2xl font-bold ${pccChange >= 0 ? 'text-[#6B8F71]' : 'text-rose'}`}>
                        {pccChange >= 0 ? '+' : ''}{pccChange}%
                      </p>
                    </div>
                    <div className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-4 text-center">
                      <p className="text-xs text-[#64748B] dark:text-white/60 font-body mb-1">Screenings</p>
                      <p className="font-heading italic text-2xl font-bold text-amber">
                        {pccData.length}
                      </p>
                    </div>
                  </div>

                  {/* PCC line chart */}
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pccData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DE" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: '#64748B' }}
                          axisLine={{ stroke: '#E8E4DE' }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 12, fill: '#64748B' }}
                          axisLine={{ stroke: '#E8E4DE' }}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                            fontFamily: 'var(--font-body)',
                            background: '#fff',
                          }}
                          formatter={(value) => [`${value}%`, 'PCC']}
                        />
                        <Line
                          type="monotone"
                          dataKey="pcc"
                          stroke="#6B8F71"
                          strokeWidth={3}
                          dot={{ fill: '#6B8F71', r: 5, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 7, fill: '#6B8F71' }}
                          name="PCC"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <p className="text-xs text-[#64748B] dark:text-white/60 font-body mt-4 text-center">
                    PCC measures the percentage of consonant sounds produced correctly during screening.
                    A score of 85%+ is typically age-appropriate for children 5+.
                  </p>
                </>
              );
            })()}
          </div>
        </AnimatedSection>

        {/* ─── Achievement Badges Grid ─── */}
        <AnimatedSection delay={0.2} className="mb-16">
          <div className="bg-[#F5F1EB] dark:bg-[#2D3142] rounded-3xl p-10">
            <h2 className="font-heading italic text-3xl text-amber mb-8 text-center">
              {t('dashboard.badges') || 'Achievement Stamps'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
              {progress.badges.map((badge, i) => {
                const isUnlocked = !!badge.unlockedAt;
                // Alternate slight rotations for editorial feel
                const rotations = [3, -3, 6, -6, 2, -2, 3, -3];
                const rotation = rotations[i % rotations.length];
                // Color palette for unlocked badges
                const badgeColors = [
                  'bg-[#C2956B]/40',
                  'bg-[#8B7EC8]/30',
                  'bg-amber/30',
                  'bg-[#C2956B]/30',
                  'bg-[#E8E4DE]',
                  'bg-[#E8E4DE]',
                  'bg-[#E8E4DE]',
                  'bg-[#E8E4DE]',
                ];

                return (
                  <TiltCard key={badge.id} tiltAmount={8} className="group">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className={`flex flex-col items-center gap-3 ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}
                    >
                      <div
                        className={`w-20 h-20 rounded-2xl ${isUnlocked ? badgeColors[i % badgeColors.length] : 'bg-[#E8E4DE] dark:bg-[#1A1A2E]'} flex items-center justify-center shadow-sm border-4 border-white/50 dark:border-white/10 relative overflow-hidden transition-transform duration-500 ease-out group-hover:rotate-0`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                      >
                        <span className="text-3xl">{badge.icon}</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider font-body text-center ${
                        isUnlocked ? 'text-amber' : 'text-[#64748B]'
                      }`}>
                        {badge.name}
                      </span>
                    </motion.div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </AnimatedSection>

        {/* ─── Vocal Biomarkers Section ─── */}
        <AnimatedSection delay={0.25} className="mb-16">
          <div className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#8B7EC8]/10 dark:bg-[#8B7EC8]/20 rounded-full flex items-center justify-center">
                <Mic size={20} className="text-[#8B7EC8]" />
              </div>
              <div>
                <h2 className="font-heading italic text-2xl text-amber">
                  {t('dashboard.acousticProfile')}
                </h2>
                <p className="text-sm text-[#64748B] dark:text-white/60 font-body">
                  {t('dashboard.acousticProfileDesc')}
                </p>
              </div>
            </div>

            {latestBiomarker ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {([
                  {
                    labelKey: 'dashboard.speakingRate' as const,
                    value: latestBiomarker.speakingRate.toFixed(1),
                    unitKey: 'dashboard.sylSec' as const,
                  },
                  {
                    labelKey: 'dashboard.pauseFreq' as const,
                    value: latestBiomarker.pauseFrequency.toFixed(1),
                    unitKey: 'dashboard.perMin' as const,
                  },
                  {
                    labelKey: 'dashboard.pitchVar' as const,
                    value: latestBiomarker.pitchVariability.toFixed(0),
                    unitKey: 'dashboard.hz' as const,
                  },
                  {
                    labelKey: 'dashboard.volumeDyn' as const,
                    value: latestBiomarker.volumeDynamics.toFixed(0),
                    unitKey: 'dashboard.dbRange' as const,
                  },
                ]).map((item, i) => (
                  <motion.div
                    key={item.labelKey}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                    className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-5 text-center transition-all duration-500 ease-out hover:-translate-y-0.5"
                  >
                    <p className="text-xs text-[#64748B] dark:text-white/60 font-body mb-1">{t(item.labelKey)}</p>
                    <p className="font-heading italic text-xl font-bold text-[#2D3142] dark:text-white">
                      {item.value}
                    </p>
                    <p className="text-xs text-[#64748B] dark:text-white/60 font-body">{t(item.unitKey)}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-8 text-center">
                <p className="text-[#64748B] dark:text-white/60 text-sm font-body">
                  {t('dashboard.noBiomarkers')}
                </p>
              </div>
            )}

            {vocalBiomarkers.length > 1 && (
              <p className="text-xs text-[#64748B] dark:text-white/60 font-body mt-4 text-center">
                {vocalBiomarkers.length} recordings captured &bull; Latest:{' '}
                {new Date(latestBiomarker!.capturedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </AnimatedSection>

        {/* ─── Achievements / Badges ─── */}
        <AnimatedSection delay={0.25} className="mb-16">
          <div className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
            <AchievementsBadges
              storeState={{
                totalExercises: progress.totalExercises,
                soundsMastered: progress.soundsMastered,
                currentStreak: progress.currentStreak,
                longestStreak: progress.longestStreak,
                xp: progress.xp,
                level: progress.level,
                completedModules,
                assessmentResults: assessmentResults.length,
                dailyChallengeResults: dailyChallengeResults.filter((r) => r.completed).length,
              }}
            />
          </div>
        </AnimatedSection>

        {/* ─── Educator / Therapist Access Code Section ─── */}
        <AnimatedSection delay={0.3} className="mb-16">
          <div className="bg-white dark:bg-[#2D3142] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-amber/10 dark:bg-amber/20 rounded-full flex items-center justify-center">
                <Stethoscope size={20} className="text-amber" />
              </div>
              <div>
                <h2 className="font-heading italic text-2xl text-amber">
                  {t('dashboard.educatorAccess')}
                </h2>
                <p className="text-sm text-[#64748B] dark:text-white/60 font-body">
                  {t('dashboard.educatorAccessDesc')}
                </p>
              </div>
            </div>

            {clinicianCode ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-6 text-center"
              >
                <p className="text-xs text-[#64748B] dark:text-white/60 font-body mb-3">
                  {t('dashboard.shareCode')}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-heading italic text-3xl font-bold text-[#2D3142] dark:text-white tracking-[0.3em]">
                    {clinicianCode}
                  </span>
                  <MagneticButton
                    onClick={handleCopyCode}
                    className="p-2.5 rounded-xl bg-amber/10 hover:bg-amber/20 transition-colors duration-500 ease-out"
                  >
                    {codeCopied ? (
                      <Check size={18} className="text-[#6B8F71]" />
                    ) : (
                      <Copy size={18} className="text-amber" />
                    )}
                  </MagneticButton>
                </div>
              </motion.div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-[#64748B] dark:text-white/60 font-body mb-6">
                  {t('dashboard.generateCodeDesc')}
                </p>
                <MagneticButton
                  onClick={handleGenerateCode}
                  className="bg-amber text-white font-body font-semibold py-3 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out hover:-translate-y-0.5"
                >
                  {t('dashboard.generateCode')}
                </MagneticButton>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* ─── Disclaimer ─── */}
        <AnimatedSection delay={0.35} className="mb-4">
          <div className="bg-[#FAF8F5] dark:bg-[#2D3142] rounded-3xl p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-amber mt-0.5 shrink-0" />
              <p className="text-sm text-[#64748B] dark:text-white/60 font-body leading-relaxed">
                <span className="font-semibold text-[#2D3142] dark:text-white">{t('dashboard.disclaimerLabel')}</span>{' '}
                {t('dashboard.disclaimerText')}
              </p>
            </div>
          </div>
        </AnimatedSection>
      </main>
    </div>
  );
}
