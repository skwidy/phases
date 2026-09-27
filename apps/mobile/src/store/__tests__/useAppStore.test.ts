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
