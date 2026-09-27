import { diffDays, type ISODate } from './dates';
import {
  predictCycleLength,
  predictPeriodLength,
  type CycleRecord,
  type CycleState,
} from './engine';

export type HistoryRow = {
  start: ISODate;
  length: number | null;
  delta: number | null;
  periodLength: number;
  day: number | null;
};

export type HistoryView = {
  median: number;
  sigma: number | null;
  irregular: boolean;
  periodLength: number;
  rows: HistoryRow[];
};

export function historyView(state: CycleState, today: ISODate): HistoryView {
  const records = [...state.cycles].sort((left, right) => (left.start < right.start ? -1 : 1));
  const starts = records.map((record) => record.start);
  const prediction = predictCycleLength(starts, state.defaults.cycleLength);
  const periodLength = predictPeriodLength(records, state.defaults.periodLength);
  const newestFirst = [...records].reverse();

  return {
    median: prediction.length,
    sigma: prediction.sigma,
    irregular: prediction.irregular,
    periodLength,
    rows: newestFirst.map((record, index) => rowOf(record, index, newestFirst, prediction.length, periodLength, today)),
  };
}

function rowOf(
  record: CycleRecord,
  index: number,
  newestFirst: readonly CycleRecord[],
  median: number,
  fallbackPeriod: number,
  today: ISODate,
): HistoryRow {
  const newer = index === 0 ? null : newestFirst[index - 1];
  const length = newer ? diffDays(record.start, newer.start) : null;
  const open = length === null && record.start <= today;
  return {
    start: record.start,
    length,
    delta: length === null ? null : length - median,
    periodLength: record.periodLength ?? fallbackPeriod,
    day: open ? diffDays(record.start, today) + 1 : null,
  };
}
