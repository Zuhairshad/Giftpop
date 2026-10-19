export type MoveDirection = "up" | "down";

/** Index a line lands on after one step up or down, or null when it is already at that end. */
export function stepTarget(index: number, direction: MoveDirection, length: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= length) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  return target < 0 || target >= length ? null : target;
}

/** Index to move to when a line is dropped on another, or null when nothing would change. */
export function dropTarget(from: number | null, over: number, length: number): number | null {
  if (from === null || from === over) return null;
  if (from < 0 || from >= length || over < 0 || over >= length) return null;
  return over;
}

/** A copy of `list` with the entry at `from` moved to `to`. Out-of-range moves return an unchanged copy. */
export function moveInList<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length || from === to) return next;
  const [moved] = next.splice(from, 1);
  if (moved === undefined) return next;
  next.splice(to, 0, moved);
  return next;
}

/** Plain sentence for the live region after a move; positions are shown 1-based. */
export function moveAnnouncement(name: string, to: number, length: number): string {
  return `${name} moved to position ${to + 1} of ${length}`;
}
