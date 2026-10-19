import { GiftIllustration } from "@/components/gift-illustration";

const STEPS = [
  { title: "Pick a format", text: "A bouquet, a box or a basket." },
  { title: "Choose the items", text: "Sweets, mugs, flowers and more." },
  { title: "See it come together", text: "Your gift is arranged as you build." },
  { title: "Add a personal note", text: "A card message and a name." },
] as const;

export default function Home() {
  return (
    <div className="space-y-12">
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

      <section id="choose-country" aria-labelledby="choose-country-title" className="scroll-mt-24">
        <h2 id="choose-country-title" className="font-display text-2xl font-bold sm:text-3xl">
          Where is the gift going?
        </h2>
        <p className="text-muted mt-2 max-w-xl">
          Your country sets the currency, the items you can pick, the prices and the delivery time.
        </p>
        <p className="bg-surface border-border text-muted mt-5 rounded-card border border-dashed p-5 text-sm">
          The country list will appear here once the catalogue is connected.
        </p>
      </section>

      <section aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title" className="font-display text-2xl font-bold sm:text-3xl">
          How it works
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="bg-surface border-border rounded-card border p-5 shadow-sm"
            >
              <span className="bg-pink text-on-pink flex size-8 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <h3 className="mt-3 font-bold">{step.title}</h3>
              <p className="text-muted mt-1 text-sm">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
