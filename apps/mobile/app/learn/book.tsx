import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BookCover } from '@/components/BookCover';
import { ChevronIcon } from '@/components/ChevronIcon';
import { parseLessons } from '@/content/learn';
import { radii, space, type as typeScale, useTheme } from '@/theme';

export default function BookScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('learn');
  const lessons = parseLessons(t('series.lessons', { returnObjects: true }));
  const url = t('book.url');

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

        <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <BookCover width={84} height={114} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: typeScale.label,
                fontWeight: '800',
                letterSpacing: typeScale.labelTracking,
                textTransform: 'uppercase',
              }}
            >
              {t('book.label')}
            </Text>
            <Text
              accessibilityRole="header"
              style={{ color: theme.text, fontSize: 22, lineHeight: 27, fontWeight: '900', letterSpacing: -0.3 }}
            >
              {t('book.title')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 19 }}>{t('book.subtitle')}</Text>
          </View>
        </View>

        <View style={{ marginTop: 20, padding: 18, borderRadius: radii.card, backgroundColor: theme.surface, gap: 6 }}>
          <Text style={{ color: theme.text, fontSize: typeScale.body, fontWeight: '900' }}>{t('book.author')}</Text>
          <Text style={{ color: theme.text, fontSize: typeScale.secondary, lineHeight: 22 }}>{t('book.author_bio')}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('book.publisher')}</Text>
        </View>

        <View style={{ marginTop: 12, padding: 18, borderRadius: radii.card, backgroundColor: theme.surface, gap: 6 }}>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: typeScale.label,
              fontWeight: '800',
              letterSpacing: typeScale.labelTracking,
              textTransform: 'uppercase',
            }}
          >
            {t('ui.why')}
          </Text>
          <Text style={{ color: theme.text, fontSize: 16, lineHeight: 23 }}>{t('book.why')}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('book.cta')}
          onPress={() => {
            void Linking.openURL(url);
          }}
          style={({ pressed }) => ({
            marginTop: 16,
            minHeight: 56,
            borderRadius: radii.button,
            backgroundColor: theme.accentBg,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.75 : 1,
          })}
        >
          <Text style={{ color: theme.accentFg, fontSize: typeScale.body, fontWeight: '800' }}>{t('book.cta')}</Text>
          <Svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Path
              d="M7 17L17 7M9 7h8v8"
              stroke={theme.accentFg}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View style={{ marginTop: 20, padding: 18, borderRadius: radii.card, backgroundColor: theme.surface }}>
          <Text
            style={{
              marginBottom: 6,
              color: theme.textMuted,
              fontSize: typeScale.label,
              fontWeight: '800',
              letterSpacing: typeScale.labelTracking,
              textTransform: 'uppercase',
            }}
          >
            {t('ui.lessons', { count: lessons.length })}
          </Text>
          {lessons.map((lesson) => (
            <Text key={lesson.id} style={{ color: theme.text, fontSize: typeScale.secondary, lineHeight: 24 }}>
              {lesson.number}. {lesson.title}
            </Text>
          ))}
        </View>

        <Text style={{ marginTop: 16, marginHorizontal: 4, color: theme.textMuted, fontSize: 13, lineHeight: 19 }}>
          {t('book.disclaimer')}
        </Text>
      </ScrollView>
    </View>
  );
}
