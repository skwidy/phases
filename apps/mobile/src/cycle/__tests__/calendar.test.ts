import { calendarDay, phaseBarSegments, reminderDates, type CalendarDay } from '../calendar';
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

const today = '2026-09-27';
const bells = { pms: true, period: true, ovulation: false };

function day(date: string): CalendarDay {
  return calendarDay(example, date, today);
}

test('September 2026 colors each day from the cycle that contains it', () => {
  expect(day('2026-09-01')).toMatchObject({ phase: 'spm', day: 26, tone: 'past' });
  expect(day('2026-09-03')).toMatchObject({ phase: 'spm', day: 28, tone: 'past' });
  expect(day('2026-09-04')).toMatchObject({ phase: 'regles', day: 1, tone: 'past' });
  expect(day('2026-09-16')).toMatchObject({ phase: 'ovulation', day: 13, tone: 'past' });
  expect(day('2026-09-24')).toMatchObject({ phase: 'luteale', day: 21, tone: 'past' });
  expect(day('2026-09-25')).toMatchObject({ phase: 'spm', day: 22, tone: 'past' });
  expect(day('2026-09-27')).toMatchObject({ phase: 'spm', day: 24, tone: 'today', phaseEnd: '2026-10-01' });
  expect(day('2026-09-28')).toMatchObject({ phase: 'spm', tone: 'future' });
  expect(day('2026-10-01')).toMatchObject({ phase: 'spm', day: 28, tone: 'future' });
  expect(day('2026-10-02')).toMatchObject({ phase: 'regles', day: 1, tone: 'future', nextPeriod: '2026-10-30' });
});

test('days before the first cycle and past the predicted horizon have no phase', () => {
  expect(day('2026-04-15').phase).toBeNull();
  expect(day('2027-01-01').phase).toBeNull();
  expect(calendarDay({ cycles: [], defaults: example.defaults }, today, today).phase).toBeNull();
});

test('a late day stays late until today, then the predicted cycle takes over', () => {
  const state: CycleState = {
    cycles: [{ start: '2026-09-04' }],
    defaults: { cycleLength: 28, periodLength: 5 },
  };
  expect(calendarDay(state, '2026-10-02', '2026-10-06')).toMatchObject({ phase: 'retard', tone: 'past' });
  expect(calendarDay(state, '2026-10-06', '2026-10-06')).toMatchObject({ phase: 'retard', tone: 'today' });
  expect(calendarDay(state, '2026-10-07', '2026-10-06')).toMatchObject({
    phase: 'folliculaire',
    day: 6,
    tone: 'future',
  });
});

test('bells mark the advance reminders of real and predicted cycles, not the confirmation mornings', () => {
  const dates = reminderDates(example, bells);
  expect(dates).toContain('2026-09-03');
  expect(dates).toContain('2026-09-24');
  expect(dates).not.toContain('2026-09-04');
  expect(dates).toContain('2026-10-01');
  expect(reminderDates(example, { pms: false, period: false, ovulation: false })).toEqual([]);
});

test('the phase bar uses the visible luteal days, stopping the day before SPM', () => {
  expect(phaseBarSegments(28, 5)).toEqual([
    { phase: 'regles', days: 5 },
    { phase: 'folliculaire', days: 7 },
    { phase: 'ovulation', days: 3 },
    { phase: 'luteale', days: 6 },
    { phase: 'spm', days: 7 },
  ]);
});
