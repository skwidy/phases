import { addDays, diffDays, type ISODate } from './dates';
import {
  phaseEndDate,
  phaseOfDay,
  phasesFor,
  predictCycleLength,
  predictPeriodLength,
  type CycleState,
  type Phase,
} from './engine';
import { reminderOffsets, uncertaintyPad, type ReminderKind } from '../reminders/schedule';

export const GUIDE_PHASES = ['regles', 'folliculaire', 'ovulation', 'luteale', 'spm'] as const;

export type GuidePhase = (typeof GUIDE_PHASES)[number];

const PREDICTED_CYCLES = 3;

export function isGuidePhase(value: string): value is GuidePhase {
  return (GUIDE_PHASES as readonly string[]).includes(value);
}

export type DayTone = 'past' | 'today' | 'future';

export type CalendarDay = {
  phase: Phase | null;
  day: number | null;
  tone: DayTone | null;
  phaseEnd: ISODate | null;
  nextPeriod: ISODate | null;
};

type Span = {
  start: ISODate;
  length: number;
  periodLength: number;
  predicted: boolean;
  padReminders: boolean;
  nextPeriod: ISODate;
};

const EMPTY: CalendarDay = {
  phase: null,
  day: null,
  tone: null,
  phaseEnd: null,
  nextPeriod: null,
};

function spans(state: CycleState): Span[] {
  const records = [...state.cycles].sort((left, right) => (left.start < right.start ? -1 : 1));
  if (records.length === 0) return [];
  const starts = records.map((record) => record.start);
  const predictedLength = predictCycleLength(starts, state.defaults.cycleLength).length;
  const fallbackPeriod = predictPeriodLength(records, state.defaults.periodLength);
  const built: Span[] = [];

  for (let index = 0; index < records.length - 1; index += 1) {
    const start = records[index].start;
    const next = records[index + 1].start;
    built.push({
      start,
      length: diffDays(start, next),
      periodLength: records[index].periodLength ?? fallbackPeriod,
      predicted: false,
      padReminders: false,
      nextPeriod: next,
    });
  }

  const last = records[records.length - 1];
  const periodLength = last.periodLength ?? fallbackPeriod;
  built.push({
    start: last.start,
    length: predictedLength,
    periodLength,
    predicted: false,
    padReminders: true,
    nextPeriod: addDays(last.start, predictedLength),
  });
  for (let step = 1; step <= PREDICTED_CYCLES; step += 1) {
    const start = addDays(last.start, step * predictedLength);
    built.push({
      start,
      length: predictedLength,
      periodLength,
      predicted: true,
      padReminders: true,
      nextPeriod: addDays(start, predictedLength),
    });
  }
  return built;
}

function toneOf(date: ISODate, today: ISODate): DayTone {
  if (date < today) return 'past';
  if (date > today) return 'future';
  return 'today';
}

function described(span: Span, date: ISODate, today: ISODate): CalendarDay {
  const day = diffDays(span.start, date) + 1;
  const phase = phaseOfDay(day, span.length, span.periodLength);
  return {
    phase,
    day,
    tone: toneOf(date, today),
    phaseEnd: phase === 'retard' ? null : phaseEndDate(span.start, day, span.length, span.periodLength),
    nextPeriod: span.nextPeriod,
  };
}

export function calendarDay(state: CycleState, date: ISODate, today: ISODate): CalendarDay {
  const all = spans(state);
  if (all.length === 0) return EMPTY;
  const open = all.filter((span) => !span.predicted).at(-1);
  if (!open) return EMPTY;

  if (date <= today && date >= open.start) {
    const day = diffDays(open.start, date) + 1;
    if (day > open.length) {
      return {
        phase: 'retard',
        day,
        tone: toneOf(date, today),
        phaseEnd: null,
        nextPeriod: open.nextPeriod,
      };
    }
  }

  const candidates = date > today ? all : all.filter((span) => !span.predicted);
  const span = [...candidates].reverse().find((item) => date >= item.start && date < addDays(item.start, item.length));
  if (!span) return EMPTY;
  return described(span, date, today);
}

export type ReminderFlags = {
  pms: boolean;
  period: boolean;
  ovulation: boolean;
};

const BELL_KINDS = new Set<ReminderKind>(['pms', 'period', 'ovulation']);

export function reminderDates(state: CycleState, flags: ReminderFlags): ISODate[] {
  if (!flags.pms && !flags.period && !flags.ovulation) return [];
  const all = spans(state);
  if (all.length === 0) return [];
  const starts = state.cycles.map((cycle) => cycle.start);
  const pad = uncertaintyPad(predictCycleLength(starts, state.defaults.cycleLength).sigma);
  const dates = new Set<ISODate>();
  for (const span of all) {
    const shift = span.padReminders ? pad : 0;
    for (const draft of reminderOffsets(span.length, { ...flags, confirm: false })) {
      if (!BELL_KINDS.has(draft.kind)) continue;
      dates.add(addDays(span.start, draft.offset - shift));
    }
  }
  return [...dates].sort();
}

export function phaseBarSegments(length: number, periodLength: number): { phase: GuidePhase; days: number }[] {
  const phases = phasesFor(length, periodLength);
  const rows: { phase: GuidePhase; start: number; end: number }[] = [
    { phase: 'regles', start: phases.regles[0], end: phases.regles[1] },
    { phase: 'folliculaire', start: phases.folliculaire[0], end: phases.folliculaire[1] },
    { phase: 'ovulation', start: phases.ovulation[0], end: phases.ovulation[1] },
    { phase: 'luteale', start: phases.luteale[0], end: phases.spm[0] - 1 },
    { phase: 'spm', start: phases.spm[0], end: phases.spm[1] },
  ];
  return rows.flatMap((row) => {
    const days = row.end - row.start + 1;
    return days > 0 ? [{ phase: row.phase, days }] : [];
  });
}
