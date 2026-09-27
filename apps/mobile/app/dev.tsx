import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isIsoDate } from '@/cycle/dates';
import { exampleCycles, relativeCycles } from '@/dev/fixtures';
import { deviceToday, setDebugToday, today } from '@/lib/clock';
import { formatDay } from '@/lib/format';
import { useAppStore } from '@/store/useAppStore';
import { radii, space, type as typeScale, useTheme } from '@/theme';

export default function DevScreen() {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const cycles = useAppStore((state) => state.cycles);
  const resetAll = useAppStore((state) => state.resetAll);
  const [displayed, setDisplayed] = useState(() => today());
  const [draft, setDraft] = useState(() => today());
  const [invalid, setInvalid] = useState(false);

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
          style={{ color: theme.text, fontSize: typeScale.title, fontWeight: '700', marginBottom: space.grid }}
        >
          {t('dev.title')}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginBottom: space.grid * 2 }}>
          {t('dev.clock_note')}
        </Text>
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
