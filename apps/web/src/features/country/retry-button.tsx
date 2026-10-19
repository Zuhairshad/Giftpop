"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui";

/** Asks the server to render the current page again, for pages that fell back to an outage state. */
export function RetryButton({ children = "Try again" }: { children?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      aria-busy={pending}
    >
      {children}
    </Button>
  );
}
