import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export default function GuideScreen() {
  const { t } = useTranslation();
  return <PlaceholderScreen title={t('nav.guide')} />;
}
