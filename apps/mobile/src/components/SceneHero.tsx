import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { sceneHeroXml } from '@/components/sceneHeroXml';

const RATIO = 680 / 600;

type Props = {
  label: string;
  width: number;
};

export function SceneHero({ label, width }: Props) {
  return (
    <View accessibilityRole="image" accessibilityLabel={label}>
      <SvgXml xml={sceneHeroXml} width={width} height={Math.round(width * RATIO)} />
    </View>
  );
}
