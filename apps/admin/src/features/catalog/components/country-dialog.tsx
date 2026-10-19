"use client";

import { CountrySchema } from "@giftpop/contracts";
import type { Country } from "@giftpop/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createCountry, updateCountry } from "../api/client";
import { applyApiError } from "../lib/api-errors";
import { emptyCountryValues, toUpdateCountryRequest } from "../lib/country-form";

import { CountryFields } from "./country-fields";
import { FormAlert } from "./field";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CountryDialogProps {
  /** The country to edit, or null to add a new one. */
  country: Country | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Remounts its form each time it opens, so a cancelled edit never lingers. */
export function CountryDialog({ country, open, onOpenChange }: CountryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {open ? <CountryForm country={country} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CountryForm({ country, onDone }: { country: Country | null; onDone: () => void }) {
  const router = useRouter();
  const form = useForm<Country, unknown, Country>({
    resolver: zodResolver(CountrySchema),
    defaultValues: country ?? emptyCountryValues(),
  });
  const [saveError, setSaveError] = useState<string>();
  const { isSubmitting } = form.formState;

  async function onSubmit(values: Country) {
    setSaveError(undefined);
    try {
      const saved = country
        ? await updateCountry(country.code, toUpdateCountryRequest(values))
        : await createCountry(values);
      toast.success(`${saved.name} ${country ? "saved" : "added"}`);
      onDone();
      router.refresh();
    } catch (error) {
      setSaveError(applyApiError(error, form.setError));
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-4">
      <DialogHeader>
        <DialogTitle>{country ? `Edit ${country.name}` : "Add a country"}</DialogTitle>
        <DialogDescription>
          {country
            ? "Changes apply to new orders. Existing orders keep what they were placed with."
            : "A new country needs prices for its items before customers can buy there."}
        </DialogDescription>
      </DialogHeader>
      <CountryFields form={form} existing={country !== null} />
      <FormAlert message={saveError} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : country ? "Save country" : "Add country"}
        </Button>
      </DialogFooter>
    </form>
  );
}
