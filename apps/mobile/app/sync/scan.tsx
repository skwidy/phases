import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { claimLink } from '@/sync/pending';
import { serif, space, type as typeScale, useTheme } from '@/theme';

export default function ScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const locked = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  function onScan(data: string) {
    if (locked.current) return;
    if (!claimLink(data)) return;
    locked.current = true;
    router.replace('/sync/receive');
  }

  if (!permission?.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 24,
          paddingBottom: Math.max(insets.bottom, 24),
          justifyContent: 'center',
        }}
      >
        <Text accessibilityRole="header" style={{ ...serif, color: theme.text, fontSize: typeScale.title }}>
          {t('sync.camera_off')}
        </Text>
        <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22 }}>
          {t('sync.camera_off_sub')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.enable')}
          onPress={() => {
            if (permission?.canAskAgain) void requestPermission();
            else void Linking.openSettings();
          }}
          style={({ pressed }) => ({
            marginTop: 24,
            minHeight: 56,
            borderRadius: 18,
            backgroundColor: theme.accentBg,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: theme.accentFg, fontSize: typeScale.body, fontWeight: '800' }}>{t('settings.enable')}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          onPress={() => router.back()}
          style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{t('common.cancel')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(result) => onScan(result.data)}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: space.screen,
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 22,
          backgroundColor: theme.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '800' }}>{t('common.cancel')}</Text>
      </Pressable>
    </View>
  );
}
