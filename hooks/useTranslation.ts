'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { t, type TranslationKey } from '@/lib/i18n';

/**
 * Hook that returns a translation function bound to the current app language.
 * Usage: const { t } = useTranslation();
 *        <h1>{t('home.title')}</h1>
 */
export function useTranslation() {
  const appLanguage = useAppStore((s) => s.appLanguage);
  const profile = useAppStore((s) => s.profile);
  const lang = profile?.language ?? appLanguage ?? 'en';

  const translate = useCallback(
    (key: TranslationKey) => t(key, lang),
    [lang],
  );

  return { t: translate, lang };
}
