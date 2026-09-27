import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { isGuidePhase, phaseBarSegments, type GuidePhase } from '@/cycle/calendar';
import { type ISODate } from '@/cycle/dates';
import { todayStatus } from '@/cycle/engine';
import { today } from '@/lib/clock';
import { useAppStore } from '@/store/useAppStore';
import { cardChrome, eyebrowStyle, light, radii, serif, space, type as typeScale, useTheme } from '@/theme';

export default function PhaseScreen() {
  const params = useLocalSearchParams<{ phase?: string; from?: string }>();
  const phase = typeof params.phase === 'string' ? params.phase : '';
  if (!isGuidePhase(phase)) return <Redirect href="/guide" />;
  return <PhasePage phase={phase} fromList={params.from === 'list'} />;
}

function PhasePage({ phase, fromList }: { phase: GuidePhase; fromList: boolean }) {
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

  const status = todayStatus({ cycles, defaults }, dayIso);
  const segments = phaseBarSegments(status.cycleLength, status.periodLength);
  const mayFeel = lines(content(`${phase}.may_feel`, { returnObjects: true }));
  const helps = lines(content(`${phase}.helps`, { returnObjects: true }));
  const helpsLess = lines(content(`${phase}.helps_less`, { returnObjects: true }));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 24,
      }}
    >
      <BackButton
        label={t(fromList ? 'guide.title' : 'nav.today')}
        onPress={() => router.back()}
      />
      <View
        style={{
          alignSelf: 'flex-start',
          marginTop: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: radii.pill,
          backgroundColor: theme[phase],
        }}
      >
        <Text style={{ color: light.accentFg, fontSize: 13, fontWeight: '800' }}>{content(`${phase}.range_hint`)}</Text>
      </View>
      <Text style={{ ...serif, marginTop: 12, color: theme.text, fontSize: typeScale.title, letterSpacing: -0.4 }}>
        {t(`phase.${phase}`)}
      </Text>
      <Text style={{ marginTop: 4, color: theme.textMuted, fontSize: typeScale.body, lineHeight: 22 }}>
        {content(`${phase}.subtitle`)}
      </Text>
      <View style={{ marginTop: 14, flexDirection: 'row' }}>
        {segments.map((segment) => (
          <Pressable
            key={segment.phase}
            accessibilityRole="button"
            accessibilityLabel={t(`phase.${segment.phase}`)}
            accessibilityState={{ selected: segment.phase === phase }}
            onPress={() => router.setParams({ phase: segment.phase })}
            style={{
              flex: segment.days,
              marginRight: 4,
              padding: 2,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: segment.phase === phase ? theme.text : 'transparent',
            }}
          >
            <View style={{ height: 10, borderRadius: 5, backgroundColor: theme[segment.phase] }} />
          </Pressable>
        ))}
      </View>
      <Text style={{ ...eyebrowStyle(theme), marginTop: 20 }}>
        {t(self ? 'guide.may_feel_self' : 'guide.may_feel')}
      </Text>
      <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap' }}>
        {mayFeel.map((item) => (
          <View
            key={item}
            style={{
              marginRight: 8,
              marginBottom: 8,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: radii.pill,
              backgroundColor: theme.warmSoft,
            }}
          >
            <Text style={{ color: theme.warm, fontSize: typeScale.secondary, fontWeight: '700' }}>{item}</Text>
          </View>
        ))}
      </View>
      <AdviceCard title={t(self ? 'guide.helps_self' : 'guide.helps')} color={theme.good} items={helps} kind="check" />
      <AdviceCard
        title={t(self ? 'guide.helps_less_self' : 'guide.helps_less')}
        color={theme.regles}
        items={helpsLess}
        kind="cross"
      />
      <Text style={{ marginTop: 14, color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 20 }}>
        {t(self ? 'guide.disclaimer_self' : 'guide.disclaimer')}
      </Text>
    </ScrollView>
  );
}

function lines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function AdviceCard({
  title,
  color,
  items,
  kind,
}: {
  title: string;
  color: string;
  items: string[];
  kind: 'check' | 'cross';
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        ...cardChrome(theme),
        marginTop: 16,
        padding: 18,
      }}
    >
      <Text style={{ ...eyebrowStyle(theme), marginBottom: 4 }}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', marginTop: 10 }}>
          <View style={{ marginRight: 10, marginTop: 1 }}>
            {kind === 'check' ? <CheckIcon color={color} /> : <CrossIcon color={color} />}
          </View>
          <Text style={{ flex: 1, color: theme.text, fontSize: typeScale.body, lineHeight: 22 }}>{item}</Text>
        </View>
      ))}
    </View>
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

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CrossIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M7 7l10 10M17 7L7 17" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}
