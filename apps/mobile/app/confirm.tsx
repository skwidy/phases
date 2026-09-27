import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Toggle } from '@/components/Toggle';
import { confirmPreview } from '@/cycle/confirmPreview';
import { addDays, type ISODate } from '@/cycle/dates';
import { todayStatus } from '@/cycle/engine';
import { formatShort, formatWeekday } from '@/lib/format';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { light, radii, space, type as typeScale, useTheme } from '@/theme';

function localDate(iso: ISODate): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function isoFromDate(date: Date): ISODate {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function clampDate(iso: ISODate, min: ISODate, max: ISODate): ISODate {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

export default function ConfirmScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const mode = useAppStore((state) => state.mode);
  const partnerName = useAppStore((state) => state.partnerName);
  const startCycle = useAppStore((state) => state.startCycle);
  const now = today();
  const earliest = addDays(now, -7);
  const [selected, setSelected] = useState<ISODate>(now);
  const [showPicker, setShowPicker] = useState(false);
  const [sendUpdate, setSendUpdate] = useState(true);
  const locale = i18n.language;
  const chips = [-2, -1, 0, 1, 2].map((offset) => addDays(now, offset));
  const preview = confirmPreview(
    cycles.map((cycle) => cycle.start),
    defaults,
    selected,
  );
  const showSend = Boolean(partnerName) || mode === 'self';
  const correcting = todayStatus({ cycles, defaults }, now).phase === 'regles';
  const title = correcting
    ? mode === 'self'
      ? t('today.change_day_self')
      : partnerName
        ? t('today.change_day_name', { name: partnerName })
        : t('today.change_day')
    : t(mode === 'self' ? 'today.started_self' : 'today.started_partner');

  function onPick(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (!date) return;
    setSelected(clampDate(isoFromDate(date), earliest, now));
  }

  function confirm() {
    if (selected > now) return;
    startCycle(selected);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          sheetGrabberVisible: true,
          sheetCornerRadius: 28,
          sheetAllowedDetents: [0.92],
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.bg }}
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Text
          style={{
            color: theme.text,
            fontSize: typeScale.title,
            fontWeight: '800',
            letterSpacing: -0.4,
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            color: theme.textMuted,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          {t('confirm.which_day')}
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {chips.map((iso) => {
            const future = iso > now;
            const active = iso === selected;
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={formatShort(iso, locale)}
                accessibilityState={{ disabled: future, selected: active }}
                disabled={future}
                onPress={() => setSelected(iso)}
                style={{
                  flex: 1,
                  minHeight: 72,
                  marginHorizontal: 3,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? theme.regles : 'transparent',
                  borderWidth: active ? 0 : 1.5,
                  borderStyle: future ? 'dashed' : 'solid',
                  borderColor: theme.line,
                }}
              >
                <Text
                  style={{
                    color: active ? light.accentFg : theme.textMuted,
                    fontSize: 11,
                    fontWeight: '800',
                  }}
                >
                  {iso === now ? t('confirm.today_short') : formatWeekday(iso, locale)}
                </Text>
                <Text
                  style={{
                    color: active ? light.accentFg : future ? theme.textMuted : theme.text,
                    fontSize: 18,
                    fontWeight: '800',
                    marginTop: 2,
                  }}
                >
                  {Number(iso.slice(8, 10))}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('confirm.other_date')}
          onPress={() => setShowPicker((open) => !open)}
          style={{ minHeight: 44, justifyContent: 'center', marginBottom: 8 }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: typeScale.body,
              fontWeight: '700',
              textDecorationLine: 'underline',
            }}
          >
            {chips.includes(selected)
              ? t('confirm.other_date')
              : `${t('confirm.other_date')} ${formatShort(selected, locale)}`}
          </Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker
            value={localDate(selected)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={localDate(earliest)}
            maximumDate={localDate(now)}
            onChange={onPick}
          />
        ) : null}
        <View style={{ marginTop: 8 }}>
          {preview.previousLength !== null ? (
            <RecapRow label={t('confirm.previous_cycle')} value={t('confirm.days', { count: preview.previousLength })} />
          ) : null}
          {preview.nextPms ? (
            <RecapRow
              label={t('confirm.next_pms')}
              value={t('confirm.around', { date: formatShort(preview.nextPms, locale) })}
            />
          ) : null}
          {preview.nextPeriod ? (
            <RecapRow
              label={t('confirm.next_period')}
              value={
                preview.window
                  ? t('confirm.range', {
                      start: formatShort(preview.window.start, locale),
                      end: formatShort(preview.window.end, locale),
                    })
                  : t('confirm.around', { date: formatShort(preview.nextPeriod, locale) })
              }
            />
          ) : null}
        </View>
        {showSend ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={
              partnerName ? t('confirm.send_update', { name: partnerName }) : t('confirm.send_update_self')
            }
            accessibilityState={{ checked: sendUpdate }}
            onPress={() => setSendUpdate((value) => !value)}
            style={{
              minHeight: 44,
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '700' }}>
                {partnerName
                  ? t('confirm.send_update', { name: partnerName })
                  : t('confirm.send_update_self')}
              </Text>
              <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, marginTop: 2 }}>
                {t('confirm.send_update_sub')}
              </Text>
            </View>
            <Toggle value={sendUpdate} />
          </Pressable>
        ) : null}
        <View style={{ marginTop: 20 }}>
          <PrimaryButton label={t('common.confirm')} onPress={confirm} />
        </View>
        <View style={{ marginTop: 8 }}>
          <PrimaryButton label={t('common.cancel')} variant="plain" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </>
  );
}

function RecapRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: theme.line,
      }}
    >
      <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: typeScale.secondary, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
