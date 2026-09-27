import { type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { radii, useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel: string;
};

export function Card({ children, selected = false, onPress, accessibilityLabel }: Props) {
  const theme = useTheme();
  const style = {
    minHeight: 44,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: selected ? theme.text : 'transparent',
    backgroundColor: theme.surface,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  };

  if (!onPress) return <View style={style}>{children}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({ ...style, opacity: pressed ? 0.75 : 1 })}
    >
      {children}
    </Pressable>
  );
}
