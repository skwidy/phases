import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  color: ColorValue;
  size?: number;
  direction?: 'left' | 'right';
};

export function ChevronIcon({ color, size = 14, direction = 'right' }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
