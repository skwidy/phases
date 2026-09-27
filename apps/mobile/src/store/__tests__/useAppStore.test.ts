import { type StateStorage } from 'zustand/middleware';

import { defaultAppState, parseAppState, createAppStore } from '../useAppStore';

jest.mock('expo-sqlite/kv-store', () => ({
  __esModule: true,
  default: {
    getItem: () => Promise.resolve(null),
    setItem: () => Promise.resolve(),
    removeItem: () => Promise.resolve(),
  },
}));

function memoryStorage() {
  const map = new Map<string, string>();
  const storage: StateStorage = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
  return { storage, read: (key: string) => map.get(key) ?? null };
}

function storeWith(storage: StateStorage = memoryStorage().storage) {
  const store = createAppStore(storage, { skipHydration: true });
  return store;
}

test('startCycle collapses dates less than 5 days apart and keeps a later cycle', async () => {
  const store = storeWith();
  await store.persist.rehydrate();
  store.getState().startCycle('2026-09-04');
  store.getState().startCycle('2026-09-07');
  expect(store.getState().cycles).toEqual([{ start: '2026-09-07' }]);
  store.getState().startCycle('2026-10-05');
  expect(store.getState().cycles.map((cycle) => cycle.start)).toEqual(['2026-09-07', '2026-10-05']);
});

test('importState rejects an invalid payload and leaves cycles unchanged', async () => {
  const store = storeWith();
  await store.persist.rehydrate();
  store.getState().startCycle('2026-09-04');

  expect(store.getState().importState(null)).toBe(false);
  expect(store.getState().importState({ version: 1 })).toBe(false);
  expect(
    store.getState().importState({
      ...defaultAppState(),
      cycles: [{ start: '2026-02-31' }],
    }),
  ).toBe(false);

  expect(store.getState().cycles).toEqual([{ start: '2026-09-04' }]);
  expect(parseAppState({ version: 2 })).toBeNull();
});

test('importState accepts a complete version 1 state', async () => {
  const store = storeWith();
  await store.persist.rehydrate();
  const next = {
    ...defaultAppState(),
    mode: 'self' as const,
    partnerName: '  Sam  ',
    language: 'fr' as const,
    cycles: [{ start: '2026-09-04', periodLength: 5 }],
    onboarded: true,
  };
  expect(store.getState().importState(next)).toBe(true);
  expect(store.getState().mode).toBe('self');
  expect(store.getState().partnerName).toBe('Sam');
  expect(store.getState().cycles).toEqual([{ start: '2026-09-04', periodLength: 5 }]);
  expect(store.getState().onboarded).toBe(true);
});

test('learn stays optional on version 1 and survives a restart', async () => {
  const current = { ...defaultAppState(), cycles: [{ start: '2026-09-04' as const }], onboarded: true };
  const { learn: _learn, ...legacy } = current;
  expect(parseAppState(legacy)?.learn).toEqual({ read: [] });
  expect(parseAppState(legacy)?.cycles).toEqual([{ start: '2026-09-04' }]);
  expect(parseAppState({ ...current, version: 2 } as unknown)).toBeNull();
  expect(
    parseAppState({ ...current, learn: { read: [' cinq-temps ', 'cinq-temps', '', 4] } } as unknown)?.learn.read,
  ).toEqual(['cinq-temps']);

  const { storage, read } = memoryStorage();
  const first = storeWith(storage);
  await first.persist.rehydrate();
  first.getState().markLessonRead('amour-ne-suffit-pas');
  first.getState().markLessonRead('amour-ne-suffit-pas');
  first.getState().markLessonRead('   ');
  expect(first.getState().learn.read).toEqual(['amour-ne-suffit-pas']);

  const saved = JSON.parse(read('phases-state') ?? '') as {
    version: number;
    state: { version: number; learn: { read: string[] } };
  };
  expect(saved.version).toBe(1);
  expect(saved.state.version).toBe(1);
  expect(saved.state.learn.read).toEqual(['amour-ne-suffit-pas']);

  const second = storeWith(storage);
  await second.persist.rehydrate();
  expect(second.getState().version).toBe(1);
  expect(second.getState().learn.read).toEqual(['amour-ne-suffit-pas']);
});

test('persists under phases-state and restores it', async () => {
  const { storage, read } = memoryStorage();
  const first = storeWith(storage);
  await first.persist.rehydrate();
  first.getState().startCycle('2026-09-04');

  const raw = read('phases-state');
  const saved = JSON.parse(raw ?? '') as { version: number; state: { cycles: { start: string }[] } };
  expect(saved.version).toBe(1);
  expect(saved.state.cycles).toEqual([{ start: '2026-09-04' }]);

  const second = storeWith(storage);
  await second.persist.rehydrate();
  expect(second.getState().cycles).toEqual([{ start: '2026-09-04' }]);
});

test('applySharedCycles merges dates and default lengths and leaves the name alone', async () => {
  const store = storeWith();
  await store.persist.rehydrate();
  store.getState().setMode('self');
  store.getState().setPartnerName('Sophie');
  store.getState().startCycle('2026-09-04');
  store.getState().applySharedCycles(['2026-10-02'], { cycleLength: 30, periodLength: 4 });
  expect(store.getState().mode).toBe('self');
  expect(store.getState().partnerName).toBe('Sophie');
  expect(store.getState().cycles.map((cycle) => cycle.start)).toEqual(['2026-09-04', '2026-10-02']);
  expect(store.getState().defaults).toEqual({ cycleLength: 30, periodLength: 4 });
});
