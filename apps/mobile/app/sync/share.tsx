import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { shareUrl } from '@/sync/format';
import { useAppStore } from '@/store/useAppStore';
import { radii, serif, space, type as typeScale, useTheme } from '@/theme';

export default function ShareScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const url =
    cycles.length === 0
      ? null
      : shareUrl({
          cycles: cycles.map((cycle) => cycle.start),
          cycleLength: defaults.cycleLength,
          periodLength: defaults.periodLength,
        });

  async function sendLink() {
    if (!url) return;
    try {
      await Share.share({ message: url });
    } catch {
      // The share sheet was dismissed.
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 8 }}>
      <View style={{ paddingHorizontal: space.screen, flexDirection: 'row', alignItems: 'center' }}>
        <Text
          accessibilityRole="header"
          style={{ ...serif, flex: 1, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}
        >
          {t('sync.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sync.close')}
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke={theme.text} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>
      <Text
        style={{
          marginTop: 8,
          paddingHorizontal: space.screen,
          color: theme.textMuted,
          fontSize: typeScale.body,
          lineHeight: 22,
        }}
      >
        {t('sync.text')}
      </Text>
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: space.screen }}>
        {url ? (
          <View style={{ marginTop: 22, padding: 20, backgroundColor: theme.surface, borderRadius: 28 }}>
            <QRCode value={url} size={232} color={theme.text} backgroundColor={theme.surface} />
          </View>
        ) : (
          <Text style={{ marginTop: 28, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22, textAlign: 'center' }}>
            {t('sync.empty')}
          </Text>
        )}
        <Text style={{ marginTop: 16, color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 20, textAlign: 'center' }}>
          {t('sync.shared_text')}
        </Text>
      </View>
      <View style={{ paddingHorizontal: space.screen, paddingBottom: Math.max(insets.bottom, 16) }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sync.send_link')}
          accessibilityState={{ disabled: !url }}
          disabled={!url}
          onPress={() => void sendLink()}
          style={({ pressed }) => ({
            minHeight: 56,
            borderRadius: radii.button,
            backgroundColor: theme.accentBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !url ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.accentFg, fontSize: typeScale.body, fontWeight: '800' }}>{t('sync.send_link')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sync.scan')}
          onPress={() => router.push('/sync/scan')}
          style={({ pressed }) => ({
            minHeight: 56,
            marginTop: 12,
            borderRadius: radii.button,
            borderWidth: 1.5,
            borderColor: theme.text,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '800' }}>{t('sync.scan')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
