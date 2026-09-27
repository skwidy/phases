import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authenticateDevice } from '@/security/authenticate';
import { useAppStore } from '@/store/useAppStore';
import { serif, space, type as typeScale, useTheme } from '@/theme';

import { PrimaryButton } from './PrimaryButton';

type Props = {
  onUnlock: () => void;
};

export function LockScreen({ onUnlock }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const self = useAppStore((state) => state.mode) === 'self';
  const [unavailable, setUnavailable] = useState(false);
  const busy = useRef(false);
  const onUnlockRef = useRef(onUnlock);
  const labelsRef = useRef({
    prompt: t('lock.reason'),
    cancel: t('common.cancel'),
    fallback: t('lock.passcode'),
  });

  useEffect(() => {
    onUnlockRef.current = onUnlock;
    labelsRef.current = {
      prompt: t('lock.reason'),
      cancel: t('common.cancel'),
      fallback: t('lock.passcode'),
    };
  });

  const unlock = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      const outcome = await authenticateDevice(labelsRef.current);
      if (outcome === 'success') onUnlockRef.current();
      if (outcome === 'unavailable') setUnavailable(true);
    } finally {
      busy.current = false;
    }
  }, []);

  useEffect(() => {
    void unlock();
  }, [unlock]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.ink,
        paddingHorizontal: space.screen,
        paddingTop: insets.top + 24,
        paddingBottom: Math.max(insets.bottom, 24),
      }}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          accessibilityRole="header"
          style={{ ...serif, color: theme.inkFg, fontSize: typeScale.title, textAlign: 'center' }}
        >
          {t('lock.title')}
        </Text>
        <Text
          style={{
            marginTop: 10,
            color: theme.inkFg,
            fontSize: typeScale.body,
            lineHeight: 22,
            textAlign: 'center',
          }}
        >
          {t(self ? 'lock.text_self' : 'lock.text')}
        </Text>
        {unavailable ? (
          <Text
            style={{
              marginTop: 16,
              color: theme.inkFg,
              fontSize: typeScale.secondary,
              lineHeight: 20,
              textAlign: 'center',
            }}
          >
            {t('lock.unavailable')}
          </Text>
        ) : null}
      </View>
      <PrimaryButton label={t('lock.unlock')} onPress={() => void unlock()} />
    </View>
  );
}
