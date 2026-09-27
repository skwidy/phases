import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Toggle } from '@/components/Toggle';
import { type ReminderClock, type ReminderFlag, useAppStore } from '@/store/useAppStore';
import { radii, space, type as typeScale, useTheme } from '@/theme';

function displayTime(time: string): string {
  return time.replace(/^0/, '');
}

function timeDate(time: string): Date {
  const [hour, minute] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function clockTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const reminders = useAppStore((state) => state.reminders);
  const setReminder = useAppStore((state) => state.setReminder);
  const setReminderTime = useAppStore((state) => state.setReminderTime);
  const [denied, setDenied] = useState(false);
  const [clock, setClock] = useState<ReminderClock | null>(null);

  useFocusEffect(
    useCallback(() => {
      void Notifications.getPermissionsAsync().then((permission) => {
        setDenied(permission.status === 'denied');
      });
    }, []),
  );

  function onTime(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setClock(null);
    if (event.type === 'dismissed' || !date || !clock) return;
    setReminderTime(clock, clockTime(date));
  }

  const rows: { flag: ReminderFlag; title: string; time: string; clock: ReminderClock }[] = [
    { flag: 'pms', title: t('onboarding.pms_row'), time: reminders.eveningTime, clock: 'evening' },
    { flag: 'period', title: t('onboarding.period_row'), time: reminders.eveningTime, clock: 'evening' },
    { flag: 'confirm', title: t('onboarding.confirm_row'), time: reminders.morningTime, clock: 'morning' },
    { flag: 'ovulation', title: t('onboarding.ovulation_row'), time: reminders.eveningTime, clock: 'evening' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('dev.open')}
            delayLongPress={3000}
            onLongPress={() => router.push('/dev')}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text
              accessibilityRole="header"
              style={{ color: theme.text, fontSize: typeScale.title, fontWeight: '800', letterSpacing: -0.4 }}
            >
              {t('nav.settings')}
            </Text>
          </Pressable>
        ) : (
          <Text
            accessibilityRole="header"
            style={{ color: theme.text, fontSize: typeScale.title, fontWeight: '800', letterSpacing: -0.4 }}
          >
            {t('nav.settings')}
          </Text>
        )}
        {denied ? (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: radii.button,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.ovulation,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ flex: 1, color: theme.text, fontSize: typeScale.secondary, lineHeight: 20, marginRight: 12 }}>
              <Text style={{ fontWeight: '800' }}>{t('settings.notifs_off')}</Text> {t('settings.notifs_off_sub')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings.enable')}
              onPress={() => void Linking.openSettings()}
              style={({ pressed }) => ({
                minHeight: 44,
                paddingHorizontal: 12,
                borderRadius: 12,
                backgroundColor: theme.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: theme.accentFg, fontSize: 14, fontWeight: '800' }}>{t('settings.enable')}</Text>
            </Pressable>
          </View>
        ) : null}
        <Text
          style={{
            marginTop: 22,
            marginBottom: 8,
            marginLeft: 4,
            color: theme.textMuted,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
          }}
        >
          {t('settings.reminders').toUpperCase()}
        </Text>
        <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, paddingHorizontal: 16 }}>
          {rows.map((row, index) => (
            <View
              key={row.flag}
              style={{
                minHeight: 54,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: index === rows.length - 1 ? 0 : 1,
                borderBottomColor: theme.line,
              }}
            >
              <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '700' }}>{row.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${row.clock === 'evening' ? t('settings.evening') : t('settings.morning')} ${displayTime(row.time)}`}
                onPress={() => setClock((current) => (current === row.clock ? null : row.clock))}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
              >
                <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary }}>{displayTime(row.time)}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel={row.title}
                accessibilityState={{ checked: reminders[row.flag] }}
                onPress={() => setReminder(row.flag, !reminders[row.flag])}
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Toggle value={reminders[row.flag]} />
              </Pressable>
            </View>
          ))}
        </View>
        {clock ? (
          <DateTimePicker
            value={timeDate(clock === 'evening' ? reminders.eveningTime : reminders.morningTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTime}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
