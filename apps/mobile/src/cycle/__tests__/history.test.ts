import { historyView } from '../history';
import { type CycleState } from '../engine';

const example: CycleState = {
  cycles: [
    { start: '2026-04-16' },
    { start: '2026-05-13' },
    { start: '2026-06-11' },
    { start: '2026-07-09' },
    { start: '2026-08-07' },
    { start: '2026-09-04' },
  ],
  defaults: { cycleLength: 28, periodLength: 5 },
};

test('history lists cycles from the newest, with the open cycle and the gap to the median', () => {
  const view = historyView(example, '2026-09-27');
  expect(view.median).toBe(28);
  expect(view.periodLength).toBe(5);
  expect(view.irregular).toBe(false);
  expect(view.sigma).toBeCloseTo(0.75, 1);
  expect(view.rows.map((row) => [row.start, row.length, row.delta, row.day, row.periodLength])).toEqual([
    ['2026-09-04', null, null, 24, 5],
    ['2026-08-07', 28, 0, null, 5],
    ['2026-07-09', 29, 1, null, 5],
    ['2026-06-11', 28, 0, null, 5],
    ['2026-05-13', 29, 1, null, 5],
    ['2026-04-16', 27, -1, null, 5],
  ]);
});

test('a stored period length stays on that cycle', () => {
  const view = historyView(
    {
      cycles: [
        { start: '2026-08-07', periodLength: 5 },
        { start: '2026-09-04', periodLength: 4 },
      ],
      defaults: { cycleLength: 28, periodLength: 6 },
    },
    '2026-09-27',
  );
  expect(view.periodLength).toBe(5);
  expect(view.sigma).toBeNull();
  expect(view.rows.map((row) => [row.start, row.length, row.periodLength, row.day])).toEqual([
    ['2026-09-04', null, 4, 24],
    ['2026-08-07', 28, 5, null],
  ]);
});
