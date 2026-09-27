import { useRouter } from 'expo-router';

import { LockScreen } from '@/components/LockScreen';

export default function LockRoute() {
  const router = useRouter();
  return <LockScreen onUnlock={() => router.back()} />;
}
