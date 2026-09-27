import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Card } from '@/components/Card';
import { OnboardingFrame } from '@/components/OnboardingFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SceneHero } from '@/components/SceneHero';
import { Title } from '@/components/Title';
import { Wordmark } from '@/components/Wordmark';
import { useAppStore } from '@/store/useAppStore';
import { eyebrowStyle, radii, serif, type as typeScale, useTheme } from '@/theme';

export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const setPartnerName = useAppStore((state) => state.setPartnerName);
  const [name, setName] = useState(() => useAppStore.getState().partnerName ?? '');

  function continueOnboarding() {
    if (mode === 'partner') setPartnerName(name);
    else setPartnerName('');
    router.push('/onboarding/last-period');
  }

  return (
    <OnboardingFrame
      step={1}
      footer={<PrimaryButton label={t('common.continue')} onPress={continueOnboarding} />}
    >
      <Wordmark />
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        <SceneHero label={t('onboarding.welcome_art')} width={Math.min(width - 80, 280)} />
      </View>
      <Title
        emphasis={t('onboarding.welcome_emphasis')}
        style={{
          marginTop: 16,
          fontSize: typeScale.title,
          lineHeight: 36,
          letterSpacing: -0.4,
        }}
      >
        {t('onboarding.welcome_title')}
      </Title>
      <Text style={{ marginTop: 8, color: theme.textMuted, fontSize: 16, lineHeight: 22 }}>
        {t('onboarding.welcome_text')}
      </Text>
      <Text style={{ ...eyebrowStyle(theme), marginTop: 20 }}>{t('onboarding.who')}</Text>
      <View style={{ marginTop: 10 }}>
        <View style={{ marginBottom: 10 }}>
          <Card
            selected={mode === 'partner'}
            accessibilityLabel={t('onboarding.mode_partner')}
            onPress={() => setMode('partner')}
          >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...serif, color: theme.text, fontSize: typeScale.body }}>
              {t('onboarding.mode_partner')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('onboarding.mode_partner_sub')}</Text>
          </View>
          <ChoiceMark selected={mode === 'partner'} />
        </Card>
        </View>
        <Card
          selected={mode === 'self'}
          accessibilityLabel={t('onboarding.mode_self')}
          onPress={() => setMode('self')}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...serif, color: theme.text, fontSize: typeScale.body }}>
              {t('onboarding.mode_self')}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>{t('onboarding.mode_self_sub')}</Text>
          </View>
          <ChoiceMark selected={mode === 'self'} />
        </Card>
      </View>
      {mode === 'partner' ? (
        <>
          <Text style={{ ...eyebrowStyle(theme), marginTop: 20 }}>{t('onboarding.name_label')}</Text>
          <TextInput
            accessibilityLabel={t('onboarding.name_label')}
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={setName}
            placeholder={t('onboarding.name_placeholder')}
            placeholderTextColor={theme.textMuted}
            value={name}
            style={{
              marginTop: 8,
              height: 50,
              paddingHorizontal: 16,
              borderRadius: radii.button,
              backgroundColor: theme.surface,
              color: theme.text,
              fontFamily: 'ui-rounded',
              fontSize: typeScale.body,
            }}
          />
        </>
      ) : null}
      <View style={{ marginTop: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <LockIcon color={theme.good} />
          <Text style={{ flex: 1, color: theme.textMuted, fontSize: 14, fontWeight: '700' }}>
            {t('onboarding.reassure_local')}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <InfoIcon color={theme.textMuted} />
          <Text style={{ flex: 1, color: theme.textMuted, fontSize: 14, fontWeight: '700' }}>
            {t('onboarding.reassure_medical')}
          </Text>
        </View>
      </View>
    </OnboardingFrame>
  );
}

function ChoiceMark({ selected }: { selected: boolean }) {
  const theme = useTheme();
  if (!selected) {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={10.5} stroke={theme.textMuted} strokeWidth={1.5} />
      </Svg>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} fill={theme.text} />
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

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={10} width={14} height={10} rx={2} stroke={color} strokeWidth={2.2} />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.2} />
      <Path d="M12 8v5M12 16.5v.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
