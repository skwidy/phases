import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type CalendarDay, type GuidePhase } from '@/cycle/calendar';
import { type ISODate } from '@/cycle/dates';
import { light, radii, useTheme } from '@/theme';

type Props = {
  weeks: (ISODate | null)[][];
  letters: string[];
  today: ISODate;
  selected: ISODate;
  dayInfo: (date: ISODate) => CalendarDay;
  reminded: (date: ISODate) => boolean;
  colorFor: (phase: GuidePhase) => string;
  labelFor: (date: ISODate, info: CalendarDay) => string;
  hintFor: (date: ISODate) => string | undefined;
  onSelect: (date: ISODate) => void;
  onLongPress: (date: ISODate) => void;
};

export function CalendarMonth({
  weeks,
  letters,
  today,
  selected,
  dayInfo,
  reminded,
  colorFor,
  labelFor,
  hintFor,
  onSelect,
  onLongPress,
}: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingVertical: 14,
        paddingHorizontal: 10,
        backgroundColor: theme.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: theme.line,
      }}
    >
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {letters.map((letter, index) => (
          <Text
            key={`${letter}-${index}`}
            style={{ flex: 1, textAlign: 'center', color: theme.textMuted, fontSize: 12, fontWeight: '800' }}
          >
            {letter}
          </Text>
        ))}
      </View>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={{ flexDirection: 'row' }}>
          {week.map((iso, dayIndex) => {
            if (!iso) return <View key={`empty-${weekIndex}-${dayIndex}`} style={{ flex: 1, height: 48, marginBottom: 6 }} />;
            const info = dayInfo(iso);
            const color = info.phase && info.phase !== 'retard' ? colorFor(info.phase) : null;
            const isToday = iso === today;
            const isSelected = iso === selected;
            const future = info.tone === 'future';
            const hint = hintFor(iso);
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={labelFor(iso, info)}
                accessibilityHint={hint}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(iso)}
                onLongPress={() => onLongPress(iso)}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 48,
                  marginBottom: 6,
                  alignItems: 'center',
                  opacity: pressed ? 0.55 : 1,
                })}
              >
                <View style={{ width: 40, height: 40 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isToday && color ? color : !future && color ? `${color}33` : 'transparent',
                      borderWidth: isToday || isSelected ? 2 : future && color ? 1.5 : 0,
                      borderStyle: future && color && !isSelected ? 'dashed' : 'solid',
                      borderColor: isToday || isSelected ? theme.text : color ?? 'transparent',
                    }}
                  >
                    <Text
                      style={{
                        color: isToday && color ? light.accentFg : isToday ? theme.regles : theme.text,
                        fontSize: 15,
                        fontWeight: isToday ? '800' : '700',
                      }}
                    >
                      {Number(iso.slice(8))}
                    </Text>
                  </View>
                  {reminded(iso) ? (
                    <View
                      style={{
                        position: 'absolute',
                        left: 12,
                        bottom: -6,
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: theme.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Bell color={theme.text} />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Bell({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
