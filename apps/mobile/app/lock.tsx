import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function LockScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.lock')} />;
}
