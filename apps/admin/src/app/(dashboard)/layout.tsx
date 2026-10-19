import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSession } from "@/lib/session";

// Checks the staff session on the server for every dashboard request. A layout does not re-run on
// client-side navigation, so pages that are owner-only call `requireOwner()` themselves, and the API
// checks the session again on every call.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await getSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
