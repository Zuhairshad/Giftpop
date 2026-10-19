"use client";

/** DEV ONLY. Mounts a step view on the fake builder. Production code must never import this. */
import { PersonaliseView } from "../../personalise/personalise-view";
import { ArrangeView } from "../arrange-view";

import { useFakeBuilder } from "./fake-builder";

export function DevArrange() {
  return <ArrangeView builder={useFakeBuilder()} />;
}

export function DevPersonalise() {
  return <PersonaliseView builder={useFakeBuilder()} />;
}
