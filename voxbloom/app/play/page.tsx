'use client';

import { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { GAME_CONFIGS } from '@/lib/constants';
import { ArrowRight, Stethoscope, Star, Sparkles, Mic } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/hooks/useTranslation';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { TextScramble } from '@/components/ui/TextScramble';
import type { RiskLevel } from '@/types';

/* ------------------------------------------------------------------ */
/*  AI / Voice badges                                                   */
/* ------------------------------------------------------------------ */
const AI_GAMES = new Set(['story-studio', 'emotion-echo']);
const VOICE_GAMES = new Set(['sound-safari', 'word-garden', 'rhythm-river', 'reader']);

/* ------------------------------------------------------------------ */
/*  Difficulty map                                                      */
/* ------------------------------------------------------------------ */
const DIFFICULTY_MAP: Record<string, { label: string; variant: string }> = {
  'story-studio': { label: 'Mastery Path', variant: 'bg-teal/10 text-teal' },
  'sound-safari': { label: 'All Levels', variant: 'bg-success/10 text-success' },
  'word-garden': { label: 'All Levels', variant: 'bg-violet/10 text-violet' },
  'rhythm-river': { label: 'All Levels', variant: 'bg-teal/10 text-teal' },
  'emotion-echo': { label: 'All Levels', variant: 'bg-rose/10 text-rose' },
  'tongue-gym': { label: 'Beginner', variant: 'bg-coral/10 text-coral' },
  'reader': { label: 'All Levels', variant: 'bg-sky/10 text-sky' },
};

/* ------------------------------------------------------------------ */
/*  Game descriptions for bento cards (editorial voice)                 */
/* ------------------------------------------------------------------ */
const EDITORIAL_COPY: Record<string, string> = {
  'story-studio': 'Step into an open storybook where words float and magic happens. Narrate your own journey and find your voice.',
  'sound-safari': 'Mimic the calls of the wild as you explore animal habitats and collect new sounds.',
  'word-garden': 'Plant new syllables and watch your vocabulary bloom into flowers.',
  'rhythm-river': 'Find the perfect rhythm as you match sounds that sing together.',
  'emotion-echo': 'Listen to voices and mirror the emotions you hear in each echo.',
  'tongue-gym': 'Strengthen your speech muscles with playful morning stretches and wiggle workouts designed for tiny voices.',
  'reader': 'Upload any text or PDF and read aloud, one word at a time. Evidence-based oral reading fluency practice.',
};

/* ------------------------------------------------------------------ */
/*  AI / Voice badge component                                          */
/* ------------------------------------------------------------------ */
function GameTechBadge({ slug, overlay = false }: { slug: string; overlay?: boolean }) {
  if (AI_GAMES.has(slug)) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body font-bold uppercase tracking-widest ${
        overlay
          ? 'bg-violet/80 backdrop-blur-sm text-white border border-white/10'
          : 'bg-violet/15 text-violet dark:text-violet'
      }`}>
        <Sparkles size={9} />
        AI-Powered
      </span>
    );
  }
  if (VOICE_GAMES.has(slug)) {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body font-bold uppercase tracking-widest ${
        overlay
          ? 'bg-teal/70 backdrop-blur-sm text-white border border-white/10'
          : 'bg-teal/12 text-teal'
      }`}>
        <Mic size={9} />
        Voice
      </span>
    );
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  Recommendation logic (preserved from original)                      */
/* ------------------------------------------------------------------ */
function getRecommendedGames(
  assessmentResults: { categories: { id: string; riskLevel: RiskLevel }[] }[]
): string[] {
  if (assessmentResults.length === 0) return [];
  const latest = assessmentResults[assessmentResults.length - 1];
  const recommended = new Set<string>();

  for (const cat of latest.categories) {
    if (cat.riskLevel === 'monitor' || cat.riskLevel === 'consult') {
      if (cat.id.includes('early') || cat.id.includes('vowel')) {
        recommended.add('sound-safari');
        recommended.add('word-garden');
      }
      if (cat.id.includes('late') || cat.id.includes('complex')) {
        recommended.add('sound-safari');
        recommended.add('rhythm-river');
      }
      if (cat.id.includes('blend') || cat.id.includes('multi')) {
        recommended.add('rhythm-river');
      }
    }
  }

  return Array.from(recommended);
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: i * 0.1 },
  }),
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function PlayPage() {
  const assessmentResults = useAppStore((s) => s.assessmentResults);
  const hasCompletedScreening = useAppStore((s) => s.hasCompletedScreening);
  const screeningDone = hasCompletedScreening();
  const recommendedGames = getRecommendedGames(assessmentResults);
  const { t } = useTranslation();

  const games = Object.entries(GAME_CONFIGS) as [
    keyof typeof GAME_CONFIGS,
    (typeof GAME_CONFIGS)[keyof typeof GAME_CONFIGS],
  ][];

  const sortedGames = useMemo(() => {
    return [...games].sort(([slugA], [slugB]) => {
      const aRec = recommendedGames.includes(slugA) ? 1 : 0;
      const bRec = recommendedGames.includes(slugB) ? 1 : 0;
      return bRec - aRec;
    });
  }, [recommendedGames]);

  // Swap sound safari and emotion echo manually
  const displayGames = [...sortedGames];
  const safariIdx = displayGames.findIndex(g => g[0] === 'sound-safari');
  const echoIdx = displayGames.findIndex(g => g[0] === 'emotion-echo');
  if (safariIdx !== -1 && echoIdx !== -1) {
    const temp = displayGames[safariIdx];
    displayGames[safariIdx] = displayGames[echoIdx];
    displayGames[echoIdx] = temp;
  }

  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: '-40px' });
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInView = useInView(gridRef, { once: true, margin: '-60px' });

  // Split games: first = featured (2-col), second = daily goal card, row of cards, banner
  const featuredGame = displayGames[0];
  const dailyGoalGame = displayGames[1];
  const rowGames = displayGames.slice(2, 6); // 4 cards in the row now (including Reader)
  const bannerGame = displayGames[6]; // tongue-gym as full-width banner

  const getGradient = (slug: string) => {
    if (slug === 'story-studio') return 'from-[#61549b] to-[#978ad5]';
    if (slug === 'sound-safari') return 'from-[#25686a] to-[#5f9ea0]';
    if (slug === 'word-garden') return 'from-[#ba1a1a] to-[#fdcb9d]';
    if (slug === 'rhythm-river') return 'from-[#004f51] to-[#92d2d3]';
    if (slug === 'emotion-echo') return 'from-[#7c5732] to-[#eebd90]';
    if (slug === 'tongue-gym') return 'from-[#38336a] to-[#47428a]';
    if (slug === 'reader') return 'from-[#2a6f7a] to-[#5f9ea0]';
    return 'from-teal/50 to-teal';
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1A1A2E]">
      <ScrollProgress className="bg-teal" />
      {/* ── Editorial Header ── */}
      <header className="max-w-[1200px] mx-auto px-8 pt-24 pb-16">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-3"
        >
          <h1 className="font-heading italic text-6xl md:text-8xl tracking-tight text-sky max-w-2xl leading-[1.1]">
            {t('play.title')}
          </h1>
          <p className="font-body text-slate/70 dark:text-white/50 text-lg max-w-lg leading-relaxed pt-2">
            {t('play.chooseAdventure')}
          </p>
        </motion.div>
      </header>

      {/* ── Bento Grid ── */}
      <main ref={gridRef} className="max-w-[1200px] mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* ── Row 1: Featured Game (2-col) + Daily Goal (1-col) ── */}
          {featuredGame && (
            <motion.div
              className="md:col-span-2"
              variants={fadeUp}
              initial="hidden"
              animate={gridInView ? 'show' : 'hidden'}
              custom={0}
            >
              <TiltCard tiltAmount={2} className="h-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <Link href={`/play/${featuredGame[0]}`} className="block h-full group">
                  <div className="bg-white dark:bg-[#2D3142] h-full flex flex-col">
                    <div className={`h-[300px] relative overflow-hidden bg-gradient-to-br ${getGradient(featuredGame[0])} flex-shrink-0`}>
                      <img src={`/illustrations/shared/${featuredGame[0]}.png`} alt={featuredGame[1].name} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase border border-white/10 shadow-sm">
                          Featured
                        </span>
                        <GameTechBadge slug={featuredGame[0]} overlay />
                      </div>
                    </div>

                    <div className="p-8 md:p-10 flex flex-col flex-1 justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-body font-bold uppercase tracking-widest ${DIFFICULTY_MAP[featuredGame[0]]?.variant}`}>
                            {DIFFICULTY_MAP[featuredGame[0]]?.label}
                          </span>
                          {recommendedGames.includes(featuredGame[0]) && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-[#C2956B]/15 text-[#C2956B] tracking-widest uppercase">
                              <Star size={10} />
                              {t('play.recommended')}
                            </span>
                          )}
                        </div>
                        <h2 className="font-heading italic text-3xl md:text-4xl text-navy dark:text-white leading-tight">
                          {featuredGame[1].name}
                        </h2>
                        <p className="font-body text-slate/70 dark:text-white/50 text-base leading-relaxed max-w-md">
                          {EDITORIAL_COPY[featuredGame[0]] || featuredGame[1].description}
                        </p>
                      </div>
                      <div className="mt-8 flex items-center gap-2 text-sky font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                        <span>Play Now</span>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          )}

          {/* ── Daily Goal Card ── */}
          {dailyGoalGame && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate={gridInView ? 'show' : 'hidden'}
              custom={1}
            >
              <TiltCard tiltAmount={3} className="h-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <Link href={`/play/${dailyGoalGame[0]}`} className="block h-full group">
                  <div className="bg-white dark:bg-[#2D3142] h-full flex flex-col">
                    <div className={`h-[300px] relative overflow-hidden bg-gradient-to-br ${getGradient(dailyGoalGame[0])} flex-shrink-0`}>
                      <img src={`/illustrations/shared/${dailyGoalGame[0]}.png`} alt={dailyGoalGame[1].name} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold tracking-widest uppercase shadow-sm border border-white/10">
                          Today's Goal
                        </span>
                        <GameTechBadge slug={dailyGoalGame[0]} overlay />
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 flex flex-col flex-1 justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading italic text-2xl text-navy dark:text-white">
                            {dailyGoalGame[1].name}
                          </h3>
                          {recommendedGames.includes(dailyGoalGame[0]) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C2956B]/15 text-[#C2956B]">
                              <Star size={9} />
                              Rec
                            </span>
                          )}
                        </div>
                        <p className="font-body text-slate/70 dark:text-white/50 text-sm leading-relaxed line-clamp-2">
                          {dailyGoalGame[1].description}
                        </p>
                      </div>
                      <MagneticButton className="mt-8 w-full bg-[#F5F1EB] dark:bg-white/5 text-navy dark:text-white py-3 rounded-xl font-body text-sm font-medium transition-colors duration-500 hover:bg-teal/10">
                        Accept Challenge
                      </MagneticButton>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          )}

          {/* ── Row 2: Game cards ── */}
          {rowGames.map(([slug, config], i) => {
            const difficulty = DIFFICULTY_MAP[slug];
            const isRecommended = recommendedGames.includes(slug);

            return (
              <motion.div
                key={slug}
                variants={fadeUp}
                initial="hidden"
                animate={gridInView ? 'show' : 'hidden'}
                custom={i + 2}
              >
                <TiltCard tiltAmount={4} className="h-full rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <Link href={`/play/${slug}`} className="block h-full group">
                    <div className="bg-white dark:bg-[#2D3142] min-h-[320px] flex flex-col h-full">
                      <div className={`h-56 relative overflow-hidden bg-gradient-to-br flex-shrink-0 ${getGradient(slug)}`}>
                        <img src={`/illustrations/shared/${slug}.png`} alt={config.name} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-4 left-4 flex gap-2">
                          {difficulty && (
                            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white/90 text-[10px] font-bold tracking-widest uppercase shadow-sm border border-white/10">
                              {difficulty.label}
                            </span>
                          )}
                          <GameTechBadge slug={slug} overlay />
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-1 justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-heading italic text-2xl text-navy dark:text-white">
                              <TextScramble text={config.name} duration={600} delay={i * 100} />
                            </h4>
                            {isRecommended && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C2956B]/15 text-[#C2956B]">
                                <Star size={9} />
                                {t('play.recommended')}
                              </span>
                            )}
                          </div>
                          <p className="font-body text-slate/70 dark:text-white/50 text-sm leading-relaxed line-clamp-2">
                            {EDITORIAL_COPY[slug] || config.description}
                          </p>
                        </div>

                        <div className="pt-6 mt-auto">
                          <div className="flex items-center gap-2 text-sky dark:text-sky font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                            <span>{slug === 'word-garden' ? 'Start Planting' : slug === 'rhythm-river' ? 'Dive In' : slug === 'emotion-echo' ? 'Join Circus' : slug === 'reader' ? 'Start Reading' : 'Play Now'}</span>
                            <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </motion.div>
            );
          })}

          {/* ── Row 3: Full-width Banner (Tongue Gym) ── */}
          {bannerGame && (
            <motion.div
              className={`md:col-span-3 ${!screeningDone ? 'mb-4' : ''}`}
              variants={fadeUp}
              initial="hidden"
              animate={gridInView ? 'show' : 'hidden'}
              custom={6}
            >
              <TiltCard tiltAmount={2}>
                <Link href={`/play/${bannerGame[0]}`} className="block group">
                  <div className="rounded-2xl bg-[#38336a] text-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] relative">
                    {/* subtle ambient blobs — no images, no disconnect */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-violet/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 p-8 md:p-12 space-y-5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GameTechBadge slug={bannerGame[0]} overlay />
                      </div>
                      <h2 className="font-heading italic text-3xl md:text-5xl text-white">
                        {bannerGame[1].name}
                      </h2>
                      <p className="font-body text-white/80 text-lg max-w-xl">
                        {EDITORIAL_COPY[bannerGame[0]] || bannerGame[1].description}
                      </p>
                      {recommendedGames.includes(bannerGame[0]) && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 shadow-sm border border-white/10 uppercase tracking-widest text-white">
                          <Star size={11} />
                          {t('play.recommended')}
                        </span>
                      )}
                      <div>
                        <MagneticButton className="bg-white text-navy px-8 py-3 rounded-xl font-body text-sm font-semibold inline-flex items-center gap-3 transition-all duration-500 mt-2">
                          {t('play.playNow')}
                          <ArrowRight size={16} />
                        </MagneticButton>
                      </div>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          )}

          {/* ── Row 4: Screening Banner ── */}
          {!screeningDone && (
            <motion.div
              className="md:col-span-3"
              variants={fadeUp}
              initial="hidden"
              animate={gridInView ? 'show' : 'hidden'}
              custom={7}
            >
              <TiltCard tiltAmount={2}>
                <Link href="/screening" className="block group">
                  <div className="rounded-2xl bg-[#61549b] text-white overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex flex-col md:flex-row items-center transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]">
                    <div className="p-8 md:p-12 flex-1 space-y-5">
                      <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-[10px] uppercase font-body font-bold tracking-widest">
                          Personalized Path
                        </span>
                      </div>
                      <h2 className="font-heading italic text-3xl md:text-4xl text-white">
                        {t('play.takeScreeningFirst')}
                      </h2>
                      <p className="font-body text-white/80 text-lg max-w-xl">
                        {t('play.personalizedRecs')}
                      </p>
                      <MagneticButton className="bg-white text-[#61549b] px-8 py-3 rounded-xl font-body text-sm font-semibold inline-flex items-center gap-3 transition-all duration-500">
                        Start Screening
                        <Stethoscope size={16} />
                      </MagneticButton>
                    </div>
                    <div className="relative w-full md:w-[400px] h-48 md:h-64 overflow-hidden opacity-30">
                      <span className="text-8xl w-full h-full flex items-center justify-center"><Stethoscope size={64}/></span>
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.div>
          )}

          {/* ── Recommended banner (if screening done) ── */}
          {screeningDone && recommendedGames.length > 0 && (
            <motion.div
              className="md:col-span-3 mt-4"
              variants={fadeUp}
              initial="hidden"
              animate={gridInView ? 'show' : 'hidden'}
              custom={7}
            >
              <div className="bg-[#C2956B]/8 dark:bg-[#C2956B]/10 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 text-center">
                <Star size={18} className="text-[#C2956B] flex-shrink-0" />
                <p className="font-body text-sm text-[#C2956B] font-medium">
                  {t('play.recommendedBanner')}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
