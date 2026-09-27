import { syncPreview } from '../preview';

test('a received start shows the previous length, the local prediction, and the next PMS', () => {
  const preview = syncPreview(
    ['2026-09-04'],
    { cycleLength: 28, periodLength: 5 },
    { cycles: ['2026-10-02'], cycleLength: 28, periodLength: 5 },
    '2026-09-27',
  );
  expect(preview).toEqual({
    headline: '2026-10-02',
    previousLength: 28,
    localNextPeriod: '2026-10-02',
    matchesLocal: true,
    nextPms: '2026-10-23',
  });
});
