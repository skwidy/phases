import * as Notifications from 'expo-notifications';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isIsoDate } from '@/cycle/dates';
import { exampleCycles, relativeCycles } from '@/dev/fixtures';
import { deviceToday, setDebugToday, today } from '@/lib/clock';
import { formatDay, formatShort } from '@/lib/format';
import { scheduleTestReminder } from '@/reminders/sync';
import { useAppStore } from '@/store/useAppStore';
import { radii, serif, space, type as typeScale, useTheme } from '@/theme';

type ListedNotification = {
  id: string;
  day: string;
  time: string;
  kind: 'pms' | 'period' | 'confirm' | 'ovulation' | 'test' | 'other';
  title: string;
  sort: string;
};

function listedNotification(item: Notifications.NotificationRequest): ListedNotification {
  const match = item.identifier.match(
    /^phases-(pms|period|confirm|ovulation)-(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?$/,
  );
  if (match) {
    const kind = match[1] as ListedNotification['kind'];
    const time = match[3] ?? '';
    return { id: item.identifier, day: match[2], time, kind, title: item.content.title ?? '', sort: `${match[2]}T${time || '00:00'}` };
  }
  if (item.identifier === 'phases-test') {
    const seconds =
      item.trigger && typeof item.trigger === 'object' && 'seconds' in item.trigger && typeof item.trigger.seconds === 'number'
        ? item.trigger.seconds
        : 60;
    const at = new Date(Date.now() + seconds * 1000);
    const hour = String(at.getHours()).padStart(2, '0');
    const minute = String(at.getMinutes()).padStart(2, '0');
    return {
      id: item.identifier,
      day: '',
      time: `${hour}:${minute}`,
      kind: 'test',
      title: item.content.title ?? '',
      sort: '0000',
    };
  }
  return {
    id: item.identifier,
    day: '',
    time: '',
    kind: 'other',
    title: item.content.title ?? item.identifier,
    sort: '9999',
  };
}

export default function DevScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const cycles = useAppStore((state) => state.cycles);
  const resetAll = useAppStore((state) => state.resetAll);
  const [displayed, setDisplayed] = useState(() => today());
  const [draft, setDraft] = useState(() => today());
  const [invalid, setInvalid] = useState(false);
  const [scheduled, setScheduled] = useState<ListedNotification[]>([]);

  const loadScheduled = useCallback(() => {
    void Notifications.getAllScheduledNotificationsAsync().then((items) => {
      setScheduled(items.map(listedNotification).sort((left, right) => (left.sort < right.sort ? -1 : left.sort > right.sort ? 1 : 0)));
    });
  }, []);

  useFocusEffect(loadScheduled);

  if (!__DEV__) return <Redirect href="/" />;

  function applyDate() {
    if (!isIsoDate(draft)) {
      setInvalid(true);
      return;
    }
    setDebugToday(draft);
    setDisplayed(today());
    setInvalid(false);
  }

  function useRealDay() {
    setDebugToday(null);
    const next = today();
    setDisplayed(next);
    setDraft(next);
    setInvalid(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: space.screen, paddingBottom: space.screen * 2 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', opacity: pressed ? 0.55 : 1, marginBottom: space.grid * 2 })}
        >
          <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700' }}>{t('common.back')}</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{ ...serif, color: theme.text, fontSize: typeScale.title, marginBottom: space.grid }}
        >
          {t('dev.title')}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginBottom: space.grid * 2 }}>
          {t('dev.clock_note')}
        </Text>
        <LanguageChoice />
        <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700', marginBottom: space.grid }}>
          {t('dev.displayed_day')}
        </Text>
        <Text style={{ color: theme.text, fontSize: typeScale.body, marginBottom: space.grid * 2 }}>
          {formatDay(displayed, i18n.language)}
        </Text>
        <TextInput
          accessibilityLabel={t('dev.displayed_day')}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => {
            setDraft(value);
            setInvalid(false);
          }}
          placeholder={t('dev.date_placeholder')}
          placeholderTextColor={theme.textMuted}
          value={draft}
          style={{
            minHeight: 44,
            borderWidth: 1,
            borderColor: theme.line,
            backgroundColor: theme.surface,
            color: theme.text,
            borderRadius: radii.button,
            paddingHorizontal: 16,
            fontFamily: 'ui-rounded',
            fontSize: typeScale.body,
            marginBottom: space.grid * 2,
          }}
        />
        {invalid ? (
          <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginBottom: space.grid * 2 }}>
            {t('dev.invalid_date')}
          </Text>
        ) : null}
        <ActionButton label={t('dev.apply_date')} onPress={applyDate} />
        <ActionButton label={t('dev.real_today')} onPress={useRealDay} secondary />
        <ActionButton
          label={t('dev.example_history')}
          hint={t('dev.example_history_sub')}
          onPress={() => useAppStore.setState({ cycles: exampleCycles() })}
        />
        <ActionButton
          label={t('dev.relative_history')}
          hint={t('dev.relative_history_sub')}
          onPress={() => useAppStore.setState({ cycles: relativeCycles(deviceToday()) })}
        />
        <ActionButton label={t('dev.reset')} onPress={resetAll} secondary />
        <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700', marginBottom: space.grid }}>
          {scheduled.length === 0 ? t('dev.scheduled') : t('dev.scheduled_heading', { count: scheduled.length })}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 20, marginBottom: space.grid * 2 }}>
          {scheduled.length === 0 ? t('dev.scheduled_empty') : t('dev.scheduled_note')}
        </Text>
        {scheduled.map((item) => (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={{ width: 108, color: theme.text, fontSize: typeScale.secondary, fontWeight: '700' }}>
              {item.day ? formatShort(item.day, i18n.language) : item.time}
            </Text>
            <Text style={{ width: 52, color: theme.textMuted, fontSize: typeScale.secondary }}>
              {item.day ? item.time : ''}
            </Text>
            <Text style={{ flex: 1, color: theme.text, fontSize: typeScale.secondary }}>
              {item.kind === 'other' ? item.title : t(`dev.kind_${item.kind}`)}
            </Text>
          </View>
        ))}
        <ActionButton
          label={t('dev.test_reminder')}
          onPress={() => {
            void scheduleTestReminder().then(loadScheduled);
          }}
        />
        <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700' }}>
          {t('dev.cycle_count', { count: cycles.length })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  hint,
  onPress,
  secondary = false,
}: {
  label: string;
  hint?: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 56,
        marginBottom: space.grid * 2,
        borderRadius: radii.button,
        backgroundColor: secondary ? theme.surface : theme.accentBg,
        borderWidth: secondary ? 1 : 0,
        borderColor: theme.line,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? theme.text : theme.accentFg,
          fontSize: typeScale.body,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
      {hint ? (
        <Text style={{ color: secondary ? theme.textMuted : theme.accentFg, fontSize: typeScale.label, textAlign: 'center' }}>
          {hint}
        </Text>
      ) : null}
    </Pressable>
  );
}

function LanguageChoice() {
  const theme = useTheme();
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const options = [
    ['auto', t('dev.language_auto')],
    ['fr', t('dev.language_fr')],
    ['en', t('dev.language_en')],
  ] as const;

  return (
    <View style={{ marginBottom: space.grid * 2 }}>
      <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700', marginBottom: space.grid }}>
        {t('settings.language')}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.grid }}>
        {options.map(([value, label]) => {
          const selected = language === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected }}
              onPress={() => setLanguage(value)}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 44,
                borderRadius: radii.button,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? theme.accentBg : theme.surface,
                borderWidth: selected ? 0 : 1,
                borderColor: theme.line,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: selected ? theme.accentFg : theme.text, fontSize: typeScale.secondary, fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
