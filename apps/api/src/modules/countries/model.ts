import type { Country } from "@giftpop/contracts";
import { model, Schema } from "mongoose";

/** A country is stored exactly as the contract describes it. `code` is the natural key. */
export type CountryDoc = Country;

const ruleSchema = {
  required: { type: Boolean, required: true },
  label: { type: String, required: true },
};

const countrySchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    currency: { type: String, required: true, uppercase: true },
    status: { type: String, required: true, enum: ["live", "coming_soon"] },
    paymentModes: { type: [String], enum: ["prepaid", "cod"], default: [] },
    shipping: {
      flatMinor: { type: Number, required: true },
      freeOverMinor: { type: Number },
      deliveryDays: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
    },
    addressFormat: {
      region: ruleSchema,
      postalCode: ruleSchema,
    },
    dialCode: { type: String },
    paymentInstructions: { type: String, default: "" },
  },
  { versionKey: false, collection: "countries" },
);

export const CountryModel = model<CountryDoc>("Country", countrySchema);
