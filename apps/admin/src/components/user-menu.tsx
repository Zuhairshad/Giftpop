"use client";

import type { StaffUser } from "@giftpop/contracts";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { signOut } from "@/features/auth/auth-client";

interface UserMenuProps {
  user: Pick<StaffUser, "name" | "email" | "role">;
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      toast.error("Could not sign you out. Try again.");
      setSigningOut(false);
      return;
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            {/* No aria-label: the name starts with the visible text, so voice control matches it. */}
            <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.role === "owner" ? "Owner" : "Staff"}
                <span className="sr-only">, account menu</span>
              </span>
            </span>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="min-w-56">
            <div className="px-1.5 py-1.5 text-sm">
              <p className="truncate font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
            <DropdownMenuItem disabled={signingOut} onClick={() => void handleSignOut()}>
              <LogOutIcon aria-hidden="true" />
              {signingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
