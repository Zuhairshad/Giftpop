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

const STEPS = [
  {
    title: "Send a short request",
    body: "Pick the form that fits and tell us who you are and what you offer. It takes a couple of minutes.",
  },
  {
    title: "It reaches our team",
    body: "Your request lands in our team's admin portal as new, with everything you wrote, and one of us reads it.",
  },
  {
    title: "We talk it through",
    body: "If it looks like a fit, we write to the email you gave us to talk about samples, pricing or timing.",
  },
  {
    title: "We decide together",
    body: "A brand's products become items in the gifts people build. A new country gets its own prices, delivery and payment options before it goes live.",
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
      <section aria-labelledby="partner-how" className="mt-12">
        <p className="font-script text-lavender-deep text-2xl leading-none font-bold">
          Step by step
        </p>
        <h2
          id="partner-how"
          className="font-display mt-2 text-3xl leading-tight font-bold tracking-tight"
        >
          How partnering works
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="bg-surface shadow-hairline flex min-w-0 gap-4 rounded-lg p-5"
            >
              <span
                aria-hidden="true"
                className="bg-primary-tint text-primary-pressed font-display flex size-9 flex-none items-center justify-center rounded-full text-lg font-bold"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-snug font-bold">{step.title}</h3>
                <p className="text-muted mt-1">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
