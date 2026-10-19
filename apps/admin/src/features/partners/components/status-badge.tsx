import type { PartnerRequestStatus } from "@giftpop/contracts";

import { STATUS_LABELS } from "../lib/format";

import { Badge } from "@/components/ui/badge";

const VARIANTS: Record<PartnerRequestStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    new: "default",
    in_talks: "secondary",
    accepted: "outline",
    declined: "destructive",
  };

export function StatusBadge({ status }: { status: PartnerRequestStatus }) {
  return <Badge variant={VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
