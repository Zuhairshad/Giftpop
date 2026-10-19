"use client";

import type { StaffUser } from "@giftpop/contracts";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface CreatedAccount {
  user: StaffUser;
  password: string;
}

/** Shows the temporary password once, right after the account is created. */
export function InviteCreated({
  created,
  onDone,
}: {
  created: CreatedAccount;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(created.password);
      setCopied(true);
    } catch {
      toast.error("Could not copy. Select the password and copy it by hand.");
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Account created</DialogTitle>
        <DialogDescription>
          Give {created.user.name} this temporary password now. It is shown once and cannot be
          looked up later.
        </DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Sign in as {created.user.email}</span>
        <div className="flex items-center gap-2">
          <code className="bg-muted min-w-0 flex-1 rounded-lg px-2.5 py-1.5 font-mono text-sm break-all select-all">
            {created.password}
          </code>
          <Button type="button" variant="outline" onClick={() => void copyPassword()}>
            {copied ? (
              <CheckIcon data-icon="inline-start" aria-hidden="true" />
            ) : (
              <CopyIcon data-icon="inline-start" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy password"}
          </Button>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </DialogFooter>
    </>
  );
}
