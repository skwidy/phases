// Phases — sync format + cycle engine (web copy).
// Format: https://tryphases.io/s#1.<base64url(JSON)>
// JSON: { c: ["YYYY-MM-DD", ...], L: 28, P: 5 }  (cycle start dates, default lengths)
// The payload lives after "#": browsers never send it to the server.

export const SITE = 'https://tryphases.io';
export const APP_SCHEME = 'phases://';
export const VERSION = '1';

const MIN_CYCLE = 21;
const MAX_CYCLE = 45;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

// ---------- encoding ----------

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64) {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encode({ cycles, cycleLength = 28, periodLength = 5 }) {
  const c = [...new Set(cycles)].filter((d) => ISO.test(d)).sort();
  return `${VERSION}.${toBase64Url(JSON.stringify({ c, L: cycleLength, P: periodLength }))}`;
}

export function shareUrl(state) {
  return `${SITE}/s#${encode(state)}`;
}

// Returns { cycles, cycleLength, periodLength } or null when invalid.
export function decode(fragment) {
  try {
    const raw = String(fragment || '').replace(/^#/, '');
    const dot = raw.indexOf('.');
    if (dot < 0 || raw.slice(0, dot) !== VERSION) return null;
    const data = JSON.parse(fromBase64Url(raw.slice(dot + 1)));
    const cycles = Array.isArray(data.c) ? data.c.filter((d) => typeof d === 'string' && ISO.test(d)).sort() : [];
    const L = Number.isInteger(data.L) && data.L >= MIN_CYCLE && data.L <= MAX_CYCLE ? data.L : 28;
    const P = Number.isInteger(data.P) && data.P >= 2 && data.P <= 10 ? data.P : 5;
    if (cycles.length === 0 || cycles.length > 60) return null;
    return { cycles, cycleLength: L, periodLength: P };
  } catch {
    return null;
  }
}

// ---------- dates (calendar days, never timestamps) ----------

export function dayNumber(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}

export function fromDayNumber(n) {
  return new Date(n * 864e5).toISOString().slice(0, 10);
}

export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------- engine ----------

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// Median of the last 6 complete cycles within 21–45 days, else the default.
export function predictCycleLength(cycles, fallback = 28) {
  const days = cycles.map(dayNumber).sort((a, b) => a - b);
  const lengths = [];
  for (let i = 1; i < days.length; i++) lengths.push(days[i] - days[i - 1]);
  const valid = lengths.filter((l) => l >= MIN_CYCLE && l <= MAX_CYCLE).slice(-6);
  if (valid.length === 0) return { length: fallback, sigma: null, irregular: false };
  const length = median(valid);
  let sigma = null;
  if (valid.length >= 3) {
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    sigma = Math.sqrt(valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length);
  }
  return { length, sigma, irregular: sigma !== null && sigma > 5 };
}

// Phase ranges in cycle days (1-based, inclusive).
export function phasesFor(length, periodLength) {
  const o = length - 14;
  return {
    regles: [1, periodLength],
    folliculaire: [periodLength + 1, o - 2],
    ovulation: [o - 1, o + 1],
    luteale: [o + 2, length],
    spm: [length - 6, length],
  };
}

export function phaseOfDay(day, length, periodLength) {
  const p = phasesFor(length, periodLength);
  if (day > length) return 'retard';
  if (day >= p.spm[0]) return 'spm';
  if (day <= p.regles[1]) return 'regles';
  if (day <= p.folliculaire[1]) return 'folliculaire';
  if (day <= p.ovulation[1]) return 'ovulation';
  return 'luteale';
}

export function status({ cycles, cycleLength = 28, periodLength = 5 }, today = todayIso()) {
  const sorted = [...cycles].sort();
  const start = sorted[sorted.length - 1];
  const pred = predictCycleLength(sorted, cycleLength);
  const L = pred.length;
  const day = dayNumber(today) - dayNumber(start) + 1;
  const s = dayNumber(start);
  return {
    start,
    day,
    late: Math.max(0, day - L - 1), // 0 on the expected day, 2 two days after
    cycleLength: L,
    irregular: pred.irregular,
    phase: phaseOfDay(day, L, periodLength),
    nextPms: fromDayNumber(s + (L - 6) - 1),
    nextPeriod: fromDayNumber(s + L),
  };
}
