import type { OrderStatus } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { statusLabel, statusTone } from "./status-labels";

export function StatusPill({ status }: { status: OrderStatus }): ReactElement {
  return (
    <span
      className={`${statusTone(status)} inline-flex min-h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold shadow-hairline`}
    >
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-current" />
      {statusLabel(status)}
    </span>
  );
}
