import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

export default function LearnLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
      }}
    />
  );
}
