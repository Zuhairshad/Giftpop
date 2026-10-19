"use client";

import Link from "next/link";

/** Shown when the API is down or answers something unexpected. A missing gift is a 404 instead. */
export default function SharedGiftError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="py-10 text-center">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">We could not open this gift</h1>
      <p className="text-muted mt-3">Something went wrong on our side. Try again in a moment.</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="bg-pink text-on-pink hover:bg-pink-strong rounded-full px-6 py-2.5 font-bold transition-colors"
        >
          Try again
        </button>
        <Link href="/" className="text-pink-strong font-semibold underline underline-offset-4">
          Go to the home page
        </Link>
      </div>
    </section>
  );
}
