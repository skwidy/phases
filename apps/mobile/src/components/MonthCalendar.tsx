import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { type ISODate } from '@/cycle/dates';
import { today } from '@/lib/clock';
import { formatDay, formatMonth, weekdayInitial } from '@/lib/format';
import { monthCells, shiftMonth } from '@/lib/month';
import { light, radii, serif, useTheme } from '@/theme';

type Props = {
  month: { year: number; month: number };
  selected: ISODate | null;
  onMonth: (month: { year: number; month: number }) => void;
  onSelect: (date: ISODate) => void;
};

export function MonthCalendar({ month, selected, onMonth, onSelect }: Props) {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const mondayFirst = locale.toLowerCase().startsWith('fr');
  const shownToday = today();
  const monthKey = `${month.year}-${String(month.month).padStart(2, '0')}`;
  const canNext = monthKey < shownToday.slice(0, 7);
  const cells = monthCells(month.year, month.month, mondayFirst);
  const weeks: (ISODate | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));

  return (
    <View
      style={{
        padding: 16,
        backgroundColor: theme.surface,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: theme.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.month_prev')}
          onPress={() => onMonth(shiftMonth(month.year, month.month, -1))}
          style={({ pressed }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
        >
          <Chevron color={theme.text} direction="left" />
        </Pressable>
        <Text style={{ ...serif, color: theme.text, fontSize: 17 }}>
          {formatMonth(`${monthKey}-01`, locale)}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.month_next')}
          accessibilityState={{ disabled: !canNext }}
          disabled={!canNext}
          onPress={() => onMonth(shiftMonth(month.year, month.month, 1))}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: !canNext ? 0.35 : pressed ? 0.6 : 1,
          })}
        >
          <Chevron color={canNext ? theme.text : theme.textMuted} direction="right" />
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 8 }}>
        {weekdayInitial(locale).map((letter, index) => (
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
            if (!iso) return <View key={`empty-${weekIndex}-${dayIndex}`} style={{ flex: 1, height: 44 }} />;
            const future = iso > shownToday;
            const isSelected = iso === selected;
            const isToday = iso === shownToday;
            return (
              <Pressable
                key={iso}
                accessibilityRole="button"
                accessibilityLabel={formatDay(iso, locale)}
                accessibilityState={{ disabled: future, selected: isSelected }}
                disabled={future}
                onPress={() => onSelect(iso)}
                style={{ flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? theme.regles : 'transparent',
                    borderWidth: isToday && !isSelected ? 1.5 : 0,
                    borderColor: theme.text,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    style={{
                      color: isSelected ? light.accentFg : future ? theme.textMuted : theme.text,
                      fontSize: 15,
                      fontWeight: isSelected || isToday ? '800' : '600',
                    }}
                  >
                    {Number(iso.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function Chevron({ color, direction }: { color: string; direction: 'left' | 'right' }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
