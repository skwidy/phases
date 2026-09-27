import '@/lib/applyRoundedFont';
import '@/i18n';

import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';

import { syncLanguage } from '@/i18n';
import { startReminders } from '@/reminders/sync';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const language = useAppStore((state) => state.language);
  const onboarded = useAppStore((state) => state.onboarded);
  const [ready, setReady] = useState(() => useAppStore.persist.hasHydrated());

  useEffect(() => {
    syncLanguage(language);
  }, [language]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) setReady(true);
    return useAppStore.persist.onFinishHydration(() => setReady(true));
  }, []);

  const inOnboarding = pathname.startsWith('/onboarding');
  const inDev = pathname === '/dev';

  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.bg }} />;

  return (
    <>
      <ReminderSync />
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
      {!onboarded && !inOnboarding && !inDev ? <Redirect href="/onboarding/welcome" /> : null}
      {onboarded && inOnboarding ? <Redirect href="/" /> : null}
    </>
  );
}

function ReminderSync() {
  const router = useRouter();

  useEffect(() => {
    return startReminders(() => {
      router.navigate('/');
    });
  }, [router]);

  return null;
}
