import { View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  value: boolean;
};

export function Toggle({ value }: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        width: 51,
        height: 31,
        borderRadius: 16,
        backgroundColor: value ? theme.good : theme.line,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 27,
          height: 27,
          borderRadius: 14,
          backgroundColor: theme.surface,
          marginLeft: value ? 22 : 2,
        }}
      />
    </View>
  );
}
