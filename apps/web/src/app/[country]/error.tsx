"use client";

/** Shown when something under a country page fails to load, for example the builder when the API is down. */
export default function CountryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="py-16 text-center" aria-labelledby="country-error-heading">
      <h1 id="country-error-heading" className="font-display text-3xl font-bold">
        We could not load this page
      </h1>
      <p className="text-muted mt-3">
        Something went wrong on our side. Nothing was lost. Try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-pink text-on-pink hover:bg-pink-strong mt-6 rounded-full px-6 py-2.5 font-bold transition-colors"
      >
        Try again
      </button>
    </section>
  );
}
