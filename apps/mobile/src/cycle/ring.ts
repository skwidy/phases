import { phaseOfDay, phasesFor, type Phase } from './engine';

export const RING_SIZE = 300;
export const RING_RADIUS = 120;
export const RING_STROKE = 20;
export const RING_GAP = 4;
export const RING_CENTER = RING_SIZE / 2;

const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export type RingPhase = Exclude<Phase, 'retard'>;

export type RingArc = {
  phase: RingPhase;
  start: number;
  length: number;
  dayStart: number;
  days: number;
};

const PHASES: RingPhase[] = ['regles', 'folliculaire', 'ovulation', 'luteale', 'spm'];

function spans(cycleLength: number, periodLength: number): Omit<RingArc, 'start' | 'length'>[] {
  const phases = phasesFor(cycleLength, periodLength);
  const spmStart = phases.spm[0];
  return [
    { phase: 'regles', dayStart: phases.regles[0], days: phases.regles[1] - phases.regles[0] + 1 },
    {
      phase: 'folliculaire',
      dayStart: phases.folliculaire[0],
      days: phases.folliculaire[1] - phases.folliculaire[0] + 1,
    },
    {
      phase: 'ovulation',
      dayStart: phases.ovulation[0],
      days: phases.ovulation[1] - phases.ovulation[0] + 1,
    },
    { phase: 'luteale', dayStart: phases.luteale[0], days: spmStart - phases.luteale[0] },
    { phase: 'spm', dayStart: phases.spm[0], days: phases.spm[1] - phases.spm[0] + 1 },
  ];
}

export function ringArcs(cycleLength: number, periodLength: number): RingArc[] {
  const visible = spans(cycleLength, periodLength).filter((span) => span.days > 0);
  const totalDays = visible.reduce((sum, span) => sum + span.days, 0);
  const drawable = CIRCUMFERENCE - visible.length * RING_GAP;
  let cursor = RING_GAP / 2;
  return visible.map((span) => {
    const length = (drawable * span.days) / totalDays;
    const arc = { ...span, start: cursor, length };
    cursor += length + RING_GAP;
    return arc;
  });
}

export function dayMarker(
  day: number,
  cycleLength: number,
  periodLength: number,
): { x: number; y: number } | null {
  if (day < 1 || day > cycleLength) return null;
  if (phaseOfDay(day, cycleLength, periodLength) === 'retard') return null;
  const arc = ringArcs(cycleLength, periodLength).find(
    (item) => day >= item.dayStart && day < item.dayStart + item.days,
  );
  if (!arc) return null;
  const along = arc.start + ((day - arc.dayStart + 0.5) / arc.days) * arc.length;
  const theta = along / RING_RADIUS;
  return {
    x: RING_CENTER + RING_RADIUS * Math.sin(theta),
    y: RING_CENTER - RING_RADIUS * Math.cos(theta),
  };
}

export function lateMarker(): { x: number; y: number } {
  return { x: RING_CENTER, y: RING_CENTER - RING_RADIUS };
}

export function ringPhaseOrder(phase: RingPhase): number {
  return PHASES.indexOf(phase);
}
