import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { CycleRing } from '@/components/CycleRing';
import { PrimaryButton } from '@/components/PrimaryButton';
import { dayNumber, diffDays, type ISODate } from '@/cycle/dates';
import {
  phaseEndDate,
  retainedCycleLengths,
  todayStatus,
  type Phase,
} from '@/cycle/engine';
import { nextReminderDate } from '@/cycle/nextReminder';
import { dailyTips } from '@/cycle/tips';
import { formatDay, formatShort } from '@/lib/format';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { radii, space, type as typeScale, useTheme, type Theme } from '@/theme';

function tipList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function gestureColor(theme: Theme, mode: 'partner' | 'self', phase: Phase): string {
  if (mode === 'self') return theme.good;
  if (phase === 'retard') return theme.spm;
  return theme[phase];
}

export default function TodayScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { t: content } = useTranslation('content');
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const mode = useAppStore((state) => state.mode);
  const reminders = useAppStore((state) => state.reminders);
  const [dayIso, setDayIso] = useState<ISODate>(() => today());

  useFocusEffect(
    useCallback(() => {
      setDayIso(today());
    }, []),
  );

  const status = todayStatus({ cycles, defaults }, dayIso);
  const starts = [...cycles.map((cycle) => cycle.start)].sort();
  const start = starts[starts.length - 1];
  const late = status.phase === 'retard';
  const phaseName = status.phase ? t(`phase.${status.phase}`) : '';
  const locale = i18n.language;
  const lengths = retainedCycleLengths(starts);
  const audience = mode === 'self' ? 'self' : 'partner';
  const tips = status.phase
    ? dailyTips(
        tipList(content(`${status.phase}.tips_${audience}`, { returnObjects: true })),
        dayNumber(dayIso),
      )
    : [];
  const happens = status.phase ? content(`${status.phase}.today_${audience}`) : '';
  const reminder =
    start && status.phase
      ? nextReminderDate(start, status.cycleLength, reminders, dayIso)
      : null;
  const until =
    start && status.day !== null && !late
      ? phaseEndDate(start, status.day, status.cycleLength, status.periodLength)
      : null;

  const title = late
    ? t('today.title_late')
    : status.phase
      ? t(mode === 'self' ? 'today.title_self' : 'today.title_partner', { phase: phaseName })
      : t('today.empty');
  const center = late
    ? t('today.late_day', { count: status.late })
    : status.day !== null
      ? t('today.cycle_day', { day: status.day })
      : '';
  const caption = late && status.nextPeriod
    ? t('today.expected', { date: formatShort(status.nextPeriod, locale) })
    : until
      ? t('today.until', { phase: phaseName, date: formatShort(until, locale) })
      : '';
  const ringLabel = late
    ? t('today.ring_late', { count: status.late })
    : status.day !== null
      ? t('today.ring', { day: status.day, length: status.cycleLength, phase: phaseName })
      : t('today.empty');

  function openGuide() {
    if (!status.phase) return;
    router.push({ pathname: '/guide/[phase]', params: { phase: status.phase } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 8,
          paddingBottom: 16,
        }}
      >
        <Text
          style={{
            color: theme.textMuted,
            fontSize: typeScale.secondary,
            fontWeight: '700',
            textAlign: 'center',
          }}
        >
          {formatDay(dayIso, locale)}
        </Text>
        <Text
          style={{
            color: theme.text,
            fontSize: typeScale.title,
            fontWeight: '800',
            letterSpacing: -0.4,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          {title}
        </Text>
        {status.irregular && lengths.length > 0 ? (
          <View
            style={{
              marginTop: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 14,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.ovulation,
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <View style={{ marginRight: 10, marginTop: 2 }}>
              <ClockIcon color={theme.ovulation} />
            </View>
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>
              {t('today.irregular', {
                min: Math.min(...lengths),
                max: Math.max(...lengths),
              })}
            </Text>
          </View>
        ) : null}
        <View style={{ marginTop: 12 }}>
          <CycleRing
            cycleLength={status.cycleLength}
            periodLength={status.periodLength}
            day={status.day}
            late={late}
            dimFuture={status.irregular}
            center={center}
            caption={caption}
            accessibilityLabel={ringLabel}
          />
        </View>
        {status.phase && !late && status.nextPeriod ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 8,
            }}
          >
            <Pill
              label={
                status.window
                  ? t('today.period_window', {
                      start: formatShort(status.window.start, locale),
                      end: formatShort(status.window.end, locale),
                    })
                  : t('today.period_in', { count: diffDays(dayIso, status.nextPeriod) })
              }
            />
            {reminder ? (
              <Pill label={t('today.reminder_on', { date: formatShort(reminder, locale) })} bell />
            ) : null}
          </View>
        ) : null}
        {late ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('today.late_text')}
            onPress={openGuide}
            style={({ pressed }) => ({
              marginTop: 16,
              backgroundColor: theme.surface,
              borderRadius: radii.card,
              paddingVertical: 16,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'flex-start',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ marginRight: 10, marginTop: 1 }}>
              <ClockIcon color={theme.textMuted} />
            </View>
            <Text style={{ flex: 1, color: theme.text, fontSize: 16, lineHeight: 22 }}>
              {t('today.late_text')}
            </Text>
          </Pressable>
        ) : null}
        {status.phase ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              late
                ? t(mode === 'self' ? 'today.what_to_do_self' : 'today.what_to_do_partner')
                : `${t('today.what_happens')}, ${phaseName}`
            }
            onPress={openGuide}
            style={({ pressed }) => ({
              marginTop: 12,
              backgroundColor: theme.surface,
              borderRadius: radii.card,
              paddingVertical: 16,
              paddingHorizontal: 18,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {late ? null : (
              <>
                <Text style={labelStyle(theme)}>{t('today.what_happens')}</Text>
                <Text style={{ color: theme.text, fontSize: 16, lineHeight: 22, marginBottom: 16 }}>
                  {happens}
                </Text>
              </>
            )}
            <Text style={labelStyle(theme)}>
              {t(mode === 'self' ? 'today.what_to_do_self' : 'today.what_to_do_partner')}
            </Text>
            {tips.map((tip) => (
              <View
                key={tip}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, minHeight: 28 }}
              >
                <View style={{ marginRight: 10 }}>
                  <CheckIcon color={gestureColor(theme, mode, status.phase as Phase)} />
                </View>
                <Text style={{ flex: 1, color: theme.text, fontSize: 16, lineHeight: 22 }}>{tip}</Text>
              </View>
            ))}
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={{ paddingHorizontal: space.screen, paddingBottom: Math.max(insets.bottom, 12) }}>
        <PrimaryButton
          label={t(mode === 'self' ? 'today.started_self' : 'today.started_partner')}
          onPress={() => router.push('/confirm')}
        />
        {late ? (
          <View style={{ marginTop: 8 }}>
            <PrimaryButton label={t('today.not_yet')} variant="plain" onPress={() => undefined} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function labelStyle(theme: Theme) {
  return {
    color: theme.textMuted,
    fontSize: typeScale.label,
    fontWeight: '800' as const,
    letterSpacing: typeScale.labelTracking,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
  };
}

function Pill({ label, bell = false }: { label: string; bell?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.line,
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        minHeight: 32,
        margin: 4,
        backgroundColor: theme.bg,
      }}
    >
      {bell ? (
        <View style={{ marginRight: 6 }}>
          <BellIcon color={theme.text} />
        </View>
      ) : null}
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.2} />
      <Path
        d="M8 12.5l2.5 2.5L16 9.5"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.3 21a1.9 1.9 0 0 0 3.4 0"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.2} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
