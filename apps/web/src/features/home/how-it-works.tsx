const STEPS = [
  {
    title: "Choose",
    body: "Pick your country and a gift format, like a bouquet, a box or a basket.",
    art: (
      <>
        <circle cx="60" cy="60" r="44" fill="var(--gp-sky)" />
        <rect x="34" y="46" width="52" height="38" rx="10" fill="var(--gp-pink)" />
        <rect x="30" y="38" width="60" height="14" rx="6" fill="var(--gp-pink-strong)" />
        <rect x="56" y="38" width="8" height="46" fill="var(--gp-butter)" />
      </>
    ),
  },
  {
    title: "Build",
    body: "Pick the items, watch your gift take shape, and add a card with their name.",
    art: (
      <>
        <circle cx="60" cy="60" r="44" fill="var(--gp-mint)" />
        <rect x="30" y="62" width="22" height="26" rx="6" fill="var(--gp-butter)" />
        <rect x="55" y="44" width="18" height="44" rx="8" fill="var(--gp-pink)" />
        <circle cx="86" cy="72" r="13" fill="var(--gp-lilac)" />
        <circle cx="86" cy="72" r="5" fill="var(--gp-pink-strong)" />
      </>
    ),
  },
  {
    title: "We make and deliver",
    body: "We make your gift by hand, pack it with care and send it to their door.",
    art: (
      <>
        <circle cx="60" cy="60" r="44" fill="var(--gp-lilac)" />
        <rect x="26" y="48" width="44" height="30" rx="6" fill="var(--gp-pink)" />
        <path d="M70 56h16l10 10v12H70z" fill="var(--gp-pink-strong)" />
        <circle cx="42" cy="82" r="7" fill="var(--gp-butter)" />
        <circle cx="84" cy="82" r="7" fill="var(--gp-butter)" />
      </>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading" className="font-display text-3xl font-bold">
        How it works
      </h2>
      <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="border-border bg-surface rounded-card flex flex-wrap gap-4 border p-5 sm:flex-col sm:flex-nowrap"
          >
            <svg
              viewBox="0 0 120 120"
              width="96"
              height="96"
              className="h-24 w-24 shrink-0"
              aria-hidden="true"
              focusable="false"
            >
              {step.art}
            </svg>
            <div className="min-w-0 flex-1 basis-40 wrap-anywhere">
              <h3 className="font-display text-xl font-bold">
                <span className="text-pink-strong">{index + 1}.</span> {step.title}
              </h3>
              <p className="text-muted mt-1">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
