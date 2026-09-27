import { confirmPreview } from '../confirmPreview';

test('confirming 2 October after 4 September previews a 28-day cycle and the next dates', () => {
  expect(
    confirmPreview(['2026-09-04'], { cycleLength: 28, periodLength: 5 }, '2026-10-02'),
  ).toEqual({
    previousLength: 28,
    nextPms: '2026-10-23',
    nextPeriod: '2026-10-30',
    window: null,
  });
});

test('the first cycle has no previous length and uses the default', () => {
  const preview = confirmPreview([], { cycleLength: 30, periodLength: 5 }, '2026-09-27');
  expect(preview.previousLength).toBeNull();
  expect(preview.nextPeriod).toBe('2026-10-27');
  expect(preview.nextPms).toBe('2026-10-20');
});
