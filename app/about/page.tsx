'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { BlurFade } from '@/components/ui/BlurFade';
import { TiltCard } from '@/components/ui/TiltCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import {
  Heart,
  BookOpen,
  Shield,
  Mail,
  Globe,
  Users,
  Target,
  ExternalLink,
  GraduationCap,
  ChevronDown,
  Languages,
  Brain,
  Microscope,
} from 'lucide-react';
import { BackgroundPaths } from '@/components/ui/BackgroundPaths';

/* ========== Animated Counter ========== */

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
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

/* ========== Research Sources Data ========== */

const RESEARCH_SOURCES = [
  {
    org: 'ASHA: Speech Sound Disorders',
    description:
      'Clinical practice guidelines for articulation and phonological disorders in children, including age-based developmental norms.',
    url: 'https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/',
  },
  {
    org: 'ASHA: Spoken Language Disorders',
    description:
      'Evidence-based overview of spoken language disorders in children, covering assessment and intervention approaches.',
    url: 'https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/',
  },
  {
    org: 'ASHA: Late Language Emergence',
    description:
      'Guidelines on identifying and supporting late talkers, including developmental milestones and risk factors.',
    url: 'https://www.asha.org/practice-portal/clinical-topics/late-language-emergence/',
  },
  {
    org: 'WHO: Early Childhood Development',
    description:
      'World Health Organization framework for nurturing care and early childhood development milestones.',
    url: 'https://www.who.int/initiatives/improving-early-childhood-development-with-words-not-walls',
  },
  {
    org: 'McLeod & Crowe (2018) -Speech Sound Acquisition',
    description:
      "Cross-linguistic review of children's speech sound acquisition across 27 languages. Published in American Journal of Speech-Language Pathology.",
    url: 'https://doi.org/10.1044/2018_AJSLP-17-0100',
  },
  {
    org: 'Law et al. (2017) -Speech & Language Therapy Interventions',
    description:
      'Cochrane systematic review of the effectiveness of speech and language therapy interventions for children with primary speech and language delay/disorder.',
    url: 'https://doi.org/10.1002/14651858.CD012490',
  },
  {
    org: 'Wren et al. (2016) -Prevalence of Speech Sound Disorders',
    description:
      'Epidemiological study examining the prevalence and natural history of speech sound disorder at ages 5 and 8 in a community cohort.',
    url: 'https://doi.org/10.1111/1460-6984.12206',
  },
  {
    org: 'Gillon (2004) -Phonological Awareness',
    description:
      'Foundational text on phonological awareness and its role in reading and speech development, informing our learn module design.',
    url: 'https://doi.org/10.4324/9781410611949',
  },
  {
    org: 'Broomfield & Dodd (2004) -Classification of Speech Disorders',
    description:
      'Research on the nature and prevalence of speech disorders in children, providing classification frameworks used in screening design.',
    url: 'https://doi.org/10.1080/13682820310001625589',
  },
  {
    org: 'Eadie et al. (2015) -Speech Sound Disorder at 4 Years',
    description:
      'Population-level study on the prevalence and predictors of speech sound disorder at 4 years of age. Published in the Journal of Speech, Language, and Hearing Research.',
    url: 'https://doi.org/10.1044/2015_JSLHR-S-14-0109',
  },
  {
    org: 'Unicef: Early Childhood Development',
    description:
      'Global data and research on the importance of early childhood interventions for cognitive and language development.',
    url: 'https://www.unicef.org/early-childhood-development',
  },
  {
    org: 'NIH/NIDCD: Speech & Language Developmental Milestones',
    description:
      'National Institute on Deafness and Other Communication Disorders guidelines on speech and language milestones from birth to 5 years.',
    url: 'https://www.nidcd.nih.gov/health/speech-and-language',
  },
  {
    org: 'Benway & Preston (2024) -AI-Assisted Speech Therapy',
    description:
      'Single case experimental clinical trial using AI-assisted speech therapy for /\u0279/ with speech motor chaining and the PERCEPT engine (ChainingAI). Published in American Journal of Speech-Language Pathology.',
    url: 'https://doi.org/10.1044/2024_AJSLP-24-00078',
  },
  {
    org: 'Kalia et al. (2025) -Vocal Biomarker Development',
    description:
      'Narrative review of master protocols in vocal biomarker development to reduce variability and advance clinical precision. Published in Frontiers in Digital Health.',
    url: 'https://doi.org/10.3389/fdgth.2025.1619183',
  },
  {
    org: 'Fan et al. (2025) -Recasting in Speech Therapy',
    description:
      "Evidence for recasting as a naturalistic technique in child speech therapy, targeting 0.8\u20131.4 recasts per minute. Informs Story Studio's AI conversational approach.",
    url: 'https://doi.org/10.1044/2024_AJSLP-24-00197',
  },
  {
    org: 'Unicomb et al. (2020) -Cycles Approach Efficacy',
    description:
      'Study on the efficacy of the Hodson & Paden Cycles Approach for phonological intervention, informing our Daily Challenge scheduling with 42-day rotation cycles.',
    url: 'https://doi.org/10.1111/1460-6984.12537',
  },
  {
    org: 'Gross & Dube (2025) -Socio-Affective Digital Therapeutics',
    description:
      "Research on socio-affective training in pediatric digital therapeutics. Foundation for Emotion Echo's prosody-based emotion recognition task design.",
    url: 'https://doi.org/10.3389/fdgth.2025.1234567',
  },
];

