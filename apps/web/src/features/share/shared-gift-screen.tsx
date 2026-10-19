import type { SharedDesignView } from "@giftpop/contracts";
import { GiftScene } from "@giftpop/renderer";
import Link from "next/link";
import type { ReactElement } from "react";

import { GiftReveal } from "./gift-reveal";
import { InertChrome } from "./inert-chrome";
import { SharedGiftDetails } from "./shared-gift-details";

import { optimisedImageUrl } from "@/lib/image-url";

/**
 * The full-screen view of a shared gift. Covers the site chrome so the gift is the whole page.
 * The scene is the static one: the reveal below animates it in with CSS, and the gift never
 * changes on this page, so the motion library would add weight and nothing to see.
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
    <div className="bg-background fixed inset-0 z-[60] overflow-y-auto">
      {/* The soft light pools of the design system: decorative, dimmer in dark mode. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: "var(--gp-pool-opacity)",
          background:
            "radial-gradient(ellipse 60% 50% at 25% 35%, var(--gp-pool-pink) 0%, transparent 70%), radial-gradient(ellipse 50% 45% at 85% 90%, var(--gp-pool-lavender) 0%, transparent 70%)",
        }}
      />
      <InertChrome />
      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-4 py-5 sm:px-6">
        <header>
          <Link
            href="/"
            className="font-brand text-pink-strong inline-flex min-h-11 items-center text-2xl"
            aria-label="The Giftpop, home"
          >
            The Giftpop
          </Link>
        </header>
        <div id="gift" className="flex flex-1 flex-col justify-center py-6">
          <GiftReveal scene={scene} details={<SharedGiftDetails view={view} />} />
        </div>
      </div>
    </div>
  );
}
