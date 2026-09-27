import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { SunsetFill } from '@/components/SunsetFill';
import { serif, space, type as typeScale, useTheme } from '@/theme';

export default function SeriesDoneScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('learn');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SunsetFill />
      <View
        style={{
          flex: 1,
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 48,
          paddingBottom: Math.max(insets.bottom, 24),
          justifyContent: 'flex-end',
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ ...serif, color: theme.text, fontSize: 36, lineHeight: 42, letterSpacing: -0.6 }}
        >
          {t('ui.series_done_title')}
        </Text>
        <Text style={{ marginTop: 12, color: theme.text, fontSize: typeScale.body, lineHeight: 26 }}>
          {t('ui.series_done_text')}
        </Text>
        <View style={{ marginTop: 28 }}>
          <PrimaryButton
            label={t('ui.series_done_back')}
            onPress={() => router.dismissTo('/(tabs)/learn')}
          />
        </View>
      </View>
    </View>
  );
}
