import '@/lib/applyRoundedFont';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SystemUI from 'expo-system-ui';

import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();

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
