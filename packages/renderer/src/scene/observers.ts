type Unobserve = () => void;
const NOOP: Unobserve = () => undefined;

export interface SizeObserverCtor {
  new (callback: (entries: readonly { contentRect: { width: number } }[]) => void): {
    observe(target: Element): void;
    disconnect(): void;
  };
}

export interface ViewObserverCtor {
  new (
    callback: (entries: readonly { isIntersecting: boolean }[]) => void,
    options?: { rootMargin?: string },
  ): { observe(target: Element): void; disconnect(): void };
}

/**
 * Reports the element's rendered width in CSS pixels, now and on every resize.
 * Without `ResizeObserver` it reports the current width once and then stays quiet.
 */
export function observeWidth(
  element: Element,
  onWidth: (width: number) => void,
  Observer: SizeObserverCtor | undefined = globalThis.ResizeObserver,
): Unobserve {
  if (!Observer) {
    onWidth(element.getBoundingClientRect().width);
    return NOOP;
  }
  const observer = new Observer((entries) => {
    const last = entries[entries.length - 1];
    if (last) onWidth(last.contentRect.width);
  });
  observer.observe(element);
  return () => observer.disconnect();
}

/**
 * Reports whether the element is within `rootMargin` of the viewport.
 * Without `IntersectionObserver` it reports `true` once, so images still load.
 */
export function observeNearViewport(
  element: Element,
  onChange: (near: boolean) => void,
  rootMargin = "200px",
  Observer: ViewObserverCtor | undefined = globalThis.IntersectionObserver,
): Unobserve {
  if (!Observer) {
    onChange(true);
    return NOOP;
  }
  const observer = new Observer(
    (entries) => {
      const last = entries[entries.length - 1];
      if (last) onChange(last.isIntersecting);
    },
    { rootMargin },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
