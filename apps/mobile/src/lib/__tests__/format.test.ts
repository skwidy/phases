import { formatDay, formatShort, weekdayShort } from '../format';

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
