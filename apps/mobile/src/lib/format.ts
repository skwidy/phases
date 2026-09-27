const DAY_MS = 864e5;

function utcDay(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDay(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(utcDay(iso));
}

export function formatShort(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(utcDay(iso));
}

export function weekdayShort(locale: string): string[] {
  const mondayFirst = locale.toLowerCase().startsWith('fr');
  const start = Date.UTC(1970, 0, mondayFirst ? 5 : 4);
  const format = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });
  return Array.from({ length: 7 }, (_, index) => format.format(new Date(start + index * DAY_MS)));
}

export function weekdayInitial(locale: string): string[] {
  return weekdayShort(locale).map((name) => {
    const letter = name.replace(/\./g, '').trim().charAt(0);
    return letter.toLocaleUpperCase(locale);
  });
}

export function formatWeekday(iso: string, locale: string): string {
  const name = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(utcDay(iso));
  return name.replace(/\./g, '').trim().toLocaleUpperCase(locale);
}

export function formatMonthName(iso: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: 'long',
    timeZone: 'UTC',
  }).format(utcDay(iso));
  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}

export function formatShortWithWeekday(iso: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(utcDay(iso));
  return formatted.replace(/\.$/, '');
}

export function formatMonth(iso: string, locale: string): string {
  const formatted = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDay(iso));
  return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
}
