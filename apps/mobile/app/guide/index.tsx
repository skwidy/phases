import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { GUIDE_PHASES } from '@/cycle/calendar';
import { type ISODate } from '@/cycle/dates';
import { todayStatus } from '@/cycle/engine';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { radii, serif, space, type as typeScale, useTheme } from '@/theme';

export default function GuideScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { t: content } = useTranslation('content');
  const cycles = useAppStore((state) => state.cycles);
  const defaults = useAppStore((state) => state.defaults);
  const mode = useAppStore((state) => state.mode);
  const [dayIso, setDayIso] = useState<ISODate>(() => today());
  const self = mode === 'self';

  useFocusEffect(
    useCallback(() => {
      setDayIso(today());
    }, []),
  );

  const current = todayStatus({ cycles, defaults }, dayIso).phase;
  const now = current && current !== 'retard' ? current : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <BackButton label={t('nav.today')} onPress={() => router.back()} />
      <Text style={{ ...serif, marginTop: 8, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}>
        {t('guide.title')}
      </Text>
      <Text style={{ marginTop: 6, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22 }}>
        {t(self ? 'guide.intro_self' : 'guide.intro')}
      </Text>
      <View style={{ marginTop: 18 }}>
        {GUIDE_PHASES.map((phase) => (
          <PhaseRow
            key={phase}
            name={t(`phase.${phase}`)}
            range={content(`${phase}.range_hint`)}
            letter={t(`guide.letters.${phase}`)}
            color={theme[phase]}
            current={phase === now}
            nowLabel={t('guide.now')}
            onPress={() => router.push({ pathname: '/guide/[phase]', params: { phase, from: 'list' } })}
          />
        ))}
      </View>
      <Text style={{ marginTop: 16, color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 20 }}>
        {t(self ? 'guide.footer_self' : 'guide.footer')}
      </Text>
    </ScrollView>
  );
}

function PhaseRow({
  name,
  range,
  letter,
  color,
  current,
  nowLabel,
  onPress,
}: {
  name: string;
  range: string;
  letter: string;
  color: string;
  current: boolean;
  nowLabel: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={current ? `${name}, ${nowLabel}, ${range}` : `${name}, ${range}`}
      accessibilityState={{ selected: current }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: theme.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: current ? theme.warm : theme.line,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          marginRight: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}26`,
        }}
      >
        <Text style={{ color, fontSize: typeScale.body, fontWeight: '900' }}>{letter}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ ...serif, color: theme.text, fontSize: typeScale.body }}>{name}</Text>
          {current ? (
            <View
              style={{
                marginLeft: 8,
                paddingVertical: 2,
                paddingHorizontal: 8,
                borderRadius: radii.pill,
                backgroundColor: theme.warmSoft,
              }}
            >
              <Text style={{ color: theme.warm, fontSize: 11, fontWeight: '800' }}>{nowLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={{ marginTop: 2, color: theme.textMuted, fontSize: 14 }}>{range}</Text>
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 5l7 7-7 7" stroke={theme.textMuted} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

function BackButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M15 5l-7 7 7 7" stroke={theme.spm} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={{ marginLeft: 6, color: theme.spm, fontSize: 16, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
