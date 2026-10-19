import type { Country } from "@giftpop/contracts";

/**
 * The nine launch countries from docs/product.md. Every one is `live` with both
 * payment modes on (ASSUMPTION in docs/product.md).
 *
 * DEV ONLY: shipping rates, delivery days and payment instructions below are
 * made-up values for local development. Real values are set by the owner in the
 * admin app. SA has a free-shipping threshold and PK has none, so both pricing
 * paths exist in dev data.
 */
const DEV_PAYMENT_INSTRUCTIONS = "DEV ONLY: bank transfer details go here";

export const COUNTRIES: Country[] = [
  {
    code: "US",
    dialCode: "+1",
    name: "United States",
    currency: "USD",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 599, deliveryDays: { min: 3, max: 6 } },
    addressFormat: {
      region: { required: true, label: "State" },
      postalCode: { required: true, label: "ZIP" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "GB",
    dialCode: "+44",
    name: "United Kingdom",
    currency: "GBP",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 499, deliveryDays: { min: 2, max: 5 } },
    addressFormat: {
      region: { required: false, label: "County" },
      postalCode: { required: true, label: "Postcode" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "SA",
    dialCode: "+966",
    name: "Saudi Arabia",
    currency: "SAR",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY: free shipping from SAR 200 of goods.
    shipping: { flatMinor: 2500, freeOverMinor: 20000, deliveryDays: { min: 4, max: 8 } },
    addressFormat: {
      region: { required: true, label: "Region" },
      postalCode: { required: true, label: "Postal code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "IN",
    dialCode: "+91",
    name: "India",
    currency: "INR",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 9900, deliveryDays: { min: 4, max: 9 } },
    addressFormat: {
      region: { required: true, label: "State" },
      postalCode: { required: true, label: "PIN code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "PK",
    dialCode: "+92",
    name: "Pakistan",
    currency: "PKR",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY: no free-shipping threshold, so shipping is always the flat rate.
    shipping: { flatMinor: 25000, deliveryDays: { min: 3, max: 7 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: false, label: "Postal code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "CN",
    dialCode: "+86",
    name: "China",
    currency: "CNY",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 3000, deliveryDays: { min: 5, max: 10 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: true, label: "Postal code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "AU",
    dialCode: "+61",
    name: "Australia",
    currency: "AUD",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 899, deliveryDays: { min: 4, max: 8 } },
    addressFormat: {
      region: { required: true, label: "State" },
      postalCode: { required: true, label: "Postcode" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "TR",
    dialCode: "+90",
    name: "Turkey",
    currency: "TRY",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 14900, deliveryDays: { min: 3, max: 6 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: true, label: "Postal code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
  {
    code: "CA",
    dialCode: "+1",
    name: "Canada",
    currency: "CAD",
    status: "live",
    paymentModes: ["prepaid", "cod"],
    // DEV ONLY
    shipping: { flatMinor: 799, deliveryDays: { min: 3, max: 7 } },
    addressFormat: {
      region: { required: true, label: "Province" },
      postalCode: { required: true, label: "Postal code" },
    },
    paymentInstructions: DEV_PAYMENT_INSTRUCTIONS,
  },
];
