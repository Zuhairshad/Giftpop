import Link from "next/link";

const linkClass =
  "inline-block rounded-full px-6 py-3 text-base font-bold transition-colors";

export function PartnerBand() {
  return (
    <section
      aria-labelledby="partners-heading"
      className="bg-pink-soft rounded-blob px-6 py-10 sm:px-12"
    >
      <h2 id="partners-heading" className="font-display text-3xl font-bold">
        Grow with The Giftpop
      </h2>
      <p className="text-muted mt-2 max-w-xl">
        Are you a brand with products people love, or do you want gifts like these where you live?
        Talk to us.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/partners/brands"
          className={`${linkClass} bg-pink-strong text-on-pink hover:bg-pink`}
        >
          Sell your products in our gifts
        </Link>
        <Link
          href="/partners/countries"
          className={`${linkClass} border-pink-strong text-foreground hover:bg-surface border-2`}
        >
          Bring The Giftpop to your country
        </Link>
      </div>
    </section>
  );
}
