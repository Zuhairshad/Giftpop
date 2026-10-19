import { OrderModel } from "./model";

/**
 * Fills `searchKeys` on orders stored before it existed, with the same rules as
 * `searchKeysFor` (trimmed lower-case email, ASCII digits of the phone). Runs at boot; once
 * every order has keys it matches nothing, through the `searchKeys.email` index.
 * Returns how many orders it updated.
 */
export async function backfillOrderSearchKeys(): Promise<number> {
  const result = await OrderModel.updateMany(
    { "searchKeys.email": { $exists: false } },
    [
      {
        $set: {
          searchKeys: {
            email: { $toLower: { $trim: { input: "$contact.email" } } },
            phoneDigits: {
              $reduce: {
                input: { $regexFindAll: { input: "$contact.phone", regex: "[0-9]" } },
                initialValue: "",
                in: { $concat: ["$$value", "$$this.match"] },
              },
            },
          },
        },
      },
    ],
    { updatePipeline: true },
  );
  return result.modifiedCount;
}
