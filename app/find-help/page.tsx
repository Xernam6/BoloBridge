'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { TiltCard } from '@/components/ui/TiltCard';
import { SpiralPaths } from '@/components/ui/background-patterns';
import {
  ArrowLeft,
  MapPin,
  Search,
  ExternalLink,
  Loader2,
  Heart,
  Lightbulb,
  Phone,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { COUNTRIES, INTERNATIONAL_RESOURCES } from '@/lib/constants';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Resource {
  name: string;
  description: string;
  url: string;
  type: string;
  icon: string;
}

interface FindHelpResult {
  location: string;
  summary: string;
  resources: Resource[];
  tips: string[];
  searchSuggestions?: string[];
  source: 'anthropic' | 'fallback';
}

/* ------------------------------------------------------------------ */
/*  Static quick-help cards (always visible)                            */
/* ------------------------------------------------------------------ */

const QUICK_HELP = [
  { icon: '👶', titleKey: 'findHelp.under3' as const, descKey: 'findHelp.under3Desc' as const, bg: 'bg-[#fcf3f3]' },
  { icon: '🏫', titleKey: 'findHelp.ages3to12' as const, descKey: 'findHelp.ages3to12Desc' as const, bg: 'bg-[#f3f7f2]' },
  { icon: '💻', titleKey: 'findHelp.preferOnline' as const, descKey: 'findHelp.preferOnlineDesc' as const, bg: 'bg-[#f4f3f8]' },
  { icon: '💰', titleKey: 'findHelp.costConcerns' as const, descKey: 'findHelp.costConcernsDesc' as const, bg: 'bg-[#fcf6f0]' },
];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                            */
/* ------------------------------------------------------------------ */

const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    color: 'text-[#5C4D9A]',
    items: [
      {
        q: 'What is BoloBridge?',
        a: 'BoloBridge is a digital bridge for early childhood speech development. We combine professional-grade screening tools with engaging, game-based practice to help children find their voice in a safe, supportive environment. Think of it as a personal speech laboratory that feels like playtime.',
      },
      { q: 'How do I create my child\'s profile?', a: 'After signing up, you\'ll be guided through a short onboarding wizard where you can set your child\'s name, age, and any speech concerns. This helps us personalize the experience from the very first session.' },
      { q: 'Is BoloBridge free?', a: 'BoloBridge offers a free tier with access to basic screening and introductory games. Our premium plan unlocks the full library of exercises, detailed progress reports, and clinician-sharing features.' },
    ],
  },
  {
    title: 'Speech Screening',
    color: 'text-[#C2956B]',
    items: [
      { q: 'How accurate is the screening?', a: 'Our screening uses validated developmental milestones and acoustic analysis. While it is not a clinical diagnosis, studies show strong correlation with professional evaluations. We always recommend following up with a certified speech-language pathologist.' },
      { q: 'What do the results mean?', a: 'Results are presented as easy-to-understand categories: on track, monitor, or consult a professional. Each category includes specific next steps and resources tailored to your child\'s age and area of concern.' },
      { q: 'Should I share results with my child\'s doctor?', a: 'Yes, we encourage it. You can export a summary report directly from your dashboard to bring to your pediatrician or speech therapist. The report includes specific observations that can help guide professional evaluation.' },
    ],
  },
  {
    title: 'Privacy & Data',
    color: 'text-[#5C4D9A]',
    items: [
      { q: 'Is my child\'s data safe?', a: 'Absolutely. We are COPPA-compliant and use end-to-end encryption for all voice recordings. Data is stored securely and never shared with third parties. You maintain full control over your child\'s information at all times.' },
      { q: 'Can I delete my data?', a: 'Yes. You can delete individual recordings, session data, or your entire account at any time from the Settings page. Deletion is permanent and processed within 24 hours.' },
      { q: 'Does BoloBridge work offline?', a: 'Some practice games and previously downloaded lessons are available offline. However, screening, progress syncing, and new content require an internet connection.' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Slow, gentle animation variants                                     */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function FindHelpPage() {
  const { t } = useTranslation();
  const [location, setLocation] = useState('');
  const [childAge, setChildAge] = useState('');
  const [concerns, setConcerns] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FindHelpResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>('What is BoloBridge?');

  const selectedCountryData = COUNTRIES.find((c) => c.code === selectedCountry);

  const relevantResources = INTERNATIONAL_RESOURCES.filter(
    (r) =>
      r.countries.length === 0 ||
      (r.countries as readonly string[]).includes(selectedCountry)
  );

  const handleSearch = async () => {
    if (!location.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch('/api/find-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location.trim(),
          childAge: childAge ? parseInt(childAge) : undefined,
          concerns: concerns.trim() || undefined,
          country: selectedCountry,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      // Show fallback resources even if API fails
      const fallbackTips =
        selectedCountry === 'US'
          ? [
              'Search "speech-language pathologist near me" on Google.',
              'Visit find.asha.org to search the ASHA certified provider directory.',
              'Contact your pediatrician for local referrals.',
              'Call your local school district about available evaluations.',
            ]
          : [
              'Search "speech therapist near me" or "speech-language pathologist near me" on Google.',
              'Contact your family doctor or pediatrician for local referrals.',
              'Ask your local school or education authority about available speech services.',
              'Look into telehealth options for remote speech therapy sessions.',
            ];
      setResult({
        location: location.trim(),
        summary: `We couldn't process your request right now, but here are general resources that can help you find speech therapy services near ${location}.`,
        resources: [],
        tips: fallbackTips,
        source: 'fallback',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 text-violet opacity-[0.18] pointer-events-none z-0">
        <SpiralPaths />
      </div>
      {/* ============================================================ */}
      {/* HERO — warm cream, editorial serif headline                   */}
      {/* ============================================================ */}
      <section className="relative pt-12 pb-36 sm:pb-40 px-6 overflow-hidden">
        {/* Soft tonal circle behind headline */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-[#5C4D9A]/[0.04] rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          {/* Back link */}
          <div className="flex justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#5C4D9A]/60 hover:text-[#5C4D9A] font-body text-sm transition-colors duration-500"
            >
              <ArrowLeft size={16} />
              {t('findHelp.home')}
            </Link>
          </div>

          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#5C4D9A]/[0.08] rounded-full"
          >
            <Heart size={14} className="text-[#D16D6D]" />
            <span className="text-sm font-body font-medium text-[#5C4D9A]">
              Find Professional Help
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
            className="font-heading italic text-5xl sm:text-6xl md:text-7xl text-[#2D3142] dark:text-[#FAF8F5] leading-tight tracking-tight"
          >
            You&rsquo;re Not Alone
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="font-body text-lg sm:text-xl text-[#2D3142]/70 dark:text-[#FAF8F5]/70 max-w-2xl mx-auto leading-relaxed"
          >
            {t('findHelp.subtitle')}
          </motion.p>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SEARCH CARD — overlapping hero with negative margin            */}
      {/* ============================================================ */}
      <section className="relative z-20 px-6 -mt-24 sm:-mt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="max-w-5xl mx-auto bg-white dark:bg-[#232340] rounded-3xl p-8 sm:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Country */}
            <div className="space-y-2">
              <label className="block text-xs font-body font-semibold uppercase tracking-wider text-[#2D3142]/50 dark:text-[#FAF8F5]/50 px-1">
                {t('findHelp.yourCountry')}
              </label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1A1A2E] border-none rounded-full px-6 py-4 font-body text-sm text-[#2D3142] dark:text-[#FAF8F5] focus:ring-2 focus:ring-[#5C4D9A]/20 appearance-none pr-10 transition-all duration-500"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag}  {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D3142]/30 dark:text-[#FAF8F5]/30 pointer-events-none"
                />
              </div>
            </div>

            {/* City / Region */}
            <div className="space-y-2">
              <label className="block text-xs font-body font-semibold uppercase tracking-wider text-[#2D3142]/50 dark:text-[#FAF8F5]/50 px-1">
                {t('findHelp.cityRegion')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={
                    selectedCountry === 'US'
                      ? 'e.g., Philadelphia, PA or 19104'
                      : selectedCountry === 'GB'
                      ? 'e.g., London or SW1A 1AA'
                      : selectedCountry === 'CA'
                      ? 'e.g., Toronto, ON or M5V 3L9'
                      : selectedCountry === 'AU'
                      ? 'e.g., Sydney, NSW or 2000'
                      : selectedCountry === 'IN'
                      ? 'e.g., Mumbai or 400001'
                      : 'e.g., your city or postal code'
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1A1A2E] border-none rounded-full px-6 py-4 font-body text-sm text-[#2D3142] dark:text-[#FAF8F5] placeholder:text-[#2D3142]/30 dark:placeholder:text-[#FAF8F5]/30 focus:ring-2 focus:ring-[#5C4D9A]/20 transition-all duration-500 pr-10"
                />
                <MapPin
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D3142]/30 dark:text-[#FAF8F5]/30"
                />
              </div>
            </div>

            {/* Child's Age */}
            <div className="space-y-2">
              <label className="block text-xs font-body font-semibold uppercase tracking-wider text-[#2D3142]/50 dark:text-[#FAF8F5]/50 px-1">
                {t('findHelp.childAge')}
              </label>
              <div className="relative">
                <select
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1A1A2E] border-none rounded-full px-6 py-4 font-body text-sm text-[#2D3142] dark:text-[#FAF8F5] focus:ring-2 focus:ring-[#5C4D9A]/20 appearance-none pr-10 transition-all duration-500"
                >
                  <option value="">{t('findHelp.selectAge')}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((age) => (
                    <option key={age} value={age}>
                      {age} {age === 1 ? t('common.year') : t('common.years')}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D3142]/30 dark:text-[#FAF8F5]/30 pointer-events-none"
                />
              </div>
            </div>

            {/* Concern */}
            <div className="space-y-2">
              <label className="block text-xs font-body font-semibold uppercase tracking-wider text-[#2D3142]/50 dark:text-[#FAF8F5]/50 px-1">
                {t('findHelp.mainConcern')}
              </label>
              <div className="relative">
                <select
                  value={concerns}
                  onChange={(e) => setConcerns(e.target.value)}
                  className="w-full bg-[#FAF8F5] dark:bg-[#1A1A2E] border-none rounded-full px-6 py-4 font-body text-sm text-[#2D3142] dark:text-[#FAF8F5] focus:ring-2 focus:ring-[#5C4D9A]/20 appearance-none pr-10 transition-all duration-500"
                >
                  <option value="">{t('findHelp.selectConcern')}</option>
                  <option value="articulation">{t('findHelp.articulation')}</option>
                  <option value="fluency">{t('findHelp.stuttering')}</option>
                  <option value="language">{t('findHelp.languageDelay')}</option>
                  <option value="voice">{t('findHelp.voiceQuality')}</option>
                  <option value="feeding">{t('findHelp.feeding')}</option>
                  <option value="general">{t('findHelp.generalScreening')}</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2D3142]/30 dark:text-[#FAF8F5]/30 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {/* Search button */}
          <div className="mt-10 flex justify-center">
            <motion.button
              onClick={handleSearch}
              disabled={!location.trim() || isLoading}
              className="bg-[#5C4D9A] text-white font-body font-semibold text-base px-10 py-4 rounded-xl shadow-[0_8px_32px_rgba(92,77,154,0.18)] hover:shadow-[0_12px_40px_rgba(92,77,154,0.25)] transition-all duration-500 ease-out disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              whileHover={!isLoading ? { y: -2 } : undefined}
              whileTap={!isLoading ? { scale: 0.98 } : undefined}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {t('findHelp.findingResources')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Search size={18} />
                  {t('findHelp.findResources')}
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* RESULTS SECTION                                                */}
      {/* ============================================================ */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="max-w-5xl mx-auto px-6 py-16"
          >
            <div className="space-y-8">
              {/* Summary card */}
              <div className="bg-[#f4f3f8] dark:bg-[#2a2a48] rounded-3xl p-8">
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">🦜</span>
                  <div>
                    <h3 className="font-heading italic text-xl text-[#2D3142] dark:text-[#FAF8F5] mb-2">
                      {t('findHelp.viviGuidance')}
                    </h3>
                    <p className="font-body text-[#2D3142]/70 dark:text-[#FAF8F5]/70 text-base leading-relaxed">
                      {result.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Resource cards */}
              {result.resources.length > 0 && (
                <div>
                  <h3 className="font-heading italic text-2xl text-[#5C4D9A] mb-6 flex items-center gap-3">
                    <Phone size={20} />
                    {t('findHelp.recommendedResources')}
                  </h3>
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                  >
                    {result.resources.map((resource) => (
                      <TiltCard key={resource.name}>
                        <motion.div
                          variants={staggerItem}
                          className="bg-white dark:bg-[#232340] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] h-full"
                        >
                          <span className="text-3xl block mb-3">{resource.icon}</span>
                          <h4 className="font-heading italic text-lg text-[#2D3142] dark:text-[#FAF8F5] mb-2">
                            {resource.name}
                          </h4>
                          <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 text-sm leading-relaxed mb-4">
                            {resource.description}
                          </p>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-[#5C4D9A] hover:text-[#5C4D9A]/70 transition-colors duration-500"
                            >
                              {t('findHelp.visitWebsite')}
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </motion.div>
                      </TiltCard>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Tips */}
              {result.tips.length > 0 && (
                <div className="bg-white dark:bg-[#232340] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <h3 className="font-heading italic text-2xl text-[#C2956B] mb-6 flex items-center gap-3">
                    <Lightbulb size={20} />
                    {t('findHelp.tipsForHelp')}
                  </h3>
                  <ul className="space-y-4">
                    {result.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                        <span className="w-7 h-7 rounded-full bg-[#5C4D9A]/10 text-[#5C4D9A] font-body font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="font-body text-[#2D3142]/70 dark:text-[#FAF8F5]/70 text-base leading-relaxed">
                          {tip}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Search Suggestions */}
              {result.searchSuggestions && result.searchSuggestions.length > 0 && (
                <div className="bg-[#FAF8F5] dark:bg-[#1A1A2E] rounded-2xl p-6">
                  <h4 className="font-heading italic text-lg text-[#2D3142] dark:text-[#FAF8F5] mb-3">
                    {t('findHelp.trySearching')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.searchSuggestions.map((term) => (
                      <a
                        key={term}
                        href={`https://www.google.com/search?q=${encodeURIComponent(term)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#232340] rounded-xl text-sm font-body font-medium text-[#5C4D9A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-500"
                      >
                        <Search size={12} />
                        {term}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* QUICK HELP — 2x2 grid with tonal bg cards                     */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-8 py-24 sm:py-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="font-heading italic text-4xl sm:text-5xl text-[#5C4D9A]">
            {hasSearched ? t('findHelp.moreWays') : 'A Path for Every Family'}
          </h2>
          <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 max-w-2xl mx-auto text-lg leading-relaxed">
            Navigating the world of speech therapy can be overwhelming. We&rsquo;ve curated these first steps to help you find the right direction.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          {QUICK_HELP.map((item) => (
            <TiltCard key={item.titleKey}>
              <motion.div
                variants={staggerItem}
                className={`${item.bg} dark:bg-[#232340] p-10 rounded-3xl space-y-4 group`}
              >
                <span className="text-4xl block mb-4">{item.icon}</span>
                <h3 className="font-heading italic text-2xl text-[#2D3142] dark:text-[#FAF8F5]">
                  {t(item.titleKey)}
                </h3>
                <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 leading-relaxed">
                  {t(item.descKey)}
                </p>
              </motion.div>
            </TiltCard>
          ))}
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* INTERNATIONAL RESOURCES — 3-column grid on tonal bg           */}
      {/* ============================================================ */}
      <section className="bg-[#F5F1EB] dark:bg-[#1A1A2E] py-24 sm:py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="flex items-center gap-4 mb-12"
          >
            <Globe size={32} className="text-[#5C4D9A]" />
            <h2 className="font-heading italic text-4xl text-[#2D3142] dark:text-[#FAF8F5]">
              {t('findHelp.resourcesFor')} {selectedCountryData?.flag} {selectedCountryData?.name || t('findHelp.yourCountry')}
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            {relevantResources.map((resource) => (
              <TiltCard key={resource.name}>
                <motion.div
                  variants={staggerItem}
                  className="bg-white dark:bg-[#232340] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] h-full flex flex-col justify-between"
                >
                  <div>
                    <span className="text-3xl block mb-4">{resource.icon}</span>
                    <h4 className="font-heading italic text-xl text-[#2D3142] dark:text-[#FAF8F5] mb-3">
                      {resource.name}
                    </h4>
                    <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 text-sm leading-relaxed mb-6">
                      {resource.description}
                    </p>
                  </div>
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-[#5C4D9A] hover:text-[#5C4D9A]/70 transition-colors duration-500"
                    >
                      {t('findHelp.visitWebsite')}
                      <ExternalLink size={14} />
                    </a>
                  )}
                </motion.div>
              </TiltCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* ASHA ProFind CTA - US only                                    */}
      {/* ============================================================ */}
      {selectedCountry === 'US' && (
        <section className="max-w-5xl mx-auto px-8 py-24 sm:py-32">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="bg-[#5C4D9A] rounded-3xl p-12 sm:p-16 text-center"
          >
            <span className="text-5xl block mb-6">🏥</span>
            <h3 className="font-heading italic text-3xl sm:text-4xl text-white mb-4">
              {t('findHelp.ashaProFind')}
            </h3>
            <p className="font-body text-white/75 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
              {t('findHelp.ashaDesc')}
            </p>
            <a
              href="https://find.asha.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-[#5C4D9A] font-body font-semibold py-4 px-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-all duration-500 ease-out hover:-translate-y-0.5"
            >
              {t('findHelp.searchAsha')}
              <ExternalLink size={16} />
            </a>
          </motion.div>
        </section>
      )}

      {/* ============================================================ */}
      {/* FAQ SECTION — from Stitch 78                                   */}
      {/* ============================================================ */}
      <section className="max-w-3xl mx-auto px-8 py-24 sm:py-32">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="font-heading italic text-4xl sm:text-5xl text-[#2D3142] dark:text-[#FAF8F5]">
            {t('findHelp.quickGuide')}
          </h2>
          <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 max-w-xl mx-auto text-lg leading-relaxed">
            Common questions about BoloBridge, speech screening, and getting started.
          </p>
        </motion.div>

        {FAQ_SECTIONS.map((section) => (
          <div key={section.title} className="mb-14">
            <h3 className={`font-heading italic text-2xl ${section.color} mb-6 pb-4 border-b border-[#2D3142]/10 dark:border-[#FAF8F5]/10`}>
              {section.title}
            </h3>
            <div className="space-y-3">
              {section.items.map((item) => {
                const isOpen = openFaq === item.q;
                return (
                  <div
                    key={item.q}
                    className="bg-white dark:bg-[#232340] rounded-2xl overflow-hidden transition-shadow duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : item.q)}
                      className="w-full flex justify-between items-center px-6 py-5 text-left group cursor-pointer"
                    >
                      <span className="font-body font-medium text-lg text-[#2D3142] dark:text-[#FAF8F5]">
                        {item.q}
                      </span>
                      <span className="text-[#2D3142]/30 dark:text-[#FAF8F5]/30 transition-transform duration-500">
                        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 bg-[#FAF8F5] dark:bg-[#1A1A2E]">
                            <p className="font-body text-[#2D3142]/70 dark:text-[#FAF8F5]/70 leading-relaxed">
                              {item.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Contact card */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="mt-24 p-12 bg-[#F5F1EB] dark:bg-[#232340] rounded-3xl text-center"
        >
          <h3 className="font-heading italic text-3xl text-[#2D3142] dark:text-[#FAF8F5] mb-4">
            Still need help?
          </h3>
          <p className="font-body text-[#2D3142]/60 dark:text-[#FAF8F5]/60 mb-8 max-w-md mx-auto leading-relaxed">
            Our team of specialists is ready to guide you through any technical or clinical questions.
          </p>
          <a
            className="inline-flex items-center gap-2 font-heading italic text-xl text-[#5C4D9A] hover:text-[#5C4D9A]/70 transition-colors duration-500 group"
            href="mailto:support@bolobridge.com"
          >
            Contact us at support@bolobridge.com
            <ExternalLink size={16} className="group-hover:translate-x-1 transition-transform duration-500" />
          </a>
        </motion.div>
      </section>

      {/* ============================================================ */}
      {/* DISCLAIMER                                                     */}
      {/* ============================================================ */}
      <section className="px-8 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#F5F1EB] dark:bg-[#1A1A2E] rounded-2xl p-6">
            <p className="font-body text-[#2D3142]/50 dark:text-[#FAF8F5]/50 text-sm text-center leading-relaxed">
              {t('findHelp.disclaimer')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
