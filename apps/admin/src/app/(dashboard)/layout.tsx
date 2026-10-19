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
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-3 focus:ring-ring"
      >
        Skip to content
      </a>
      <AppSidebar user={user} />
      <SidebarInset id="admin-main" tabIndex={-1} className="outline-none">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
