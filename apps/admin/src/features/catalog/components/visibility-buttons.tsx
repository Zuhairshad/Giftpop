"use client";

import { SaveItemRequestSchema, SavePackagingRequestSchema } from "@giftpop/contracts";
import type { Country, Item, Packaging } from "@giftpop/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { saveItem, savePackaging, updateCountry } from "../api/client";

import { Button } from "@/components/ui/button";

interface ToggleProps {
  name: string;
  hidden: boolean;
  hideLabel: string;
  showLabel: string;
  hiddenMessage: string;
  shownMessage: string;
  run: () => Promise<unknown>;
}

function ToggleButton({
  name,
  hidden,
  hideLabel,
  showLabel,
  hiddenMessage,
  shownMessage,
  run,
}: ToggleProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      await run();
      toast.success(hidden ? shownMessage : hiddenMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const label = hidden ? showLabel : hideLabel;
  return (
    <Button
      type="button"
      variant={hidden ? "secondary" : "outline"}
      size="sm"
      disabled={busy}
      aria-label={`${label} ${name}`}
      onClick={() => void onClick()}
    >
      {busy ? "Saving" : label}
    </Button>
  );
}

export function ItemVisibilityButton({ item }: { item: Item }) {
  return (
    <ToggleButton
      name={item.name}
      hidden={!item.active}
      hideLabel="Hide"
      showLabel="Restore"
      hiddenMessage={`${item.name} is hidden from the store.`}
      shownMessage={`${item.name} is back in the store.`}
      run={() => saveItem(item.id, SaveItemRequestSchema.parse({ ...item, active: !item.active }))}
    />
  );
}

export function PackagingVisibilityButton({ packaging }: { packaging: Packaging }) {
  return (
    <ToggleButton
      name={packaging.name}
      hidden={!packaging.active}
      hideLabel="Hide"
      showLabel="Restore"
      hiddenMessage={`${packaging.name} is hidden from the store.`}
      shownMessage={`${packaging.name} is back in the store.`}
      run={() =>
        savePackaging(
          packaging.id,
          SavePackagingRequestSchema.parse({ ...packaging, active: !packaging.active }),
        )
      }
    />
  );
}

export function CountryLockButton({ country }: { country: Country }) {
  const locked = country.status === "coming_soon";
  return (
    <ToggleButton
      name={country.name}
      hidden={locked}
      hideLabel="Lock"
      showLabel="Unlock"
      hiddenMessage={`${country.name} is locked (coming soon).`}
      shownMessage={`${country.name} is open for orders.`}
      run={() => updateCountry(country.code, { status: locked ? "live" : "coming_soon" })}
    />
  );
}
