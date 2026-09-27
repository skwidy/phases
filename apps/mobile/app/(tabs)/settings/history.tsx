import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon } from '@/components/ChevronIcon';
import { historyView, type HistoryRow } from '@/cycle/history';
import { isIsoDate, type ISODate } from '@/cycle/dates';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { cardChrome, eyebrowStyle, light, serif, space, type as typeScale, useTheme } from '@/theme';

type Picking = { kind: 'add' } | { kind: 'edit'; from: ISODate };

function dateFromIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isoFromDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatWhen(iso: string, locale: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
  return formatted.replace(/\.$/, '');
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return '0';
}

function formatSigma(sigma: number | null, locale: string, unknown: string): string {
  if (sigma === null) return unknown;
  const value = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(sigma);
  return `±${value}`;
}

export default function HistoryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const startCycle = useAppStore((state) => state.startCycle);
  const editCycle = useAppStore((state) => state.editCycle);
  const deleteCycle = useAppStore((state) => state.deleteCycle);
  const [dayIso, setDayIso] = useState<ISODate>(() => today());
  const [picking, setPicking] = useState<Picking | null>(null);
  const [draft, setDraft] = useState(() => dateFromIso(today()));

  useFocusEffect(
    useCallback(() => {
      setDayIso(today());
    }, []),
  );

  const view = historyView({ cycles, defaults }, dayIso);
  const locale = i18n.language;

  function openAdd() {
    const date = dateFromIso(dayIso);
    setDraft(date);
    setPicking({ kind: 'add' });
  }

  function openEdit(start: ISODate) {
    setDraft(dateFromIso(start));
    setPicking({ kind: 'edit', from: start });
  }

  function commit(date: Date) {
    const iso = isoFromDate(date);
    if (!picking || !isIsoDate(iso) || iso > dayIso) return;
    if (picking.kind === 'add') startCycle(iso);
    else editCycle(picking.from, iso);
    setPicking(null);
  }

  function onPick(event: DateTimePickerEvent, date?: Date) {
    if (event.type === 'dismissed') {
      setPicking(null);
      return;
    }
    if (!date) return;
    if (Platform.OS === 'ios') {
      setDraft(date);
      return;
    }
    commit(date);
  }

  function askDelete(start: ISODate) {
    Alert.alert(t('history.delete'), t('history.delete_confirm', { date: formatWhen(start, locale) }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('history.delete'), style: 'destructive', onPress: () => deleteCycle(start) },
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nav.settings')}
          onPress={() => router.back()}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.55 : 1,
          })}
        >
          <ChevronIcon color={theme.spm} size={18} direction="left" />
          <Text style={{ marginLeft: 6, color: theme.spm, fontSize: 16, fontWeight: '800' }}>{t('nav.settings')}</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{ ...serif, marginTop: 8, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}
        >
          {t('settings.history')}
        </Text>
        <View
          style={{
            ...cardChrome(theme),
            marginTop: 18,
            paddingVertical: 16,
            flexDirection: 'row',
          }}
        >
          <Stat label={t('history.median')} value={t('common.days_short', { count: view.median })} />
          <Stat label={t('history.variation')} value={formatSigma(view.sigma, locale, t('common.unknown'))} />
          <Stat label={t('history.period')} value={t('common.days_short', { count: view.periodLength })} />
        </View>
        {view.sigma !== null ? (
          <Text
            style={{
              marginTop: 12,
              color: view.irregular ? theme.ovulation : theme.good,
              fontSize: typeScale.secondary,
              lineHeight: 20,
              fontWeight: '700',
            }}
          >
            {t(view.irregular ? 'history.irregular' : 'history.regular')}
          </Text>
        ) : null}
        <View style={{ ...cardChrome(theme), marginTop: 18, overflow: 'hidden' }}>
          {view.rows.map((row, index) => (
            <CycleRow
              key={row.start}
              row={row}
              last={index === view.rows.length - 1}
              when={formatWhen(row.start, locale)}
              lengthLabel={
                row.day !== null
                  ? t('history.ongoing', { day: row.day })
                  : t('history.period_days', { count: row.periodLength })
              }
              daysLabel={row.length === null ? t('common.unknown') : t('common.days_short', { count: row.length })}
              deltaLabel={row.delta === null ? '' : formatDelta(row.delta)}
              editLabel={t('history.edit')}
              deleteLabel={t('history.delete')}
              onEdit={() => openEdit(row.start)}
              onDelete={() => askDelete(row.start)}
            />
          ))}
        </View>
        {view.rows.length > 0 ? (
          <Text style={{ marginTop: 10, color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 20 }}>
            {t('history.swipe_hint')}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('history.add_old')}
          onPress={openAdd}
          style={({ pressed }) => ({
            ...cardChrome(theme),
            marginTop: 16,
            minHeight: 54,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.spm, fontSize: 16, fontWeight: '800' }}>{t('history.add_old')}</Text>
        </Pressable>
        {picking ? (
          <View style={{ marginTop: 12 }}>
            <DateTimePicker
              value={draft}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={dateFromIso(dayIso)}
              onChange={onPick}
            />
            {Platform.OS === 'ios' ? (
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.cancel')}
                  onPress={() => setPicking(null)}
                  style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}
                >
                  <Text style={{ color: theme.textMuted, fontSize: 16, fontWeight: '700' }}>{t('common.cancel')}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.confirm')}
                  onPress={() => commit(draft)}
                  style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}
                >
                  <Text style={{ color: theme.spm, fontSize: 16, fontWeight: '800' }}>{t('common.confirm')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={{ flex: 1, alignItems: 'center' }}>
      <Text style={eyebrowStyle(theme)}>{label}</Text>
      <Text style={{ ...serif, marginTop: 4, color: theme.text, fontSize: 22 }}>{value}</Text>
    </View>
  );
}

function CycleRow({
  row,
  last,
  when,
  lengthLabel,
  daysLabel,
  deltaLabel,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: {
  row: HistoryRow;
  last: boolean;
  when: string;
  lengthLabel: string;
  daysLabel: string;
  deltaLabel: string;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const summary = deltaLabel === '' ? `${when}, ${lengthLabel}` : `${when}, ${daysLabel}, ${deltaLabel}, ${lengthLabel}`;

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View style={{ flexDirection: 'row', height: '100%' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            onPress={onEdit}
            style={{ width: 88, height: '100%', backgroundColor: theme.accentBg, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: theme.accentFg, fontSize: 15, fontWeight: '800' }}>{editLabel}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            onPress={onDelete}
            style={{ width: 96, height: '100%', backgroundColor: theme.regles, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: light.accentFg, fontSize: 15, fontWeight: '800' }}>{deleteLabel}</Text>
          </Pressable>
        </View>
      )}
    >
      <View
        accessible
        accessibilityLabel={summary}
        accessibilityActions={[
          { name: 'edit', label: editLabel },
          { name: 'delete', label: deleteLabel },
        ]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'edit') onEdit();
          if (event.nativeEvent.actionName === 'delete') onDelete();
        }}
        style={{
          minHeight: 64,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surface,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: theme.line,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{when}</Text>
          <Text style={{ marginTop: 2, color: row.day !== null ? theme.spm : theme.textMuted, fontSize: 14 }}>
            {lengthLabel}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{daysLabel}</Text>
          {deltaLabel === '' ? null : (
            <Text style={{ marginTop: 2, color: row.delta === 0 ? theme.textMuted : theme.spm, fontSize: 14, fontWeight: '700' }}>
              {deltaLabel}
            </Text>
          )}
        </View>
      </View>
    </Swipeable>
  );
}
