export type ISODate = string;

const MS_PER_DAY = 864e5;

export function dayNumber(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromDayNumber(n: number): ISODate {
  return new Date(n * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(dayNumber(iso) + days);
}

export function diffDays(from: ISODate, to: ISODate): number {
  return dayNumber(to) - dayNumber(from);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is ISODate {
  if (!ISO_DATE.test(value)) return false;
  return fromDayNumber(dayNumber(value)) === value;
}
