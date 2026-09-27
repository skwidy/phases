import { Text, type StyleProp, type TextStyle } from 'react-native';

import { serif, useTheme } from '@/theme';

type Props = {
  children: string;
  emphasis?: string;
  style?: StyleProp<TextStyle>;
};

export function Title({ children, emphasis, style }: Props) {
  const theme = useTheme();
  const base = [serif, { color: theme.text }, style];
  const index = emphasis ? children.toLocaleLowerCase().indexOf(emphasis.toLocaleLowerCase()) : -1;

  if (!emphasis || index < 0) {
    return (
      <Text accessibilityRole="header" style={base}>
        {children}
      </Text>
    );
  }

  const match = children.slice(index, index + emphasis.length);

  return (
    <Text accessibilityRole="header" style={base}>
      {children.slice(0, index)}
      <Text style={[serif, { fontStyle: 'italic', color: theme.warm }]}>{match}</Text>
      {children.slice(index + emphasis.length)}
    </Text>
  );
}
