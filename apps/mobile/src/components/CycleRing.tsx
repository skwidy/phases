import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { phaseOfDay } from '@/cycle/engine';
import {
  dayMarker,
  lateMarker,
  RING_CENTER,
  RING_RADIUS,
  RING_SIZE,
  RING_STROKE,
  ringArcs,
  ringPhaseOrder,
  type RingArc,
  type RingPhase,
} from '@/cycle/ring';
import { light, type as typeScale, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DASH_GAP = 1000;
const DISPLAY = 240;

type Props = {
  cycleLength: number;
  periodLength: number;
  day: number | null;
  late: boolean;
  dimFuture: boolean;
  center: string;
  caption: string;
  detail?: string;
  captionColor?: string;
  accessibilityLabel: string;
};

function DrawnArc({
  arc,
  color,
  opacity,
  progress,
}: {
  arc: RingArc;
  color: string;
  opacity: number;
  progress: SharedValue<number>;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: `${arc.length * progress.value} ${DASH_GAP}`,
  }));

  return (
    <AnimatedCircle
      cx={RING_CENTER}
      cy={RING_CENTER}
      r={RING_RADIUS}
      stroke={color}
      strokeWidth={RING_STROKE}
      fill="none"
      strokeDashoffset={-arc.start}
      animatedProps={animatedProps}
      opacity={opacity}
      transform="rotate(-90 150 150)"
    />
  );
}

export function CycleRing({
  cycleLength,
  periodLength,
  day,
  late,
  dimFuture,
  center,
  caption,
  detail = '',
  captionColor,
  accessibilityLabel,
}: Props) {
  const theme = useTheme();
  const progress = useSharedValue(0);
  const arcs = day === null ? [] : ringArcs(cycleLength, periodLength);
  const marker = late ? lateMarker() : day === null ? null : dayMarker(day, cycleLength, periodLength);
  const current =
    day === null || late ? null : phaseOfDay(day, cycleLength, periodLength);
  const daySize = Math.round((typeScale.ring * DISPLAY) / RING_SIZE);
  const noteColor = captionColor ?? (late ? theme.regles : theme.textMuted);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress, cycleLength, periodLength, day, late]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: DISPLAY, height: DISPLAY, alignSelf: 'center' }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: DISPLAY, height: DISPLAY }}
      >
        <Svg width={DISPLAY} height={DISPLAY} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={RING_RADIUS}
            stroke={theme.line}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          {arcs.map((arc) => (
            <DrawnArc
              key={arc.phase}
              arc={arc}
              color={theme[arc.phase]}
              opacity={arcOpacity(arc.phase, current, late, dimFuture)}
              progress={progress}
            />
          ))}
          {marker ? (
            <Circle
              cx={marker.x}
              cy={marker.y}
              r={15}
              fill={light.surface}
              stroke={late ? theme.regles : theme.text}
              strokeWidth={5}
              strokeDasharray={late ? '6 5' : undefined}
            />
          ) : null}
        </Svg>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 36,
            right: 36,
            top: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {center ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                color: theme.text,
                fontSize: daySize,
                fontWeight: '800',
                letterSpacing: -1,
              }}
            >
              {center}
            </Text>
          ) : null}
          {caption ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                marginTop: 2,
                color: noteColor,
                fontSize: typeScale.secondary,
                lineHeight: 20,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {caption}
            </Text>
          ) : null}
          {detail ? (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                color: noteColor,
                fontSize: typeScale.secondary,
                lineHeight: 20,
                fontWeight: '700',
                textAlign: 'center',
              }}
            >
              {detail}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function arcOpacity(
  phase: RingPhase,
  current: ReturnType<typeof phaseOfDay> | null,
  late: boolean,
  dimFuture: boolean,
): number {
  if (late) return 0.35;
  if (!dimFuture || current === null || current === 'retard') return 1;
  return ringPhaseOrder(phase) > ringPhaseOrder(current as RingPhase) ? 0.6 : 1;
}
