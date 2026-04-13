'use client';

import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { motion, useInView, useSpring, useTransform, useScroll } from 'framer-motion';
import {
  BookOpen,
  Gamepad2,
  BarChart3,
  ArrowRight,
  Heart,
  ChevronRight,
  Stethoscope,
  Shield,
  Globe as GlobeIcon,
  Mic,
  UserPlus,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { AuroraBackground } from '@/components/ui/AuroraBackground';
import { BlurFade } from '@/components/ui/BlurFade';
import { MorphingText } from '@/components/ui/MorphingText';
import { Marquee } from '@/components/ui/Marquee';
import { WaveDivider } from '@/components/ui/WaveDivider';
import { TiltCard } from '@/components/ui/TiltCard';

const InteractiveGlobe = lazy(() =>
  import('@/components/ui/Globe').then((m) => ({ default: m.InteractiveGlobe }))
);

/* ------------------------------------------------------------------ */
/*  Animated spring counter                                            */
/* ------------------------------------------------------------------ */
function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  const spring = useSpring(0, {
    damping: 30,
    stiffness: 50,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    Math.floor(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView && !hasAnimated) {
      spring.set(value);
      setHasAnimated(true);
    }
  }, [isInView, value, spring, hasAnimated]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-24 sm:py-32 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero — Aurora Background + Blur Fade + Morphing Text               */
/* ------------------------------------------------------------------ */
function Hero() {
  const { t } = useTranslation();

  const morphTexts = [
    t('home.heroWord1'),
    t('home.heroWord2'),
    t('home.heroWord3'),
    t('home.heroWord4'),
    t('home.heroWord5'),
    t('home.heroWord6'),
    t('home.heroWord7'),
    t('home.heroWord8'),
    t('home.heroWord9'),
    t('home.heroWord10'),
  ];

  return (
    <AuroraBackground className="min-h-screen -mt-16 bg-[#2D3142] dark:bg-[#1A1A2E]">
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle pill badge */}
        <BlurFade delay={0.2} inView={false}>
          <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 bg-teal-light rounded-full" />
            <span className="text-sm font-body font-medium text-white/60">
              Speech Wellness for Every Child
            </span>
          </div>
        </BlurFade>

        {/* Morphing text heading */}
        <BlurFade delay={0.4} inView={false}>
          <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-[1.1] tracking-tight">
            Every Child Deserves
          </h1>
        </BlurFade>

        <BlurFade delay={0.6} inView={false}>
          <MorphingText
            texts={morphTexts}
            className="text-white mb-8"
          />
        </BlurFade>

        {/* Subtitle */}
        <BlurFade delay={0.8} inView={false}>
          <p className="font-body text-lg sm:text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-12 leading-relaxed">
            {t('home.subtitle')}
          </p>
        </BlurFade>

        {/* CTAs */}
        <BlurFade delay={1.0} inView={false}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/play">
              <MagneticButton className="rounded-full bg-teal text-white font-body font-semibold py-3.5 px-10 text-lg flex items-center gap-2.5 hover:bg-teal-dark transition-colors duration-300">
                {t('home.getStarted') || 'Get Started'}
                <ArrowRight className="w-5 h-5" />
              </MagneticButton>
            </Link>
            <Link href="/about">
              <MagneticButton className="rounded-full bg-white/8 backdrop-blur-sm text-white/80 font-body font-semibold py-3.5 px-10 text-lg border border-white/10 hover:bg-white/12 transition-colors duration-300">
                {t('home.learnMore')}
              </MagneticButton>
            </Link>
          </div>
        </BlurFade>

        {/* Trust indicators */}
        <BlurFade delay={1.2} inView={false}>
          <div className="relative z-20 flex flex-wrap items-center justify-center gap-8 mt-16">
            {[
              { icon: Shield, label: 'Research-Based' },
              { icon: GlobeIcon, label: '6 Languages' },
              { icon: Heart, label: 'Built with Care' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-white/70"
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-body font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </BlurFade>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream dark:from-cloud to-transparent" />
    </AuroraBackground>
  );
}

/* ------------------------------------------------------------------ */
/*  Four Pillars — Calm hover-reveal list                              */
/* ------------------------------------------------------------------ */
const pillars = [
  {
    titleKey: 'home.screenCard' as const,
    descKey: 'home.screenCardDesc' as const,
    href: '/screening',
    icon: Stethoscope,
    accentColor: 'bg-teal',
    textColor: 'text-teal',
    bgLight: 'bg-teal/10',
  },
  {
    titleKey: 'home.learnCard' as const,
    descKey: 'home.learnCardDesc' as const,
    href: '/learn',
    icon: BookOpen,
    accentColor: 'bg-success',
    textColor: 'text-success',
    bgLight: 'bg-success/10',
  },
  {
    titleKey: 'home.playCard' as const,
    descKey: 'home.playCardDesc' as const,
    href: '/play',
    icon: Gamepad2,
    accentColor: 'bg-sky',
    textColor: 'text-sky',
    bgLight: 'bg-sky/10',
  },
  {
    titleKey: 'home.trackCard' as const,
    descKey: 'home.trackCardDesc' as const,
    href: '/dashboard',
    icon: BarChart3,
    accentColor: 'bg-amber',
    textColor: 'text-amber',
    bgLight: 'bg-amber/10',
  },
];

function FourPillars() {
  const { t } = useTranslation();

  return (
    <section className="py-24 sm:py-32 bg-cream dark:bg-cloud overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-10">
        {/* Header — left-aligned */}
        <BlurFade>
          <div className="mb-20">
            <span className="block font-body text-xs font-bold uppercase tracking-[0.3em] text-teal mb-4">
              Foundation
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-navy dark:text-white">
              {t('home.fourPillars')}
            </h2>
          </div>
        </BlurFade>

        {/* Staggered 4-column card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            const isOffset = i === 1 || i === 3;
            return (
              <BlurFade key={pillar.titleKey} delay={0.08 + i * 0.1}>
                <Link href={pillar.href} className="block">
                  <TiltCard tiltAmount={5} className={isOffset ? 'lg:mt-14' : ''}>
                    <motion.div
                      className="relative flex flex-col h-[360px] sm:h-[400px] p-8 bg-white dark:bg-ice rounded-2xl border border-gray-100/80 dark:border-white/5 overflow-hidden cursor-pointer"
                      whileHover={{ y: -8 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                    >
                      {/* Icon box */}
                      <div className={`w-16 h-16 rounded-xl ${pillar.bgLight} flex items-center justify-center mb-6 flex-shrink-0`}>
                        <Icon className={`w-7 h-7 ${pillar.textColor}`} />
                      </div>

                      {/* Title */}
                      <h3 className="font-heading text-2xl font-bold italic text-navy dark:text-white mb-4 leading-snug">
                        {t(pillar.titleKey)}
                      </h3>

                      {/* Description */}
                      <p className="font-body text-muted text-sm leading-relaxed flex-1">
                        {t(pillar.descKey)}
                      </p>

                      {/* Bottom accent bar */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1.5 ${pillar.accentColor} rounded-b-2xl`} />
                    </motion.div>
                  </TiltCard>
                </Link>
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Statistics — Muted cards with counters                             */
/* ------------------------------------------------------------------ */
function StatsBanner() {
  const { t } = useTranslation();

  const stats = [
    { end: 8, suffix: 'M+', label: t('home.stat1Label') },
    { end: 90, suffix: '%', label: t('home.stat2Label') },
    { end: 6, suffix: '', label: t('home.stat3Label') },
  ];

  return (
    <section className="relative py-24 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-[#2D3142] dark:bg-[#1A1A2E]" />

      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <BlurFade
              key={stat.label}
              delay={i * 0.15}
            >
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/8">
                <div className="font-heading text-5xl sm:text-6xl font-bold text-white mb-2 tracking-tight">
                  <AnimatedCounter value={stat.end} duration={2.2} />
                  <span className="text-teal-light">{stat.suffix}</span>
                </div>
                <p className="font-body text-white/40 text-sm">{stat.label}</p>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Global Impact — Interactive Globe                                  */
/* ------------------------------------------------------------------ */
function GlobalImpact() {
  const { t } = useTranslation();
  return (
    <Section className="bg-cream dark:bg-cloud">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        {/* Globe */}
        <BlurFade delay={0.2} className="flex-shrink-0">
          <div className="w-[300px] h-[300px] md:w-[380px] md:h-[380px]">
            <Suspense
              fallback={
                <div className="w-full h-full rounded-full bg-teal/8" />
              }
            >
              <InteractiveGlobe />
            </Suspense>
          </div>
        </BlurFade>

        {/* Content */}
        <div className="flex-1 text-center">
          <BlurFade delay={0.3}>
            <span className="inline-block font-body text-sm font-semibold text-teal uppercase tracking-widest mb-4">
              Closing the Gap
            </span>
          </BlurFade>
          <BlurFade delay={0.4}>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-navy dark:text-white mb-4">
              Built for the Families Left Behind
            </h2>
          </BlurFade>
          <BlurFade delay={0.5}>
            <p className="font-body text-muted text-lg leading-relaxed mb-6 max-w-lg mx-auto">
              Globally, an estimated 8 million children need speech-language support, yet the majority lack access to professional services. Waitlists stretch months, clinics concentrate in urban areas, and most families have no idea where to start.
            </p>
            <p className="font-body text-muted text-lg leading-relaxed mb-6 max-w-lg mx-auto">
              BoloBridge brings evidence-based screening and structured practice to phones and low-bandwidth connections, reaching families in underserved and multilingual communities who have never had access to professional support.
            </p>
          </BlurFade>
          <BlurFade delay={0.6}>
            <div className="flex flex-wrap gap-3 justify-center">
              {['English', 'Spanish', 'Hindi', 'Afrikaans', 'Bengali', 'Tagalog', 'Portuguese', 'Arabic', 'Russian', 'Vietnamese'].map((lang) => (
                <span
                  key={lang}
                  className="px-3 py-1 rounded-full bg-teal/8 text-teal dark:text-teal-light font-body text-sm font-medium border border-teal/10"
                >
                  {lang}
                </span>
              ))}
            </div>
          </BlurFade>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Screening CTA                                                      */
/* ------------------------------------------------------------------ */
function ScreeningCTA() {
  const { t } = useTranslation();

  return (
    <Section className="bg-mint dark:bg-cloud">
      <BlurFade>
      <div
        className="relative rounded-2xl overflow-hidden border border-gray-200/50 dark:border-white/5"
      >
        <div className="bg-white dark:bg-ice p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-teal/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal" />
              </div>
              <span className="text-xs font-body font-semibold bg-teal/8 text-teal px-3 py-1 rounded-full uppercase tracking-wide">
                {t('home.aiTriage')}
              </span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-navy dark:text-white mb-3">
              {t('home.screeningCtaTitle')}
            </h2>
            <p className="font-body text-muted text-base leading-relaxed mb-5">
              {t('home.screeningCtaDesc')}
            </p>
            <ul className="font-body text-muted text-sm space-y-2.5 mb-7">
              {[
                { key: 'home.screeningBullet1' as const, color: 'bg-teal' },
                { key: 'home.screeningBullet2' as const, color: 'bg-success' },
                { key: 'home.screeningBullet3' as const, color: 'bg-violet' },
              ].map((bullet) => (
                <li key={bullet.key} className="flex items-center gap-2.5">
                  <span className={`w-1.5 h-1.5 ${bullet.color} rounded-full flex-shrink-0`} />
                  {t(bullet.key)}
                </li>
              ))}
            </ul>
            <Link href="/screening">
              <MagneticButton className="inline-flex items-center gap-2 bg-teal text-white font-body font-semibold py-3 px-8 rounded-xl hover:bg-teal-dark transition-colors">
                <Stethoscope className="w-4 h-4" />
                {t('home.startScreening')}
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </Link>
          </div>

          {/* Voice preview visualization */}
          <div className="flex-shrink-0 w-64 h-64 rounded-2xl bg-[#2D3142] dark:bg-[#1A1A2E] flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                className="absolute rounded-full border border-teal/15"
                style={{ width: `${ring * 50 + 40}px`, height: `${ring * 50 + 40}px` }}
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.3, 0.1, 0.3],
                }}
                transition={{
                  duration: 3,
                  delay: ring * 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <motion.div
              className="relative z-10 w-14 h-14 rounded-xl bg-teal/20 flex items-center justify-center"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              <Mic className="w-6 h-6 text-teal-light" />
            </motion.div>
            <motion.p
              className="relative z-10 text-white/30 text-xs mt-4 font-body"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              Tap to preview
            </motion.p>
          </div>
        </div>
      </div>
      </BlurFade>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works — Interactive step cards with auto-advance             */
/* ------------------------------------------------------------------ */
const stepKeys = [
  {
    number: '1',
    titleKey: 'home.step1Title' as const,
    descKey: 'home.step1Desc' as const,
    icon: UserPlus,
    accent: 'bg-teal',
    accentText: 'text-teal',
  },
  {
    number: '2',
    titleKey: 'home.step2Title' as const,
    descKey: 'home.step2Desc' as const,
    icon: Stethoscope,
    accent: 'bg-violet',
    accentText: 'text-violet',
  },
  {
    number: '3',
    titleKey: 'home.step3Title' as const,
    descKey: 'home.step3Desc' as const,
    icon: GraduationCap,
    accent: 'bg-coral',
    accentText: 'text-coral',
  },
];

function HowItWorks() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  // Auto-advance every 4s while in view
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % stepKeys.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isInView, activeStep]);

  return (
    <Section id="how-it-works" className="bg-cream dark:bg-cloud">
      <BlurFade>
        <div className="text-center mb-16">
          <span className="inline-block font-body text-sm font-semibold text-violet uppercase tracking-widest mb-4">
            Simple Process
          </span>
          <h2 className="font-heading italic text-3xl sm:text-4xl md:text-5xl font-bold text-navy dark:text-white mb-4">
            {t('home.howItWorks')}
          </h2>
          <p className="font-body text-muted text-lg max-w-2xl mx-auto">
            {t('home.howItWorksDesc')}
          </p>
        </div>
      </BlurFade>

      <div ref={sectionRef} className="max-w-5xl mx-auto">
        {/* Desktop: horizontal step selector */}
        <div className="hidden md:flex items-center justify-center gap-0 mb-12">
          {stepKeys.map((step, i) => {
            const isActive = i === activeStep;
            return (
              <div key={step.titleKey} className="flex items-center">
                <button
                  onClick={() => setActiveStep(i)}
                  className={`relative flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 ${
                    isActive
                      ? 'bg-white dark:bg-ice shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                      : 'hover:bg-white/50 dark:hover:bg-ice/50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-body font-bold transition-all duration-500 ${
                      isActive
                        ? `${step.accent} text-white`
                        : 'bg-gray-200 dark:bg-white/10 text-muted'
                    }`}
                  >
                    {step.number}
                  </div>
                  <span
                    className={`font-body font-semibold text-sm transition-colors duration-500 ${
                      isActive ? 'text-navy dark:text-white' : 'text-muted'
                    }`}
                  >
                    {t(step.titleKey)}
                  </span>
                  {/* Progress bar under active step */}
                  {isActive && (
                    <motion.div
                      className={`absolute bottom-0 left-6 right-6 h-0.5 ${step.accent} rounded-full`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 4, ease: 'linear' }}
                      style={{ transformOrigin: 'left' }}
                      key={`progress-${i}-${activeStep}`}
                    />
                  )}
                </button>
                {/* Connector line */}
                {i < stepKeys.length - 1 && (
                  <div
                    className={`w-12 h-px transition-colors duration-500 ${
                      i < activeStep
                        ? 'bg-teal dark:bg-teal'
                        : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical step indicators */}
        <div className="flex md:hidden justify-center gap-3 mb-8">
          {stepKeys.map((step, i) => (
            <button
              key={step.titleKey}
              onClick={() => setActiveStep(i)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-body font-bold transition-all duration-500 ${
                i === activeStep
                  ? `${step.accent} text-white shadow-md`
                  : 'bg-gray-200 dark:bg-white/10 text-muted'
              }`}
            >
              {step.number}
            </button>
          ))}
        </div>

        {/* Active step card */}
        <div className="relative min-h-[280px] sm:min-h-[240px]">
          {stepKeys.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === activeStep;
            return (
              <motion.div
                key={step.titleKey}
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 20,
                  scale: isActive ? 1 : 0.97,
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className={`${isActive ? 'relative' : 'absolute inset-0 pointer-events-none'}`}
              >
                <TiltCard tiltAmount={4} className="w-full">
                  <div className="bg-white dark:bg-ice rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 sm:p-12 flex flex-col sm:flex-row items-start gap-8 overflow-hidden relative">
                    {/* Accent stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${step.accent}`} />

                    {/* Icon */}
                    <motion.div
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${step.accent}/10 flex items-center justify-center`}
                      animate={isActive ? { rotate: [0, -5, 5, 0] } : {}}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeInOut' }}
                    >
                      <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${step.accentText}`} />
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`${step.accent} text-white text-xs font-body font-bold px-2.5 py-1 rounded-full`}>
                          Step {step.number}
                        </span>
                      </div>
                      <h3 className="font-heading italic text-2xl sm:text-3xl font-bold text-navy dark:text-white mb-3">
                        {t(step.titleKey)}
                      </h3>
                      <p className="font-body text-muted text-base sm:text-lg leading-relaxed max-w-xl">
                        {t(step.descKey)}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  const { t } = useTranslation();

  return (
    <Section className="bg-cream dark:bg-cloud">
      <BlurFade>
      <div
        className="relative rounded-2xl overflow-hidden"
      >
        <div className="bg-[#2D3142] dark:bg-[#1A1A2E] relative">
          {/* Soft gradient orbs */}
          <div className="absolute top-10 left-[10%] w-40 h-40 bg-teal/10 rounded-full blur-[60px]" />
          <div className="absolute bottom-10 right-[15%] w-48 h-48 bg-violet/8 rounded-full blur-[60px]" />

          <div className="relative z-10 py-20 sm:py-28 px-6 sm:px-12 text-center">
            <BlurFade delay={0.1}>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                {t('home.startJourney')}
              </h2>
            </BlurFade>
            <BlurFade delay={0.2}>
              <p className="font-body text-white/40 text-lg sm:text-xl mb-10 max-w-2xl mx-auto">
                {t('home.startJourneyDesc')}
              </p>
            </BlurFade>
            <BlurFade delay={0.3}>
              <Link href="/profile">
                <MagneticButton className="rounded-full bg-white text-navy font-body font-semibold py-4 px-12 text-lg inline-flex items-center gap-2.5 hover:bg-white/90 transition-colors">
                  <Heart className="w-5 h-5 text-coral" />
                  {t('home.createProfile')}
                  <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </Link>
            </BlurFade>
            <BlurFade delay={0.4}>
              <p className="font-body text-white/25 text-sm mt-7">
                {t('home.noLoginRequired')}
              </p>
            </BlurFade>
          </div>
        </div>
      </div>
      </BlurFade>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <>
      <Hero />
      <GlobalImpact />
      <WaveDivider className="my-0" />
      <StatsBanner />
      <FourPillars />
      <WaveDivider className="my-0" />
      <ScreeningCTA />
      <HowItWorks />
      <Marquee text="BoloBridge" duration={25} />
      <FinalCTA />
    </>
  );
}
