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

Prices are set per country in that country's currency. There is no currency conversion. Every launch country starts with `cod` only (20% now, rest on delivery); the admin can turn on `prepaid`.

A customer picks a country first. That choice sets the currency, which items are available, prices and shipping. A country that is `coming_soon` is listed with a "Bring The Giftpop here" link to the country partnership form.

## Payment

Owner decision: every order asks for **20% of the total now** and the rest **on delivery**. There is no discount for paying early.
- `cod` is the mode every launch country offers: 20% of the total now as an advance, the balance on delivery.
- `prepaid` (pay in full now) still exists in the data with a 0% discount. A country only offers it if the admin turns it on.
- The percentage lives in one config object read by `contracts/pricing`. It is admin-editable later.

**ASSUMPTION**: shipping is `shipping.flatMinor`, or free when the goods total **before any discount** reaches `shipping.freeOverMinor`. Using the pre-discount total means the payment mode never changes shipping. There is no personalisation fee yet; the pricing function takes one so the owner can add it later.

Until a card gateway is chosen, "pay now" means a manual transfer using the country's `paymentInstructions`. The order waits in `awaiting_payment` until staff record the payment. Card payment is an interface with no implementation yet.

Payment status is separate from order status: `unpaid`, `advance_paid`, `paid`, `refunded`.

## Gift builder (guided questions over a live overview)

The builder is one page, `/<country>/build`. A live **overview** of the gift (`<GiftScene/>`) stays on screen the whole time; each question appears in a **question surface**: a bottom sheet on phones (below 900px) and a floating card beside the overview on desktop. Every answer updates the overview at once. Questions lead into each other with a spring transition and Back reverses it; a six-segment progress bar and "Question 3 of 6" show where you are. The country is chosen before the builder (the home page of a country is `/<cc>`).

1. **"What should your gift come in?"** Packagings from the database, grouped by their `kind` (box, bouquet, basket, mug, other). Each has `kind` (one of those five; a packaging stored without one reads as `box`; orders do not snapshot it), `layoutType`, `minItems`, `maxItems` (for example "Pick 6 to 10"), `capacityUnits`, colour options for wrapper and ribbon, and layer images. Above the groups, **"Start from a ready-made gift"**: the featured templates for the country; "Start from this" opens the builder pre-filled on the review question.
2. **"Pick your colours"**: wrapper and ribbon from the packaging's colour options; the overview recolours live.
3. **"What goes inside?"**: category tabs, items with pictures in a grid and, under it, a written list of more items (name and price, no picture: "Want something not shown above?"), chosen per item by staff (`pickerStyle`: `tile` or `list`, absent means `tile`); both kinds count, price and draw in the overview the same way; a live counter ("4 of 6-10 picked", "N spaces left"). Items that cannot be added stay visible but disabled with a reason ("Box is full", "Not available in Pakistan", "Out of stock"). Items animate into the overview.
4. **"Happy with the layout?"**: shuffle, and reorder with "Move up" / "Move down" buttons. Placement is slot-based from the layout function, never free drag.
5. **"Who's it for?"**: recipient name (max 40), card message (max 200), and a name on any item marked `personalizable` (its own max length).
6. **Review**: your card (recipient and message), the price breakdown from the API quote for both payment modes side by side, "Save and share" (creates a share link), "Continue to checkout".

Back keeps every answer. A visitor who reloads returns to their question with their answers (saved per country in the browser). The old per-step addresses (`/build/format`, `/build/items`, ...) redirect to `/<cc>/build`.

A saved design gets a `shareId`. `/g/<shareId>` shows the gift full-screen with "Order this gift" and "Make your own".

Rules the API enforces on every design: item count within min/max, total `sizeUnits` within `capacityUnits`, every item active and in stock for the country, personalisation within limits, packaging available in the country. The browser never sends a price.

## Home page

Exactly one screen (`100dvh`, no scroll at any size): an `h1` that names what we sell and the customer's country (from the country document), one supporting line, one primary button "Build your gift", the 3D gift hero (a static poster first; the animation starts after the page has loaded and is skipped for reduced motion or when WebGL is unavailable), reassurance ticks taken from the country data (delivery days, cash on delivery when the country allows it), and a slim footer bar. Featured templates are not on the home page; they live in the builder's first question.

## Assets

Every item and packaging layer is an image with a transparent background. The admin uploads it; the API converts it to WebP, records width, height and an anchor point (where the item sits in a slot). An item with no image yet renders one illustration chosen by its `shape` (bar, bottle, jar, box, mug, flower, card, soft-toy, balloon, perfume, candle, jewellery, cosmetic, cupcake, frame, other), tinted by its `color`; a packaging with no layer images renders one illustration per `layoutType`, tinted by the chosen wrapper and ribbon colours. A real uploaded image always wins over the illustration.

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

Staff can mark a saved design as a featured template with a title and a country list. The builder's first question shows templates for the customer's country; "Start from this" opens the builder pre-filled on the review question.
