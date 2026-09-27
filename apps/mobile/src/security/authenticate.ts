import * as LocalAuthentication from 'expo-local-authentication';

export type AuthLabels = {
  prompt: string;
  cancel: string;
  fallback: string;
};

export type AuthOutcome = 'success' | 'failed' | 'unavailable';

export async function authenticateDevice(labels: AuthLabels): Promise<AuthOutcome> {
  const level = await LocalAuthentication.getEnrolledLevelAsync();
  if (level === LocalAuthentication.SecurityLevel.NONE) return 'unavailable';
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: labels.prompt,
    cancelLabel: labels.cancel,
    fallbackLabel: labels.fallback,
    disableDeviceFallback: false,
  });
  return result.success ? 'success' : 'failed';
}
