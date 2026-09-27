import { addDays, dayNumber, diffDays, fromDayNumber } from '../dates';

test('dayNumber and fromDayNumber round-trip a calendar day', () => {
  expect(fromDayNumber(dayNumber('2026-09-27'))).toBe('2026-09-27');
});

test('addDays and diffDays count calendar days', () => {
  expect(addDays('2026-09-04', 28)).toBe('2026-10-02');
  expect(diffDays('2026-09-04', '2026-10-02')).toBe(28);
  expect(diffDays('2026-10-02', '2026-09-04')).toBe(-28);
});

test('leap day 29 February 2028 is a real calendar day', () => {
  expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  expect(diffDays('2028-02-28', '2028-03-01')).toBe(2);
  expect(fromDayNumber(dayNumber('2028-02-29'))).toBe('2028-02-29');
});

test('day counts stay exact across the winter clock change', () => {
  expect(diffDays('2026-10-24', '2026-10-26')).toBe(2);
  expect(diffDays('2026-10-20', '2026-10-30')).toBe(10);
});
