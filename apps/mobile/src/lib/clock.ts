import { type ISODate } from '../cycle/dates';

let debugToday: ISODate | null = null;

function isDev(): boolean {
  return (globalThis as { __DEV__?: boolean }).__DEV__ === true;
}

function calendarToday(now: Date): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function deviceToday(): ISODate {
  return calendarToday(new Date());
}

export function today(): ISODate {
  if (isDev() && debugToday !== null) return debugToday;
  return deviceToday();
}

export function setDebugToday(date: ISODate | null): void {
  if (!isDev()) return;
  debugToday = date;
}
