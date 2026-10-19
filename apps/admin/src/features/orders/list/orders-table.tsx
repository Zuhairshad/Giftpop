import Link from "next/link";

import type { OrderRow } from "./lib/row";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const HEADS = ["Order", "Date", "Country", "Customer", "Total", "Payment", "Status", "Items"];

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${className}`}
    >
      {label}
    </span>
  );
}

function Head() {
  return (
    <TableHeader className="bg-background sticky top-0 z-10">
      <TableRow>
        {HEADS.map((head) => (
          <TableHead key={head} scope="col" className="whitespace-nowrap">
            {head}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

export function OrdersTable({ rows }: { rows: readonly OrderRow[] }) {
  return (
    <Table>
      <caption className="sr-only">Orders, newest first</caption>
      <Head />
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium whitespace-nowrap">
              <Link
                href={row.href}
                className="focus-visible:ring-ring rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-2"
              >
                {row.number}
              </Link>
              {row.hasPendingProof ? (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  Proof to check
                </span>
              ) : null}
            </TableCell>
            <TableCell className="whitespace-nowrap">{row.date}</TableCell>
            <TableCell className="whitespace-nowrap">
              <span aria-hidden="true">{row.flag}</span> {row.countryCode}
            </TableCell>
            <TableCell className="max-w-48 truncate wrap-anywhere" title={row.customer}>
              {row.customer}
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums">{row.total}</TableCell>
            <TableCell>
              <Pill label={row.paymentLabel} className={row.paymentStyle} />
            </TableCell>
            <TableCell>
              <Pill label={row.statusLabel} className={row.statusStyle} />
            </TableCell>
            <TableCell className="whitespace-nowrap">{row.items}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function OrdersTableSkeleton() {
  return (
    <Table aria-busy="true">
      <caption className="sr-only">Loading orders</caption>
      <Head />
      <TableBody>
        {Array.from({ length: 8 }, (_, i) => (
          <TableRow key={i}>
            {HEADS.map((head) => (
              <TableCell key={head}>
                <Skeleton className="h-4 w-full min-w-12" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
