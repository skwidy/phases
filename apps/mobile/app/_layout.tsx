import '@/lib/applyRoundedFont';

import { Redirect, Stack, usePathname, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SystemUI from 'expo-system-ui';

import { syncLanguage } from '@/i18n';
import { startReminders } from '@/reminders/sync';
import { LockGate } from '@/security/LockGate';
import { claimLink } from '@/sync/pending';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const theme = useTheme();
  const pathname = usePathname();
  const language = useAppStore((state) => state.language);
  const onboarded = useAppStore((state) => state.onboarded);
  const ready = useSyncExternalStore(
    (onStoreChange) => useAppStore.persist.onFinishHydration(onStoreChange),
    () => useAppStore.persist.hasHydrated(),
    () => useAppStore.persist.hasHydrated(),
  );

  useEffect(() => {
    syncLanguage(language);
  }, [language]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme.bg);
  }, [theme.bg]);

  const inOnboarding = pathname.startsWith('/onboarding');
  const inDev = __DEV__ && pathname === '/dev';

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, backgroundColor: theme.bg }} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>
        <ReminderSync />
        <SyncLinks />
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
          }}
        />
        {!onboarded && !inOnboarding && !inDev ? <Redirect href="/onboarding/welcome" /> : null}
        {onboarded && inOnboarding ? <Redirect href="/" /> : null}
      </View>
      <LockGate />
    </GestureHandlerRootView>
  );
}

function SyncLinks() {
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  const opened = useRef<string | null>(null);

  useEffect(() => {
    path.current = pathname;
  }, [pathname]);

  useEffect(() => {
    function open(url: string | null) {
      if (!url || url === opened.current || !claimLink(url)) return;
      opened.current = url;
      if (path.current === '/s' || path.current === '/sync/receive') return;
      router.push('/sync/receive');
    }

    void Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener('url', (event) => open(event.url));
    return () => subscription.remove();
  }, [router]);

  return null;
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
