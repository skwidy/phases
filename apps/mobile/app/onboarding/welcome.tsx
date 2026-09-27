import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.welcome')} />;
}
