const listeners = new Set<() => void>();
let pending = false;

export function markCycleSaved(): void {
  pending = true;
  for (const listener of listeners) listener();
}

export function consumeCycleSaved(): boolean {
  const saved = pending;
  pending = false;
  return saved;
}

export function subscribeCycleSaved(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
