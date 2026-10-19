"use client";

import { ITEM_SHAPES } from "@giftpop/contracts";
import type { SaveItemRequest } from "@giftpop/contracts";
import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";


import { DEFAULT_PERSONALIZATION_MAX_LENGTH } from "../lib/item-form";
import type { ItemFormInput } from "../lib/item-form";

import { ColourInput } from "./colour-input";
import { Field, ToggleRow } from "./field";
import { OptionSelect } from "./option-select";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const SHAPE_OPTIONS = ITEM_SHAPES.map((shape) => ({
  value: shape,
  label: shape.replace("-", " ").replace(/^./, (letter) => letter.toUpperCase()),
}));

export type ItemFormApi = UseFormReturn<ItemFormInput, unknown, SaveItemRequest>;

interface ItemDetailsFieldsProps {
  form: ItemFormApi;
  /** Existing categories, offered as suggestions. A new one can be typed. */
  categories: readonly string[];
}

export function ItemDetailsFields({ form, categories }: ItemDetailsFieldsProps) {
  const { register, control, watch, setValue, formState } = form;
  const { errors } = formState;
  const personalizable = watch("personalizable");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Name" error={errors.name?.message} className="sm:col-span-2">
        {(field) => <Input {...field} autoComplete="off" {...register("name")} />}
      </Field>

      <Field
        label="Category"
        error={errors.category?.message}
        hint="Pick an existing category or type a new one."
      >
        {(field) => (
          <>
            <Input
              {...field}
              list={`${field.id}-list`}
              autoComplete="off"
              {...register("category")}
            />
            <datalist id={`${field.id}-list`}>
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </>
        )}
      </Field>

      <Field
        label="Shape"
        error={errors.shape?.message}
        hint="Used for the placeholder until there is an image."
      >
        {(field) => (
          <Controller
            control={control}
            name="shape"
            render={({ field: { value, onChange } }) => (
              <OptionSelect
                id={field.id}
                value={value}
                options={SHAPE_OPTIONS}
                onValueChange={onChange}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
              />
            )}
          />
        )}
      </Field>

      <Field
        label="Colour"
        error={errors.color?.message}
        hint="Used for the placeholder until there is an image."
      >
        {(field) => (
          <Controller
            control={control}
            name="color"
            render={({ field: { value, onChange, onBlur } }) => (
              <ColourInput
                id={field.id}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                invalid={field["aria-invalid"]}
                describedBy={field["aria-describedby"]}
                pickerLabel="Pick the item colour"
              />
            )}
          />
        )}
      </Field>

      <Field
        label="Size units"
        error={errors.sizeUnits?.message}
        hint="How much room one of these takes up in the packaging."
      >
        {(field) => (
          <Input
            {...field}
            type="number"
            min={1}
            step={1}
            {...register("sizeUnits", { valueAsNumber: true })}
          />
        )}
      </Field>

      <Field label="Sort order" error={errors.sortOrder?.message} hint="Lower numbers come first.">
        {(field) => (
          <Input
            {...field}
            type="number"
            step={1}
            {...register("sortOrder", { valueAsNumber: true })}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:col-span-2">
        <Controller
          control={control}
          name="active"
          render={({ field: { value, onChange } }) => (
            <ToggleRow label="Active" description="Inactive items are hidden from the store.">
              {({ id }) => <Switch id={id} checked={value} onCheckedChange={onChange} />}
            </ToggleRow>
          )}
        />
        <Controller
          control={control}
          name="personalizable"
          render={({ field: { value, onChange } }) => (
            <ToggleRow label="Personalizable" description="Customers can put a name on this item.">
              {({ id }) => (
                <Switch
                  id={id}
                  checked={value}
                  onCheckedChange={(checked) => {
                    onChange(checked);
                    if (!checked) {
                      setValue("personalizationMaxLength", undefined);
                    } else if (!form.getValues("personalizationMaxLength")) {
                      setValue("personalizationMaxLength", DEFAULT_PERSONALIZATION_MAX_LENGTH);
                    }
                  }}
                />
              )}
            </ToggleRow>
          )}
        />
      </div>

      {personalizable ? (
        <Field
          label="Longest name allowed"
          error={errors.personalizationMaxLength?.message}
          hint="Characters, up to 40."
        >
          {(field) => (
            <Input
              {...field}
              type="number"
              min={1}
              max={40}
              step={1}
              {...register("personalizationMaxLength", { valueAsNumber: true })}
            />
          )}
        </Field>
      ) : null}
    </div>
  );
}
