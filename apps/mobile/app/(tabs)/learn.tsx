import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, type TextLayoutEvent, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { BookCover } from '@/components/BookCover';
import { ChevronIcon } from '@/components/ChevronIcon';
import { lessonRowStatus, parseLessons, seriesProgress, type LearnLesson } from '@/content/learn';
import { useAppStore } from '@/store/useAppStore';
import { radii, space, type as typeScale, useTheme, type Theme } from '@/theme';

const PHASES = ['regles', 'folliculaire', 'ovulation', 'luteale', 'spm'] as const;

function phaseInitial(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase();
}

function useUniformLineSize(samples: readonly string[], boxWidth: number, max: number, min: number) {
  const key = samples.join('\n');
  const [measure, setMeasure] = useState({ key, widest: 0 });
  if (measure.key !== key) setMeasure({ key, widest: 0 });

  const widest = measure.widest;
  const size =
    widest > boxWidth && boxWidth > 0
      ? Math.max(min, Math.min(max, Math.floor(((max * (boxWidth - 1)) / widest) * 10) / 10))
      : max;

  function rememberWidth(event: TextLayoutEvent) {
    const measured = event.nativeEvent.lines[0]?.width ?? 0;
    if (measured <= 0) return;
    setMeasure((current) => {
      if (current.key !== key || measured <= current.widest + 0.5) return current;
      return { key, widest: measured };
    });
  }

  const probes = (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', opacity: 0, left: 0, top: 0 }}
    >
      {samples.map((sample) => (
        <Text key={sample} style={{ fontSize: max, fontWeight: '800' }} onTextLayout={rememberWidth}>
          {sample}
        </Text>
      ))}
    </View>
  );

  return { size, probes };
}

function StatusMark({ status, theme }: { status: 'read' | 'current' | 'unread'; theme: Theme }) {
  if (status === 'read') {
    return (
      <Svg
        width={20}
        height={20}
        viewBox="0 0 24 24"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Circle cx={12} cy={12} r={10} fill={theme.good} />
        <Path
          d="M7.5 12.5l3 3 6-6.5"
          fill="none"
          stroke={theme.accentFg}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: status === 'current' ? theme.text : theme.line,
      }}
    />
  );
}

