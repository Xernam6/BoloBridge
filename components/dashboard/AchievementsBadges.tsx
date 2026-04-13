'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  Trophy,
  Star,
  Flame,
  Music,
  Flower2,
  BookOpen,
  Zap,
  Target,
  Heart,
  Sparkles,
  Lock,
  Check,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Badge definitions with watercolor art + unlock criteria             */
/* ------------------------------------------------------------------ */

interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  watercolor: string;
  category: 'milestone' | 'streak' | 'mastery' | 'explorer';
  requirement: string;
  checkUnlocked: (state: StoreState) => boolean;
  getProgress: (state: StoreState) => { current: number; target: number };
}

export interface StoreState {
  totalExercises: number;
  soundsMastered: string[];
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: number;
  completedModules: string[];
  assessmentResults: number;
  dailyChallengeResults: number;
}

const ACHIEVEMENTS: AchievementBadge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Complete your first exercise',
    icon: <Flower2 size={20} />,
    watercolor: '/design-assets/stitchimgages/flowering_plant_growing_out_of_a_speech_bubble_illustration.png',
    category: 'milestone',
    requirement: '1 exercise',
    checkUnlocked: (s) => s.totalExercises >= 1,
    getProgress: (s) => ({ current: Math.min(s.totalExercises, 1), target: 1 }),
  },
  {
    id: 'getting-warmed-up',
    name: 'Warmed Up',
    description: 'Complete 10 exercises',
    icon: <Zap size={20} />,
    watercolor: '/design-assets/stitchimgages/warm_golden_sunset_watercolor_textures.png',
    category: 'milestone',
    requirement: '10 exercises',
    checkUnlocked: (s) => s.totalExercises >= 10,
    getProgress: (s) => ({ current: Math.min(s.totalExercises, 10), target: 10 }),
  },
  {
    id: 'dedicated-learner',
    name: 'Dedicated',
    description: '50 exercises total',
    icon: <Star size={20} />,
    watercolor: '/design-assets/stitchimgages/soft_watercolor_golden_star_on_white_background.png',
    category: 'milestone',
    requirement: '50 exercises',
    checkUnlocked: (s) => s.totalExercises >= 50,
    getProgress: (s) => ({ current: Math.min(s.totalExercises, 50), target: 50 }),
  },
  {
    id: 'century-club',
    name: 'Century Club',
    description: '100 exercises',
    icon: <Trophy size={20} />,
    watercolor: '/design-assets/stitchimgages/abstract_trophy_shape_with_sunbeams_in_golden_and_camel_tone.png',
    category: 'milestone',
    requirement: '100 exercises',
    checkUnlocked: (s) => s.totalExercises >= 100,
    getProgress: (s) => ({ current: Math.min(s.totalExercises, 100), target: 100 }),
  },
  {
    id: 'three-day-streak',
    name: 'Consistent',
    description: '3-day practice streak',
    icon: <Flame size={20} />,
    watercolor: '/design-assets/stitchimgages/warm_sunset_light_casting_soft_shadows_on_paper.png',
    category: 'streak',
    requirement: '3-day streak',
    checkUnlocked: (s) => s.longestStreak >= 3,
    getProgress: (s) => ({ current: Math.min(s.longestStreak, 3), target: 3 }),
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: '7 days in a row',
    icon: <Flame size={20} />,
    watercolor: '/design-assets/stitchimgages/abstract_watercolor_waves_in_sage_teal.png',
    category: 'streak',
    requirement: '7-day streak',
    checkUnlocked: (s) => s.longestStreak >= 7,
    getProgress: (s) => ({ current: Math.min(s.longestStreak, 7), target: 7 }),
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: '30 days of practice',
    icon: <Heart size={20} />,
    watercolor: '/design-assets/stitchimgages/soft_lavender_and_coral_watercolor_flower_clusters.png',
    category: 'streak',
    requirement: '30-day streak',
    checkUnlocked: (s) => s.longestStreak >= 30,
    getProgress: (s) => ({ current: Math.min(s.longestStreak, 30), target: 30 }),
  },
  {
    id: 'sound-explorer',
    name: 'Sound Explorer',
    description: 'Master 5 sounds',
    icon: <Music size={20} />,
    watercolor: '/design-assets/stitchimgages/abstract_colorful_sound_wave_patterns_and_geometric_shapes_o.png',
    category: 'mastery',
    requirement: '5 sounds',
    checkUnlocked: (s) => s.soundsMastered.length >= 5,
    getProgress: (s) => ({ current: Math.min(s.soundsMastered.length, 5), target: 5 }),
  },
  {
    id: 'phoneme-pro',
    name: 'Phoneme Pro',
    description: 'Master 10 sounds',
    icon: <Target size={20} />,
    watercolor: '/design-assets/stitchimgages/abstract_vibrating_sound_waves_and_bubbles_in_warm_coral_ton.png',
    category: 'mastery',
    requirement: '10 sounds',
    checkUnlocked: (s) => s.soundsMastered.length >= 10,
    getProgress: (s) => ({ current: Math.min(s.soundsMastered.length, 10), target: 10 }),
  },
  {
    id: 'articulation-ace',
    name: 'Articulation Ace',
    description: 'Master 15 sounds',
    icon: <Sparkles size={20} />,
    watercolor: '/design-assets/stitchimgages/bright_watercolor_parrot_illustration.png',
    category: 'mastery',
    requirement: '15 sounds',
    checkUnlocked: (s) => s.soundsMastered.length >= 15,
    getProgress: (s) => ({ current: Math.min(s.soundsMastered.length, 15), target: 15 }),
  },
  {
    id: 'screening-complete',
    name: 'Health Check',
    description: 'First screening',
    icon: <Target size={20} />,
    watercolor: '/design-assets/stitchimgages/stethoscope_made_of_flowers_in_warm_teal_and_camel_tones.png',
    category: 'explorer',
    requirement: '1 screening',
    checkUnlocked: (s) => s.assessmentResults >= 1,
    getProgress: (s) => ({ current: Math.min(s.assessmentResults, 1), target: 1 }),
  },
  {
    id: 'knowledge-seeker',
    name: 'Scholar',
    description: '5 learning modules',
    icon: <BookOpen size={20} />,
    watercolor: '/design-assets/stitchimgages/illustration_of_an_open_magic_book_with_stars.png',
    category: 'explorer',
    requirement: '5 modules',
    checkUnlocked: (s) => s.completedModules.length >= 5,
    getProgress: (s) => ({ current: Math.min(s.completedModules.length, 5), target: 5 }),
  },
  {
    id: 'daily-champion',
    name: 'Daily Champ',
    description: '5 daily challenges',
    icon: <Zap size={20} />,
    watercolor: '/design-assets/stitchimgages/abstract_watercolor_puzzle_pieces_in_soft_tones.png',
    category: 'explorer',
    requirement: '5 challenges',
    checkUnlocked: (s) => s.dailyChallengeResults >= 5,
    getProgress: (s) => ({ current: Math.min(s.dailyChallengeResults, 5), target: 5 }),
  },
];

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  milestone: { label: 'Milestones', color: 'text-coral' },
  streak: { label: 'Streaks', color: 'text-teal' },
  mastery: { label: 'Mastery', color: 'text-violet' },
  explorer: { label: 'Explorer', color: 'text-success' },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function AchievementsBadges({ storeState }: { storeState: StoreState }) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.checkUnlocked(storeState)).length;
  const totalCount = ACHIEVEMENTS.length;
  const overallPercent = Math.round((unlockedCount / totalCount) * 100);

  const categories = ['milestone', 'streak', 'mastery', 'explorer'] as const;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet/10 dark:bg-violet/20 rounded-full flex items-center justify-center">
            <Trophy size={20} className="text-violet" />
          </div>
          <div>
            <h2 className="font-heading italic text-2xl text-violet">Badges</h2>
            <p className="text-sm text-[#64748B] dark:text-white/60 font-body">
              {unlockedCount}/{totalCount} unlocked
            </p>
          </div>
        </div>

        {/* Mini progress ring */}
        <div className="relative w-14 h-14">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7" className="text-violet/10" />
            <motion.circle
              cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="7"
              className="text-violet"
              strokeLinecap="round"
              strokeDasharray={251}
              initial={{ strokeDashoffset: 251 }}
              animate={{ strokeDashoffset: 251 - (251 * overallPercent) / 100 }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-heading italic text-navy dark:text-white">
            {overallPercent}%
          </span>
        </div>
      </div>

      {/* Badge categories */}
      {categories.map((cat) => {
        const catBadges = ACHIEVEMENTS.filter((a) => a.category === cat);
        const catInfo = CATEGORY_LABELS[cat];

        return (
          <div key={cat} className="mb-6 last:mb-0">
            <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${catInfo.color}`}>
              {catInfo.label}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {catBadges.map((badge) => {
                const unlocked = badge.checkUnlocked(storeState);
                const prog = badge.getProgress(storeState);
                const pct = Math.round((prog.current / prog.target) * 100);

                return (
                  <div
                    key={badge.id}
                    className={`
                      relative overflow-hidden rounded-xl border p-3.5
                      transition-all duration-500
                      ${unlocked
                        ? 'bg-white dark:bg-[#1E1E36] border-teal/15'
                        : 'bg-white/40 dark:bg-white/3 border-gray-200/20 dark:border-white/5'
                      }
                    `}
                  >
                    {/* Subtle watercolor bg */}
                    <div className={`absolute -right-4 -top-4 w-20 h-20 ${unlocked ? 'opacity-10' : 'opacity-[0.04]'}`}>
                      <Image
                        src={badge.watercolor}
                        alt=""
                        width={80}
                        height={80}
                        className="object-cover rounded-full"
                      />
                    </div>

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`
                        w-9 h-9 rounded-lg flex items-center justify-center mb-2
                        ${unlocked
                          ? 'bg-teal/10 text-teal'
                          : 'bg-gray-100 dark:bg-white/5 text-slate/25 dark:text-white/12'
                        }
                      `}>
                        {unlocked ? badge.icon : <Lock size={16} />}
                      </div>

                      <h3 className={`font-heading italic text-xs mb-0.5 ${unlocked ? 'text-navy dark:text-white' : 'text-slate/35 dark:text-white/18'}`}>
                        {badge.name}
                      </h3>
                      <p className={`text-[10px] font-body mb-2 ${unlocked ? 'text-muted' : 'text-slate/25 dark:text-white/10'}`}>
                        {badge.description}
                      </p>

                      {/* Progress bar */}
                      <div className="flex items-center justify-between mb-1">
                        {unlocked ? (
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold text-success">
                            <Check size={9} /> Done
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate/35">
                            {prog.current}/{prog.target}
                          </span>
                        )}
                      </div>
                      <div className="h-1 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${unlocked ? 'bg-success' : 'bg-teal/30'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
