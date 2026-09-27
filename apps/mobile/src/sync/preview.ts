import { diffDays, type ISODate } from '@/cycle/dates';
import { todayStatus } from '@/cycle/engine';
import { mergeCycles } from '@/cycle/merge';

import { type SharedCycles } from './format';

export type SyncPreview = {
  headline: ISODate;
  previousLength: number | null;
  localNextPeriod: ISODate | null;
  matchesLocal: boolean;
  nextPms: ISODate | null;
};

export function syncPreview(
  local: readonly ISODate[],
  defaults: { cycleLength: number; periodLength: number },
  incoming: SharedCycles,
  today: ISODate,
): SyncPreview {
  const merged = mergeCycles(local, incoming.cycles);
  const added = incoming.cycles.filter((date) => !local.includes(date)).sort();
  const source = added.length > 0 ? added : [...incoming.cycles].sort();
  const headline = merged.includes(source[source.length - 1]) ? source[source.length - 1] : merged[merged.length - 1];
  const index = merged.indexOf(headline);
  const localStatus = todayStatus({ cycles: local.map((start) => ({ start })), defaults }, today);
  const next = todayStatus(
    {
      cycles: merged.map((start) => ({ start })),
      defaults: { cycleLength: incoming.cycleLength, periodLength: incoming.periodLength },
    },
    today,
  );
  return {
    headline,
    previousLength: index > 0 ? diffDays(merged[index - 1], headline) : null,
    localNextPeriod: localStatus.nextPeriod,
    matchesLocal: localStatus.nextPeriod === headline,
    nextPms: next.nextPms,
  };
}
