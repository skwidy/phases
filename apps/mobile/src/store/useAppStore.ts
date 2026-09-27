import kvStore from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { isIsoDate, type ISODate } from '../cycle/dates';
import { type CycleRecord } from '../cycle/engine';
import { mergeCycles } from '../cycle/merge';

const STORAGE_KEY = 'phases-state';
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export type Mode = 'partner' | 'self';
export type AppLanguage = 'auto' | 'fr' | 'en';
export type ReminderFlag = 'pms' | 'period' | 'confirm' | 'ovulation';
export type ReminderClock = 'evening' | 'morning';

export type AppState = {
  version: 1;
  mode: Mode;
  partnerName?: string;
  language: AppLanguage;
  cycles: CycleRecord[];
  defaults: { cycleLength: number; periodLength: number };
  reminders: {
    pms: boolean;
    period: boolean;
    confirm: boolean;
    ovulation: boolean;
    eveningTime: string;
    morningTime: string;
    discreet: boolean;
  };
  security: { faceId: boolean };
  learn: { read: string[] };
  onboarded: boolean;
};

type AppActions = {
  setMode: (mode: Mode) => void;
  setPartnerName: (name: string) => void;
  setDefaults: (defaults: AppState['defaults']) => void;
  completeOnboarding: () => void;
  startCycle: (date: ISODate) => void;
  editCycle: (from: ISODate, to: ISODate) => void;
  deleteCycle: (start: ISODate) => void;
  setReminder: (flag: ReminderFlag, enabled: boolean) => void;
  setReminderTime: (clock: ReminderClock, time: string) => void;
  setDiscreet: (discreet: boolean) => void;
  setFaceId: (faceId: boolean) => void;
  setLanguage: (language: AppLanguage) => void;
  markLessonRead: (id: string) => void;
  importState: (value: unknown) => boolean;
  resetAll: () => void;
};

export type AppStore = AppState & AppActions;

export function defaultAppState(): AppState {
  return {
    version: 1,
    mode: 'partner',
    partnerName: undefined,
    language: 'auto',
    cycles: [],
    defaults: { cycleLength: 28, periodLength: 5 },
    reminders: {
      pms: true,
      period: true,
      confirm: true,
      ovulation: false,
      eveningTime: '19:00',
      morningTime: '09:00',
      discreet: false,
    },
    security: { faceId: false },
    learn: { read: [] },
    onboarded: false,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIntIn(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function learnFrom(value: unknown): { read: string[] } {
  if (!isRecord(value) || !Array.isArray(value.read)) return { read: [] };
  const read: string[] = [];
  const seen = new Set<string>();
  for (const item of value.read) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (id === '' || seen.has(id)) continue;
    seen.add(id);
    read.push(id);
  }
  return { read };
}

function cycleFrom(start: ISODate, periodLength: number | undefined): CycleRecord {
  return periodLength === undefined ? { start } : { start, periodLength };
}

function cyclesFrom(starts: readonly ISODate[], periodByStart: ReadonlyMap<ISODate, number | undefined>): CycleRecord[] {
  return starts.map((start) => cycleFrom(start, periodByStart.get(start)));
}

export function parseAppState(value: unknown): AppState | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (value.mode !== 'partner' && value.mode !== 'self') return null;
  if (value.language !== 'auto' && value.language !== 'fr' && value.language !== 'en') return null;
  if (typeof value.onboarded !== 'boolean') return null;
  if (value.partnerName !== undefined && typeof value.partnerName !== 'string') return null;
  if (!isRecord(value.defaults)) return null;
  if (!isIntIn(value.defaults.cycleLength, 21, 45) || !isIntIn(value.defaults.periodLength, 2, 10)) return null;
  if (!isRecord(value.reminders)) return null;
  const reminders = value.reminders;
  if (
    typeof reminders.pms !== 'boolean' ||
    typeof reminders.period !== 'boolean' ||
    typeof reminders.confirm !== 'boolean' ||
    typeof reminders.ovulation !== 'boolean' ||
    typeof reminders.discreet !== 'boolean'
  ) {
    return null;
  }
  if (typeof reminders.eveningTime !== 'string' || !TIME.test(reminders.eveningTime)) return null;
  if (typeof reminders.morningTime !== 'string' || !TIME.test(reminders.morningTime)) return null;
  if (!isRecord(value.security) || typeof value.security.faceId !== 'boolean') return null;
  if (!Array.isArray(value.cycles)) return null;

  const cycles: CycleRecord[] = [];
  const seen = new Set<string>();
  for (const item of value.cycles) {
    if (!isRecord(item) || typeof item.start !== 'string' || !isIsoDate(item.start)) return null;
    if (seen.has(item.start)) return null;
    seen.add(item.start);
    if (item.periodLength !== undefined && !isIntIn(item.periodLength, 2, 10)) return null;
    cycles.push(cycleFrom(item.start, item.periodLength));
  }
  cycles.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));

  const partnerName = typeof value.partnerName === 'string' ? value.partnerName.trim() : '';
  return {
    version: 1,
    mode: value.mode,
    partnerName: partnerName === '' ? undefined : partnerName,
    language: value.language,
    cycles,
    defaults: {
      cycleLength: value.defaults.cycleLength,
      periodLength: value.defaults.periodLength,
    },
    reminders: {
      pms: reminders.pms,
      period: reminders.period,
      confirm: reminders.confirm,
      ovulation: reminders.ovulation,
      eveningTime: reminders.eveningTime,
      morningTime: reminders.morningTime,
      discreet: reminders.discreet,
    },
    security: { faceId: value.security.faceId },
    learn: learnFrom(value.learn),
    onboarded: value.onboarded,
  };
}

