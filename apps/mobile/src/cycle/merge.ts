import { diffDays, type ISODate } from './dates';

const SAME_CYCLE_DAYS = 5;

type Marked = {
  date: ISODate;
  incoming: boolean;
  order: number;
};

function pick(cluster: readonly Marked[]): ISODate {
  let chosen = cluster[0];
  for (const item of cluster) {
    const incomingReplaces = item.incoming && !chosen.incoming;
    const laterEntry = item.incoming === chosen.incoming && item.order > chosen.order;
    if (incomingReplaces || laterEntry) chosen = item;
  }
  return chosen.date;
}

export function mergeCycles(existing: readonly ISODate[], incoming: readonly ISODate[]): ISODate[] {
  const marked: Marked[] = [
    ...existing.map((date, order) => ({ date, incoming: false, order })),
    ...incoming.map((date, index) => ({ date, incoming: true, order: existing.length + index })),
  ];
  const byDate = [...marked].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const clusters: Marked[][] = [];

  for (const item of byDate) {
    const last = clusters[clusters.length - 1];
    const previous = last?.[last.length - 1];
    if (previous && diffDays(previous.date, item.date) < SAME_CYCLE_DAYS) last.push(item);
    else clusters.push([item]);
  }

  return clusters.map(pick).sort();
}
