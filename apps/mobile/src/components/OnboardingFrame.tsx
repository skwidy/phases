import { type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressDots } from '@/components/ProgressDots';
import { space, useTheme } from '@/theme';

type Props = {
  step: 1 | 2 | 3;
  onBack?: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingFrame({ step, onBack, children, footer }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top + 8 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingHorizontal: space.screen }}>
        <ProgressDots step={step} onBack={onBack} />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: 22,
          paddingBottom: 16,
        }}
      >
        {children}
      </ScrollView>
      <View style={{ paddingHorizontal: space.screen, paddingBottom: Math.max(insets.bottom, 16) }}>{footer}</View>
    </KeyboardAvoidingView>
  );
}
