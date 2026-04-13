'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/lib/i18n';
import DarkModeToggle from '@/components/ui/dark-mode-toggle';

const NAV_ITEMS: { href: string; labelKey: TranslationKey; emoji: string }[] = [
  { href: '/screening', labelKey: 'nav.screening', emoji: '🩺' },
  { href: '/learn', labelKey: 'nav.learn', emoji: '📚' },
  { href: '/play', labelKey: 'nav.play', emoji: '🎮' },
  { href: '/daily-challenge', labelKey: 'nav.dailyChallenge', emoji: '⚡' },
  { href: '/profile', labelKey: 'nav.profile', emoji: '👤' },
  { href: '/dashboard', labelKey: 'nav.dashboard', emoji: '📊' },
  { href: '/clinician', labelKey: 'nav.clinician', emoji: '🎓' },
  { href: '/settings', labelKey: 'nav.settings', emoji: '⚙️' },
  { href: '/about', labelKey: 'nav.about', emoji: '💡' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMac, setIsMac] = useState(false); // detected after mount to avoid hydration mismatch
  const pathname = usePathname();
  const { t } = useTranslation();

  useEffect(() => {
    setMounted(true);
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);


  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6">
      {/* Spacer for content below */}
      <nav
        className={`
          mx-auto mt-3 max-w-5xl
          rounded-full
          transition-all duration-500 ease-out
          ${scrolled
            ? 'bg-white/80 dark:bg-[#1A1A2E]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
            : 'bg-white/60 dark:bg-[#1A1A2E]/60 backdrop-blur-sm'
          }
        `}
      >
        <div className="flex items-center justify-between h-14 px-5">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-heading italic text-xl text-teal tracking-tight">
              BoloBridge
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative px-3 py-1.5 rounded-full text-xs font-medium
                    transition-colors duration-500 ease-out
                    ${isActive
                      ? 'text-teal'
                      : 'text-slate hover:text-navy dark:hover:text-white'
                    }
                  `}
                >
                  <span className="relative z-10">{t(item.labelKey)}</span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-teal/8 dark:bg-teal/12 rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  {/* Hover underline animation */}
                  {!isActive && (
                    <span className="absolute bottom-1 left-3 right-3 h-px bg-teal/40 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cmd+K search trigger */}
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal/6 dark:bg-white/5 hover:bg-teal/10 dark:hover:bg-white/8 transition-colors duration-300 cursor-pointer"
              aria-label="Open command palette"
            >
              <Search size={12} className="text-teal/60" />
              <span className="text-[10px] font-mono text-teal/50 dark:text-white/30">
                {isMac ? '⌘K' : 'Ctrl+K'}
              </span>
            </button>

            {/* Theme toggle */}
            {mounted && <DarkModeToggle />}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-full text-slate hover:text-teal hover:bg-teal/8 transition-colors duration-500"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={t('navbar.toggleMenu')}
            >
              {isOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-down panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="
              lg:hidden mx-auto max-w-5xl mt-2
              rounded-2xl overflow-hidden
              bg-white/90 dark:bg-[#1A1A2E]/90 backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.08)]
            "
          >
            <div className="px-4 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl
                      text-sm font-medium transition-colors duration-500 ease-out
                      ${isActive
                        ? 'bg-teal/8 text-teal'
                        : 'text-body hover:bg-cloud dark:hover:bg-white/5'
                      }
                    `}
                  >
                    <span className="text-base">{item.emoji}</span>
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
