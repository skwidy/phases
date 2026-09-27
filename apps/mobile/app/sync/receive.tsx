import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { formatShort, formatShortWithWeekday } from '@/lib/format';
import { today } from '@/lib/clock';
import { syncNotifications } from '@/reminders/sync';
import { decode } from '@/sync/format';
import { peekPendingSync, releaseLink } from '@/sync/pending';
import { syncPreview } from '@/sync/preview';
import { useAppStore } from '@/store/useAppStore';
import { cardChrome, radii, serif, space, type as typeScale, useTheme } from '@/theme';

export default function ReceiveScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const partnerName = useAppStore((state) => state.partnerName);
  const applySharedCycles = useAppStore((state) => state.applySharedCycles);
  const [fragment] = useState(() => peekPendingSync());
  const decoded = fragment ? decode(fragment) : null;
  const preview = decoded
    ? syncPreview(
        cycles.map((cycle) => cycle.start),
        defaults,
        decoded,
        today(),
      )
    : null;
  const locale = i18n.language;

  useEffect(() => () => releaseLink(), []);

  function close() {
    releaseLink();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  async function apply() {
    if (!decoded) return;
    applySharedCycles(decoded.cycles, { cycleLength: decoded.cycleLength, periodLength: decoded.periodLength });
    await syncNotifications();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    close();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 28,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View style={{ flex: 1 }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: radii.button,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7"
              stroke={theme.text}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
        <Text
          accessibilityRole="header"
          style={{ ...serif, marginTop: 18, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4, lineHeight: 36 }}
        >
          {decoded ? (partnerName ? t('sync.received_title', { name: partnerName }) : t('sync.received_unnamed')) : t('sync.invalid')}
        </Text>
        {decoded ? (
          <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22 }}>{t('sync.received_text')}</Text>
        ) : null}
        {preview ? (
          <View style={{ ...cardChrome(theme), marginTop: 22, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radii.pill,
                  overflow: 'hidden',
                  backgroundColor: theme.warmSoft,
                  color: theme.warm,
                  fontSize: typeScale.label,
                  fontWeight: '800',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {t('sync.badge_new')}
              </Text>
              <Text style={{ ...serif, flex: 1, marginLeft: 12, color: theme.text, fontSize: typeScale.body }}>
                {t('sync.new_cycle', { date: formatShortWithWeekday(preview.headline, locale) })}
              </Text>
            </View>
            {preview.previousLength !== null ? (
              <Recap label={t('confirm.previous_cycle')} value={t('confirm.days', { count: preview.previousLength })} />
            ) : null}
            {preview.localNextPeriod ? (
              <Recap
                label={t('sync.local_expected')}
                value={
                  preview.matchesLocal
                    ? t('sync.matched', { date: formatShortWithWeekday(preview.localNextPeriod, locale) })
                    : formatShortWithWeekday(preview.localNextPeriod, locale)
                }
                muted={preview.matchesLocal}
              />
            ) : null}
            {preview.nextPms ? (
              <Recap label={t('sync.reminders')} value={t('sync.pms_around', { date: formatShort(preview.nextPms, locale) })} />
            ) : null}
          </View>
        ) : null}
      </View>
      {decoded ? <PrimaryButton label={t('sync.apply')} onPress={() => void apply()} /> : null}
      <View style={{ marginTop: 8 }}>
        <PrimaryButton label={t('sync.ignore')} variant="plain" onPress={close} />
      </View>
    </View>
  );
}

function Recap({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary }}>{label}</Text>
      <Text style={{ color: muted ? theme.textMuted : theme.text, fontSize: typeScale.secondary, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
