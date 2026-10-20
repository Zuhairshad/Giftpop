import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Partner with us" };

const ROUTES = [
  {
    href: "/partners/brands",
    title: "I have a brand",
    body: "Want your products in our gifts? Tell us about your brand and what you make.",
    action: "Tell us about your brand",
    variant: "primary",
  },
  {
    href: "/partners/countries",
    title: "I want The Giftpop in my country",
    body: "We open one country at a time. If yours is not live yet, ask us to come.",
    action: "Ask us to open your country",
    variant: "tint",
  },
] as const;

export default function PartnersPage() {
  return (
    <section className="mx-auto w-full max-w-3xl min-w-0">
      <p className="font-script text-lavender-deep text-2xl leading-none font-bold">Partnerships</p>
      <h1 className="font-display mt-2 text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        Partner with The Giftpop
      </h1>
      <p className="text-muted mt-3 max-w-xl text-lg">
        There are two ways to work with us. Pick the one that fits and send a short request. We read
        every one.
      </p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {ROUTES.map((route) => (
          <li
            key={route.href}
            className="bg-surface shadow-hairline flex min-w-0 flex-col rounded-lg p-6"
          >
            <h2 className="font-display text-2xl leading-tight font-bold tracking-tight wrap-anywhere">
              {route.title}
            </h2>
            <p className="text-muted mt-2 flex-1">{route.body}</p>
            <ButtonLink
              href={route.href}
              variant={route.variant}
              block
              className="mt-5 whitespace-normal text-center"
            >
              {route.action}
            </ButtonLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
