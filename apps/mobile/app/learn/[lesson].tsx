import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronIcon } from '@/components/ChevronIcon';
import { PrimaryButton } from '@/components/PrimaryButton';
import { parseLessons, type LearnLesson, type LearnLink } from '@/content/learn';
import { useAppStore } from '@/store/useAppStore';
import { radii, space, type as typeScale, useTheme } from '@/theme';

function lessonId(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  return value?.[0] ?? '';
}

function openLinkedRoute(router: ReturnType<typeof useRouter>, route: string) {
  switch (route) {
    case '/(tabs)':
    case '/':
      router.push('/');
      return;
    case '/(tabs)/calendar':
    case '/calendar':
      router.push('/calendar');
      return;
    case '/guide':
      router.push('/guide');
      return;
    case '/sync/share':
      router.push('/sync/share');
      return;
    case '/(tabs)/settings':
    case '/settings':
      router.push('/settings');
      return;
    default:
      return;
  }
}

export default function LessonScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ lesson: string }>();
  const { t } = useTranslation('learn');
  const markLessonRead = useAppStore((state) => state.markLessonRead);
  const lessons = parseLessons(t('series.lessons', { returnObjects: true }));
  const id = lessonId(params.lesson);
  const lesson = lessons.find((item) => item.id === id) ?? null;
  const index = lesson ? lessons.findIndex((item) => item.id === lesson.id) : -1;
  const next = index >= 0 ? (lessons[index + 1] ?? null) : null;
  const known = lesson !== null;

  useEffect(() => {
    if (known) markLessonRead(id);
  }, [known, id, markLessonRead]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 24),
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.title')}
          onPress={() => (router.canGoBack() ? router.back() : router.navigate('/(tabs)/learn'))}
          style={({ pressed }) => ({
            minHeight: 44,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <ChevronIcon color={theme.spm} size={18} direction="left" />
          <Text style={{ color: theme.spm, fontSize: 16, fontWeight: '800' }}>{t('home.title')}</Text>
        </Pressable>

        {lesson ? (
          <LessonBody
            lesson={lesson}
            total={lessons.length}
            next={next}
            onNext={() => {
              if (next) router.push({ pathname: '/learn/[lesson]', params: { lesson: next.id } });
              else router.dismissTo('/(tabs)/learn');
            }}
            onLink={(link) => openLinkedRoute(router, link.route)}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

function LessonBody({
  lesson,
  total,
  next,
  onNext,
  onLink,
}: {
  lesson: LearnLesson;
  total: number;
  next: LearnLesson | null;
  onNext: () => void;
  onLink: (link: LearnLink) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation('learn');

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
        <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
          {Array.from({ length: total }, (_, segment) => (
            <View
              key={segment}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                backgroundColor: segment < lesson.number ? theme.text : theme.line,
              }}
            />
          ))}
        </View>
        <Text style={{ flexShrink: 1, color: theme.textMuted, fontSize: 13, fontWeight: '800' }}>
          {t('ui.lesson_meta', { n: lesson.number, total, count: lesson.minutes })}
        </Text>
      </View>

      <Text
        accessibilityRole="header"
        style={{
          marginTop: 18,
          color: theme.text,
          fontSize: 32,
          lineHeight: 37,
          fontWeight: '900',
          letterSpacing: -0.6,
        }}
      >
        {lesson.title}
      </Text>

      <Tint tone="luteale">
        <Text
          style={{
            color: theme.spm,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
          }}
        >
          {t('ui.key_idea')}
        </Text>
        <Text style={{ marginTop: 6, color: theme.text, fontSize: 18, lineHeight: 25, fontWeight: '800' }}>
          {lesson.key_idea}
        </Text>
      </Tint>

      <View style={{ marginTop: 20, gap: 14 }}>
        {lesson.body.map((paragraph) => (
          <Text key={paragraph} style={{ color: theme.text, fontSize: typeScale.body, lineHeight: 26 }}>
            {paragraph}
          </Text>
        ))}
      </View>

      {lesson.steps ? <Steps steps={lesson.steps} title={t('ui.steps')} note={t('ui.steps_note')} /> : null}

      {lesson.quote ? (
        <View style={{ marginTop: 20, padding: 18, borderRadius: radii.card, backgroundColor: theme.surface, gap: 6 }}>
          <Text style={{ color: theme.luteale, fontSize: 44, lineHeight: 30, fontWeight: '900' }}>{t('ui.quote_mark')}</Text>
          <Text style={{ color: theme.text, fontSize: 20, lineHeight: 27, fontWeight: '800' }}>{lesson.quote.text}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>{lesson.quote.source}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: 14, padding: 18, borderRadius: radii.card, backgroundColor: theme.surface, gap: 8 }}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '900' }}>{lesson.with_phases.title}</Text>
        <Text style={{ color: theme.text, fontSize: 16, lineHeight: 23 }}>{lesson.with_phases.text}</Text>
        {lesson.with_phases.link ? (
          <LinkButton link={lesson.with_phases.link} onPress={onLink} />
        ) : null}
      </View>

      <Tint tone="ovulation">
        <Text
          style={{
            color: theme.text,
            fontSize: typeScale.label,
            fontWeight: '800',
            letterSpacing: typeScale.labelTracking,
            textTransform: 'uppercase',
          }}
        >
          {t('ui.try')}
        </Text>
        <Text style={{ marginTop: 8, color: theme.text, fontSize: 16, lineHeight: 23 }}>{lesson.try}</Text>
      </Tint>

      <View style={{ marginTop: 22 }}>
        <PrimaryButton label={next ? t('ui.next') : t('ui.finish')} onPress={onNext} />
      </View>
    </View>
  );
}

function LinkButton({ link, onPress }: { link: LearnLink; onPress: (link: LearnLink) => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={link.label}
      onPress={() => onPress(link)}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        marginTop: 4,
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: theme.accentBg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: theme.accentFg, fontSize: 14, fontWeight: '800' }}>{link.label}</Text>
    </Pressable>
  );
}

