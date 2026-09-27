import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { peekPendingImport, setPendingImport } from '@/backup/pending';
import { ChevronIcon } from '@/components/ChevronIcon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { syncNotifications } from '@/reminders/sync';
import { useAppStore } from '@/store/useAppStore';
import { serif, space, type as typeScale, useTheme } from '@/theme';

export default function ImportScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const importState = useAppStore((state) => state.importState);
  const [pending] = useState(() => peekPendingImport());
  const [busy, setBusy] = useState(false);

  function leave() {
    setPendingImport(null);
    router.back();
  }

  async function replace() {
    if (!pending || busy) return;
    setBusy(true);
    const ok = importState(pending);
    setPendingImport(null);
    if (!ok) {
      setBusy(false);
      return;
    }
    await syncNotifications();
    router.back();
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 8,
        paddingBottom: Math.max(insets.bottom, 24),
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={leave}
        style={({ pressed }) => ({
          alignSelf: 'flex-start',
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          opacity: pressed ? 0.55 : 1,
        })}
      >
        <ChevronIcon color={theme.spm} size={18} direction="left" />
        <Text style={{ marginLeft: 6, color: theme.spm, fontSize: 16, fontWeight: '800' }}>{t('common.cancel')}</Text>
      </Pressable>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          accessibilityRole="header"
          style={{ ...serif, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}
        >
          {pending ? t('settings.import_title') : t('settings.import_invalid')}
        </Text>
        {pending ? (
          <Text style={{ marginTop: 12, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22 }}>
            {t('settings.import_body', { count: pending.cycles.length })}
          </Text>
        ) : null}
      </View>
      {pending ? (
        <PrimaryButton label={t('settings.replace')} disabled={busy} onPress={() => void replace()} />
      ) : null}
    </View>
  );
}
