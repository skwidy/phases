import { addDays, type ISODate } from './dates';

export type ReminderFlags = {
  pms: boolean;
  period: boolean;
  confirm: boolean;
  ovulation: boolean;
};

export function nextReminderDate(
  start: ISODate,
  length: number,
  flags: ReminderFlags,
  today: ISODate,
): ISODate | null {
  const dates: ISODate[] = [];
  let cycleStart = start;
  for (let cycle = 0; cycle < 3; cycle += 1) {
    if (flags.pms) dates.push(addDays(cycleStart, length - 8));
    if (flags.ovulation) dates.push(addDays(cycleStart, length - 17));
    if (flags.period) dates.push(addDays(cycleStart, length - 1));
    if (flags.confirm) {
      for (let extra = 0; extra < 4; extra += 1) dates.push(addDays(cycleStart, length + extra));
    }
    cycleStart = addDays(cycleStart, length);
  }
  const upcoming = dates.filter((date) => date >= today).sort();
  return upcoming[0] ?? null;
}
