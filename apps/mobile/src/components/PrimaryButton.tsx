import { Pressable, Text } from 'react-native';

import { radii, type as typeScale, useTheme } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'plain';
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, variant = 'primary', disabled = false }: Props) {
  const theme = useTheme();
  const plain = variant === 'plain';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: plain ? 48 : 56,
        borderRadius: radii.button,
        backgroundColor: plain ? 'transparent' : theme.accentBg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: plain ? theme.text : theme.accentFg,
          fontSize: plain ? 16 : typeScale.body,
          fontWeight: '800',
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
