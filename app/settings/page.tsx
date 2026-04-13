'use client';

import { useState, useEffect } from 'react';
import { GeometricPaths } from '@/components/ui/background-patterns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Globe,
  User,
  ChevronRight,
  Moon,
  Sun,
  Check,
  Save,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { LANGUAGES, AVATARS } from '@/lib/constants';
import { useTranslation } from '@/hooks/useTranslation';

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

/* ── Toggle Switch ── */
function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors duration-500 ease-out focus:outline-none cursor-pointer ${
        enabled ? 'bg-teal' : 'bg-muted/30'
      }`}
      aria-label={label}
    >
      <motion.div
        className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ── Main Component ── */
export default function SettingsPage() {
  const {
    appLanguage,
    setAppLanguage,
    soundEnabled,
    toggleSound,
    profile,
    textSize,
    setTextSize,
  } = useAppStore();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [pendingLanguage, setPendingLanguage] = useState(appLanguage);
  const [saved, setSaved] = useState(false);
  const { t } = useTranslation();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    setPendingLanguage(appLanguage);
  }, [appLanguage]);

  const hasUnsavedChanges = pendingLanguage !== appLanguage;

  const handleSave = () => {
    setAppLanguage(pendingLanguage);
    setSaved(true);
    toast.success('Settings saved');
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarData = profile
    ? AVATARS.find((a) => a.id === profile.avatarId)
    : null;

  const textSizeLabel = textSize === 1 ? 'Small' : textSize === 2 ? 'Medium' : 'Large';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 text-teal opacity-[0.10] pointer-events-none z-0">
        <GeometricPaths />
      </div>
      {/* Film grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03]">
        <svg width="100%" height="100%">
          <filter id="grain-settings">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain-settings)" />
        </svg>
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-cream/80 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[700px] mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-teal hover:bg-ice transition-colors duration-300 p-2 rounded-full"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-heading italic text-2xl tracking-tight text-teal">
              {t('settings.title')}
            </h1>
          </div>
        </div>
        <div className="h-[1px] bg-ice w-full" />
      </header>

      <main className="max-w-[700px] mx-auto px-6 py-24 space-y-12">
        {/* ── Appearance Group ── */}
        <motion.section custom={1} variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
          <h3 className="font-heading italic text-2xl px-2 text-navy">Appearance</h3>
          <div className="bg-white dark:bg-[#252540] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="space-y-10">
              {/* Theme toggle */}
              {mounted && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-body font-medium text-navy">Theme</span>
                    <span className="text-xs uppercase tracking-widest text-teal font-bold">
                      {theme === 'dark' ? 'Dark' : 'Light'} Active
                    </span>
                  </div>
                  <div className="flex bg-ice p-1.5 rounded-full relative">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ease-out flex items-center justify-center gap-2 cursor-pointer ${
                        theme !== 'dark'
                          ? 'bg-teal text-white'
                          : 'text-muted hover:text-navy'
                      }`}
                    >
                      <Sun size={14} />
                      {t('settings.light')}
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ease-out flex items-center justify-center gap-2 cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-teal text-white'
                          : 'text-muted hover:text-navy'
                      }`}
                    >
                      <Moon size={14} />
                      {t('settings.dark')}
                    </button>
                  </div>
                </div>
              )}

              {/* Text Size */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-body font-medium text-navy">Text Size</span>
                  <span className="text-sm text-muted">{textSizeLabel}</span>
                </div>
                <input
                  className="w-full h-1.5 bg-ice rounded-lg appearance-none cursor-pointer accent-teal"
                  max={3}
                  min={1}
                  step={1}
                  type="range"
                  value={textSize}
                  onChange={(e) => setTextSize(parseInt(e.target.value))}
                />
                <div className="flex justify-between px-1 text-[10px] font-bold uppercase tracking-tighter text-muted">
                  <span>Small</span>
                  <span>Medium</span>
                  <span>Large</span>
                </div>
              </div>

              {/* Reduce Motion */}
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="font-body font-medium text-navy">Reduce Motion</span>
                  <span className="text-xs text-muted">Simplifies transitions for visual comfort</span>
                </div>
                <ToggleSwitch
                  enabled={reduceMotion}
                  onToggle={() => setReduceMotion(!reduceMotion)}
                  label="Toggle reduce motion"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Language Group ── */}
        <motion.section custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <h3 className="font-heading italic text-2xl text-navy">{t('settings.appLanguage')}</h3>
            <span className="bg-teal/10 text-teal px-3 py-0.5 rounded-full text-xs font-semibold">
              {LANGUAGES.find((l) => l.code === pendingLanguage)?.flag}{' '}
              {LANGUAGES.find((l) => l.code === pendingLanguage)?.name}
            </span>
          </div>
          <div className="bg-white dark:bg-[#252540] rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="divide-y divide-ice">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setPendingLanguage(lang.code)}
                  className={`w-full text-left px-8 py-5 transition-colors duration-500 ease-out flex justify-between items-center group cursor-pointer ${
                    pendingLanguage === lang.code
                      ? 'bg-teal/5'
                      : 'hover:bg-ice'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="font-body text-navy">{lang.name}</span>
                  </div>
                  {pendingLanguage === lang.code ? (
                    <Check size={16} className="text-teal" />
                  ) : (
                    <ChevronRight
                      size={16}
                      className="text-muted opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Unsaved changes */}
          <AnimatePresence>
            {hasUnsavedChanges && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="text-xs text-coral font-body px-2 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 bg-coral rounded-full" />
                {t('settings.unsaved')}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ── Privacy Group ── */}
        <motion.section custom={4} variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
          <h3 className="font-heading italic text-2xl px-2 text-navy">Privacy</h3>
          <div className="bg-white dark:bg-[#252540] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)] space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-body font-medium text-navy">Anonymous Analytics</span>
                <span className="text-xs text-muted">
                  Helps us improve the app without tracking you
                </span>
              </div>
              <ToggleSwitch
                enabled={analytics}
                onToggle={() => setAnalytics(!analytics)}
                label="Toggle analytics"
              />
            </div>

            <div className="pt-4 flex justify-center">
              <button className="text-rose hover:underline underline-offset-8 transition-all duration-500 font-medium text-sm cursor-pointer">
                Remove All Data
              </button>
            </div>
          </div>
        </motion.section>

        {/* ── Profile Card ── */}
        <motion.section custom={5} variants={fadeUp} initial="hidden" animate="visible">
          <Link href="/profile">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white dark:bg-[#252540] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {profile && avatarData ? (
                    <div
                      className={`w-12 h-12 ${avatarData.bgColor} rounded-full flex items-center justify-center ring-2 ring-white shadow-sm`}
                    >
                      <span className="text-2xl">{avatarData.emoji}</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-ice rounded-full flex items-center justify-center">
                      <User size={22} className="text-muted" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-heading italic text-lg text-navy">
                      {profile ? profile.name : t('profile.createProfile')}
                    </h2>
                    <p className="text-sm text-muted font-body">
                      {profile
                        ? `${profile.age} ${t('profile.yearsOld')}`
                        : t('settings.setupProfile')}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-muted transition-transform duration-500 group-hover:translate-x-1"
                />
              </div>
            </motion.div>
          </Link>
        </motion.section>

        {/* ── Save Button ── */}
        <motion.section custom={6} variants={fadeUp} initial="hidden" animate="visible">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!hasUnsavedChanges && !saved}
            className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-heading font-bold text-base transition-all duration-500 cursor-pointer ${
              saved
                ? 'bg-success text-white'
                : hasUnsavedChanges
                ? 'bg-teal text-white shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]'
                : 'bg-ice text-muted cursor-not-allowed'
            }`}
          >
            <AnimatePresence mode="wait">
              {saved ? (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex items-center gap-2"
                >
                  <Check size={20} />
                  {t('settings.settingsSaved')}
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex items-center gap-2"
                >
                  <Save size={18} />
                  {t('settings.saveSettings')}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.section>

        {/* ── About ── */}
        <motion.section custom={7} variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
          <h3 className="font-heading italic text-2xl px-2 text-navy">About</h3>
          <div className="bg-white dark:bg-[#252540] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="space-y-1">
                <p className="font-heading italic font-bold text-lg text-teal">BoloBridge</p>
                <p className="text-xs uppercase tracking-widest text-muted">
                  {t('settings.version')}
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <a
                  className="text-teal hover:underline underline-offset-4 flex items-center justify-center gap-2 text-sm transition-colors duration-500"
                  href="#"
                >
                  Research Sources
                  <ChevronRight size={14} />
                </a>
                <a
                  className="text-teal hover:underline underline-offset-4 flex items-center justify-center gap-2 text-sm transition-colors duration-500"
                  href="#"
                >
                  Open Source
                  <ChevronRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── System Log ── */}
        <motion.section custom={8} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="font-heading italic text-xl px-2 text-muted/60">System Log</h3>
          <div className="bg-white dark:bg-[#252540] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <span className="font-heading italic text-teal text-sm whitespace-nowrap pt-0.5">
                  Today, 08:14
                </span>
                <p className="font-body text-sm text-muted">
                  Privacy PIN was successfully updated from your primary device.
                </p>
              </div>
              <div className="flex items-start gap-4 opacity-50">
                <span className="font-heading italic text-teal text-sm whitespace-nowrap pt-0.5">
                  Oct 12, 19:45
                </span>
                <p className="font-body text-sm text-muted">
                  Language set to English (US) during initial calibration.
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ice py-12">
        <div className="flex flex-col items-center gap-4 w-full max-w-[700px] mx-auto text-center">
          <div className="flex gap-6 mb-2">
            <a className="font-body text-xs tracking-wide uppercase text-muted hover:text-teal transition-colors duration-500" href="#">Support</a>
            <a className="font-body text-xs tracking-wide uppercase text-muted hover:text-teal transition-colors duration-500" href="#">Privacy</a>
            <a className="font-body text-xs tracking-wide uppercase text-muted hover:text-teal transition-colors duration-500" href="#">Terms</a>
            <a className="font-body text-xs tracking-wide uppercase text-muted hover:text-teal transition-colors duration-500" href="#">Feedback</a>
          </div>
          <p className="font-body text-xs tracking-wide uppercase text-muted">
            &copy; 2024 BoloBridge. Crafted for Calm.
          </p>
        </div>
      </footer>
    </div>
  );
}
