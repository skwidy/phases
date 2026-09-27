import { Text, View } from 'react-native';

import { type as typeScale, useTheme } from '@/theme';

type Props = {
  title: string;
};

export function PlaceholderScreen({ title }: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        padding: 20,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          color: theme.text,
          fontSize: typeScale.title,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
    </View>
  );
}
