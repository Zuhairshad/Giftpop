import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Partner with us" };

const ROUTES = [
  {
    href: "/partners/brands",
    title: "I have a brand",
    body: "Want your products in our gifts? Tell us about your brand and what you make.",
    action: "Tell us about your brand",
  },
  {
    href: "/partners/countries",
    title: "I want The Giftpop in my country",
    body: "We open one country at a time. If yours is not live yet, ask us to come.",
    action: "Ask us to open your country",
  },
] as const;

export default function PartnersPage() {
  return (
    <section className="mx-auto w-full max-w-3xl min-w-0">
      <p className="text-pink-strong text-sm font-bold tracking-wide uppercase">Partnerships</p>
      <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Partner with The Giftpop</h1>
      <p className="text-muted mt-3 max-w-xl text-base">
        There are two ways to work with us. Pick the one that fits and send a short request. We read
        every one.
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {ROUTES.map((route) => (
          <li
            key={route.href}
            className="bg-surface border-border shadow-pop rounded-blob flex min-w-0 flex-col border p-6"
          >
            <h2 className="font-display text-2xl font-bold">{route.title}</h2>
            <p className="text-muted mt-2 flex-1">{route.body}</p>
            <Link
              href={route.href}
              className="bg-pink text-on-pink hover:bg-pink-strong mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-bold transition-colors"
            >
              {route.action}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
