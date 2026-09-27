import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { dark, light } from '@/theme';

type Props = {
  width?: number;
  height?: number;
};

export function BookCover({ width = 56, height = 76 }: Props) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 56 76"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Rect x={4} y={2} width={50} height={72} rx={6} fill={light.spm} />
      <Rect x={4} y={2} width={8} height={72} rx={3} fill={light.text} />
      <Rect x={18} y={16} width={28} height={4} rx={2} fill={light.accentFg} />
      <Rect x={18} y={25} width={20} height={4} rx={2} fill={light.accentFg} opacity={0.7} />
      <Circle cx={32} cy={52} r={8} fill={light.text} />
      <Path d="M32 44 A8 8 0 0 1 32 60 Z" fill={dark.ovulation} />
    </Svg>
  );
}
