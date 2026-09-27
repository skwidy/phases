import { setDebugToday, today } from '../clock';

const dev = globalThis as { __DEV__?: boolean };

afterEach(() => {
  dev.__DEV__ = true;
  setDebugToday(null);
});

test('setDebugToday overrides the local calendar day in dev', () => {
  dev.__DEV__ = true;
  setDebugToday('2026-09-27');
  expect(today()).toBe('2026-09-27');
  setDebugToday(null);
  expect(today()).toBe(localToday());
});

test('setDebugToday is ignored in production', () => {
  dev.__DEV__ = true;
  setDebugToday('2026-09-27');
  dev.__DEV__ = false;
  expect(today()).toBe(localToday());
  setDebugToday('2028-02-29');
  expect(today()).toBe(localToday());
});

function localToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
