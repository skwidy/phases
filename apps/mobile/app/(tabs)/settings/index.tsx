import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import * as Sharing from 'expo-sharing';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appStateOf, setPendingImport } from '@/backup/pending';
import { ChevronIcon } from '@/components/ChevronIcon';
import { Stepper } from '@/components/Stepper';
import { Toggle } from '@/components/Toggle';
import { deviceToday } from '@/lib/clock';
import { authenticateDevice } from '@/security/authenticate';
import { parseAppState, type AppLanguage, type ReminderClock, type ReminderFlag, useAppStore } from '@/store/useAppStore';
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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const mode = useAppStore((state) => state.mode);
  const partnerName = useAppStore((state) => state.partnerName);
  const language = useAppStore((state) => state.language);
  const defaults = useAppStore((state) => state.defaults);
  const cycles = useAppStore((state) => state.cycles);
  const reminders = useAppStore((state) => state.reminders);
  const faceId = useAppStore((state) => state.security.faceId);
  const setMode = useAppStore((state) => state.setMode);
  const setPartnerName = useAppStore((state) => state.setPartnerName);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setDefaults = useAppStore((state) => state.setDefaults);
  const setReminder = useAppStore((state) => state.setReminder);
  const setReminderTime = useAppStore((state) => state.setReminderTime);
  const setDiscreet = useAppStore((state) => state.setDiscreet);
  const setFaceId = useAppStore((state) => state.setFaceId);
  const resetAll = useAppStore((state) => state.resetAll);
  const [denied, setDenied] = useState(false);
  const [clock, setClock] = useState<ReminderClock | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [lengthsOpen, setLengthsOpen] = useState(false);

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

  const languageName = t(i18n.language.startsWith('en') ? 'dev.language_en' : 'dev.language_fr');
  const languageValue =
    language === 'auto' ? t('settings.language_auto', { lang: languageName }) : languageName;
  const syncLabel = mode === 'partner' && partnerName ? t('settings.sync_with', { name: partnerName }) : t('settings.sync');
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const rows: { flag: ReminderFlag; title: string; time: string; clock: ReminderClock }[] = [
    { flag: 'pms', title: t('onboarding.pms_row'), time: reminders.eveningTime, clock: 'evening' },
    { flag: 'period', title: t('onboarding.period_row'), time: reminders.eveningTime, clock: 'evening' },
    { flag: 'confirm', title: t('onboarding.confirm_row'), time: reminders.morningTime, clock: 'morning' },
    { flag: 'ovulation', title: t('onboarding.ovulation_row'), time: reminders.eveningTime, clock: 'evening' },
  ];

  function chooseMode() {
    Alert.alert(t('settings.mode'), undefined, [
      { text: t('settings.mode_partner'), onPress: () => setMode('partner') },
      { text: t('settings.mode_self'), onPress: () => setMode('self') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  function chooseLanguage() {
    const options: { label: string; value: AppLanguage }[] = [
      { label: t('settings.language_auto', { lang: languageName }), value: 'auto' },
      { label: t('dev.language_fr'), value: 'fr' },
      { label: t('dev.language_en'), value: 'en' },
    ];
    Alert.alert(t('settings.language'), undefined, [
      ...options.map((option) => ({ text: option.label, onPress: () => setLanguage(option.value) })),
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  function commitName() {
    if (nameDraft === null) return;
    setPartnerName(nameDraft);
    setNameDraft(null);
  }

  async function toggleFaceId() {
    if (faceId) {
      setFaceId(false);
      return;
    }
    const outcome = await authenticateDevice({
      prompt: t('lock.reason'),
      cancel: t('common.cancel'),
      fallback: t('lock.passcode'),
    });
    if (outcome === 'success') setFaceId(true);
    if (outcome === 'unavailable') Alert.alert(t('lock.unavailable'));
  }

  async function exportBackup() {
    try {
      const file = new File(Paths.cache, `phases-backup-${deviceToday()}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(appStateOf(useAppStore.getState())));
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(t('settings.export_fail'));
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } catch {
      Alert.alert(t('settings.export_fail'));
    }
  }

  async function importBackup() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'text/plain'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;
    try {
      const parsed = parseAppState(JSON.parse(await new File(asset.uri).text()));
      if (!parsed) {
        Alert.alert(t('settings.import_invalid'));
        return;
      }
      setPendingImport(parsed);
      router.push('/settings/import');
    } catch {
      Alert.alert(t('settings.import_invalid'));
    }
  }

  function erase() {
    Alert.alert(t('settings.erase'), t('settings.erase_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.erase'),
        style: 'destructive',
        onPress: () => {
          resetAll();
          void Notifications.cancelAllScheduledNotificationsAsync();
          router.replace('/onboarding/welcome');
        },
      },
    ]);
  }

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
        <Section title={t('settings.reminders')}>
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
                accessibilityLabel={`${row.clock === 'evening' ? t('settings.evening') : t('settings.morning')} ${
                  reminders[row.flag] ? displayTime(row.time) : t('settings.off')
                }`}
                onPress={() => setClock((current) => (current === row.clock ? null : row.clock))}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
              >
                <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary }}>
                  {reminders[row.flag] ? displayTime(row.time) : t('settings.off')}
                </Text>
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
        </Section>
        {clock ? (
          <DateTimePicker
            value={timeDate(clock === 'evening' ? reminders.eveningTime : reminders.morningTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTime}
          />
        ) : null}
        <Section title={t('settings.cycle')}>
          <ValueRow label={t('settings.mode')} value={t(mode === 'self' ? 'settings.mode_self' : 'settings.mode_partner')} onPress={chooseMode} />
          <View
            style={{
              minHeight: 54,
              flexDirection: 'row',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: theme.line,
            }}
          >
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '700' }}>
              {t(mode === 'self' ? 'settings.name_self' : 'settings.name')}
            </Text>
            {nameDraft === null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(mode === 'self' ? 'settings.name_self' : 'settings.name')}
                onPress={() => setNameDraft(partnerName ?? '')}
                style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginRight: 6 }}>
                  {partnerName ?? '—'}
                </Text>
                <ChevronIcon color={theme.textMuted} />
              </Pressable>
            ) : (
              <TextInput
                accessibilityLabel={t(mode === 'self' ? 'settings.name_self' : 'settings.name')}
                value={nameDraft}
                onChangeText={setNameDraft}
                onBlur={commitName}
                onSubmitEditing={commitName}
                autoFocus
                returnKeyType="done"
                placeholder={t('onboarding.name_placeholder')}
                placeholderTextColor={theme.textMuted}
                style={{
                  minHeight: 44,
                  minWidth: 120,
                  color: theme.text,
                  fontSize: typeScale.secondary,
                  fontFamily: 'ui-rounded',
                  textAlign: 'right',
                }}
              />
            )}
          </View>
          <ValueRow
            label={t('settings.defaults')}
            value={t('settings.lengths', { cycle: defaults.cycleLength, period: defaults.periodLength })}
            onPress={() => setLengthsOpen((open) => !open)}
          />
          {lengthsOpen ? (
            <View style={{ borderBottomWidth: 1, borderBottomColor: theme.line }}>
              <Stepper
                label={t('onboarding.cycle_length')}
                valueLabel={t('common.days_short', { count: defaults.cycleLength })}
                value={defaults.cycleLength}
                min={21}
                max={45}
                decreaseLabel={t('onboarding.step_down')}
                increaseLabel={t('onboarding.step_up')}
                onChange={(cycleLength) => setDefaults({ cycleLength, periodLength: defaults.periodLength })}
              />
              <Stepper
                label={t('onboarding.period_length')}
                valueLabel={t('common.days_short', { count: defaults.periodLength })}
                value={defaults.periodLength}
                min={2}
                max={10}
                decreaseLabel={t('onboarding.step_down')}
                increaseLabel={t('onboarding.step_up')}
                onChange={(periodLength) => setDefaults({ cycleLength: defaults.cycleLength, periodLength })}
              />
            </View>
          ) : null}
          <ValueRow
            label={t('settings.history')}
            value={t('settings.cycle_count', { count: cycles.length })}
            onPress={() => router.push('/settings/history')}
            last
          />
        </Section>
        <Section title={t('settings.privacy')}>
          <SwitchRow label={t('settings.face_id')} value={faceId} onPress={() => void toggleFaceId()} />
          <SwitchRow label={t('settings.discreet')} value={reminders.discreet} onPress={() => setDiscreet(!reminders.discreet)} />
          <ValueRow label={t('settings.language')} value={languageValue} onPress={chooseLanguage} last />
        </Section>
        <Section title={t('settings.data')}>
          <DetailRow label={syncLabel} detail={t('settings.sync_sub')} onPress={() => router.push('/sync/share')} />
          <ValueRow label={t('settings.export')} value="" onPress={() => void exportBackup()} />
          <ValueRow label={t('settings.import')} value="" onPress={() => void importBackup()} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('settings.erase')}
            onPress={erase}
            style={({ pressed }) => ({
              minHeight: 54,
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: theme.regles, fontSize: 16, fontWeight: '700' }}>{t('settings.erase')}</Text>
          </Pressable>
        </Section>
        <Text
          style={{
            marginTop: 28,
            color: theme.textMuted,
            fontSize: typeScale.secondary,
            lineHeight: 20,
            textAlign: 'center',
          }}
        >
          {t('settings.footer', { version })}
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginTop: 22 }}>
      <Text
        style={{
          marginBottom: 8,
          marginLeft: 4,
          color: theme.textMuted,
          fontSize: typeScale.label,
          fontWeight: '800',
          letterSpacing: typeScale.labelTracking,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <View style={{ backgroundColor: theme.surface, borderRadius: radii.card, paddingHorizontal: 16 }}>{children}</View>
    </View>
  );
}

function ValueRow({
  label,
  value,
  onPress,
  last = false,
}: {
  label: string;
  value: string;
  onPress: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value === '' ? label : `${label}, ${value}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      {value === '' ? null : (
        <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginRight: 6 }}>{value}</Text>
      )}
      <ChevronIcon color={theme.textMuted} />
    </Pressable>
  );
}

function DetailRow({ label, detail, onPress }: { label: string; detail: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, paddingVertical: 10 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
        <Text style={{ marginTop: 2, color: theme.textMuted, fontSize: 14 }}>{detail}</Text>
      </View>
      <ChevronIcon color={theme.textMuted} />
    </Pressable>
  );
}

function SwitchRow({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={onPress}
      style={{
        minHeight: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.line,
      }}
    >
      <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '700', marginRight: 12 }}>{label}</Text>
      <Toggle value={value} />
    </Pressable>
  );
}
