"use client";

import { flagEmoji } from "../lib/country-form";
import type { PriceRow } from "../lib/price-grid";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


interface PriceGridProps {
  rows: readonly PriceRow[];
  errors: Record<string, string>;
  onChange: (rows: PriceRow[]) => void;
  /** What the thing being priced is called, for the control labels ("Dark chocolate"). */
  subject: string;
}

/** One row per country: the price in that country's currency, and whether it is in stock. */
export function PriceGrid({ rows, errors, onChange, subject }: PriceGridProps) {
  function update(country: string, patch: Partial<PriceRow>) {
    onChange(rows.map((row) => (row.country === country ? { ...row, ...patch } : row)));
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">Add a country first, then set prices.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Country</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>In stock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const error = errors[row.country];
            const priceId = `price-${row.country}`;
            const errorId = `${priceId}-error`;
            return (
              <TableRow key={row.country}>
                <TableCell className="whitespace-normal">
                  <span aria-hidden="true">{flagEmoji(row.country)}</span> {row.countryName}
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-2">
                    <Input
                      id={priceId}
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="Not sold"
                      value={row.priceText}
                      aria-label={`Price of ${subject} in ${row.countryName} (${row.currency})`}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? errorId : undefined}
                      onChange={(event) => update(row.country, { priceText: event.target.value })}
                      className="w-24 sm:w-36"
                    />
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {row.currency}
                    </span>
                  </div>
                  {error ? (
                    <p id={errorId} role="alert" className="text-destructive mt-1 text-sm">
                      {error}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={row.inStock}
                    onCheckedChange={(checked) => update(row.country, { inStock: checked })}
                    aria-label={`${subject} in stock in ${row.countryName}`}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <p className="text-muted-foreground text-xs">
        Prices are in each country&rsquo;s own currency, like 12.50. Leave a price empty to not sell
        here. A saved price cannot be removed from this screen.
      </p>
    </div>
  );
}
