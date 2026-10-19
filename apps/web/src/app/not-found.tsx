import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="py-10 text-center">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">We could not find that page</h1>
      <p className="text-muted mt-3">The link may be wrong, or the page may have moved.</p>
      <Link
        href="/"
        className="bg-pink text-on-pink hover:bg-pink-strong mt-6 inline-block rounded-full px-6 py-2.5 font-bold transition-colors"
      >
        Go to the home page
      </Link>
    </section>
  );
}
