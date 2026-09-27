import { monthCells, shiftMonth } from '../month';

test('September 2026 starts on Tuesday when the week starts on Monday', () => {
  const cells = monthCells(2026, 9, true);
  expect(cells[0]).toBeNull();
  expect(cells[1]).toBe('2026-09-01');
  expect(cells[4]).toBe('2026-09-04');
  expect(cells[27]).toBe('2026-09-27');
  expect(cells).toHaveLength(35);
});

test('September 2026 has two leading blanks when the week starts on Sunday', () => {
  const cells = monthCells(2026, 9, false);
  expect(cells[0]).toBeNull();
  expect(cells[1]).toBeNull();
  expect(cells[2]).toBe('2026-09-01');
});

test('shiftMonth crosses the year', () => {
  expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
});
