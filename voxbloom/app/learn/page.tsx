'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import modules from '@/data/modules.json';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { TiltCard } from '@/components/ui/TiltCard';
import { Stethoscope, ArrowRight } from 'lucide-react';
import { FlowPaths } from '@/components/ui/background-patterns';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

/* ------------------------------------------------------------------ */
/*  Roman numerals                                                      */
/* ------------------------------------------------------------------ */
const ROMAN = [
  'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII',
];

/* ------------------------------------------------------------------ */
/*  Editorial insight copy per module (for the chapter row)             */
/* ------------------------------------------------------------------ */
const INSIGHTS: Record<string, string> = {
  'how-we-make-sounds': 'Explore the fascinating journey of air becoming speech',
  'meet-your-mouth': 'Get to know the team that creates every sound',
  'sound-map': 'Navigate consonant corners and vowel valleys',
  'speech-milestones': 'What to expect at every age',
  'tricky-sounds': 'Understanding common challenges',
  'breathing-for-speech': 'Your breath is your superpower',
  'listening-skills': 'Becoming a sound detective',
  'conversation-skills': 'The art of talking together',
};

/* ------------------------------------------------------------------ */
/*  Recommendation logic (preserved from original)                      */
/* ------------------------------------------------------------------ */
function getRecommendedModules(
  assessmentResults: ReturnType<typeof useAppStore.getState>['assessmentResults']
) {
  if (assessmentResults.length === 0) return [];

  const latest = assessmentResults[assessmentResults.length - 1];
  const recommended: string[] = [];

  for (const cat of latest.categories) {
    if (cat.riskLevel === 'consult' || cat.riskLevel === 'monitor') {
      if (cat.id === 'early-sounds' || cat.id === 'middle-sounds') {
        recommended.push('how-we-make-sounds', 'meet-your-mouth');
      }
      if (cat.id === 'later-sounds' || cat.id === 'blends') {
        recommended.push('tricky-sounds', 'sound-map');
      }
    }
  }

  if (latest.overallRisk === 'consult') {
    recommended.push('speech-milestones', 'breathing-for-speech');
  }

  return [...new Set(recommended)];
}

/* ------------------------------------------------------------------ */
/*  Animation                                                           */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: i * 0.06 },
  }),
};

