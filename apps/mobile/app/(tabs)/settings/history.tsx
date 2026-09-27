import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function HistoryScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.history')} />;
}
