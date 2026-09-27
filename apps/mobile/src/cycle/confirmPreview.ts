import { diffDays, type ISODate } from './dates';
import { todayStatus, type DateWindow } from './engine';
import { mergeCycles } from './merge';

export type ConfirmPreview = {
  previousLength: number | null;
  nextPms: ISODate | null;
  nextPeriod: ISODate | null;
  window: DateWindow | null;
};

export function confirmPreview(
  cycles: readonly ISODate[],
  defaults: { cycleLength: number; periodLength: number },
  selected: ISODate,
): ConfirmPreview {
  const merged = mergeCycles(cycles, [selected]);
  const status = todayStatus(
    { cycles: merged.map((start) => ({ start })), defaults },
    selected,
  );
  const index = merged.indexOf(selected);
  return {
    previousLength: index > 0 ? diffDays(merged[index - 1], selected) : null,
    nextPms: status.nextPms,
    nextPeriod: status.nextPeriod,
    window: status.window,
  };
}
