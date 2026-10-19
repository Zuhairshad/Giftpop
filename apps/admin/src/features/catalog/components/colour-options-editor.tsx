"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";
import { useId } from "react";
import { useFieldArray } from "react-hook-form";

import { ColourInput } from "./colour-input";
import type { PackagingFormApi } from "./packaging-details-fields";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColourOptionsEditorProps {
  form: PackagingFormApi;
  name: "wrapperColors" | "ribbonColors";
  /** "wrapper" or "ribbon", for labels. */
  noun: string;
}

/** A list of named colours the customer can choose from. At least one is required. */
export function ColourOptionsEditor({ form, name, noun }: ColourOptionsEditorProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name });
  const baseId = useId();
  const { register, setValue, watch, formState } = form;
  const errors = formState.errors[name];
  const listError = errors?.root?.message ?? errors?.message;

  return (
    <fieldset className="grid grid-cols-1 content-start gap-3">
      <legend className="text-sm font-medium">
        {noun.charAt(0).toUpperCase() + noun.slice(1)} colours
      </legend>
      <ul className="grid grid-cols-1 gap-3">
        {fields.map((field, index) => {
          const rowErrors = errors?.[index];
          const nameId = `${baseId}-${index}-name`;
          const hexId = `${baseId}-${index}-hex`;
          return (
            <li key={field.id} className="flex flex-wrap items-start gap-2">
              <div className="grid min-w-36 flex-1 gap-1.5">
                <Label htmlFor={nameId} className="sr-only">
                  {`${noun} colour ${index + 1} name`}
                </Label>
                <Input
                  id={nameId}
                  placeholder="Name, such as Kraft"
                  autoComplete="off"
                  aria-invalid={Boolean(rowErrors?.name)}
                  {...register(`${name}.${index}.name`)}
                />
                {rowErrors?.name?.message ? (
                  <p role="alert" className="text-destructive text-sm">
                    {rowErrors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="grid w-44 gap-1.5">
                <Label htmlFor={hexId} className="sr-only">
                  {`${noun} colour ${index + 1} hex code`}
                </Label>
                <ColourInput
                  id={hexId}
                  value={watch(`${name}.${index}.hex`) ?? ""}
                  onChange={(hex) =>
                    setValue(`${name}.${index}.hex`, hex, {
                      shouldDirty: true,
                      shouldValidate: formState.isSubmitted,
                    })
                  }
                  invalid={Boolean(rowErrors?.hex)}
                  pickerLabel={`Pick ${noun} colour ${index + 1}`}
                />
                {rowErrors?.hex?.message ? (
                  <p role="alert" className="text-destructive text-sm">
                    {rowErrors.hex.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={fields.length <= 1}
                aria-label={`Remove ${noun} colour ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2Icon />
              </Button>
            </li>
          );
        })}
      </ul>
      {listError ? (
        <p role="alert" className="text-destructive text-sm">
          {listError}
        </p>
      ) : null}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: "", hex: "#cccccc" })}
        >
          <PlusIcon data-icon="inline-start" />
          Add {noun} colour
        </Button>
      </div>
    </fieldset>
  );
}
