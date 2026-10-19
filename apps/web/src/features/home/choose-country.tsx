import Link from "next/link";

/** Shown on the generic home, where no country is chosen yet. The anchor id is the hero's target. */
export function ChooseCountry() {
  return (
    <section
      id="choose-country"
      aria-labelledby="choose-country-heading"
      className="border-border bg-surface rounded-blob scroll-mt-24 border px-6 py-10 text-center"
    >
      <h2 id="choose-country-heading" className="font-display text-3xl font-bold">
        Choose your country
      </h2>
      <p className="text-muted mx-auto mt-2 max-w-md">
        Your country sets the currency, the items we can send and what delivery costs.
      </p>
      <Link
        href="/countries"
        className="bg-pink-strong text-on-pink hover:bg-pink shadow-pop mt-6 inline-block rounded-full px-7 py-3 text-base font-bold transition-colors"
      >
        See countries
      </Link>
    </section>
  );
}