export default function LearnScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { t } = useTranslation('learn');
  const { t: app } = useTranslation();
  const read = useAppStore((state) => state.learn.read);
  const lessons = parseLessons(t('series.lessons', { returnObjects: true }));
  const { done, total, pending } = seriesProgress(lessons, read);
  const target = pending ?? lessons[0];
  const continueLabel =
    pending && done > 0 ? t('ui.continue_lesson', { n: pending.number }) : done > 0 ? t('ui.continue') : t('ui.start');
  const phaseNames = PHASES.map((phase) => app(`phase.${phase}`));
  const phaseLabelWidth = (width - space.screen * 2 - 6 * (PHASES.length - 1)) / PHASES.length - 6;
  const lessonTitles = lessons.map((lesson) => `${lesson.number}. ${lesson.title}`);
  const lessonTitleWidth = width - space.screen * 2 - 32 - 58;
  const phases = useUniformLineSize(phaseNames, phaseLabelWidth, 11, 8);
  const titles = useUniformLineSize(lessonTitles, lessonTitleWidth, 16, 13);

  function openLesson(id: string) {
    router.push({ pathname: '/learn/[lesson]', params: { lesson: id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {phases.probes}
      {titles.probes}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 8,
          paddingBottom: 32,
        }}
      >
        <Text
          accessibilityRole="header"
          style={{ color: theme.text, fontSize: typeScale.title, fontWeight: '800', letterSpacing: -0.4 }}
        >
          {t('home.title')}
        </Text>
        <Text style={{ marginTop: 4, color: theme.textMuted, fontSize: 16, lineHeight: 22 }}>{t('home.subtitle')}</Text>

        <View
          style={{
            marginTop: 18,
            padding: 20,
            borderRadius: 24,
            backgroundColor: theme.accentBg,
            gap: 10,
          }}
        >
          <Text
            style={{
              color: theme.accentFg,
              fontSize: typeScale.label,
              fontWeight: '800',
              letterSpacing: typeScale.labelTracking,
              textTransform: 'uppercase',
            }}
          >
            {t('ui.series_kicker', { count: total, time: t('series.total_time') })}
          </Text>
          <Text style={{ color: theme.accentFg, fontSize: 24, lineHeight: 29, fontWeight: '900', letterSpacing: -0.4 }}>
            {t('series.title')}
          </Text>
          <Text style={{ color: theme.accentFg, opacity: 0.72, fontSize: typeScale.secondary, lineHeight: 20 }}>
            {t('series.subtitle')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel={t('ui.progress', { done, total })}
              accessibilityValue={{ min: 0, max: total, now: done }}
              style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: theme.accentFg,
                  opacity: 0.25,
                }}
              />
              <View
                style={{
                  width: total === 0 ? 0 : `${(done / total) * 100}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.ovulation,
                }}
              />
            </View>
            <Text style={{ color: theme.accentFg, opacity: 0.72, fontSize: 13, fontWeight: '800' }}>
              {t('ui.progress', { done, total })}
            </Text>
          </View>
          {target ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={continueLabel}
              onPress={() => openLesson(target.id)}
              style={({ pressed }) => ({
                marginTop: 6,
                minHeight: 52,
                borderRadius: 16,
                backgroundColor: theme.accentFg,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 16,
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Text style={{ color: theme.accentBg, fontSize: 16, fontWeight: '800' }}>{continueLabel}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text
          style={{
            marginTop: 22,
            marginHorizontal: 4,
            color: theme.textMuted,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
          }}
        >
          {t('home.cycle_section')}
        </Text>
        <Text style={{ marginTop: 4, marginHorizontal: 4, marginBottom: 10, color: theme.textMuted, fontSize: 14 }}>
          {t('home.cycle_section_sub')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 6 }}>
          {PHASES.map((phase, index) => {
            const name = phaseNames[index] ?? '';
            return (
              <Pressable
                key={phase}
                accessibilityRole="button"
                accessibilityLabel={name}
                onPress={() => router.push({ pathname: '/guide/[phase]', params: { phase } })}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 6,
                  paddingTop: 12,
                  paddingBottom: 10,
                  paddingHorizontal: 3,
                  borderRadius: 16,
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <View
                  style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      borderRadius: 12,
                      backgroundColor: theme[phase],
                      opacity: 0.15,
                    }}
                  />
                  <Text style={{ color: theme[phase], fontSize: 15, fontWeight: '900' }}>{phaseInitial(name)}</Text>
                </View>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                  style={{
                    width: '100%',
                    color: theme.text,
                    fontSize: phases.size,
                    lineHeight: phases.size + 3,
                    fontWeight: '800',
                    textAlign: 'center',
                  }}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={{
            marginTop: 22,
            marginBottom: 8,
            marginHorizontal: 4,
            color: theme.textMuted,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
          }}
        >
          {t('home.couple_section')}
        </Text>
        <View style={{ paddingHorizontal: 16, borderRadius: radii.card, backgroundColor: theme.surface }}>
          {lessons.map((lesson, index) => {
            const status = lessonRowStatus(lesson.id, lessons, read);
            const minutes =
              status === 'read'
                ? t('ui.minutes_done', { count: lesson.minutes })
                : status === 'current'
                  ? t('ui.minutes_current', { count: lesson.minutes })
                  : t('ui.minutes', { count: lesson.minutes });
            return (
              <LessonRow
                key={lesson.id}
                lesson={lesson}
                status={status}
                minutes={minutes}
                titleSize={titles.size}
                last={index === lessons.length - 1}
                onPress={() => openLesson(lesson.id)}
              />
            );
          })}
        </View>

        <Text
          style={{
            marginTop: 22,
            marginBottom: 8,
            marginHorizontal: 4,
            color: theme.textMuted,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
          }}
        >
          {t('home.reading_section')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('book.title')}
          onPress={() => router.push('/learn/book')}
          style={({ pressed }) => ({
            padding: 16,
            borderRadius: radii.card,
            backgroundColor: theme.surface,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <BookCover />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: theme.text, fontSize: 16, lineHeight: 21, fontWeight: '800' }}>{t('book.title')}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('book.author')}</Text>
          </View>
          <ChevronIcon color={theme.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function LessonRow({
  lesson,
  status,
  minutes,
  titleSize,
  last,
  onPress,
}: {
  lesson: LearnLesson;
  status: 'read' | 'current' | 'unread';
  minutes: string;
  titleSize: number;
  last: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.number}. ${lesson.title}. ${minutes}`}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 58,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.line,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <StatusMark status={status} theme={theme} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
          style={{
            color: theme.text,
            fontSize: titleSize,
            lineHeight: titleSize + 4,
            fontWeight: '800',
          }}
        >
          {lesson.number}. {lesson.title}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 17 }}>{minutes}</Text>
      </View>
      <ChevronIcon color={theme.textMuted} />
    </Pressable>
  );
}
