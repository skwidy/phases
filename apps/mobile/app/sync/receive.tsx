import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function ReceiveScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.receive')} />;
}
