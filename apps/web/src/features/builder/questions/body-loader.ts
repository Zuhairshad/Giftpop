"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import type { QuestionId } from "./ids";
import { getQuestion } from "./registry";

/**
 * Question bodies after the first load in their own chunks, so the builder's first load carries
 * only the packaging question. A loaded body is kept here and renders at once from then on (no
 * Suspense flash), and `preloadQuestionBodies` fetches them all when the browser is idle.
 * Kept in a "use client" module: a lazy import reached from a Server Component is preloaded.
 */
const loaded = new Map<QuestionId, ComponentType>();
const pending = new Map<QuestionId, Promise<ComponentType>>();

/** The body if it is already here, or null. */
export function loadedBody(id: QuestionId): ComponentType | null {
  const { body } = getQuestion(id);
  if ("eager" in body) return body.eager;
  return loaded.get(id) ?? null;
}

/** Loads a body once; later calls share the same promise. */
export function loadBody(id: QuestionId): Promise<ComponentType> {
  const ready = loadedBody(id);
  if (ready) return Promise.resolve(ready);
  const inFlight = pending.get(id);
  if (inFlight) return inFlight;
  const { body } = getQuestion(id);
  if ("eager" in body) return Promise.resolve(body.eager);
  const promise = body.load().then(
    (component) => {
      loaded.set(id, component);
      pending.delete(id);
      return component;
    },
    (error: unknown) => {
      // Forget the failure so the next attempt fetches again.
      pending.delete(id);
      throw error;
    },
  );
  pending.set(id, promise);
  return promise;
}

/** The body of a question, or null while its chunk loads. A failed load retries after a pause. */
export function useQuestionBody(id: QuestionId): ComponentType | null {
  const [state, setState] = useState<{ id: QuestionId; body: ComponentType | null }>(() => ({
    id,
    body: loadedBody(id),
  }));
  const body = state.id === id ? state.body : loadedBody(id);

  useEffect(() => {
    if (body) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = (delay: number) => {
      loadBody(id).then(
        (component) => {
          if (active) setState({ id, body: component });
        },
        () => {
          if (active) timer = setTimeout(() => attempt(Math.min(delay * 2, 8000)), delay);
        },
      );
    };
    attempt(1000);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [id, body]);

  return body;
}

/** Fetches every lazy body, ignoring failures (the body retries when it is shown). */
export function preloadQuestionBodies(ids: readonly QuestionId[]): void {
  for (const id of ids) loadBody(id).catch(() => undefined);
}
