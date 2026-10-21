import Link from "next/link";

import { HeroStage } from "./hero3d";
import { HOME_EYEBROW, HOME_HEADLINE, HOME_LEDE } from "./home-copy";
import { giftsHrefFromBuild } from "./view-models";

import { ButtonLink } from "@/components/ui";

type HomeScreenProps = {
  ticks: string[];
  /** `/<cc>/build`, or `/countries` when no country is chosen yet. */
  buildHref: string;
  /** Set on `/` only: adds the quiet "Choose your country" link. */
  chooseCountryHref?: string;
};

// Short phones (568px high) lose the eyebrow first, then the lede, then the ticks, so the scene and button stay in view.
const HIDE_EYEBROW = "[@media(max-height:700px)]:hidden";
const HIDE_LEDE = "[@media(max-height:620px)]:hidden";
const HIDE_TICKS = "[@media(max-height:600px)]:hidden";

// A quiet second way on, dropped on short screens so the scene and the primary button keep the room.
const QUIET_LINK =
  "text-muted hover:text-foreground inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-semibold underline underline-offset-4 [@media(max-height:640px)]:hidden";

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="text-success flex-none"
    >
      <path
        d="M3 8.5l3.2 3L13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The whole home page: exactly one viewport, no scroll. Phone: copy, scene, ticks, button.
 * Desktop (768px and up): copy 5fr and scene 7fr, the copy block vertically centred.
 * Server-rendered; the scene is `HeroStage`, which loads its own client code.
 */
export function HomeScreen({ ticks, buildHref, chooseCountryHref }: HomeScreenProps) {
  // Only a country's own home links on to its ready-made gifts; `/` has no country yet.
  const giftsHref = giftsHrefFromBuild(buildHref);
  return (
    <div data-viewport-fit="home" className="relative isolate h-full min-h-0 overflow-hidden">
      {/* Feathered pink and lavender light pools (globals.css), centred on the scene. */}
      <div
        aria-hidden="true"
        className="gp-light-pools pointer-events-none absolute inset-0 -z-10 [--gp-pool-a-shape:70%_42%_at_50%_62%] [--gp-pool-b-shape:60%_36%_at_0%_100%] md:[--gp-pool-a-shape:42%_60%_at_72%_52%] md:[--gp-pool-b-shape:34%_44%_at_8%_96%]"
      />
      {/* Same gutter as the header bar (16px phones, 40px desktop), so the copy lines up with the logo. */}
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1320px] flex-col px-[var(--gp-gutter)] pt-3 pb-3 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:grid-rows-[1fr_auto_auto_auto_1fr] md:gap-x-2 md:pt-0 md:pb-0">
        <div className="relative z-10 max-w-[560px] flex-none md:col-start-1 md:row-start-2">
          <p
            className={`bg-lavender text-lavender-deep font-script inline-flex rounded-full px-3.5 pt-1.5 pb-1 text-[22px] leading-[1.1] font-bold ${HIDE_EYEBROW}`}
          >
            {HOME_EYEBROW}
          </p>
          <h1 className="font-display mt-3.5 mb-3 text-[clamp(34px,9.6vw,44px)] leading-[1.02] font-bold tracking-[-1.6px] text-balance wrap-anywhere md:text-[clamp(44px,4.2vw,62px)] md:tracking-[-2.6px] [@media(max-height:700px)]:mt-0">
            {HOME_HEADLINE}
          </h1>
          <p
            className={`text-muted max-w-[30ch] text-[17px] leading-[1.45] md:max-w-[34ch] md:text-xl md:tracking-[-0.125px] ${HIDE_LEDE}`}
          >
            {HOME_LEDE}
          </p>
        </div>

        <div className="my-2 min-h-0 flex-1 md:col-start-2 md:row-span-5 md:row-start-1 md:my-0">
          <HeroStage className="h-full w-full" />
        </div>

        {/* Hidden on phones (DESIGN.md). From 768px a tidy two-column grid, so four never leave one orphan. */}
        <ul
          aria-label="Why people choose The Giftpop"
          className={`text-ink-2 hidden flex-none text-sm leading-tight font-medium md:col-start-1 md:row-start-4 md:grid md:w-fit md:grid-cols-[auto_auto] md:gap-x-6 md:gap-y-2 md:pt-[18px] ${HIDE_TICKS}`}
        >
          {ticks.map((tick) => (
            <li key={tick} className="inline-flex items-center gap-1.5">
              <CheckIcon />
              {tick}
            </li>
          ))}
        </ul>

        <div className="relative z-10 flex flex-none flex-col items-stretch gap-1 md:col-start-1 md:row-start-3 md:mt-5 md:flex-row md:items-center md:gap-4">
          <ButtonLink href={buildHref} size="lg" className="w-full md:w-auto">
            Build your gift
            <ArrowIcon />
          </ButtonLink>
          {chooseCountryHref ? (
            <Link href={chooseCountryHref} className={QUIET_LINK}>
              Choose your country
            </Link>
          ) : null}
          {giftsHref ? (
            <Link href={giftsHref} className={QUIET_LINK}>
              Browse ready-made gifts
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
