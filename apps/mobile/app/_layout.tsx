import '@/lib/applyRoundedFont';
import '@/i18n';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';

import { syncLanguage } from '@/i18n';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const language = useAppStore((state) => state.language);

  useEffect(() => {
    syncLanguage(language);
  }, [language]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
    </>
  );
}
