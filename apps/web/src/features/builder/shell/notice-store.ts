import { useSyncExternalStore } from "react";

/**
 * One notice for the shell ("Left out because they are no longer available: ..."), kept outside React
 * so it survives the page re-mounting when `?from=` is removed from the address.
 */
let notice: string | null = null;
const listeners = new Set<() => void>();

export function setNotice(next: string | null): void {
  if (next === notice) return;
  notice = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotice(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => notice,
    () => null,
  );
}
