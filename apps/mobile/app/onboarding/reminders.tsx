import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function RemindersScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.reminders')} />;
}
