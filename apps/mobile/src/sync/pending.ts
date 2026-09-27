import { fragmentFromLink } from './format';

let pending: string | null = null;
let openedUrl: string | null = null;

export function peekPendingSync(): string | null {
  return pending;
}

export function claimLink(url: string): boolean {
  if (url === openedUrl) return false;
  const fragment = fragmentFromLink(url);
  if (fragment === null) return false;
  openedUrl = url;
  pending = fragment;
  return true;
}

export function releaseLink(): void {
  openedUrl = null;
}