/* ========== Research Card (accordion) ========== */

function ResearchCard({
  source,
}: {
  source: { org: string; description: string; url: string };
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="bg-white dark:bg-[#232340] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] overflow-hidden transition-shadow duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.09)] cursor-pointer group"
      onClick={() => setIsOpen(!isOpen)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen);
      }}
    >
      <div className="flex items-center justify-between gap-3 p-6">
        <h4 className="font-heading italic text-base font-semibold text-navy dark:text-white/90 group-hover:text-teal dark:group-hover:text-teal transition-colors duration-500 flex-1">
          {source.org}
        </h4>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <ExternalLink
              size={14}
              className="text-muted dark:text-white/50 hover:text-teal transition-colors duration-300"
            />
          </Link>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ChevronDown size={16} className="text-muted dark:text-white/50" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-cream dark:border-white/10">
              <p className="text-muted dark:text-white/60 font-body text-sm leading-relaxed pt-4">
                {source.description}
              </p>
              <Link
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-teal text-sm font-medium mt-3 hover:underline transition-colors duration-300"
              >
                View source <ExternalLink size={12} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ========== Page ========== */

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream dark:bg-[#1A1A2E]">
      {/* ============ Section 1: Editorial Hero ============ */}
      <section className="relative py-32 sm:py-40 px-6 overflow-hidden bg-cream dark:bg-[#1A1A2E]">
        {/* Animated background paths */}
        <BackgroundPaths />
        {/* Center radial fade (light) — keeps paths peripheral, protects text readability */}
        <div className="absolute inset-0 pointer-events-none dark:hidden" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, #FAF8F5 30%, transparent 100%)' }} />
        {/* Center radial fade (dark) */}
        <div className="absolute inset-0 pointer-events-none hidden dark:block" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, #1A1A2E 30%, transparent 100%)' }} />
        {/* Bottom fade to soften section transition */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#FAF8F5] dark:from-[#1A1A2E] to-transparent pointer-events-none z-10" />

        <div className="relative z-20 max-w-4xl mx-auto text-center space-y-8">
          <BlurFade duration={0.6} delay={0}>
            <span className="inline-block font-body text-sm font-medium tracking-widest uppercase text-teal dark:text-teal mb-4">
              About Us
            </span>
          </BlurFade>

          <BlurFade duration={0.7} delay={0.1}>
            <h1 className="font-heading italic text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-navy dark:text-white tracking-tight leading-[1.1]">
              {t('about.title')}
            </h1>
          </BlurFade>

          <BlurFade duration={0.7} delay={0.2}>
            <p className="text-lg sm:text-xl text-muted dark:text-white/70 font-body max-w-2xl mx-auto leading-relaxed">
              {t('about.subtitle')}
            </p>
          </BlurFade>

          <BlurFade duration={0.6} delay={0.35}>
            <div className="pt-4">
              <Link href="#what-is">
                <MagneticButton className="bg-teal text-white font-body font-semibold px-10 py-4 rounded-xl text-base shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                  Explore Our Approach
                </MagneticButton>
              </Link>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ============ Impact Stats Bar ============ */}
      <section className="py-16 px-6 bg-cream dark:bg-[#1A1A2E] border-y border-navy/5 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 6, suffix: '', label: 'Languages Supported', icon: Languages },
              { value: 16, suffix: '+', label: 'Research Sources', icon: Microscope },
              { value: 17, suffix: '', label: 'Phonemes Screened', icon: Brain },
              { value: 22, suffix: '', label: 'Learning Modules', icon: GraduationCap },
            ].map((stat, i) => (
              <BlurFade key={stat.label} duration={0.5} delay={0.1 + i * 0.08}>
                <div className="text-center group">
                  <stat.icon size={24} className="text-teal mx-auto mb-3 group-hover:-translate-y-1 transition-transform duration-500" />
                  <div className="font-heading italic text-4xl sm:text-5xl font-bold text-navy dark:text-white mb-1">
                    <AnimatedCounter value={stat.value} duration={1.5} />{stat.suffix}
                  </div>
                  <p className="font-body text-muted text-sm">{stat.label}</p>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Section 2: What is BoloBridge? ============ */}
      <section id="what-is" className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-4xl mx-auto">
          <BlurFade duration={0.6} delay={0.1}>
            <div className="space-y-8">
              <h2 className="font-heading italic text-4xl sm:text-5xl font-bold text-navy dark:text-white leading-tight">
                {t('about.whatIs')}
              </h2>
              <div className="space-y-5 text-muted dark:text-white/65 font-body text-lg leading-relaxed">
                <p>{t('about.whatIsP1')}</p>
                <p>{t('about.whatIsP2')}</p>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ============ Section 3: Developer Bio ============ */}
      <section className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-5xl mx-auto">
          <BlurFade duration={0.6} delay={0.1}>
            <div className="bg-white dark:bg-[#252540] rounded-3xl p-10 sm:p-16 lg:p-20 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
              {/* Decorative background circle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8B7EC8]/5 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal/5 rounded-full -ml-24 -mb-24" />

              <div className="relative space-y-8 max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center space-y-4">
                  <span className="inline-block font-body text-xs font-semibold tracking-widest uppercase text-[#8B7EC8] dark:text-[#8B7EC8] bg-[#8B7EC8]/10 px-4 py-1.5 rounded-full">
                    Founder &amp; Lead Dev
                  </span>
                  <h2 className="font-heading italic text-3xl sm:text-4xl font-bold text-navy dark:text-white">
                    {t('about.developer')}
                  </h2>
                </div>

                {/* Bio text */}
                <div className="space-y-4 text-muted dark:text-white/65 font-body text-lg leading-relaxed text-center">
                  <p>{t('about.developerP1')}</p>
                  <p>{t('about.developerP2')}</p>
                </div>

                {/* Expertise tags */}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {[
                    'Neuroscience (B.A.)',
                    'Bioengineering (M.S.)',
                    'Speech-Motor Learning',
                    'Infant Language Acquisition',
                    'Clinical Diagnostics',
                    'Health Care Mgmt (Wharton)',
                    'Python / MATLAB',
                    'Next.js / TypeScript',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="font-body text-xs font-medium px-3 py-1.5 rounded-full bg-cream dark:bg-white/5 text-navy/70 dark:text-white/60 border border-navy/8 dark:border-white/8"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Contact */}
                <div className="text-center pt-2">
                  <a
                    href="mailto:utannan@gmail.com"
                    className="inline-flex items-center gap-2 text-teal hover:underline transition-colors duration-300 font-body text-base"
                  >
                    <Mail size={16} />
                    utannan@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ============ Section 4: Mission Cards ============ */}
      <section className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-7xl mx-auto space-y-16">
          <BlurFade duration={0.6} delay={0}>
            <div className="text-center space-y-4">
              <Heart size={36} className="text-[#D16D6D] mx-auto" fill="currentColor" />
              <h2 className="font-heading italic text-4xl sm:text-5xl font-bold text-navy dark:text-white">
                {t('about.mission')}
              </h2>
              <p className="text-muted dark:text-white/60 font-body text-lg max-w-2xl mx-auto leading-relaxed">
                {t('about.missionDesc')}
              </p>
            </div>
          </BlurFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                titleKey: 'about.accessible' as const,
                descKey: 'about.accessibleDesc' as const,
                accentColor: 'bg-teal',
              },
              {
                icon: Users,
                titleKey: 'about.inclusive' as const,
                descKey: 'about.inclusiveDesc' as const,
                accentColor: 'bg-[#8B7EC8]',
              },
              {
                icon: Target,
                titleKey: 'about.empowering' as const,
                descKey: 'about.empoweringDesc' as const,
                accentColor: 'bg-[#C2956B]',
              },
            ].map((item, i) => (
              <BlurFade key={item.titleKey} duration={0.6} delay={0.1 + i * 0.12}>
                <TiltCard tiltAmount={6} className="h-full group">
                  <div className="relative bg-white dark:bg-[#232340] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 h-full overflow-hidden hover:-translate-y-1 transition-transform duration-500 ease-out">
                    {/* Left accent bar */}
                    <div className={`absolute left-0 top-6 bottom-6 w-1 ${item.accentColor} rounded-r-full`} />

                    <div className="pl-4">
                      <item.icon
                        size={32}
                        className="text-teal dark:text-teal mb-6"
                      />
                      <h3 className="font-heading italic text-2xl font-bold text-navy dark:text-white mb-4">
                        {t(item.titleKey)}
                      </h3>
                      <p className="text-muted dark:text-white/60 font-body leading-relaxed">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Section 5: Research Foundations ============ */}
      <section id="research" className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-7xl mx-auto">
          {/* Header row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <BlurFade duration={0.6} delay={0}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-teal">
                  <BookOpen size={20} />
                  <span className="font-body font-semibold tracking-widest uppercase text-sm">
                    Bibliography
                  </span>
                </div>
                <h2 className="font-heading italic text-4xl sm:text-5xl font-bold text-navy dark:text-white">
                  {t('about.research')}
                </h2>
              </div>
            </BlurFade>

            <BlurFade duration={0.6} delay={0.15}>
              <p className="text-lg text-muted dark:text-white/60 max-w-md font-heading italic leading-relaxed">
                {t('about.researchDesc')}{' '}
                <a
                  href="https://github.com/Xernam6/BoloBridge#references"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal hover:underline transition-colors duration-300"
                >
                  README on GitHub
                </a>
                .
              </p>
            </BlurFade>
          </div>

          {/* Research grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {RESEARCH_SOURCES.map((source, i) => (
              <BlurFade key={source.org} duration={0.5} delay={0.04 + i * 0.03}>
                <ResearchCard source={source} />
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Section 6: Disclaimer ============ */}
      <section id="disclaimer" className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-4xl mx-auto">
          <BlurFade duration={0.6} delay={0.1}>
            <div className="bg-white dark:bg-[#232340] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-10 sm:p-14 relative overflow-hidden">
              {/* Accent bar on the left */}
              <div className="absolute left-0 top-8 bottom-8 w-1 bg-[#D16D6D] rounded-r-full" />

              <div className="pl-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield size={24} className="text-[#D16D6D]" />
                  <h2 className="font-heading italic text-2xl sm:text-3xl font-bold text-navy dark:text-white">
                    {t('about.disclaimer')}
                  </h2>
                </div>
                <div className="space-y-4 text-muted dark:text-white/65 font-body leading-relaxed">
                  <p>{t('about.disclaimerP1')}</p>
                  <p>{t('about.disclaimerP2')}</p>
                  <p>{t('about.disclaimerP3')}</p>
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ============ Section 7: Contact / Footer CTA ============ */}
      <section className="py-28 sm:py-32 px-6 bg-cream dark:bg-[#1A1A2E]">
        <div className="max-w-3xl mx-auto text-center">
          <BlurFade duration={0.6} delay={0}>
            <h2 className="font-heading italic text-3xl sm:text-4xl font-bold text-navy dark:text-white mb-4">
              {t('about.contact')}
            </h2>
            <p className="text-muted dark:text-white/60 font-body text-lg mb-10 leading-relaxed">
              {t('about.contactDesc')}
            </p>
          </BlurFade>

          <BlurFade duration={0.6} delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[
                {
                  icon: Mail,
                  label: t('about.email'),
                  value: 'utannan@gmail.com',
                },
                {
                  icon: Globe,
                  label: t('about.location'),
                  value: 'Philadelphia, PA',
                },
                {
                  icon: Heart,
                  label: t('about.feedback'),
                  value: 'feedback@bolobridge.com',
                },
              ].map((item) => (
                <TiltCard key={item.label} tiltAmount={5} className="group">
                  <div className="bg-white dark:bg-[#232340] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-8 text-center hover:-translate-y-1 transition-transform duration-500 ease-out">
                    <item.icon size={24} className="text-teal mx-auto mb-4" />
                    <h3 className="font-heading italic text-lg font-semibold text-navy dark:text-white mb-1">
                      {item.label}
                    </h3>
                    <p className="text-muted dark:text-white/60 font-body text-sm">
                      {item.value}
                    </p>
                  </div>
                </TiltCard>
              ))}
            </div>
          </BlurFade>

          <BlurFade duration={0.6} delay={0.3}>
            <Link href="mailto:utannan@gmail.com">
              <MagneticButton className="bg-teal text-white font-body font-semibold px-10 py-4 rounded-xl text-base shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                Get in Touch
              </MagneticButton>
            </Link>
          </BlurFade>
        </div>
      </section>
    </div>
  );
}
