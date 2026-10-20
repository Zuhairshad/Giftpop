import type { SharedDesignView } from "@giftpop/contracts";
import { GiftScene } from "@giftpop/renderer";
import type { ReactElement } from "react";

import { GiftReveal } from "./gift-reveal";
import { InertChrome } from "./inert-chrome";
import { SharedGiftDetails } from "./shared-gift-details";

import { Logo } from "@/components/logo";
import { SiteFooter } from "@/components/site-footer";
import { optimisedImageUrl } from "@/lib/image-url";

/**
 * The full-screen view of a shared gift. Covers the site chrome so the gift is the whole page, but
 * keeps the same logo (same place as the site header) and the same slim footer bar, so it still
 * reads as our site. The scene is the static one: the reveal below animates it in with CSS, and the
 * gift never changes on this page, so the motion library would add weight and nothing to see.
 */
export function SharedGiftScreen({ view }: { view: SharedDesignView }): ReactElement {
  const scene = (
    <GiftScene
      imageUrl={optimisedImageUrl}
      design={view.design}
      packaging={view.packaging}
      items={view.items}
    />
  );

  return (
    <div className="bg-canvas fixed inset-0 z-[60] flex flex-col overflow-y-auto">
      {/* The soft light pools of the design system (globals.css): decorative, never over text. */}
      <div
        aria-hidden="true"
        className="gp-light-pools pointer-events-none absolute inset-0 [--gp-pool-a-shape:44%_50%_at_26%_42%] [--gp-pool-b-shape:40%_40%_at_88%_92%]"
      />
      <InertChrome />
      <header className="gp-bar relative flex h-14 flex-none items-center md:h-16">
        <Logo />
      </header>
      <div
        id="gift"
        className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-[var(--gp-gutter)] py-6"
      >
        <GiftReveal scene={scene} details={<SharedGiftDetails view={view} />} />
      </div>
      <div className="relative flex-none">
        <SiteFooter />
      </div>
    </div>
  );
}
