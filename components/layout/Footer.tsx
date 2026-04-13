'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

const LANGUAGE_BADGES = ['EN', 'ES', 'HI', 'AF', 'BN', 'TL', 'PT', 'AR', 'RU', 'VI'];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="relative bg-[#2D3142] text-white overflow-hidden">
      {/* Subtle grain overlay for the footer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 sm:py-20">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 sm:gap-12">
          {/* Brand column */}
          <div>
            <span className="font-heading italic text-xl text-white tracking-tight block mb-4">
              BoloBridge
            </span>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Explore column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-6">
              {t('footer.explore')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/screening', label: t('nav.screening') },
                { href: '/learn', label: t('nav.learn') },
                { href: '/play', label: t('nav.play') },
                { href: '/daily-challenge', label: t('nav.dailyChallenge') },
                { href: '/dashboard', label: t('nav.dashboard') },
                { href: '/profile', label: t('nav.profile') },
                { href: '/settings', label: t('nav.settings') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors duration-500 ease-out"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-6">
              {t('footer.resources')}
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/about', label: t('footer.aboutBoloBridge') },
                { href: '/find-help', label: t('footer.findHelp') },
                { href: '/about#research', label: t('footer.research') },
                { href: '/about#disclaimer', label: t('footer.disclaimerLink') },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/80 transition-colors duration-500 ease-out"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Important column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white/35 mb-6">
              {t('footer.important')}
            </h4>
            <p className="text-xs text-white/30 leading-relaxed">
              {t('footer.legalText')}
            </p>
          </div>
        </div>

        {/* Language badges row */}
        <div className="mt-14 pt-8 border-t border-white/[0.06]">
          <div className="flex flex-wrap gap-2 mb-8">
            {LANGUAGE_BADGES.map((lang) => (
              <span
                key={lang}
                className="
                  px-3 py-1.5 rounded-lg
                  bg-white/[0.04] border border-white/[0.06]
                  text-[10px] font-semibold tracking-wider text-white/40
                "
              >
                {lang}
              </span>
            ))}
          </div>

          {/* Copyright + disclaimer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} {t('footer.copyright')}
            </p>
            <p className="text-xs text-white/20">
              {t('footer.notMedical')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
