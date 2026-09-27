import type { ColorValue } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

type Props = {
  color: ColorValue;
  size?: number;
};

export function CalendarIcon({ color, size = 24 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect x={3} y={5} width={18} height={16} rx={3} stroke={color} strokeWidth={2} />
      <Path d="M3 10h18M8 3v4M16 3v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
