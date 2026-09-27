import en from './en.json';
import fr from './fr.json';

const catalogs = { fr, en };

export type Language = keyof typeof catalogs;

type NavKey = keyof typeof fr.nav;

export function deviceLanguage(): Language {
  const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return tag.startsWith('fr') ? 'fr' : 'en';
}

export function t(key: `nav.${NavKey}`): string {
  const name = key.slice('nav.'.length) as NavKey;
  return catalogs[deviceLanguage()].nav[name];
}
