import { nextReminderDate } from '../nextReminder';

const flags = { pms: true, period: true, confirm: true, ovulation: false };

test('the next reminder on 27 September is the evening before the expected period', () => {
  expect(nextReminderDate('2026-09-04', 28, flags, '2026-09-27')).toBe('2026-10-01');
});

test('a disabled period reminder falls through to the confirmation morning', () => {
  expect(
    nextReminderDate('2026-09-04', 28, { ...flags, period: false }, '2026-09-27'),
  ).toBe('2026-10-02');
});

test('no enabled reminder means no date', () => {
  expect(
    nextReminderDate(
      '2026-09-04',
      28,
      { pms: false, period: false, confirm: false, ovulation: false },
      '2026-09-27',
    ),
  ).toBeNull();
});
