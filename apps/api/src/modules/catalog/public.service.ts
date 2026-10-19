import type { CatalogResponse, CountryCode } from "@giftpop/contracts";

import { AppError } from "../../lib/errors";
import { CountryModel, type CountryDoc } from "../countries/model";

import { toItem, toPackaging } from "./mappers";
import {
  CountryPriceModel,
  ItemModel,
  PackagingModel,
  type CountryPriceDoc,
  type ItemDoc,
  type PackagingDoc,
} from "./model";

const SORT = { sortOrder: 1, name: 1, _id: 1 } as const;

type PriceByTarget = Map<string, CountryPriceDoc>;

function indexByTarget(rows: CountryPriceDoc[], kind: CountryPriceDoc["kind"]): PriceByTarget {
  return new Map(
    rows.filter((row) => row.kind === kind).map((row) => [row.targetId.toHexString(), row]),
  );
}

/**
 * Everything sellable in one country: active packagings and items that have a
 * price row there. A coming-soon country lists nothing. 404 for an unknown code.
 */
export async function getCountryCatalog(code: CountryCode): Promise<CatalogResponse> {
  const country = await CountryModel.findOne({ code }).lean<CountryDoc>();
  if (!country) throw new AppError("NOT_FOUND", 404, `No country with code ${code}`);

  const base = { country: country.code, currency: country.currency, status: country.status };
  if (country.status !== "live") {
    return { ...base, packagings: [], items: [], categories: [] };
  }

  const rows = await CountryPriceModel.find({ country: code }).lean<CountryPriceDoc[]>();
  const itemPrices = indexByTarget(rows, "item");
  const packagingPrices = indexByTarget(rows, "packaging");

  const [itemDocs, packagingDocs] = await Promise.all([
    ItemModel.find({ _id: { $in: [...itemPrices.keys()] }, active: true })
      .sort(SORT)
      .lean<ItemDoc[]>(),
    PackagingModel.find({ _id: { $in: [...packagingPrices.keys()] }, active: true })
      .sort(SORT)
      .lean<PackagingDoc[]>(),
  ]);

  const items = itemDocs.flatMap((doc) => {
    const price = itemPrices.get(doc._id.toHexString());
    return price
      ? [{ item: toItem(doc), priceMinor: price.priceMinor, inStock: price.inStock }]
      : [];
  });
  const packagings = packagingDocs.flatMap((doc) => {
    const price = packagingPrices.get(doc._id.toHexString());
    return price
      ? [{ packaging: toPackaging(doc), priceMinor: price.priceMinor, inStock: price.inStock }]
      : [];
  });
  const categories = [...new Set(items.map(({ item }) => item.category))].sort((a, b) =>
    a.localeCompare(b),
  );

  return { ...base, packagings, items, categories };
}
