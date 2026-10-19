import Link from "next/link";

const TABS = [
  { key: "items", label: "Items", href: "/catalog" },
  { key: "packaging", label: "Packaging", href: "/catalog/packaging" },
] as const;

export type CatalogTab = (typeof TABS)[number]["key"];

/** Links between the two catalog lists. Plain links, so they work without JavaScript. */
export function CatalogTabs({ current }: { current: CatalogTab }) {
  return (
    <nav aria-label="Catalog sections" className="flex gap-1 border-b px-4 md:px-6">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === current ? "page" : undefined}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring aria-[current=page]:border-primary aria-[current=page]:text-foreground -mb-px rounded-t-md border-b-2 border-transparent px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
