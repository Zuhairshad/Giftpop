"use client";

import { SavePackagingRequestSchema } from "@giftpop/contracts";
import type { Country, Packaging, PriceEntry, SavePackagingRequest } from "@giftpop/contracts";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { savePackaging, savePrices, updateAssetAnchor } from "../api/client";
import { applyApiError, readApiError } from "../lib/api-errors";
import { commitImageDraft, draftFromAsset, markCommitted } from "../lib/image-draft";
import type { ImageDraft } from "../lib/image-draft";
import {
  buildSavePackagingRequest,
  emptyPackagingValues,
  packagingToFormValues,
} from "../lib/packaging-form";
import type { PackagingFormInput } from "../lib/packaging-form";
import { buildPackagingPreview } from "../lib/scene-preview";

import { ColourOptionsEditor } from "./colour-options-editor";
import { FormAlert } from "./field";
import { ImageUploader } from "./image-uploader";
import { PackagingDetailsFields } from "./packaging-details-fields";
import { PriceGrid } from "./price-grid";
import { SceneView } from "./scene-view";
import { usePriceRows } from "./use-price-rows";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PackagingFormProps {
  /** The packaging being edited, or undefined for a new one. */
  packaging?: Packaging;
  countries: readonly Country[];
  prices: readonly PriceEntry[];
}

export function PackagingForm({ packaging, countries, prices }: PackagingFormProps) {
  const router = useRouter();
  const form = useForm<PackagingFormInput, unknown, SavePackagingRequest>({
    resolver: zodResolver(SavePackagingRequestSchema),
    defaultValues: packaging ? packagingToFormValues(packaging) : emptyPackagingValues(),
  });
  const [back, setBack] = useState<ImageDraft | undefined>(() =>
    draftFromAsset(packaging?.layers.back),
  );
  const [front, setFront] = useState<ImageDraft | undefined>(() =>
    draftFromAsset(packaging?.layers.front),
  );
  const [packagingId, setPackagingId] = useState(packaging?.id);
  const [saveError, setSaveError] = useState<string>();
  const priceRows = usePriceRows(countries, prices);
  const { isSubmitting } = form.formState;

  const [name, layoutType, minItems, maxItems, wrapperColors, ribbonColors] = useWatch({
    control: form.control,
    name: ["name", "layoutType", "minItems", "maxItems", "wrapperColors", "ribbonColors"],
  });
  const scene = buildPackagingPreview({
    name,
    layoutType,
    minItems,
    maxItems,
    wrapperColor: wrapperColors[0]?.hex,
    ribbonColor: ribbonColors[0]?.hex,
    layers: { back: back?.asset, front: front?.asset },
  });

  async function onSubmit(values: SavePackagingRequest) {
    setSaveError(undefined);
    const entries = priceRows.validate();
    if (entries === null) {
      setSaveError("Fix the prices below, then save again.");
      return;
    }

    let saved: Packaging;
    try {
      const [committedBack, committedFront] = await Promise.all([
        commitImageDraft(back, updateAssetAnchor),
        commitImageDraft(front, updateAssetAnchor),
      ]);
      saved = await savePackaging(
        packagingId,
        buildSavePackagingRequest(values, { back: committedBack, front: committedFront }),
      );
      setPackagingId(saved.id);
      setBack(markCommitted(back));
      setFront(markCommitted(front));
    } catch (error) {
      setSaveError(applyApiError(error, form.setError));
      return;
    }

    if (entries.length > 0) {
      try {
        await savePrices("packagings", saved.id, entries);
        priceRows.markSaved();
      } catch (error) {
        const { message } = readApiError(error);
        toast.error(`${saved.name} was saved, but its prices were not: ${message}`);
        if (!packaging) router.replace(`/catalog/packaging/${saved.id}`);
        else setSaveError(message);
        return;
      }
    }

    toast.success(`${saved.name} saved`);
    if (packaging) router.refresh();
    else router.replace(`/catalog/packaging/${saved.id}`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 gap-6">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <PackagingDetailsFields form={form} autoSlug={!packaging} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colour options</CardTitle>
              <CardDescription>
                The customer picks one wrapper and one ribbon colour.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ColourOptionsEditor form={form} name="wrapperColors" noun="wrapper" />
              <ColourOptionsEditor form={form} name="ribbonColors" noun="ribbon" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Layer images</CardTitle>
              <CardDescription>
                The back layer is drawn behind the items and the front layer over them. Both are
                optional: without them the store draws a plain placeholder.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ImageUploader
                label="Back layer"
                value={back}
                onChange={setBack}
                hint="Square image, drawn behind the items."
              />
              <ImageUploader
                label="Front layer"
                value={front}
                onChange={setFront}
                hint="Square image, drawn over the items."
              />
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-4">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <SceneView
              scene={scene}
              caption="Sample items, about half way between the fewest and the most."
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Prices and stock</CardTitle>
          <CardDescription>
            One price for each country, saved together with the packaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PriceGrid
            rows={priceRows.rows}
            errors={priceRows.errors}
            onChange={priceRows.setRows}
            subject={name.trim() === "" ? "this packaging" : name}
          />
        </CardContent>
      </Card>

      <FormAlert message={saveError} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : packaging ? "Save packaging" : "Create packaging"}
        </Button>
        <Link href="/catalog/packaging" className={buttonVariants({ variant: "outline" })}>
          Back to packaging
        </Link>
      </div>
    </form>
  );
}
