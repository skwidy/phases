import { type AppState, type AppStore } from '@/store/useAppStore';

let pending: AppState | null = null;

export function appStateOf(state: AppStore): AppState {
  return {
    version: state.version,
    mode: state.mode,
    partnerName: state.partnerName,
    language: state.language,
    cycles: state.cycles,
    defaults: state.defaults,
    reminders: state.reminders,
    security: state.security,
    learn: state.learn,
    onboarded: state.onboarded,
  };
}

export function setPendingImport(state: AppState | null): void {
  pending = state;
}

export function peekPendingImport(): AppState | null {
  return pending;
}
