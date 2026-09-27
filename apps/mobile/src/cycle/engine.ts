import { addDays, dayNumber, fromDayNumber, type ISODate } from './dates';

const MIN_CYCLE = 21;
const MAX_CYCLE = 45;

export type Phase = 'regles' | 'folliculaire' | 'ovulation' | 'luteale' | 'spm' | 'retard';

export type CycleRecord = {
  start: ISODate;
  periodLength?: number;
};

export type CycleState = {
  cycles: readonly CycleRecord[];
  defaults: { cycleLength: number; periodLength: number };
};

export type DateWindow = {
  start: ISODate;
  end: ISODate;
};

export type CyclePrediction = {
  length: number;
  sigma: number | null;
  irregular: boolean;
};

export type TodayStatus = {
  day: number | null;
  phase: Phase | null;
  late: number;
  cycleLength: number;
  periodLength: number;
  sigma: number | null;
  irregular: boolean;
  window: DateWindow | null;
  nextPms: ISODate | null;
  nextPeriod: ISODate | null;
  nextOvulation: ISODate | null;
};

function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function retainedCycleLengths(cycles: readonly ISODate[]): number[] {
  const days = cycles.map(dayNumber).sort((a, b) => a - b);
  const lengths: number[] = [];
  for (let i = 1; i < days.length; i++) lengths.push(days[i] - days[i - 1]);
  return lengths.filter((length) => length >= MIN_CYCLE && length <= MAX_CYCLE).slice(-6);
}

export function predictCycleLength(cycles: readonly ISODate[], fallback = 28): CyclePrediction {
  const valid = retainedCycleLengths(cycles);
  if (valid.length === 0) return { length: fallback, sigma: null, irregular: false };
  const length = median(valid);
  let sigma: number | null = null;
  if (valid.length >= 3) {
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    sigma = Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length);
  }
  return { length, sigma, irregular: sigma !== null && sigma > 5 };
}

export function predictPeriodLength(cycles: readonly CycleRecord[], fallback = 5): number {
  const lengths = cycles.flatMap((cycle) =>
    cycle.periodLength === undefined ? [] : [cycle.periodLength],
  );
  if (lengths.length === 0) return fallback;
  return median(lengths);
}

export function phasesFor(length: number, periodLength: number) {
  const o = length - 14;
  return {
    regles: [1, periodLength] as const,
    folliculaire: [periodLength + 1, o - 2] as const,
    ovulation: [o - 1, o + 1] as const,
    luteale: [o + 2, length] as const,
    spm: [length - 6, length] as const,
  };
}

export function phaseEndDate(
  start: ISODate,
  day: number,
  length: number,
  periodLength: number,
): ISODate {
  const phases = phasesFor(length, periodLength);
  const phase = phaseOfDay(day, length, periodLength);
  const endDay =
    phase === 'retard' || phase === 'spm'
      ? length
      : phase === 'luteale'
        ? phases.spm[0] - 1
        : phases[phase][1];
  return addDays(start, endDay - 1);
}

export function phaseOfDay(day: number, length: number, periodLength: number): Phase {
  const p = phasesFor(length, periodLength);
  if (day > length) return 'retard';
  if (day >= p.spm[0]) return 'spm';
  if (day <= p.regles[1]) return 'regles';
  if (day <= p.folliculaire[1]) return 'folliculaire';
  if (day <= p.ovulation[1]) return 'ovulation';
  return 'luteale';
}

function periodWindow(nextPeriod: ISODate, sigma: number | null): DateWindow | null {
  if (sigma === null || sigma <= 2 || sigma > 5) return null;
  const pad = Math.ceil(sigma);
  return { start: addDays(nextPeriod, -pad), end: addDays(nextPeriod, pad) };
}

export function todayStatus(state: CycleState, today: ISODate): TodayStatus {
  const periodLength = predictPeriodLength(state.cycles, state.defaults.periodLength);
  const starts = state.cycles.map((cycle) => cycle.start);
  const pred = predictCycleLength(starts, state.defaults.cycleLength);

  if (starts.length === 0) {
    return {
      day: null,
      phase: null,
      late: 0,
      cycleLength: pred.length,
      periodLength,
      sigma: pred.sigma,
      irregular: pred.irregular,
      window: null,
      nextPms: null,
      nextPeriod: null,
      nextOvulation: null,
    };
  }

  const sorted = [...starts].sort();
  const start = sorted[sorted.length - 1];
  const length = pred.length;
  const day = dayNumber(today) - dayNumber(start) + 1;
  const startDay = dayNumber(start);
  const nextPeriod = fromDayNumber(startDay + length);
  const nextPms = fromDayNumber(startDay + (length - 6) - 1);
  const nextOvulation = fromDayNumber(startDay + (length - 14) - 1);

  return {
    day,
    phase: phaseOfDay(day, length, periodLength),
    late: Math.max(0, day - length - 1),
    cycleLength: length,
    periodLength,
    sigma: pred.sigma,
    irregular: pred.irregular,
    window: periodWindow(nextPeriod, pred.sigma),
    nextPms,
    nextPeriod,
    nextOvulation,
  };
}
