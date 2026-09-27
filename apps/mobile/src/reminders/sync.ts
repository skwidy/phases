import kvStore from 'expo-sqlite/kv-store';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

import i18n, { resolvedLanguage } from '../i18n';
import { deviceToday } from '../lib/clock';
import { useAppStore } from '../store/useAppStore';
import { markCycleSaved } from './notice';
import {
  CONFIRM_CATEGORY,
  CONFIRM_NO,
  CONFIRM_YES,
  reminderSchedule,
  type ScheduleState,
} from './schedule';

const HANDLED_KEY = 'phases-handled-responses';
const seen = new Set<string>();
let chain: Promise<void> = Promise.resolve();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function scheduleState(): ScheduleState {
  const state = useAppStore.getState();
  return {
    mode: state.mode,
    cycles: state.cycles,
    defaults: state.defaults,
    reminders: state.reminders,
  };
}

function localDate(stamp: string): Date {
  const [day, time] = stamp.split('T');
  const [year, month, date] = day.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(year, month - 1, date, hour, minute, 0, 0);
}

function deviceNow() {
  const clock = new Date();
  const hour = String(clock.getHours()).padStart(2, '0');
  const minute = String(clock.getMinutes()).padStart(2, '0');
  return { date: deviceToday(), time: `${hour}:${minute}` };
}

async function syncNow(): Promise<void> {
  const state = useAppStore.getState();
  const language = resolvedLanguage(state.language);
  if (i18n.language !== language) await i18n.changeLanguage(language);
  const reminders = reminderSchedule(scheduleState(), deviceNow(), (key) => i18n.t(key));
  await Notifications.setNotificationCategoryAsync(CONFIRM_CATEGORY, [
    {
      identifier: CONFIRM_YES,
      buttonTitle: i18n.t('notif.confirm_yes'),
      options: { opensAppToForeground: true },
    },
    {
      identifier: CONFIRM_NO,
      buttonTitle: i18n.t('notif.confirm_no'),
      options: { opensAppToForeground: false },
    },
  ]);
  await Notifications.cancelAllScheduledNotificationsAsync();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') return;
  for (const reminder of reminders) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: reminder.title,
          body: reminder.body,
          categoryIdentifier: reminder.categoryId,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: localDate(reminder.date) },
      });
    } catch {
      // One rejected trigger must not drop the reminders that follow.
    }
  }
}

export function syncNotifications(): Promise<void> {
  const run = chain.then(syncNow, syncNow);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function watched(state: ReturnType<typeof useAppStore.getState>): string {
  return JSON.stringify({
    cycles: state.cycles,
    defaults: state.defaults,
    reminders: state.reminders,
    mode: state.mode,
    partnerName: state.partnerName,
    language: state.language,
  });
}

function responseId(response: Notifications.NotificationResponse): string {
  const requestId = response.notification.request.identifier || String(response.notification.date);
  return `${requestId}:${response.actionIdentifier}`;
}

async function readHandled(): Promise<string[]> {
  try {
    const raw = await kvStore.getItem(HANDLED_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

async function acceptConfirmation(response: Notifications.NotificationResponse | null, openToday: () => void) {
  if (!response || response.actionIdentifier !== CONFIRM_YES) return;
  const id = responseId(response);
  if (seen.has(id)) return;
  seen.add(id);
  const handled = await readHandled();
  if (handled.includes(id)) return;
  try {
    await kvStore.setItem(HANDLED_KEY, JSON.stringify([id, ...handled].slice(0, 30)));
  } catch {
    // The in-memory set still blocks a second tap in this session.
  }
  useAppStore.getState().startCycle(deviceToday());
  void syncNotifications();
  markCycleSaved();
  openToday();
}

export function startReminders(openToday: () => void): () => void {
  let current = watched(useAppStore.getState());
  const unsubscribe = useAppStore.subscribe((state) => {
    const next = watched(state);
    if (next === current) return;
    current = next;
    void syncNotifications();
  });
  const appState = AppState.addEventListener('change', (status) => {
    if (status === 'active') void syncNotifications();
  });
  const responses = Notifications.addNotificationResponseReceivedListener((response) => {
    void acceptConfirmation(response, openToday);
  });
  void syncNotifications();
  void Notifications.getLastNotificationResponseAsync().then((response) => acceptConfirmation(response, openToday));
  return () => {
    unsubscribe();
    appState.remove();
    responses.remove();
  };
}

export async function scheduleTestReminder(): Promise<void> {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    if (asked.status !== 'granted') return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: 'phases-test',
    content: { title: i18n.t('dev.test_title'), body: i18n.t('dev.test_body') },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 },
  });
}
