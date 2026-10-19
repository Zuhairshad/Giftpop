import { redirect } from "next/navigation";

/**
 * Old step addresses (`/pk/build/items`, `/pk/build/review?from=<shareId>`) lead to the one builder
 * page. `?from` is carried along so shared gifts and templates still open.
 */
export async function redirectToBuilder({
  params,
  searchParams,
}: {
  params: Promise<{ country: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}): Promise<never> {
  const { country } = await params;
  const { from } = await searchParams;
  const share = Array.isArray(from) ? from[0] : from;
  const base = `/${country.toLowerCase()}/build`;
  return redirect(share ? `${base}?from=${encodeURIComponent(share)}` : base);
}