/* ------------------------------------------------------------------ */
/*  Chapter Row component                                               */
/* ------------------------------------------------------------------ */
function ChapterRow({
  mod,
  index,
  isCompleted,
  isRecommended,
  inView,
}: {
  mod: (typeof modules)[number];
  index: number;
  isCompleted: boolean;
  isRecommended: boolean;
  inView: boolean;
}) {
  const { t } = useTranslation();
  const progressPercent = isCompleted ? 100 : 0;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      custom={index}
    >
      <TiltCard tiltAmount={3}>
        <Link href={`/learn/${mod.id}`} className="block group">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center py-10 md:py-12 px-6 rounded-2xl cursor-pointer transition-all duration-500 hover:bg-[#F5F1EB] dark:hover:bg-white/[0.03]">
            {/* Roman numeral */}
            <div className="col-span-1">
              <span className="font-heading italic text-3xl md:text-4xl text-[#C2956B]/40 group-hover:text-[#C2956B] transition-colors duration-500">
                {ROMAN[index] || `${index + 1}`}
              </span>
            </div>

            {/* Theme title */}
            <div className="col-span-4">
              <h3 className="font-heading italic text-2xl md:text-3xl text-navy dark:text-white group-hover:text-success transition-colors duration-500">
                {mod.title}
              </h3>
              {isRecommended && (
                <span className="inline-block mt-1 text-xs font-body font-semibold text-[#C2956B]">
                  {t('learn.forYou')}
                </span>
              )}
            </div>

            {/* Insight text */}
            <div className="col-span-4">
              <p className="font-body text-slate/60 dark:text-white/40 text-sm leading-relaxed italic">
                &lsquo;{INSIGHTS[mod.id] || mod.description}&rsquo;
              </p>
            </div>

            {/* Progress ring + label */}
            <div className="col-span-2 flex items-center gap-3">
              <ProgressRing
                progress={progressPercent}
                size={32}
                strokeWidth={3}
                className={isCompleted ? 'text-success' : isRecommended ? 'text-coral' : 'text-slate/30 dark:text-white/20'}
                delay={index * 0.06}
              />
              {isCompleted ? (
                <span className="font-body text-[10px] text-[#6B8F71] font-semibold uppercase tracking-widest">
                  {t('learn.completed')}
                </span>
              ) : (
                <span className="font-body text-xs text-slate/50 dark:text-white/30 font-medium tracking-tight">
                  {progressPercent}%
                </span>
              )}
            </div>

            {/* Arrow */}
            <div className="col-span-1 text-right">
              <ArrowRight
                size={20}
                className="text-success opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500 inline-block"
              />
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */
export default function LearnPage() {
  const { t } = useTranslation();
  const completedModules = useAppStore((state) => state.completedModules);
  const assessmentResults = useAppStore((state) => state.assessmentResults);
  const hasScreening = assessmentResults.length > 0;

  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' });
  const listRef = useRef<HTMLDivElement>(null);
  const listInView = useInView(listRef, { once: true, margin: '-60px' });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: '-40px' });

  const recommendedIds = useMemo(
    () => getRecommendedModules(assessmentResults),
    [assessmentResults]
  );

  const sortedModules = useMemo(() => {
    if (recommendedIds.length === 0) return modules;
    return [...modules].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id) ? 0 : 1;
      const bRec = recommendedIds.includes(b.id) ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;
      return a.difficulty - b.difficulty;
    });
  }, [recommendedIds]);

  const overallProgress =
    modules.length > 0
      ? Math.round((completedModules.length / modules.length) * 100)
      : 0;

  // Find the first uncompleted module to resume from
  const nextModule =
    sortedModules.find((m) => !completedModules.includes(m.id)) ?? sortedModules[0];
  const nextModuleIndex = nextModule ? modules.indexOf(nextModule) : 0;

  return (
    <div className="min-h-screen">
      <ScrollProgress className="bg-success" />
      {/* Background pattern */}
      <div className="fixed inset-0 text-success opacity-[0.10] pointer-events-none z-0">
        <FlowPaths />
      </div>

      {/* ── Editorial Hero ── */}
      <section className="max-w-[1200px] mx-auto px-8 md:px-16 pt-24 pb-16 md:pb-24">
        <motion.div
          ref={headerRef}
          className="flex flex-col md:flex-row items-end justify-between gap-12"
          initial={{ opacity: 0, y: 24 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Left: title + progress */}
          <div className="max-w-2xl">
            <h1 className="font-heading italic text-6xl md:text-8xl text-success leading-none tracking-tight">
              {t('learn.title')}
            </h1>
            <p className="font-body text-slate/60 dark:text-white/40 text-lg mt-8 max-w-lg leading-relaxed">
              {t('learn.subtitle')}
            </p>

            {/* Overall progress — understated */}
            <div className="mt-8 flex items-center gap-4">
              <span className="font-body text-sm text-slate/50 dark:text-white/30">
                {`${completedModules.length} / ${modules.length} ${t('learn.modulesCompleted')}`}
              </span>
              <div className="flex-1 max-w-[120px] h-1 bg-slate/10 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-success rounded-full"
                  initial={{ width: 0 }}
                  animate={headerInView ? { width: `${overallProgress}%` } : {}}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                />
              </div>
              <span className="font-body text-sm font-semibold text-success">
                {overallProgress}%
              </span>
            </div>
          </div>

          {/* Right: Continue card */}
          {nextModule && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="w-full md:w-auto md:min-w-[280px]"
            >
              <Link href={`/learn/${nextModule.id}`}>
                <div className="relative bg-[#F5F1EB] dark:bg-[#2D3142] rounded-2xl p-8 overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500 cursor-pointer group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-success/5 rounded-bl-full pointer-events-none" />
                  <span className="font-body text-[#C2956B] uppercase tracking-[0.2em] text-[10px] mb-3 block font-semibold">
                    Pick up where you left off
                  </span>
                  <span className="font-heading italic text-4xl text-[#C2956B]/20 block mb-2">
                    {ROMAN[nextModuleIndex] || 'I'}
                  </span>
                  <h3 className="font-heading italic text-xl text-navy dark:text-white mb-4 group-hover:text-success transition-colors duration-300">
                    {nextModule.title}
                  </h3>
                  <MagneticButton className="bg-success text-white px-6 py-2.5 rounded-xl font-body text-sm font-semibold flex items-center gap-2">
                    Continue Reading
                    <ArrowRight size={14} />
                  </MagneticButton>
                </div>
              </Link>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* ── Chapter List (Table of Contents) ── */}
      <section ref={listRef} className="max-w-[1200px] mx-auto px-8 md:px-16">
        {/* Column headers (desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-8 pb-4 px-6 font-body text-[10px] uppercase tracking-widest text-slate/30 dark:text-white/20">
          <div className="col-span-1">Chapter</div>
          <div className="col-span-4">Theme</div>
          <div className="col-span-4">Insight</div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-1 text-right">Access</div>
        </div>

        {/* Chapter rows */}
        <div>
          {sortedModules.map((mod, index) => {
            const isCompleted = completedModules.includes(mod.id);
            const isRecommended = recommendedIds.includes(mod.id);

            return (
              <ChapterRow
                key={mod.id}
                mod={mod}
                index={index}
                isCompleted={isCompleted}
                isRecommended={isRecommended}
                inView={listInView}
              />
            );
          })}
        </div>
      </section>

      {/* ── Screening prompt — bottom of page ── */}
      {!hasScreening && (
        <section className="max-w-[1200px] mx-auto px-8 md:px-16 pb-24 pt-8">
          <motion.div
            ref={ctaRef}
            variants={fadeUp}
            initial="hidden"
            animate={ctaInView ? 'show' : 'hidden'}
            custom={0}
          >
            <Link href="/screening" className="block group">
              <div className="rounded-2xl bg-[#F5F1EB] dark:bg-[#2D3142] px-8 py-8 flex items-center gap-6 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
                <div className="w-12 h-12 bg-[#6B8F71]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope size={22} className="text-[#6B8F71]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading italic text-lg text-navy dark:text-white mb-0.5">
                    {t('learn.takeScreeningFirst')}
                  </h3>
                  <p className="font-body text-sm text-slate/60 dark:text-white/40">
                    {t('learn.screeningPromptDesc')}
                  </p>
                </div>
                <MagneticButton className="flex items-center gap-2 bg-[#6B8F71] text-white px-5 py-2.5 rounded-xl font-body text-sm font-semibold">
                  {t('learn.start')}
                  <ArrowRight size={14} />
                </MagneticButton>
              </div>
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  );
}
