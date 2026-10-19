import type { Country, PublicCountry } from "@giftpop/contracts";

import type { CountryDoc } from "./model";

/** Public fields only: no payment instructions until an order exists. */
export function toPublicCountry(doc: CountryDoc): PublicCountry {
  const { shipping, addressFormat } = doc;
  return {
    code: doc.code,
    name: doc.name,
    currency: doc.currency,
    status: doc.status,
    paymentModes: [...doc.paymentModes],
    shipping: {
      flatMinor: shipping.flatMinor,
      ...(shipping.freeOverMinor !== undefined && { freeOverMinor: shipping.freeOverMinor }),
      deliveryDays: { min: shipping.deliveryDays.min, max: shipping.deliveryDays.max },
    },
    addressFormat: {
      region: { required: addressFormat.region.required, label: addressFormat.region.label },
      postalCode: {
        required: addressFormat.postalCode.required,
        label: addressFormat.postalCode.label,
      },
    },
  };
}

/** The full country, as staff see it. Never leaks `_id`. */
export function toCountry(doc: CountryDoc): Country {
  return { ...toPublicCountry(doc), paymentInstructions: doc.paymentInstructions };
}
