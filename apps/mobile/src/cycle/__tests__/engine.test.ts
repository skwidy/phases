import { addDays } from '../dates';
import {
  phaseEndDate,
  phaseOfDay,
  predictCycleLength,
  predictPeriodLength,
  retainedCycleLengths,
  todayStatus,
  type CycleState,
} from '../engine';

const reference: CycleState = {
  cycles: [{ start: '2026-08-07' }, { start: '2026-09-04' }],
  defaults: { cycleLength: 28, periodLength: 5 },
};

function state(starts: readonly string[], cycleLength = 28, periodLength = 5): CycleState {
  return {
    cycles: starts.map((start) => ({ start })),
    defaults: { cycleLength, periodLength },
  };
}

function chain(start: string, lengths: readonly number[]): string[] {
  const dates = [start];
  let cursor = start;
  for (const length of lengths) {
    cursor = addDays(cursor, length);
    dates.push(cursor);
  }
  return dates;
}

test('phaseOfDay on a 28/5 cycle matches the reference', () => {
  expect(phaseOfDay(1, 28, 5)).toBe('regles');
  expect(phaseOfDay(6, 28, 5)).toBe('folliculaire');
  expect(phaseOfDay(14, 28, 5)).toBe('ovulation');
  expect(phaseOfDay(16, 28, 5)).toBe('luteale');
  expect(phaseOfDay(22, 28, 5)).toBe('spm');
  expect(phaseOfDay(30, 28, 5)).toBe('retard');
});

test('27 Sept 2026 is day 24, PMS, next period 2 Oct', () => {
  expect(todayStatus(reference, '2026-09-27')).toEqual({
    day: 24,
    phase: 'spm',
    late: 0,
    cycleLength: 28,
    periodLength: 5,
    sigma: null,
    irregular: false,
    window: null,
    nextPms: '2026-09-25',
    nextPeriod: '2026-10-02',
    nextOvulation: '2026-09-17',
  });
});

test('late is 0 on the expected day and 2 two days later', () => {
  expect(todayStatus(reference, '2026-10-02')).toMatchObject({ day: 29, phase: 'retard', late: 0 });
  expect(todayStatus(reference, '2026-10-04').late).toBe(2);
});

test('median of the design history is 28 and regular', () => {
  const hist = ['2026-04-16', '2026-05-13', '2026-06-11', '2026-07-09', '2026-08-07', '2026-09-04'];
  expect(predictCycleLength(hist).length).toBe(28);
  expect(predictCycleLength(hist).irregular).toBe(false);
  expect(todayStatus(state(hist), '2026-09-27').window).toBeNull();
});

test('a wide spread of cycles is irregular', () => {
  const wild = ['2026-01-01', '2026-01-23', '2026-03-01', '2026-03-24', '2026-05-01'];
  const pred = predictCycleLength(wild);
  expect(pred.irregular).toBe(true);
  expect(todayStatus(state(wild), '2026-05-01').window).toBeNull();
});

test('day count stays 11 across the October clock change', () => {
  expect(todayStatus(state(['2026-10-20']), '2026-10-30').day).toBe(11);
});

test('a 35-day cycle shifts every phase boundary', () => {
  expect(predictCycleLength(chain('2026-01-01', [35])).length).toBe(35);
  expect(phaseOfDay(5, 35, 5)).toBe('regles');
  expect(phaseOfDay(6, 35, 5)).toBe('folliculaire');
  expect(phaseOfDay(19, 35, 5)).toBe('folliculaire');
  expect(phaseOfDay(20, 35, 5)).toBe('ovulation');
  expect(phaseOfDay(22, 35, 5)).toBe('ovulation');
  expect(phaseOfDay(23, 35, 5)).toBe('luteale');
  expect(phaseOfDay(29, 35, 5)).toBe('spm');
  expect(phaseOfDay(35, 35, 5)).toBe('spm');
  expect(phaseOfDay(36, 35, 5)).toBe('retard');
});