function createActions(set: (partial: Partial<AppState>) => void, get: () => AppStore): AppActions {
  return {
    setMode: (mode) => {
      if (mode !== 'partner' && mode !== 'self') return;
      set({ mode });
    },
    setPartnerName: (name) => {
      const trimmed = name.trim();
      set({ partnerName: trimmed === '' ? undefined : trimmed });
    },
    setDefaults: (defaults) => {
      if (!isIntIn(defaults.cycleLength, 21, 45) || !isIntIn(defaults.periodLength, 2, 10)) return;
      set({
        defaults: { cycleLength: defaults.cycleLength, periodLength: defaults.periodLength },
      });
    },
    completeOnboarding: () => set({ onboarded: true }),
    startCycle: (date) => {
      if (!isIsoDate(date)) return;
      const current = get().cycles;
      const merged = mergeCycles(
        current.map((cycle) => cycle.start),
        [date],
      );
      const periodByStart = new Map(current.map((cycle) => [cycle.start, cycle.periodLength]));
      set({ cycles: cyclesFrom(merged, periodByStart) });
    },
    editCycle: (from, to) => {
      if (!isIsoDate(to)) return;
      const current = get().cycles;
      const edited = current.find((cycle) => cycle.start === from);
      if (!edited) return;
      const others = current.filter((cycle) => cycle.start !== from);
      const merged = mergeCycles(
        others.map((cycle) => cycle.start),
        [to],
      );
      const periodByStart = new Map(others.map((cycle) => [cycle.start, cycle.periodLength]));
      if (edited.periodLength !== undefined) periodByStart.set(to, edited.periodLength);
      set({ cycles: cyclesFrom(merged, periodByStart) });
    },
    deleteCycle: (start) => {
      set({ cycles: get().cycles.filter((cycle) => cycle.start !== start) });
    },
    setReminder: (flag, enabled) => {
      if (flag !== 'pms' && flag !== 'period' && flag !== 'confirm' && flag !== 'ovulation') return;
      set({ reminders: { ...get().reminders, [flag]: enabled } });
    },
    setReminderTime: (clock, time) => {
      if ((clock !== 'evening' && clock !== 'morning') || !TIME.test(time)) return;
      const key = clock === 'evening' ? 'eveningTime' : 'morningTime';
      set({ reminders: { ...get().reminders, [key]: time } });
    },
    setDiscreet: (discreet) => set({ reminders: { ...get().reminders, discreet } }),
    setFaceId: (faceId) => set({ security: { faceId } }),
    setLanguage: (language) => {
      if (language !== 'auto' && language !== 'fr' && language !== 'en') return;
      set({ language });
    },
    markLessonRead: (id) => {
      const trimmed = id.trim();
      if (trimmed === '' || get().learn.read.includes(trimmed)) return;
      set({ learn: { read: [...get().learn.read, trimmed] } });
    },
    importState: (value) => {
      const parsed = parseAppState(value);
      if (!parsed) return false;
      set(parsed);
      return true;
    },
    resetAll: () => set(defaultAppState()),
  };
}

export function createAppStore(storage: StateStorage, options?: { skipHydration?: boolean }) {
  return create<AppStore>()(
    persist(
      (set, get) => ({
        ...defaultAppState(),
        ...createActions(set, get),
      }),
      {
        name: STORAGE_KEY,
        storage: createJSONStorage(() => storage),
        version: 1,
        skipHydration: options?.skipHydration ?? false,
        partialize: (state) => ({
          version: state.version,
          mode: state.mode,
          partnerName: state.partnerName,
          language: state.language,
          cycles: state.cycles,
          defaults: state.defaults,
          reminders: state.reminders,
          security: state.security,
          learn: state.learn,
          onboarded: state.onboarded,
        }),
        migrate: (persisted) => parseAppState(persisted) ?? defaultAppState(),
        merge: (persisted, current) => ({
          ...current,
          ...(parseAppState(persisted) ?? defaultAppState()),
        }),
      },
    ),
  );
}

const sqliteStorage: StateStorage = {
  getItem: (key) => kvStore.getItem(key),
  setItem: (key, value) => kvStore.setItem(key, value),
  removeItem: (key) => kvStore.removeItem(key),
};

export const useAppStore = createAppStore(sqliteStorage);
