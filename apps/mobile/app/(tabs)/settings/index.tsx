import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <PlaceholderScreen
      title={t('nav.settings')}
      longPressLabel={t('dev.open')}
      onLongPressTitle={__DEV__ ? () => router.push('/dev') : undefined}
    />
  );
}
