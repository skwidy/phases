import { mergeCycles } from '../merge';

test('dates less than 5 days apart are one cycle, and the incoming date wins', () => {
  expect(mergeCycles(['2026-09-04', '2026-10-02'], ['2026-09-30'])).toEqual([
    '2026-09-04',
    '2026-09-30',
  ]);
  expect(mergeCycles(['2026-09-04'], ['2026-09-08'])).toEqual(['2026-09-08']);
});

test('dates 5 days apart stay two cycles', () => {
  expect(mergeCycles(['2026-09-04'], ['2026-09-09'])).toEqual(['2026-09-04', '2026-09-09']);
});

test('without an incoming date, the later stored start is kept', () => {
  expect(mergeCycles(['2026-09-04', '2026-09-07'], [])).toEqual(['2026-09-07']);
});
