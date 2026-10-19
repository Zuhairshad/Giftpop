import type { PartnerRequest } from "@giftpop/contracts";

import { formatDate, requestTitle } from "../lib/format";

import { StatusBadge } from "./status-badge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PartnersTableProps {
  items: readonly PartnerRequest[];
  countryName: (code: string) => string;
  onOpen: (request: PartnerRequest) => void;
}

/** One row per request. The name opens the detail sheet. */
export function PartnersTable({ items, countryName, onOpen }: PartnersTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="max-w-56 whitespace-normal">
                <button
                  type="button"
                  onClick={() => onOpen(request)}
                  className="focus-visible:ring-ring/50 rounded-sm text-left font-medium wrap-anywhere underline-offset-4 outline-none hover:underline focus-visible:ring-3"
                >
                  {requestTitle(request, countryName)}
                </button>
                {request.kind === "brand" ? (
                  <p className="text-muted-foreground text-xs">{countryName(request.country)}</p>
                ) : null}
              </TableCell>
              <TableCell className="max-w-64 whitespace-normal">
                <p className="wrap-anywhere">{request.contactName}</p>
                <p className="text-muted-foreground text-xs wrap-anywhere">{request.email}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">
                {formatDate(request.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