function Steps({ steps, title, note }: { steps: { name: string; text: string }[]; title: string; note: string }) {
  const theme = useTheme();

  return (
    <View style={{ marginTop: 20, padding: 20, borderRadius: radii.card, backgroundColor: theme.surface }}>
      <Text
        style={{
          marginBottom: 14,
          color: theme.textMuted,
          fontSize: typeScale.label,
          fontWeight: '800',
          letterSpacing: typeScale.labelTracking,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {steps.map((step, stepIndex) => {
        const last = stepIndex === steps.length - 1;
        return (
          <View
            key={step.name}
            accessible
            accessibilityLabel={`${stepIndex + 1}. ${step.name}. ${step.text}`}
            style={{ flexDirection: 'row', gap: 14 }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: theme.accentBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: theme.accentFg, fontSize: 15, fontWeight: '900' }}>{stepIndex + 1}</Text>
              </View>
              {last ? null : <View style={{ width: 3, flexGrow: 1, minHeight: 22, backgroundColor: theme.line }} />}
            </View>
            <View style={{ flex: 1, paddingTop: 5, paddingBottom: last ? 0 : 16 }}>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: '900' }}>{step.name}</Text>
              <Text style={{ color: theme.textMuted, fontSize: typeScale.secondary, lineHeight: 21 }}>{step.text}</Text>
            </View>
          </View>
        );
      })}
      <Text style={{ marginTop: 14, color: theme.textMuted, fontSize: 14, lineHeight: 20 }}>{note}</Text>
    </View>
  );
}

function Tint({ tone, children }: { tone: 'luteale' | 'ovulation'; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: radii.card,
        overflow: 'hidden',
        backgroundColor: theme.surface,
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          backgroundColor: theme[tone],
          opacity: 0.16,
        }}
      />
      <View style={{ paddingHorizontal: 20, paddingVertical: 18 }}>{children}</View>
    </View>
  );
}
