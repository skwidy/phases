// Run: node tests/sync.test.mjs
import assert from 'node:assert/strict';
import { encode, decode, shareUrl, status, predictCycleLength, phaseOfDay } from '../apps/web/assets/sync.js';

const state = { cycles: ['2026-08-07', '2026-09-04'], cycleLength: 28, periodLength: 5 };

// round trip
const frag = encode(state);
assert.ok(frag.startsWith('1.'));
assert.deepEqual(decode(frag), state);
assert.deepEqual(decode('#' + frag), state);
assert.ok(shareUrl(state).startsWith('https://tryphases.io/s#1.'));

// junk is rejected
assert.equal(decode(''), null);
assert.equal(decode('2.abc'), null);
assert.equal(decode('1.!!!'), null);

// phases on a 28/5 cycle
assert.equal(phaseOfDay(1, 28, 5), 'regles');
assert.equal(phaseOfDay(6, 28, 5), 'folliculaire');
assert.equal(phaseOfDay(14, 28, 5), 'ovulation');
assert.equal(phaseOfDay(16, 28, 5), 'luteale');
assert.equal(phaseOfDay(22, 28, 5), 'spm');
assert.equal(phaseOfDay(30, 28, 5), 'retard');

// status: 27 Sept 2026 is day 24, PMS, next period 2 Oct
const s = status(state, '2026-09-27');
assert.equal(s.day, 24);
assert.equal(s.phase, 'spm');
assert.equal(s.nextPeriod, '2026-10-02');
assert.equal(s.nextPms, '2026-09-25');
assert.equal(s.late, 0);

// late
assert.equal(status(state, '2026-10-04').late, 2);

// median + irregularity
const hist = ['2026-04-16', '2026-05-13', '2026-06-11', '2026-07-09', '2026-08-07', '2026-09-04'];
assert.equal(predictCycleLength(hist).length, 28);
assert.equal(predictCycleLength(hist).irregular, false);
const wild = ['2026-01-01', '2026-01-23', '2026-03-01', '2026-03-24', '2026-05-01'];
assert.equal(predictCycleLength(wild).irregular, true);

// DST-safe: day counts across the October clock change
assert.equal(status({ cycles: ['2026-10-20'] }, '2026-10-30').day, 11);

console.log('sync.test: all good');
