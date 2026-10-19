import { GiftIllustration } from "@/components/gift-illustration";

/**
 * HERO SLOT. A static placeholder on purpose: the hero motion piece is a separate
 * decision and is not built in phase 5. Replace this component's body when it is.
 */
export function Hero() {
  return (
    <section className="bg-pink-soft rounded-blob relative overflow-hidden px-6 py-10 sm:px-12 sm:py-16">
      <div className="max-w-lg">
        <h1 className="font-display text-4xl leading-tight font-bold sm:text-5xl">
          Build a gift they will remember
        </h1>
        <p className="text-muted mt-4 text-lg">
          Choose a format, pick the items, and watch your gift take shape. We make it by hand and
          send it to their door.
        </p>
        <a
          href="#choose-country"
          className="bg-pink text-on-pink shadow-pop hover:bg-pink-strong mt-8 inline-block rounded-full px-7 py-3 text-base font-bold transition-colors"
        >
          Start building
        </a>
      </div>
      <GiftIllustration className="gp-float pointer-events-none mx-auto mt-8 w-48 sm:absolute sm:top-1/2 sm:right-12 sm:mt-0 sm:w-64 sm:-translate-y-1/2" />
    </section>
  );
}
