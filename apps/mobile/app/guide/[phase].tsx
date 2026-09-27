import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function PhaseScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.phase')} />;
}
