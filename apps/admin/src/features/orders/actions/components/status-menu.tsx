"use client";

import { nextStatuses } from "@giftpop/contracts";
import type { AdminOrderDetail, OrderStatus } from "@giftpop/contracts";
import { ChevronDownIcon } from "lucide-react";
import { useRef, useState } from "react";

import { actionFor, NO_FURTHER_STEPS } from "../lib/action-labels";

import { StatusDialog } from "./status-dialog";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Offers only the steps the state machine allows from the order's current status. */
export function StatusMenu({ order }: { order: Pick<AdminOrderDetail, "id" | "status"> }) {
  const options = nextStatuses(order.status);
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (options.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1">
        <Button type="button" variant="outline" disabled aria-describedby="no-steps">
          Change status
          <ChevronDownIcon />
        </Button>
        <span id="no-steps" className="text-muted-foreground text-xs">
          {NO_FURTHER_STEPS}
        </span>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button ref={triggerRef} type="button" variant="outline" />}>
          Change status
          <ChevronDownIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto min-w-56">
          {options.map((status) => (
            <DropdownMenuItem
              key={status}
              variant={status === "cancelled" ? "destructive" : "default"}
              onClick={() => setTarget(status)}
            >
              {actionFor(status).label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <StatusDialog
        orderId={order.id}
        target={target}
        onClose={() => setTarget(null)}
        finalFocus={triggerRef}
      />
    </>
  );
}
