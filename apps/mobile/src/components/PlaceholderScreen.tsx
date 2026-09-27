import { Pressable, Text, View } from 'react-native';

import { space, type as typeScale, useTheme } from '@/theme';

type Props = {
  title: string;
  onLongPressTitle?: () => void;
  longPressLabel?: string;
};

export function PlaceholderScreen({ title, onLongPressTitle, longPressLabel }: Props) {
  const theme = useTheme();
  const titleNode = (
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
  );

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.bg,
        padding: space.screen,
      }}
    >
      {onLongPressTitle ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={longPressLabel ?? title}
          delayLongPress={3000}
          onLongPress={onLongPressTitle}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          {titleNode}
        </Pressable>
      ) : (
        titleNode
      )}
    </View>
  );
}
