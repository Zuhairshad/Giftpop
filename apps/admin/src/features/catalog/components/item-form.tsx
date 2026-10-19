"use client";

import { SaveItemRequestSchema } from "@giftpop/contracts";
import type { Country, Item, PriceEntry, SaveItemRequest } from "@giftpop/contracts";
import { LAYOUT_TYPES } from "@giftpop/renderer";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";


import { saveItem, savePrices, updateAssetAnchor } from "../api/client";
import { applyApiError, readApiError } from "../lib/api-errors";
import { commitImageDraft, draftFromAsset, markCommitted } from "../lib/image-draft";
import type { ImageDraft } from "../lib/image-draft";
import { buildSaveItemRequest, emptyItemValues, itemToFormValues } from "../lib/item-form";
import type { ItemFormInput } from "../lib/item-form";
import { buildItemPreview } from "../lib/scene-preview";

import { Field, FormAlert } from "./field";
import { ImageUploader } from "./image-uploader";
import { ItemDetailsFields } from "./item-details-fields";
import { OptionSelect } from "./option-select";
import { PriceGrid } from "./price-grid";
import { SceneView } from "./scene-view";
import { usePriceRows } from "./use-price-rows";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemFormProps {
  /** The item being edited, or undefined for a new one. */
  item?: Item;
  countries: readonly Country[];
  prices: readonly PriceEntry[];
  categories: readonly string[];
}

const LAYOUT_OPTIONS = LAYOUT_TYPES.map((value) => ({
  value: String(value),
  label: String(value),
}));

export function ItemForm({ item, countries, prices, categories }: ItemFormProps) {
  const router = useRouter();
  const form = useForm<ItemFormInput, unknown, SaveItemRequest>({
    resolver: zodResolver(SaveItemRequestSchema),
    defaultValues: item ? itemToFormValues(item) : emptyItemValues(),
  });
  const [image, setImage] = useState<ImageDraft | undefined>(() => draftFromAsset(item?.image));
  const [itemId, setItemId] = useState(item?.id);
  const [previewLayout, setPreviewLayout] = useState<string>(LAYOUT_OPTIONS[0]?.value ?? "");
  const [saveError, setSaveError] = useState<string>();
  const priceRows = usePriceRows(countries, prices);
  const { isSubmitting } = form.formState;

  const [name, shape, color] = useWatch({ control: form.control, name: ["name", "shape", "color"] });
  const scene = buildItemPreview({ name, shape, color, image: image?.asset }, previewLayout);

  async function onSubmit(values: SaveItemRequest) {
    setSaveError(undefined);
    const entries = priceRows.validate();
    if (entries === null) {
      setSaveError("Fix the prices below, then save again.");
      return;
    }

    let saved: Item;
    try {
      const committed = await commitImageDraft(image, updateAssetAnchor);
      saved = await saveItem(itemId, buildSaveItemRequest(values, committed));
      setItemId(saved.id);
      setImage(markCommitted(image));
    } catch (error) {
      setSaveError(applyApiError(error, form.setError));
      return;
    }

    if (entries.length > 0) {
      try {
        await savePrices("items", saved.id, entries);
        priceRows.markSaved();
      } catch (error) {
        toast.error(
          `${saved.name} was saved, but its prices were not: ${readApiError(error).message}`,
        );
        if (!item) router.replace(`/catalog/items/${saved.id}`);
        else setSaveError(readApiError(error).message);
        return;
      }
    }

    toast.success(`${saved.name} saved`);
    if (item) router.refresh();
    else router.replace(`/catalog/items/${saved.id}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemDetailsFields form={form} categories={categories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image</CardTitle>
          <CardDescription>
            Drag the marker to the point that sits in the gift slot, such as the bottom of a stem.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ImageUploader label="Item image" value={image} onChange={setImage} withAnchor />
          <div className="grid grid-cols-1 content-start gap-3">
            <Field label="Preview in">
              {(field) => (
                <OptionSelect
                  id={field.id}
                  value={previewLayout}
                  options={LAYOUT_OPTIONS}
                  onValueChange={setPreviewLayout}
                  className="w-48"
                />
              )}
            </Field>
            <SceneView
              scene={scene}
              caption="Four of this item in a gift, as the store draws it."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prices and stock</CardTitle>
          <CardDescription>
            One price for each country, saved together with the item.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceGrid
            rows={priceRows.rows}
            errors={priceRows.errors}
            onChange={priceRows.setRows}
            subject={name.trim() === "" ? "this item" : name}
          />
        </CardContent>
      </Card>

      <FormAlert message={saveError} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : item ? "Save item" : "Create item"}
        </Button>
        <Link href="/catalog" className={buttonVariants({ variant: "outline" })}>
          Back to items
        </Link>
      </div>
    </form>
  );
}
