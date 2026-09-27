import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import contentEn from '../content/phases.en.json';
import contentFr from '../content/phases.fr.json';
import en from './en.json';
import fr from './fr.json';

export type AppLanguage = 'auto' | 'fr' | 'en';
export type ResolvedLanguage = 'fr' | 'en';

export function deviceLanguage(): ResolvedLanguage {
  const code = getLocales()[0]?.languageCode?.toLowerCase() ?? '';
  return code.startsWith('fr') ? 'fr' : 'en';
}

export function resolvedLanguage(language: AppLanguage): ResolvedLanguage {
  if (language === 'fr' || language === 'en') return language;
  return deviceLanguage();
}

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr, content: contentFr },
    en: { translation: en, content: contentEn },
  },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export function syncLanguage(language: AppLanguage): void {
  const next = resolvedLanguage(language);
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export default i18n;
