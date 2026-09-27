import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type SettingsGlyphName =
  | 'moon'
  | 'drop'
  | 'sunrise'
  | 'spark'
  | 'people'
  | 'person'
  | 'calendar'
  | 'list'
  | 'lock'
  | 'eyeOff'
  | 'globe'
  | 'sync'
  | 'upload'
  | 'download'
  | 'trash'
  | 'bellOff';

type GlyphProps = {
  name: SettingsGlyphName;
  color: ColorValue;
  size?: number;
};

export function SettingsGlyph({ name, color, size = 18 }: GlyphProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {paths(name, color)}
    </Svg>
  );
}

export function IconWell({ name, color }: { name: SettingsGlyphName; color: string }) {
  return (
    <View
      style={{
        width: 34,
        height: 34,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: color,
          opacity: 0.16,
        }}
      />
      <SettingsGlyph name={name} color={color} />
    </View>
  );
}

function stroke(color: ColorValue) {
  return {
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

function paths(name: SettingsGlyphName, color: ColorValue): ReactNode {
  const line = stroke(color);
  switch (name) {
    case 'moon':
      return <Path d="M16 3.8A7.6 7.6 0 1 0 20.2 16 6.1 6.1 0 0 1 16 3.8z" {...line} />;
    case 'drop':
      return <Path d="M12 3.2s5.6 6.4 5.6 10.2a5.6 5.6 0 0 1-11.2 0C6.4 9.6 12 3.2 12 3.2z" {...line} />;
    case 'sunrise':
      return (
        <>
          <Path d="M4 17h16" {...line} />
          <Path d="M6.5 17a5.5 5.5 0 0 1 11 0" {...line} />
          <Path d="M12 4v2.6M5.8 8.2l1.8 1.8M18.2 8.2l-1.8 1.8" {...line} />
        </>
      );
    case 'spark':
      return <Path d="M12 3l1.4 5.6L19 10l-5.6 1.4L12 17l-1.4-5.6L5 10l5.6-1.4L12 3z" {...line} />;
    case 'people':
      return (
        <>
          <Circle cx={9} cy={8} r={2.7} {...line} />
          <Path d="M3.4 18.6v-.6a4 4 0 0 1 4-4h3.2a4 4 0 0 1 4 4v.6" {...line} />
          <Circle cx={17} cy={8.6} r={2.1} {...line} />
          <Path d="M16.2 14.2a3.4 3.4 0 0 1 4.4 3.2v1.2" {...line} />
        </>
      );
    case 'person':
      return (
        <>
          <Circle cx={12} cy={8} r={3} {...line} />
          <Path d="M5.6 19.2a6.4 6.4 0 0 1 12.8 0" {...line} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3.5} y={5} width={17} height={15} rx={2.5} {...line} />
          <Path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6" {...line} />
        </>
      );
    case 'list':
      return (
        <>
          <Path d="M9 7h11M9 12h11M9 17h11" {...line} />
          <Circle cx={5} cy={7} r={1} fill={color} />
          <Circle cx={5} cy={12} r={1} fill={color} />
          <Circle cx={5} cy={17} r={1} fill={color} />
        </>
      );
    case 'lock':
      return (
        <>
          <Rect x={5} y={10.5} width={14} height={9.5} rx={2} {...line} />
          <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" {...line} />
        </>
      );
    case 'eyeOff':
      return (
        <>
          <Path d="M3.5 12s3.4-6 8.5-6 8.5 6 8.5 6-3.4 6-8.5 6-8.5-6-8.5-6z" {...line} />
          <Circle cx={12} cy={12} r={2.3} {...line} />
          <Path d="M4 4l16 16" {...line} />
        </>
      );
    case 'globe':
      return (
        <>
          <Circle cx={12} cy={12} r={8.5} {...line} />
          <Path d="M3.5 12h17" {...line} />
          <Path d="M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.2-3.6-8.5s1.2-6.2 3.6-8.5z" {...line} />
        </>
      );
    case 'sync':
      return (
        <>
          <Path d="M20 12a8 8 0 0 0-13.5-5.8L5 8" {...line} />
          <Path d="M5 4.2V8h3.8" {...line} />
          <Path d="M4 12a8 8 0 0 0 13.5 5.8L19 16" {...line} />
          <Path d="M19 19.8V16h-3.8" {...line} />
        </>
      );
    case 'upload':
      return (
        <>
          <Path d="M12 15.5V4.5" {...line} />
          <Path d="M7.5 9L12 4.5 16.5 9" {...line} />
          <Path d="M5 19.5h14" {...line} />
        </>
      );
    case 'download':
      return (
        <>
          <Path d="M12 4.5v11" {...line} />
          <Path d="M7.5 11L12 15.5 16.5 11" {...line} />
          <Path d="M5 19.5h14" {...line} />
        </>
      );
    case 'trash':
      return (
        <>
          <Path d="M4.5 7h15" {...line} />
          <Path d="M9 7V5h6v2" {...line} />
          <Path d="M7.2 7l.8 12.2h8L16.8 7" {...line} />
          <Path d="M10 11v5M14 11v5" {...line} />
        </>
      );
    case 'bellOff':
      return (
        <>
          <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" {...line} />
          <Path d="M10 21a2 2 0 0 0 4 0" {...line} />
          <Path d="M3 3l18 18" {...line} />
        </>
      );
  }
}
