import type { ColorValue } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

type Props = {
  color: ColorValue;
  size?: number;
};

export function TodayIcon({ color, size = 24 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={4} r={2.5} fill={color} />
    </Svg>
  );
}
