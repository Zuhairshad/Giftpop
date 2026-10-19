"use client";

import type { Country } from "@giftpop/contracts";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { flagEmoji, PAYMENT_MODE_OPTIONS } from "../lib/country-form";

import { CountryDialog } from "./country-dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MODE_LABELS = new Map<string, string>(
  PAYMENT_MODE_OPTIONS.map((option) => [option.value, option.value === "cod" ? "COD" : "Prepaid"]),
);

/** Owner-only: the page checks the role before it renders this. */
export function CountriesTable({ countries }: { countries: readonly Country[] }) {
  const [editing, setEditing] = useState<Country | null>(null);
  const [open, setOpen] = useState(false);

  function openFor(country: Country | null) {
    setEditing(country);
    setOpen(true);
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Button onClick={() => openFor(null)}>
          <PlusIcon data-icon="inline-start" />
          Add country
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment modes</TableHead>
              <TableHead>Shipping</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {countries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                  No countries yet.
                </TableCell>
              </TableRow>
            ) : null}
            {countries.map((country) => (
              <TableRow key={country.code}>
                <TableCell className="font-medium">
                  <span aria-hidden="true" className="mr-2 text-lg">
                    {flagEmoji(country.code)}
                  </span>
                  {country.name} <span className="text-muted-foreground">({country.code})</span>
                </TableCell>
                <TableCell>{country.currency}</TableCell>
                <TableCell>
                  <Badge variant={country.status === "live" ? "default" : "secondary"}>
                    {country.status === "live" ? "Live" : "Coming soon"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {country.paymentModes.length === 0 ? (
                      <span className="text-muted-foreground">None</span>
                    ) : (
                      country.paymentModes.map((mode) => (
                        <Badge key={mode} variant="outline">
                          {MODE_LABELS.get(mode) ?? mode}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {country.shipping.deliveryDays.min}&ndash;{country.shipping.deliveryDays.max} days
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openFor(country)}
                    aria-label={`Edit ${country.name}`}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CountryDialog country={editing} open={open} onOpenChange={setOpen} />
    </div>
  );
}
