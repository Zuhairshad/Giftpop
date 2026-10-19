import type { OrderStatus } from "@giftpop/contracts";
import type { ReactElement } from "react";

import { statusLabel, statusTone } from "./status-labels";

export function StatusPill({ status }: { status: OrderStatus }): ReactElement {
  return (
    <span className={`${statusTone(status)} inline-block rounded-full px-3 py-1 text-sm font-bold`}>
      {statusLabel(status)}
    </span>
  );
}