test('a 21-day cycle keeps the short length and skips an empty follicular range', () => {
  expect(predictCycleLength(chain('2026-01-01', [21])).length).toBe(21);
  expect(phaseOfDay(5, 21, 5)).toBe('regles');
  expect(phaseOfDay(6, 21, 5)).toBe('ovulation');
  expect(phaseOfDay(8, 21, 5)).toBe('ovulation');
  expect(phaseOfDay(9, 21, 5)).toBe('luteale');
  expect(phaseOfDay(15, 21, 5)).toBe('spm');
  expect(phaseOfDay(22, 21, 5)).toBe('retard');
});

test('no history falls back to the defaults', () => {
  expect(
    todayStatus({ cycles: [], defaults: { cycleLength: 28, periodLength: 5 } }, '2026-09-27'),
  ).toEqual({
    day: null,
    phase: null,
    late: 0,
    cycleLength: 28,
    periodLength: 5,
    sigma: null,
    irregular: false,
    window: null,
    nextPms: null,
    nextPeriod: null,
    nextOvulation: null,
  });
});

test('a single cycle uses the default length and still places the day', () => {
  expect(todayStatus(state(['2026-09-04']), '2026-09-27')).toMatchObject({
    day: 24,
    phase: 'spm',
    cycleLength: 28,
    sigma: null,
    irregular: false,
    late: 0,
  });
});

test('cycles shorter than 21 or longer than 45 days are ignored', () => {
  const dates = chain('2026-01-01', [10, 35, 28]);
  expect(predictCycleLength(dates).length).toBe(32);
  expect(predictCycleLength(chain('2026-01-01', [46, 28])).length).toBe(28);
  expect(predictCycleLength(chain('2026-01-01', [45])).length).toBe(45);
});

test('only the last 6 valid cycles feed the median', () => {
  const dates = chain('2026-01-01', [40, 40, 40, 22, 24, 26, 28, 30]);
  expect(predictCycleLength(dates).length).toBe(27);
});

test('a leap-year cycle counts 29 February', () => {
  expect(todayStatus(state(['2028-02-28']), '2028-03-01').day).toBe(3);
});

test('sigma between 2 and 5 opens a window around the next period', () => {
  const dates = chain('2026-01-01', [24, 28, 32]);
  const pred = predictCycleLength(dates);
  expect(pred.sigma).toBeGreaterThan(2);
  expect(pred.sigma).toBeLessThanOrEqual(5);
  expect(pred.irregular).toBe(false);

  const status = todayStatus(state(dates), dates[dates.length - 1]);
  const pad = Math.ceil(pred.sigma ?? 0);
  expect(status.window).toEqual({
    start: addDays(status.nextPeriod ?? '', -pad),
    end: addDays(status.nextPeriod ?? '', pad),
  });
});

test('retained lengths are the last six intervals between 21 and 45 days', () => {
  const dates = chain('2026-01-01', [10, 24, 28, 32, 26, 30, 22, 40]);
  expect(retainedCycleLengths(dates)).toEqual([28, 32, 26, 30, 22, 40]);
});

test('SPM ends the day before the next period', () => {
  expect(phaseEndDate('2026-09-04', 24, 28, 5)).toBe('2026-10-01');
});

test('period length is the median of the recorded lengths', () => {
  expect(
    predictPeriodLength([{ start: '2026-01-01', periodLength: 3 }, { start: '2026-02-01' }, { start: '2026-03-01', periodLength: 5 }]),
  ).toBe(4);
  expect(predictPeriodLength([], 5)).toBe(5);
  expect(todayStatus({
    cycles: [
      { start: '2026-08-07', periodLength: 4 },
      { start: '2026-09-04', periodLength: 6 },
    ],
    defaults: { cycleLength: 28, periodLength: 5 },
  }, '2026-09-27').periodLength).toBe(5);
});
