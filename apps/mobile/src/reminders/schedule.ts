import { addDays, type ISODate } from '../cycle/dates';
import { predictCycleLength } from '../cycle/engine';

export const CONFIRM_CATEGORY = 'confirm-period';
export const CONFIRM_YES = 'confirm-yes';
export const CONFIRM_NO = 'confirm-no';

const CYCLES = 3;
const MAX_NOTIFICATIONS = 16;
const QUIET_START = 22 * 60;
const QUIET_END = 8 * 60;
const DAY = 24 * 60;

export type ReminderKind = 'pms' | 'period' | 'confirm' | 'ovulation';

export type ScheduleNow = {
  date: ISODate;
  time: string;
};

export type ScheduleState = {
  mode: 'partner' | 'self';
  cycles: readonly { start: ISODate }[];
  defaults: { cycleLength: number; periodLength: number };
  reminders: {
    pms: boolean;
    period: boolean;
    confirm: boolean;
    ovulation: boolean;
    eveningTime: string;
    morningTime: string;
    discreet: boolean;
  };
};

export type ScheduledReminder = {
  id: string;
  date: string;
  kind: ReminderKind;
  title: string;
  body: string;
  categoryId?: string;
};

export type ReminderCopy = (key: string) => string;

type Draft = {
  kind: ReminderKind;
  offset: number;
  time: string;
};

export function quietTime(time: string): string {
  const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  if (minutes >= QUIET_END && minutes < QUIET_START) return time;
  const toEvening = minutes >= QUIET_START ? minutes - QUIET_START : minutes + (DAY - QUIET_START);
  const toMorning = minutes >= QUIET_START ? DAY - minutes + QUIET_END : QUIET_END - minutes;
  if (toMorning < toEvening) return '08:00';
  if (toEvening < toMorning) return '22:00';
  return '08:00';
}

export function uncertaintyPad(sigma: number | null): number {
  if (sigma === null || sigma <= 2 || sigma > 5) return 0;
  return Math.ceil(sigma);
}

export function reminderOffsets(
  length: number,
  flags: { pms: boolean; period: boolean; ovulation: boolean; confirm: boolean },
): { kind: ReminderKind; offset: number }[] {
  const drafts: { kind: ReminderKind; offset: number }[] = [];
  if (flags.pms) drafts.push({ kind: 'pms', offset: length - 8 });
  if (flags.ovulation) drafts.push({ kind: 'ovulation', offset: length - 17 });
  if (flags.period) drafts.push({ kind: 'period', offset: length - 1 });
  if (flags.confirm) {
    for (let extra = 0; extra < 4; extra += 1) drafts.push({ kind: 'confirm', offset: length + extra });
  }
  return drafts;
}

function copyFor(
  kind: ReminderKind,
  state: ScheduleState,
  irregular: boolean,
  t: ReminderCopy,
): { title: string; body: string } {
  if (state.reminders.discreet) {
    return { title: t('notif.discreet_title'), body: t('notif.discreet') };
  }
  const self = state.mode === 'self';
  if (kind === 'confirm') {
    return {
      title: t(self ? 'notif.confirm_title_self' : 'notif.confirm_title_partner'),
      body: t('notif.confirm_body'),
    };
  }
  if (kind === 'ovulation') {
    return {
      title: t(irregular ? 'notif.ovulation_title_possible' : 'notif.ovulation_title'),
      body: t('notif.ovulation_body'),
    };
  }
  const audience = self ? 'self' : 'partner';
  return {
    title: t(irregular ? `notif.${kind}_title_possible` : `notif.${kind}_title`),
    body: t(`notif.${kind}_body_${audience}`),
  };
}

export function reminderSchedule(
  state: ScheduleState,
  now: ScheduleNow,
  t: ReminderCopy,
): ScheduledReminder[] {
  const starts = state.cycles.map((cycle) => cycle.start);
  const last = [...starts].sort().at(-1);
  if (!last) return [];

  const flags = state.reminders;
  if (!flags.pms && !flags.period && !flags.confirm && !flags.ovulation) return [];

  const prediction = predictCycleLength(starts, state.defaults.cycleLength);
  const length = prediction.length;
  const pad = uncertaintyPad(prediction.sigma);
  const evening = quietTime(flags.eveningTime);
  const morning = quietTime(flags.morningTime);
  const drafts: Draft[] = reminderOffsets(length, flags).map((draft) => ({
    ...draft,
    time: draft.kind === 'confirm' ? morning : evening,
  }));

  const nowStamp = `${now.date}T${now.time}`;
  const reminders: ScheduledReminder[] = [];
  for (let cycle = 0; cycle < CYCLES; cycle += 1) {
    const start = addDays(last, cycle * length);
    for (const draft of drafts) {
      const day = addDays(start, draft.offset - pad);
      const date = `${day}T${draft.time}`;
      if (date <= nowStamp) continue;
      const text = copyFor(draft.kind, state, prediction.irregular, t);
      reminders.push({
        id: `phases-${draft.kind}-${date}`,
        date,
        kind: draft.kind,
        title: text.title,
        body: text.body,
        categoryId: draft.kind === 'confirm' ? CONFIRM_CATEGORY : undefined,
      });
    }
  }

  return reminders.sort((left, right) => (left.date < right.date ? -1 : left.date > right.date ? 1 : 0)).slice(0, MAX_NOTIFICATIONS);
}
