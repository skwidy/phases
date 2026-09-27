import { addDays } from '../../cycle/dates';
import { quietTime, reminderSchedule, type ScheduleState } from '../schedule';

const t = (key: string) => key;

const remindersOn: ScheduleState['reminders'] = {
  pms: true,
  period: true,
  confirm: true,
  ovulation: false,
  eveningTime: '19:00',
  morningTime: '09:00',
  discreet: false,
};

function state(patch: {
  mode?: ScheduleState['mode'];
  cycles?: ScheduleState['cycles'];
  reminders?: Partial<ScheduleState['reminders']>;
} = {}): ScheduleState {
  return {
    mode: patch.mode ?? 'partner',
    cycles: patch.cycles ?? [{ start: '2026-09-07' }],
    defaults: { cycleLength: 28, periodLength: 5 },
    reminders: { ...remindersOn, ...patch.reminders },
  };
}

test('a normal cycle schedules this evening, then period, confirm, and the next two cycles', () => {
  const reminders = reminderSchedule(state(), { date: '2026-09-27', time: '12:00' }, t);
  const dates = reminders.map((item) => `${item.kind} ${item.date}`);
  expect(dates).toContain('pms 2026-09-27T19:00');
  expect(dates).toContain('period 2026-10-04T19:00');
  expect(dates).toContain('confirm 2026-10-05T09:00');
  expect(dates).toContain('confirm 2026-10-06T09:00');
  expect(dates).toContain('confirm 2026-10-07T09:00');
  expect(dates).toContain('confirm 2026-10-08T09:00');
  expect(dates).toContain('pms 2026-10-25T19:00');
  expect(dates).toContain(`pms ${addDays('2026-10-05', 28 + 20)}T19:00`);
  expect(reminders[0]).toMatchObject({
    title: 'notif.pms_title',
    body: 'notif.pms_body_partner',
  });
  expect(reminders.find((item) => item.kind === 'confirm')?.categoryId).toBe('confirm-period');
  expect(reminders.length).toBeLessThanOrEqual(16);
});

test('a reminder whose time has already passed today is left out', () => {
  const reminders = reminderSchedule(state(), { date: '2026-09-27', time: '20:00' }, t);
  expect(reminders.some((item) => item.date.startsWith('2026-09-27'))).toBe(false);
  expect(reminders[0].date).toBe('2026-10-04T19:00');
});

test('a time inside the quiet window moves to the nearest edge', () => {
  expect(quietTime('23:30')).toBe('22:00');
  expect(quietTime('06:15')).toBe('08:00');
  expect(quietTime('03:00')).toBe('08:00');
  expect(quietTime('22:00')).toBe('22:00');
  expect(quietTime('08:00')).toBe('08:00');
  expect(quietTime('21:00')).toBe('21:00');

  const reminders = reminderSchedule(
    state({ reminders: { eveningTime: '23:30', morningTime: '06:15' } }),
    { date: '2026-09-27', time: '12:00' },
    t,
  );
  expect(reminders.find((item) => item.kind === 'pms')?.date).toBe('2026-09-27T22:00');
  expect(reminders.find((item) => item.kind === 'confirm')?.date).toBe('2026-10-05T08:00');
});

test('an irregular cycle keeps the dates and says the reminder is possible', () => {
  const starts = ['2026-01-01', '2026-01-22', '2026-03-08', '2026-03-29', '2026-05-13'];
  const reminders = reminderSchedule(
    state({ cycles: starts.map((start) => ({ start })) }),
    { date: '2026-05-13', time: '08:00' },
    t,
  );
  expect(reminders.find((item) => item.kind === 'pms')?.title).toBe('notif.pms_title_possible');
  expect(reminders.find((item) => item.kind === 'period')?.title).toBe('notif.period_title_possible');
  expect(reminders.find((item) => item.kind === 'confirm')?.title).toBe('notif.confirm_title_partner');
});

test('a moderate spread pulls reminders back to the start of the window', () => {
  const starts = ['2026-01-01', '2026-01-25', '2026-02-22', '2026-03-26'];
  const last = starts[starts.length - 1];
  const reminders = reminderSchedule(
    state({ cycles: starts.map((start) => ({ start })) }),
    { date: last, time: '08:00' },
    t,
  );
  const period = reminders.find((item) => item.kind === 'period');
  expect(period?.date.startsWith(addDays(last, 23))).toBe(true);
  expect(period?.title).toBe('notif.period_title');
});

test('discreet mode uses one title and one body, and keeps the confirm actions', () => {
  const reminders = reminderSchedule(
    state({ reminders: { discreet: true }, mode: 'self' }),
    { date: '2026-09-27', time: '12:00' },
    t,
  );
  expect(reminders.every((item) => item.title === 'notif.discreet_title')).toBe(true);
  expect(reminders.every((item) => item.body === 'notif.discreet')).toBe(true);
  expect(reminders.find((item) => item.kind === 'pms')?.body).toBe('notif.discreet');
  expect(reminders.find((item) => item.kind === 'confirm')?.categoryId).toBe('confirm-period');
  const self = reminderSchedule(state({ mode: 'self' }), { date: '2026-09-27', time: '12:00' }, t);
  expect(self.find((item) => item.kind === 'pms')?.body).toBe('notif.pms_body_self');
  expect(self.find((item) => item.kind === 'confirm')?.title).toBe('notif.confirm_title_self');
});

test('nothing is scheduled when every reminder is off or there is no cycle', () => {
  expect(
    reminderSchedule(
      state({ reminders: { pms: false, period: false, confirm: false, ovulation: false } }),
      { date: '2026-09-27', time: '12:00' },
      t,
    ),
  ).toEqual([]);
  expect(reminderSchedule(state({ cycles: [] }), { date: '2026-09-27', time: '12:00' }, t)).toEqual([]);
});

test('three cycles with every reminder stay within 16 notifications', () => {
  const reminders = reminderSchedule(
    state({ reminders: { ovulation: true } }),
    { date: '2026-09-07', time: '08:00' },
    t,
  );
  expect(reminders).toHaveLength(16);
  expect(reminders.map((item) => item.date)).toEqual([...reminders.map((item) => item.date)].sort());
});
