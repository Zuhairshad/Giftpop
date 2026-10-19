import { redirect } from "next/navigation";

type BuildPageProps = { params: Promise<{ country: string }> };

export default async function BuildPage({ params }: BuildPageProps) {
  const { country } = await params;
  redirect(`/${country.toLowerCase()}/build/format`);
}
