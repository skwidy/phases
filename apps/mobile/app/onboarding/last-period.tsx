import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, Text, View } from 'react-native';

import { MonthCalendar } from '@/components/MonthCalendar';
import { OnboardingFrame } from '@/components/OnboardingFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Stepper } from '@/components/Stepper';
import { type ISODate } from '@/cycle/dates';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { cardChrome, serif, useTheme } from '@/theme';

export default function LastPeriodScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const mode = useAppStore((state) => state.mode);
  const defaults = useAppStore((state) => state.defaults);
  const setDefaults = useAppStore((state) => state.setDefaults);
  const startCycle = useAppStore((state) => state.startCycle);
  const [selected, setSelected] = useState<ISODate | null>(null);
  const [month, setMonth] = useState(() => {
    const [year, monthNumber] = today().split('-').map(Number);
    return { year, month: monthNumber };
  });

  function continueOnboarding() {
    if (selected) startCycle(selected);
    router.push('/onboarding/reminders');
  }

  async function askPartner() {
    try {
      await Share.share({ message: t('onboarding.ask_message') });
    } catch {
      // The share sheet was dismissed.
    }
  }

  return (
    <OnboardingFrame
      step={2}
      onBack={() => router.back()}
      footer={<PrimaryButton label={t('common.continue')} onPress={continueOnboarding} />}
    >
      <Text
        accessibilityRole="header"
        style={{ ...serif, color: theme.text, fontSize: 28, lineHeight: 34, letterSpacing: -0.3 }}
      >
        {t(mode === 'self' ? 'onboarding.last_period_self' : 'onboarding.last_period_partner')}
      </Text>
      <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: 16, lineHeight: 22 }}>
        {t('onboarding.last_period_text')}
      </Text>
      <View style={{ marginTop: 18 }}>
        <MonthCalendar month={month} selected={selected} onMonth={setMonth} onSelect={setSelected} />
      </View>
      <View style={{ ...cardChrome(theme), marginTop: 14, paddingHorizontal: 16 }}>
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
        <View style={{ height: 1, backgroundColor: theme.line }} />
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
      {mode === 'partner' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.dont_know_ask')}
          onPress={() => void askPartner()}
          style={({ pressed }) => ({
            marginTop: 12,
            minHeight: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: theme.spm, fontSize: 16, fontWeight: '800', textDecorationLine: 'underline' }}>
            {t('onboarding.dont_know_ask')}
          </Text>
        </Pressable>
      ) : null}
    </OnboardingFrame>
  );
}
