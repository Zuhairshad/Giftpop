"use client";

import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Called once when anything below throws (a failed import, a WebGL error). The poster stays. */
  onError: () => void;
}

/** Keeps a failure in the 3D scene from reaching the page: renders nothing and tells the stage. */
export class HeroErrorBoundary extends Component<Props, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(): void {
    this.props.onError();
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children;
  }
}
