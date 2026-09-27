import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';
import { useTheme } from '@/theme';

export default function ConfirmScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

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
