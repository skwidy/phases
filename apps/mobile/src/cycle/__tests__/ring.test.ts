import { dayMarker, lateMarker, RING_GAP, ringArcs } from '../ring';

test('a 28/5 ring spaces five phase arcs by 4, with SPM after the visible luteal arc', () => {
  const arcs = ringArcs(28, 5);
  expect(arcs.map((arc) => arc.phase)).toEqual(['regles', 'folliculaire', 'ovulation', 'luteale', 'spm']);
  expect(arcs[0].start).toBeCloseTo(RING_GAP / 2);
  for (let index = 1; index < arcs.length; index += 1) {
    const previous = arcs[index - 1];
    expect(arcs[index].start - (previous.start + previous.length)).toBeCloseTo(RING_GAP);
  }
  expect(arcs.reduce((sum, arc) => sum + arc.days, 0)).toBe(28);
  expect(arcs.find((arc) => arc.phase === 'luteale')?.days).toBe(6);
  expect(arcs.find((arc) => arc.phase === 'spm')?.days).toBe(7);
});

test('day 24 of a 28-day cycle sits in the upper left, near the design marker', () => {
  const point = dayMarker(24, 28, 5);
  expect(point).not.toBeNull();
  expect(point?.x).toBeGreaterThan(40);
  expect(point?.x).toBeLessThan(60);
  expect(point?.y).toBeGreaterThan(75);
  expect(point?.y).toBeLessThan(100);
});

test('a short cycle drops the empty follicular arc and still covers every day', () => {
  const arcs = ringArcs(21, 5);
  expect(arcs.map((arc) => arc.phase)).toEqual(['regles', 'ovulation', 'luteale', 'spm']);
  expect(arcs.reduce((sum, arc) => sum + arc.days, 0)).toBe(21);
  expect(dayMarker(1, 21, 5)).not.toBeNull();
  expect(dayMarker(21, 21, 5)).not.toBeNull();
});

test('the late marker sits at the top of the ring', () => {
  expect(lateMarker()).toEqual({ x: 150, y: 30 });
  expect(dayMarker(31, 28, 5)).toBeNull();
});
