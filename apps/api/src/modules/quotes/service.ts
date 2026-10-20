import {
  computeQuotes,
  DesignInvalidDetailsSchema,
  money,
  PAYMENT_POLICY,
  validateDesign,
  validateOrderPersonalisation,
  type CountryCatalog,
  type CountryCode,
  type Design,
  type QuoteResponse,
} from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { getCountryCatalog } from "../catalog/public.service";
import { CountryModel, type CountryDoc } from "../countries/model";

export interface DesignContext {
  country: CountryDoc;
  catalog: CountryCatalog;
}

/**
 * Loads a live country and what it sells, from the database, and checks the
 * design against it. 404 for an unknown country, 422 if it is not live,
 * 422 DESIGN_INVALID (with every problem) if the design cannot be made.
 * Shared by the quote and save routes so both enforce the same rules; an order
 * (`forOrder`) also needs the recipient, card message and item names filled in.
 */
export async function loadValidatedDesign(
  code: CountryCode,
  design: Design,
  options: { forOrder?: boolean } = {},
): Promise<DesignContext> {
  const country = await CountryModel.findOne({ code }).lean<CountryDoc>();
  if (!country) throw new AppError("NOT_FOUND", 404, `No country with code ${code}`);
  if (country.status !== "live") {
    throw new AppError("VALIDATION_ERROR", 422, `${country.name} is not open for orders yet`);
  }

  const catalog = await getCountryCatalog(code);
  const palette = catalog.packagings.find((p) => p.packaging.id === design.packagingId)?.packaging;
  if (palette) {
    const offered = (colours: { hex: string }[], hex: string) =>
      colours.some((colour) => colour.hex.toLowerCase() === hex.toLowerCase());
    for (const [field, colours, hex] of [
      ["wrapperColor", palette.wrapperColors, design.wrapperColor],
      ["ribbonColor", palette.ribbonColors, design.ribbonColor],
    ] as const) {
      if (!offered(colours, hex)) {
        throw new AppError(
          "VALIDATION_ERROR",
          422,
          `${palette.name} does not come in that colour`,
          {
            field,
            allowed: colours.map((colour) => colour.hex),
          },
        );
      }
    }
  }
  const problems = [
    ...validateDesign(design, catalog),
    ...(options.forOrder ? validateOrderPersonalisation(design, catalog) : []),
  ];
  if (problems.length > 0) {
    throw new AppError(
      "DESIGN_INVALID",
      422,
      "This design cannot be made as it is",
      DesignInvalidDetailsSchema.parse({ problems }),
    );
  }
  return { country, catalog };
}

/** Prices a validated design once per payment mode, using only database prices. */
export function priceDesign({ country, catalog }: DesignContext, design: Design): QuoteResponse {
  const { currency } = catalog;
  const packaging = catalog.packagings.find((p) => p.packaging.id === design.packagingId);
  if (!packaging) throw new AppError("INTERNAL", 500, "Validated packaging is missing");
  if (country.paymentModes.length === 0) {
    throw new AppError("VALIDATION_ERROR", 422, `${country.name} takes no payment modes yet`);
  }

  const itemLines = design.items.map((line) => {
    const priced = catalog.items.find((i) => i.item.id === line.itemId);
    if (!priced) throw new AppError("INTERNAL", 500, "Validated item is missing");
    return { unitPrice: money(priced.priceMinor, currency), qty: line.qty };
  });

  const quotes = computeQuotes(
    {
      packagingPrice: money(packaging.priceMinor, currency),
      itemLines,
      personalisationFee: money(0, currency),
      shipping: {
        flatMinor: country.shipping.flatMinor,
        freeOverMinor: country.shipping.freeOverMinor,
      },
      policy: PAYMENT_POLICY,
    },
    country.paymentModes,
  );
  return { country: country.code, currency, quotes };
}

export async function quoteDesign(code: CountryCode, design: Design): Promise<QuoteResponse> {
  const context = await loadValidatedDesign(code, design);
  return priceDesign(context, design);
}
