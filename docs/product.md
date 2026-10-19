# Product rules

Lines marked **ASSUMPTION** are unconfirmed by the owner. Build them as written, keep them in one place, and do not spread them through the code.

## Countries

Launch list: United States (US, USD), United Kingdom (GB, GBP), Saudi Arabia (SA, SAR), India (IN, INR), Pakistan (PK, PKR), China (CN, CNY), Australia (AU, AUD), Turkey (TR, TRY), Canada (CA, CAD).

Each country document holds:
- `code` (ISO 3166-1 alpha-2), `name`, `currency` (ISO 4217), `status`: `live` or `coming_soon`.
- `paymentModes`: any of `prepaid`, `cod`.
- `shipping`: `flatMinor` (integer), optional `freeOverMinor`, `deliveryDays: { min, max }`.
- `addressFormat`: which fields are required (`region`, `postalCode`) and their labels ("State", "County", "Province", "ZIP", "Postcode").
- `paymentInstructions`: text the admin writes (bank account, wallet number) shown after ordering.

Prices are set per country in that country's currency. There is no currency conversion. **ASSUMPTION**: every launch country starts with both payment modes on; the admin can turn either off.

A customer picks a country first. That choice sets the currency, which items are available, prices and shipping. A country that is `coming_soon` is listed with a "Bring The Giftpop here" link to the country partnership form.

## Payment

**ASSUMPTION** (owner wrote "Advance payment 20% discount and cash on delivery 20% advance"):
- `prepaid`: the customer pays the full total now and gets **20% off the goods** (packaging, items, personalisation; not shipping).
- `cod`: no discount. The customer pays **20% of the total now** as an advance, and the rest on delivery.
- Both percentages live in one config object read by `contracts/pricing`. They are admin-editable later.

Until a card gateway is chosen, "pay now" means a manual transfer using the country's `paymentInstructions`. The order waits in `awaiting_payment` until staff record the payment. Card payment is an interface with no implementation yet.

Payment status is separate from order status: `unpaid`, `advance_paid`, `paid`, `refunded`.

## Gift builder (digibouquet-style)

Steps, in order. Each is its own screen with a progress indicator and a back button.
1. **Country** (skipped if already chosen).
2. **Format**: pick a packaging (bouquet, box, basket...). Each packaging has `layoutType`, `minItems`, `maxItems` (for example "Pick 6 to 10"), `capacityUnits`, colour options for wrapper and ribbon, and layer images.
3. **Pick items**: category tabs, a live counter ("4 of 6–10 picked"). Items that cannot be added stay visible but disabled with a reason ("Box is full", "Not available in Pakistan", "Out of stock").
4. **Arrange**: the gift renders live with `<GiftScene/>`. The customer can shuffle the arrangement, reorder items, and change wrapper and ribbon colours. Placement is slot-based from the layout function, never free drag.
5. **Personalise**: card message (max 200 chars), recipient name (max 40), and a name on any item marked `personalizable` (its own max length).
6. **Review**: the scene, a price breakdown from the API quote for both payment modes side by side, "Save and share" (creates a share link), "Continue to checkout".

A saved design gets a `shareId`. `/g/<shareId>` shows the gift full-screen with "Order this gift" and "Make your own".

Rules the API enforces on every design: item count within min/max, total `sizeUnits` within `capacityUnits`, every item active and in stock for the country, personalisation within limits, packaging available in the country.

## Assets

Every item and packaging layer is an image with a transparent background. The admin uploads it; the API converts it to WebP, records width, height and an anchor point (where the item sits in a slot). An item with no image yet renders a placeholder silhouette chosen by its `shape` (bar, bottle, jar, box, mug, flower, card, soft-toy, balloon, other) and `color`.

## Orders

Order number format: `GP-<country>-<6 chars base32>`, for example `GP-PK-7K2M9Q`.

Order status (fulfilment):

| Status | Meaning | Next allowed |
|---|---|---|
| `awaiting_payment` | Placed; advance or full payment not recorded yet | `confirmed`, `cancelled` |
| `confirmed` | Payment recorded, ready to make | `in_production`, `cancelled` |
| `in_production` | Being made | `packed`, `cancelled` |
| `packed` | Packed, waiting for courier | `shipped` |
| `shipped` | Handed to courier; courier name and tracking number required | `out_for_delivery`, `returned` |
| `out_for_delivery` | With the local courier | `delivered`, `delivery_failed` |
| `delivery_failed` | Attempt failed | `out_for_delivery`, `returned` |
| `delivered` | Done | none |
| `returned` | Came back | none |
| `cancelled` | Stopped before shipping; reason required | none |

Every change appends `{ from, to, at, actorId, note }` to the history. The customer tracking page shows the status, the history dates, and courier and tracking details. It never shows staff notes or actor names.

Customers track an order with its number plus the phone or email used to place it. No customer accounts in v1.

## Admin

Roles: `owner` (everything, including staff and countries) and `staff` (orders, catalog, partner requests).

Areas: dashboard (what needs action now), orders, catalog (items, packaging, per-country prices and stock, images), countries, partner requests, featured templates, staff.

## Partnerships

Two public forms, both stored as `partnerRequests` with `kind`:
- `brand`: a brand that wants its products sold in gifts. Fields: brand name, contact name, email, phone, country, product categories, website or Instagram, message.
- `country`: someone who wants to bring The Giftpop to a country not yet live. Fields: country, contact name, email, phone, what they offer, message.

Staff move each request through `new`, `in_talks`, `accepted`, `declined`, with notes.

## Featured templates

Staff can mark a saved design as a featured template with a title and a country list. The home page shows templates for the customer's country; "Start from this" opens the builder pre-filled.
