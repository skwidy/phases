import { useLinkingURL } from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

import { claimLink } from '@/sync/pending';
import { useTheme } from '@/theme';

export default function IncomingSyncScreen() {
  const theme = useTheme();
  const router = useRouter();
  const url = useLinkingURL();

  useEffect(() => {
    if (!url) return;
    claimLink(url);
    router.replace('/sync/receive');
  }, [router, url]);

  return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
}
