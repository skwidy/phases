import { addDays, diffDays } from '../../cycle/dates';
import { exampleCycles, relativeCycles } from '../fixtures';

test('example history matches the design cycles', () => {
  expect(exampleCycles().map((cycle) => cycle.start)).toEqual([
    '2026-04-16',
    '2026-05-13',
    '2026-06-11',
    '2026-07-09',
    '2026-08-07',
    '2026-09-04',
  ]);
});

test('relative history ends 20 days before the given day, in 28-day steps', () => {
  const cycles = relativeCycles('2026-09-27');
  expect(cycles).toHaveLength(6);
  expect(cycles[5]?.start).toBe(addDays('2026-09-27', -20));
  for (let index = 1; index < cycles.length; index += 1) {
    expect(diffDays(cycles[index - 1].start, cycles[index].start)).toBe(28);
  }
});
