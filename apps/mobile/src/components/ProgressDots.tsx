import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/theme';

type Props = {
  step: 1 | 2 | 3;
  onBack?: () => void;
};

export function ProgressDots({ step, onBack }: Props) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={onBack}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.surface,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={theme.text}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
      ) : null}
      <View style={{ flex: 1, flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3].map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: index <= step ? theme.text : theme.line,
            }}
          />
        ))}
      </View>
      <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: '800' }}>
        {t('onboarding.step', { current: step, total: 3 })}
      </Text>
    </View>
  );
}
