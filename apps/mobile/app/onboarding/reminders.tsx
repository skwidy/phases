import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { OnboardingFrame } from '@/components/OnboardingFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Toggle } from '@/components/Toggle';
import { syncNotifications } from '@/reminders/sync';
import { type ReminderFlag, useAppStore } from '@/store/useAppStore';
import { cardChrome, radii, serif, useTheme } from '@/theme';

export default function RemindersScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const reminders = useAppStore((state) => state.reminders);
  const setReminder = useAppStore((state) => state.setReminder);
  const setDiscreet = useAppStore((state) => state.setDiscreet);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [pending, setPending] = useState(false);

  async function enableReminders() {
    if (pending) return;
    setPending(true);
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.status !== 'granted') await Notifications.requestPermissionsAsync();
    } catch {
      // A refused or unavailable prompt still finishes onboarding.
    }
    completeOnboarding();
    void syncNotifications();
  }

  const rows: { flag: ReminderFlag; color: string; title: string; detail: string }[] = [
    {
      flag: 'pms',
      color: theme.spm,
      title: t('onboarding.pms_row'),
      detail: t('onboarding.pms_sub', { time: displayTime(reminders.eveningTime) }),
    },
    {
      flag: 'period',
      color: theme.regles,
      title: t('onboarding.period_row'),
      detail: t('onboarding.period_sub', { time: displayTime(reminders.eveningTime) }),
    },
    {
      flag: 'confirm',
      color: theme.text,
      title: t('onboarding.confirm_row'),
      detail: t('onboarding.confirm_sub', { time: displayTime(reminders.morningTime) }),
    },
    {
      flag: 'ovulation',
      color: theme.ovulation,
      title: t('onboarding.ovulation_row'),
      detail: t('onboarding.ovulation_sub', { time: displayTime(reminders.eveningTime) }),
    },
  ];

  return (
    <OnboardingFrame
      step={3}
      onBack={() => router.back()}
      footer={
        <View>
          <View style={{ marginBottom: 4 }}>
            <PrimaryButton
              label={t('onboarding.reminders_enable')}
              onPress={() => void enableReminders()}
              disabled={pending}
            />
          </View>
          <PrimaryButton label={t('common.later')} variant="plain" onPress={completeOnboarding} />
        </View>
      }
    >
      <Text
        accessibilityRole="header"
        style={{ ...serif, color: theme.text, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 }}
      >
        {t('onboarding.reminders_title')}
      </Text>
      <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: 16, lineHeight: 22 }}>
        {t('onboarding.reminders_text')}
      </Text>
      <View style={{ ...cardChrome(theme), marginTop: 20, paddingHorizontal: 16 }}>
        {rows.map((row, index) => (
          <ReminderRow
            key={row.flag}
            title={row.title}
            detail={row.detail}
            color={row.color}
            enabled={reminders[row.flag]}
            divider={index < rows.length - 1}
            onPress={() => setReminder(row.flag, !reminders[row.flag])}
          />
        ))}
      </View>
      <ReminderRow
        title={t('settings.discreet')}
        detail={t('onboarding.discreet_sub', { label: t('notif.discreet') })}
        enabled={reminders.discreet}
        onPress={() => setDiscreet(!reminders.discreet)}
        boxed
      />
      <Text style={{ marginTop: 14, color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>
        {t('onboarding.reminders_permission')}
      </Text>
    </OnboardingFrame>
  );
}

function displayTime(time: string): string {
  return time.replace(/^0(\d)/, '$1');
}

function ReminderRow({
  title,
  detail,
  color,
  enabled,
  divider = false,
  boxed = false,
  onPress,
}: {
  title: string;
  detail: string;
  color?: string;
  enabled: boolean;
  divider?: boolean;
  boxed?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked: enabled }}
      onPress={onPress}
      style={({ pressed }) => ({
        marginTop: boxed ? 14 : 0,
        paddingHorizontal: boxed ? 16 : 0,
        minHeight: boxed ? 64 : 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: boxed ? radii.card : 0,
        backgroundColor: boxed ? theme.surface : 'transparent',
        borderWidth: boxed ? 1 : 0,
        borderColor: theme.line,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: theme.line,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {color ? (
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      ) : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: theme.textMuted, fontSize: 14 }}>{detail}</Text>
      </View>
      <Toggle value={enabled} />
    </Pressable>
  );
}
