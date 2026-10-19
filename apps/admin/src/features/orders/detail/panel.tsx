import type { ReactNode } from "react";

/** A titled section with an accessible heading. */
export function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="bg-card min-w-0 rounded-xl border p-4">
      <h2 id={id} tabIndex={-1} className="mb-3 text-base font-semibold outline-none">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm wrap-anywhere">{children}</dd>
    </div>
  );
}
