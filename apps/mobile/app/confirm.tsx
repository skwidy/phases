import { Stack } from 'expo-router';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { t } from '@/i18n/t';
import { useTheme } from '@/theme';

export default function ConfirmScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      />
      <PlaceholderScreen title={t('nav.confirm')} />
    </>
  );
}
