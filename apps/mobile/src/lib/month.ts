import { type ISODate } from '../cycle/dates';

export function monthCells(year: number, month: number, mondayFirst: boolean): (ISODate | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = mondayFirst ? (firstWeekday + 6) % 7 : firstWeekday;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (ISODate | null)[] = Array.from({ length: leading }, () => null);
  const monthText = String(month).padStart(2, '0');
  for (let day = 1; day <= count; day += 1) {
    cells.push(`${year}-${monthText}-${String(day).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
