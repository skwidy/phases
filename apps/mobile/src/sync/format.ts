import { type ISODate } from '@/cycle/dates';

export const SITE = 'https://tryphases.io';
export const APP_SCHEME = 'phases://';
export const VERSION = '1';

const MIN_CYCLE = 21;
const MAX_CYCLE = 45;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type SharedCycles = {
  cycles: ISODate[];
  cycleLength: number;
  periodLength: number;
};

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encode({
  cycles,
  cycleLength = 28,
  periodLength = 5,
}: {
  cycles: readonly string[];
  cycleLength?: number;
  periodLength?: number;
}): string {
  const c = [...new Set(cycles)].filter((d) => ISO.test(d)).sort();
  return `${VERSION}.${toBase64Url(JSON.stringify({ c, L: cycleLength, P: periodLength }))}`;
}

export function shareUrl(state: { cycles: readonly string[]; cycleLength?: number; periodLength?: number }): string {
  return `${SITE}/s#${encode(state)}`;
}

export function decode(fragment: string | null | undefined): SharedCycles | null {
  try {
    const raw = String(fragment || '').replace(/^#/, '');
    const dot = raw.indexOf('.');
    if (dot < 0 || raw.slice(0, dot) !== VERSION) return null;
    const data: unknown = JSON.parse(fromBase64Url(raw.slice(dot + 1)));
    if (typeof data !== 'object' || data === null) return null;
    const record = data as { c?: unknown; L?: unknown; P?: unknown };
    const cycles = Array.isArray(record.c)
      ? record.c.filter((d): d is ISODate => typeof d === 'string' && ISO.test(d)).sort()
      : [];
    const L = Number.isInteger(record.L) && (record.L as number) >= MIN_CYCLE && (record.L as number) <= MAX_CYCLE ? (record.L as number) : 28;
    const P = Number.isInteger(record.P) && (record.P as number) >= 2 && (record.P as number) <= 10 ? (record.P as number) : 5;
    if (cycles.length === 0 || cycles.length > 60) return null;
    return { cycles, cycleLength: L, periodLength: P };
  } catch {
    return null;
  }
}

export function fragmentFromLink(value: string): string | null {
  const trimmed = value.trim();
  const hash = trimmed.indexOf('#');
  if (hash < 0) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  const app = url.protocol === 'phases:' && url.hostname === 's';
  const web = url.protocol === 'https:' && url.hostname === 'tryphases.io' && (url.pathname === '/s' || url.pathname === '/s/');
  if (!app && !web) return null;
  return trimmed.slice(hash + 1);
}
