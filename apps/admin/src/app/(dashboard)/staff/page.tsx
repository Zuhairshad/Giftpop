import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Staff" };

export default function StaffPage() {
  return <PlaceholderPage title="Staff" description="Staff accounts and roles." />;
}
