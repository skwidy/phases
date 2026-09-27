import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
};

export function Stepper({ label, valueLabel, value, min, max, onChange, decreaseLabel, increaseLabel }: Props) {
  const theme = useTheme();
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: '700' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <StepButton label={decreaseLabel} glyph="−" disabled={atMin} onPress={() => onChange(value - 1)} />
        <Text
          style={{ minWidth: 52, textAlign: 'center', color: theme.text, fontSize: 17, fontWeight: '800' }}
          accessibilityLabel={valueLabel}
        >
          {valueLabel}
        </Text>
        <StepButton label={increaseLabel} glyph="+" disabled={atMax} onPress={() => onChange(value + 1)} />
      </View>
    </View>
  );
}

function StepButton({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.line,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.35 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{glyph}</Text>
    </Pressable>
  );
}
