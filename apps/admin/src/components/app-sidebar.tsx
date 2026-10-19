"use client";

import {
  GiftIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  PackageIcon,
  ShoppingBagIcon,
  UsersIcon,
  GlobeIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { navItems } from "@/config/nav";
import { isActiveHref } from "@/lib/nav";

// Icons are presentation only, so they live here and not in the lead's nav config.
const ICONS: Record<string, LucideIcon> = {
  "/": LayoutDashboardIcon,
  "/orders": ShoppingBagIcon,
  "/catalog": PackageIcon,
  "/countries": GlobeIcon,
  "/partners": HandshakeIcon,
  "/templates": LayoutTemplateIcon,
  "/staff": UsersIcon,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <GiftIcon className="size-5" aria-hidden="true" />
          <span className="text-sm font-semibold">The Giftpop</span>
          <span className="text-muted-foreground text-xs">Admin</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Phase 1: hide items with `ownerOnly` from staff by role. Today every item is listed. */}
            <SidebarMenu aria-label="Main">
              {navItems.map((item) => {
                const Icon = ICONS[item.href] ?? GiftIcon;
                const active = isActiveHref(pathname, item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => setOpenMobile(false)}
                        />
                      }
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
