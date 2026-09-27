import { addDays, type ISODate } from '../cycle/dates';
import { type CycleRecord } from '../cycle/engine';

export const EXAMPLE_CYCLE_STARTS: readonly ISODate[] = [
  '2026-04-16',
  '2026-05-13',
  '2026-06-11',
  '2026-07-09',
  '2026-08-07',
  '2026-09-04',
];

export function exampleCycles(): CycleRecord[] {
  return EXAMPLE_CYCLE_STARTS.map((start) => ({ start }));
}

export function relativeCycles(day: ISODate): CycleRecord[] {
  const last = addDays(day, -20);
  return Array.from({ length: 6 }, (_, index) => ({
    start: addDays(last, -28 * (5 - index)),
  }));
}
