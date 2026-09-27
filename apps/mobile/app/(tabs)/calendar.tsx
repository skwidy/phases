import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CalendarMonth } from '@/components/CalendarMonth';
import { calendarDay, GUIDE_PHASES, reminderDates, type CalendarDay } from '@/cycle/calendar';
import { type ISODate } from '@/cycle/dates';
import { formatDay, formatMonthName, formatShort, formatShortWithWeekday, weekdayInitial } from '@/lib/format';
import { today } from '@/lib/clock';
import { monthCells, shiftMonth } from '@/lib/month';
import { useAppStore } from '@/store/useAppStore';
import { cardChrome, eyebrowStyle, serif, space, type as typeScale, useTheme } from '@/theme';

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const reminders = useAppStore((state) => state.reminders);
  const startCycle = useAppStore((state) => state.startCycle);
  const [dayIso, setDayIso] = useState<ISODate>(() => today());
  const [selected, setSelected] = useState<ISODate>(() => today());
  const [month, setMonth] = useState(() => monthOf(today()));

  useFocusEffect(
    useCallback(() => {
      setDayIso(today());
    }, []),
  );

  const locale = i18n.language;
  const mondayFirst = locale.toLowerCase().startsWith('fr');
  const state = useMemo(() => ({ cycles, defaults }), [cycles, defaults]);
  const bells = useMemo(
    () =>
      new Set(
        reminderDates(state, {
          pms: reminders.pms,
          period: reminders.period,
          ovulation: reminders.ovulation,
        }),
      ),
    [state, reminders.pms, reminders.period, reminders.ovulation],
  );
  const cells = monthCells(month.year, month.month, mondayFirst);
  const weeks: (ISODate | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  const info = calendarDay(state, selected, dayIso);
  const card = cardCopy(t, locale, selected, dayIso, info);

  function askStart(date: ISODate) {
    if (date >= dayIso) return;
    Alert.alert(t('calendar.started_that_day'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: () => {
          startCycle(date);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={{ ...serif, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}>
          {formatMonthName(`${month.year}-${String(month.month).padStart(2, '0')}-01`, locale)}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <MonthButton
            label={t('onboarding.month_prev')}
            direction="left"
            onPress={() => setMonth(shiftMonth(month.year, month.month, -1))}
          />
          <View style={{ width: 4 }} />
          <MonthButton
            label={t('onboarding.month_next')}
            direction="right"
            onPress={() => setMonth(shiftMonth(month.year, month.month, 1))}
          />
        </View>
      </View>
      <View style={{ marginTop: 16 }}>
        <CalendarMonth
          weeks={weeks}
          letters={weekdayInitial(locale)}
          today={dayIso}
          selected={selected}
          dayInfo={(date) => calendarDay(state, date, dayIso)}
          reminded={(date) => bells.has(date)}
          colorFor={(phase) => theme[phase]}
          labelFor={(date, marked) =>
            bells.has(date) ? `${dayLabel(t, locale, date, marked)}. ${t('calendar.reminder_day')}` : dayLabel(t, locale, date, marked)
          }
          hintFor={(date) => (date < dayIso ? t('calendar.started_hint') : undefined)}
          onSelect={setSelected}
          onLongPress={askStart}
        />
      </View>
      <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap' }}>
        {GUIDE_PHASES.map((phase) => (
          <LegendItem key={phase} color={theme[phase]} label={t(`phase.${phase}`)} />
        ))}
        <LegendItem color={theme.textMuted} label={t('calendar.planned')} dashed />
      </View>
      <View style={{ ...cardChrome(theme), marginTop: 14, paddingVertical: 16, paddingHorizontal: 18 }}>
        <Text style={eyebrowStyle(theme)}>{card.kicker}</Text>
        <Text style={{ ...serif, marginTop: 6, color: theme.text, fontSize: 18 }}>{card.title}</Text>
        {card.sub ? (
          <Text style={{ marginTop: 6, color: theme.textMuted, fontSize: typeScale.secondary }}>{card.sub}</Text>
        ) : null}
        {bells.has(selected) ? (
          <Text style={{ marginTop: 6, color: theme.text, fontSize: typeScale.secondary, fontWeight: '700' }}>
            {t('calendar.reminder_day')}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}


function monthOf(iso: ISODate): { year: number; month: number } {
  return { year: Number(iso.slice(0, 4)), month: Number(iso.slice(5, 7)) };
}

function dayLabel(
  t: (key: string, options?: Record<string, string>) => string,
  locale: string,
  date: ISODate,
  info: CalendarDay,
): string {
  const when = formatDay(date, locale);
  if (!info.phase) return when;
  if (info.phase === 'retard') return `${when}, ${t(`phase.${info.phase}`)}`;
  const phase = info.phase;
  const values = { date: when, initial: t(`guide.letters.${phase}`), phase: t(`phase.${phase}`) };
  if (info.tone === 'future') return t('calendar.day_a11y_planned', { ...values, planned: t('calendar.planned') });
  return t('calendar.day_a11y', values);
}

function cardCopy(
  t: (key: string, options?: Record<string, string>) => string,
  locale: string,
  selected: ISODate,
  dayIso: ISODate,
  info: CalendarDay,
): { kicker: string; title: string; sub: string } {
  if (!info.phase || info.day === null) {
    return { kicker: formatDay(selected, locale), title: t('today.empty'), sub: '' };
  }
  const phaseName = t(`phase.${info.phase}`);
  const kicker =
    selected === dayIso
      ? t('calendar.today_day', { day: String(info.day) })
      : t('calendar.on_day', { date: formatShort(selected, locale), day: String(info.day) });
  const title =
    info.phase === 'retard' || !info.phaseEnd
      ? phaseName
      : t(info.tone === 'past' ? 'calendar.phase_until' : 'calendar.phase_until_likely', {
          phase: phaseName,
          date: formatShort(info.phaseEnd, locale),
        });
  const sub = info.nextPeriod
    ? t(info.tone === 'past' ? 'calendar.period_was' : 'calendar.period_expected', {
        date: formatShortWithWeekday(info.nextPeriod, locale),
      })
    : '';
  return { kicker, title, sub };
}

function MonthButton({
  label,
  direction,
  onPress,
}: {
  label: string;
  direction: 'left' | 'right';
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
          stroke={theme.text}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

function LegendItem({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 14, marginBottom: 8 }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          marginRight: 6,
          backgroundColor: dashed ? 'transparent' : color,
          borderWidth: dashed ? 1.5 : 0,
          borderStyle: dashed ? 'dashed' : 'solid',
          borderColor: color,
        }}
      />
      <Text style={{ color: theme.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
