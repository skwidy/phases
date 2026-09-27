import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/theme';

export function SunsetFill() {
  const theme = useTheme();
  const id = `sunset${useId().replace(/:/g, '')}`;

  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0.15" y1="0" x2="0.5" y2="1">
          <Stop offset="0" stopColor={theme.sunsetFrom} />
          <Stop offset="1" stopColor={theme.sunsetTo} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
