import {
  formatDay,
  formatMonth,
  formatMonthName,
  formatShort,
  formatShortWithWeekday,
  formatWeekday,
  weekdayInitial,
  weekdayShort,
} from '../format';

test('formatDay and formatShort keep the calendar day', () => {
  expect(formatDay('2026-09-27', 'en-US').toLowerCase()).toContain('september');
  expect(formatDay('2026-09-27', 'en-US')).toContain('27');
  expect(formatDay('2026-09-27', 'fr-FR').toLowerCase()).toContain('septembre');
  expect(formatShort('2026-09-27', 'fr-FR')).toContain('27');
  expect(formatShort('2026-09-27', 'en-US').toLowerCase()).toContain('sep');
});

test('weekdayShort starts on Monday in French and Sunday in English', () => {
  expect(weekdayShort('fr')[0].toLowerCase()).toMatch(/lun/);
  expect(weekdayShort('en')[0].toLowerCase()).toMatch(/sun/);
  expect(weekdayShort('fr')).toHaveLength(7);
  expect(weekdayShort('en')).toHaveLength(7);
});

test('formatWeekday is a short uppercase name of that calendar day', () => {
  expect(formatWeekday('2026-09-27', 'fr').toLowerCase()).toMatch(/dim/);
  expect(formatWeekday('2026-09-27', 'en').toLowerCase()).toMatch(/sun/);
});

test('formatMonthName is the month alone and formatShortWithWeekday keeps the weekday', () => {
  expect(formatMonthName('2026-09-01', 'fr-FR').toLowerCase()).toBe('septembre');
  expect(formatMonthName('2026-09-01', 'en-US').toLowerCase()).toBe('september');
  expect(formatShortWithWeekday('2026-10-02', 'fr-FR').toLowerCase()).toContain('2');
  expect(formatShortWithWeekday('2026-10-02', 'fr-FR').toLowerCase()).toMatch(/ven/);
});

test('weekdayInitial uses one capital letter and formatMonth keeps the month', () => {
  expect(weekdayInitial('fr')[0]).toBe('L');
  expect(weekdayInitial('en')[0]).toBe('S');
  expect(formatMonth('2026-09-01', 'fr-FR').toLowerCase()).toContain('septembre');
  expect(formatMonth('2026-09-01', 'en-US').toLowerCase()).toContain('september');
});
