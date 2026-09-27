import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';

import { LockScreen } from '@/components/LockScreen';
import { useAppStore } from '@/store/useAppStore';

const BACKGROUND_LOCK_MS = 60_000;

export function LockGate() {
  const faceId = useAppStore((state) => state.security.faceId);
  const [locked, setLocked] = useState(() => useAppStore.getState().security.faceId);
  const backgroundedAt = useRef<number | null>(null);
  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    if (!faceId) setLocked(false);
  }, [faceId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (!useAppStore.getState().security.faceId) return;
      if (next === 'background') {
        backgroundedAt.current = Date.now();
        return;
      }
      if (next === 'active' && backgroundedAt.current !== null) {
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= BACKGROUND_LOCK_MS) setLocked(true);
      }
    });
    return () => subscription.remove();
  }, []);

  if (!locked) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <LockScreen onUnlock={unlock} />
    </View>
  );
}
