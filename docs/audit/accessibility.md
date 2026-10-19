# Accessibility audit (phase 6, row `accessibility`)

Date: 2026-10-19. Scope: every screen of the main customer and staff flows, light and dark theme, phone (390 px) and desktop (1280 px). No application code was changed; every fix below is a patch for the lead to apply.

Severity: **high** = a keyboard or screen-reader user can lose their place or is blocked in a core task; **medium** = fails a WCAG 2.2 AA criterion or causes real friction in a main flow; **low** = polish or an edge case.

## 1. What was run, and what was not

Run, in a real (plain, non-mobile) Chromium against the lead's stack (web 3000, admin 3001, api 4000), light and dark via `prefers-color-scheme` emulation:

- **axe-core 4.14.0** (found in the repo's `node_modules`, injected into the page, no install) on every screen, 4 combinations each (light/dark x 1280/390), plus every dialog, the status menu and the country menu.
- **Own contrast walker**: every visible text node, computed colour composited over the effective background (colours such as `oklab`/`lab` converted with a canvas), flags below 4.5:1 (3:1 for 24px+ or 18.66px bold). It skips text over images and gradients (scene art, none of the text found sat on one).
- **Focus-indicator measurement**: for 8 pages x 2 themes, every Tab stop is focused, waited 320 ms (the ring fades in), and the outline or ring colour is composited and compared with the background behind it (3:1 needed).
- **Keyboard runs** by script: Tab walk of every screen (order, names, ring present), plus real interaction runs: header country menu, format, items (tabs with arrow/Home/End, add, stepper, remove to zero), arrange (move up/down, shuffle, colour radios), personalise, review, checkout (payment radios, failed submit), track, partner form, order confirmation and proof upload, and in admin every dialog opened with Enter, Tab-cycled, closed with Esc.
- **Accessibility tree** (`locator.ariaSnapshot()`) of every screen: names, roles, states, headings, landmarks, live regions, titles, `lang`.
- **Reduced motion** (`reducedMotion: "reduce"`): computed transition/animation scan, item positions sampled every 40 ms after Shuffle and Move down, admin dialog animations sampled every frame.
- **Reflow**: `scrollWidth - innerWidth` in plain contexts at 320 px (all 29 screens), 640 px (= 200% zoom of 1280, all 29), and with root font size 200% at 1280 px (all 29) and at 390 px (home, countries, country home, format only; see section 7).
- **Touch targets** at 390 px (24 px minimum, 44 px counted).

Normal-flow data changes made while testing: one order (GP-PK-QP8GVW, moved by me from awaiting payment to shipped through the real admin dialogs), one payment proof upload, about 10 saved designs (share links), one partner request ("Axe Test Brand"). I also accepted that order's proof by accident in my first dialog probe (the "Accept proof" button acts at once; see A9). Nothing else was written. Login was done once and reused with `storageState`, plus two deliberate wrong-password attempts.

**Could not check**: a real screen reader (NVDA, JAWS, VoiceOver, TalkBack) was not available, so "screen reader" below means the accessibility tree plus axe, not what is actually spoken or in what order; real touch devices and OS text-size settings (root font 200% is an approximation); forced-colors / high-contrast mode; real browser zoom (viewport width and root font size stand in); contrast of text drawn over images or gradients; voice control; the Next.js dev overlay (`nextjs-portal`) was excluded from every finding because it does not exist in production. Admin dark theme only follows the system setting (there is no toggle), so it was tested through emulation.

## 2. Result table

Legend: KB = keyboard-only run; SR = accessibility tree and axe; Contrast = text contrast in light / dark (W1, W6, A5 are the issue ids below); RM = reduced motion; Reflow = no horizontal scroll at 320 / 640 / 200% text. "ok" means checked and no finding. Issue ids: W = web, A = admin.

### Customer store

| Screen | Keyboard | Screen reader | Contrast (light / dark) | Reduced motion | Reflow | Issues |
|---|---|---|---|---|---|---|
| Home `/`, `/pk` | ok; skip link first, 3 banner stops, ring 6:1+ | ok (1 h1, landmarks, titles); country cards named by `aria-label` | W1 fail / ok | ok (`gp-float` stops) | 320 ok, 640 ok; 390 at 200% text overflows +94 px (W11) | W1, W9, W11, L1 |
| Country picker (`/countries`, header menu) | ok; Enter opens, focus to first country, Esc returns to the button, `aria-expanded` | ok | W1 / ok | ok | 390 at 200% text +110 px (W11) | W1, W11 |
| Builder: Format | ok; Enter/Space selects | ok (progress nav says "current step", cards name price and range) | W1 / ok | ok | 390 at 200% text +123 px (W11) | W1, W3, W11 |
| Builder: Items + item picker | ok; tabs answer arrows/Home/End, Enter adds, focus moves to the stepper, Space +/-, removing the last one returns focus to the Add button; disabled reason read via `aria-describedby` | ok; counter is a polite live region ("5 of 6-10 picked"); steppers are groups "Ceramic mug: 2 picked" | W1 (selected "All" tab, Continue) / ok | ok | 320, 640 ok | W1, W3, W9 |
| Builder: Arrange + gift scene | ok; Move up/down keep focus and announce "moved to position 2 of 5", Shuffle announces, colour radios work with arrows, ring on the swatch | scene is `svg role="img"` with a `<title>` listing every item ("Gift in Bouquet: 2 x Ceramic mug, ..."); order list has "Position 2 of 5"; colours are named, not colour-only | W1 / ok | ok: item positions are constant from the first frame (normal mode still settling 54 to 59 px over 250 ms) | 320, 640 ok | W3, W4, W1 |
| Builder: Personalise | ok; fields labelled, counter linked by `aria-describedby`, over-limit text is clamped with "Shortened to fit" | ok | W1 / ok | ok | 320, 640 ok (long unbroken message tested) | W3, W4, W1 |
| Builder: Review | ok; Save and share announces "Your gift is saved" in a polite status | prices are `dl`s but invalid markup (W5); quote regions have headings | W1 / ok | ok | 320, 640 ok | W5, W1, W3 |
| Checkout | ok; payment radios arrow, failed submit moves focus to the first invalid field | each field `aria-invalid` + `aria-describedby` error; "You pay PKR ... now" is a polite live region; no error summary (L2) | W1 / ok | ok | 320, 640 ok | W1, W5, W3, L2 |
| Order confirmation + proof upload | ok; file input "Picture of your receipt", Upload via Enter, Copy order number reachable | "We have your proof. We will confirm your payment soon." is a polite live region | W1 / ok | ok | 320, 640 ok | W1, W5 |
| Track (form, result, wrong details) | ok; empty submit focuses the first invalid field | errors associated; result and "could not find" message sit in a polite live region; timeline says "(current status)" | W1 / **W6 fail (Delivered pill 2.9:1)** | ok | 320, 640 ok | W1, W6 |
| Share page `/g/<id>` | **tab goes through 9 hidden header links first (W8)**; Order this gift, Make your own, Watch again ok | **two `<main>` and two `id="main"` (W4)** | W1 / ok | reveal animation not measured (the Watch again button exists) | 320, 640 ok | W4, W8, W1 |
| Partner forms (`/partners/*`) | ok; errors focus the first invalid field; honeypot is `tabindex=-1` and `aria-hidden` | success view has no h1 (W10); errors show when merely tabbing through | W1 / ok | ok | 320, 640 ok | W10, W1 |
| 404 | ok | title is just "The Giftpop" (L1) | W1 / ok | ok | ok | L1 |

### Admin

| Screen | Keyboard | Screen reader | Contrast (light / dark) | Reduced motion | Reflow | Issues |
|---|---|---|---|---|---|---|
| Login (and wrong password) | ok; Email, Password, Sign in; error is `role="alert"` and focus goes to Password | labelled; `aria-invalid` is not set on the fields (L3) | error text 3.97:1 (A5) / ok | ok | ok | A5, L3 |
| Dashboard | ok but 8 sidebar stops before content on every page, no skip link (A3); focus ring weak (A1) | cards named "1 payment proofs to check" (grammar, W9); sidebar is not a `nav` (A3) | ok / ok | ok (global rule) | 320, 640, 200% ok | A1, A3, W9 |
| Orders list + filters | ok; quick views are toggle buttons with `aria-pressed`; selects and search labelled | table has caption and real headers; status and payment are words (colour is never the signal); "Proof to check" is text | ok / ok | ok | ok | A1, A3 |
| Order detail | ok; every control reachable, copy buttons named | headings, `dl`, table caption; the items table scroller is not focusable (A6); colours shown as raw hex (L4) | ok / ok | ok | ok | A1, A6, L4 |
| Status menu | ok; Enter opens, first item focused, Esc returns to "Change status" | only the legal next statuses are listed | ok / ok | ok | ok | none |
| Dialog: Record payment | opens on the amount field; Esc and Cancel return focus; **Tab from the last control leaves the dialog (A2)**; after success focus lands on BODY (A9) | labelled, described; `Close` is last in tab order | ok / ok | 0 ms in reduced mode | ok | A2, A9 |
| Dialogs: Reject proof, Proof zoom | opens on "Keep proof"/Close; Esc returns to the opener; **A2** | named and described | Reject button 3.82:1 (A5) / ok | ok | ok | A2, A5 |
| Dialogs: Cancel order | opens on the reason field; **A2** | note "cannot be undone" is `role="note"` | Cancel order button 3.81:1 light, 4.26:1 dark (A5) | ok | ok | A2, A5 |
| Dialogs: Start production, Mark as packed | ok; focus returns to "Change status" after success; **A2** | named and described | ok / ok | ok | ok | A2 |
| Dialog: Mark as shipped | empty submit focuses Courier; errors linked (`aria-invalid`, `aria-describedby`, `role="alert"`); **A2** | labelled fields, optional fields marked | ok / ok | ok | ok | A2 |
| Toasts | n/a | Sonner region is `aria-live="polite"` ("Payment recorded", "Mark as shipped: done") | ok | ok | ok | none |
| Packing sheet | ok (12 stops) | headings per section | ok / ok | ok | ok | A3 |
| Catalog items and packaging (list, edit, new) | ok; 40+ stops on the edit page, all named | switches named "Ceramic mug in stock in Australia"; packaging page h1 is "Catalog" (L5) | ok / ok | ok | packaging overflows +290 px at 200% text (A8) | A1, A7, A8 |
| Countries (list, edit, add) | ok; dialogs open on the first field; **A2** | fields labelled; disabled fields 4.34:1 (exempt) | ok / ok | ok | ok | A1, A2 |
| Partners (list, request detail) | ok; tabs are a real tablist | detail sheet opens on the e-mail link (L6); **A2** | ok / ok | ok | ok | A2, L6 |
| Templates (list, create dialog) | ok; **A2** | ok | ok / ok | ok | ok | A2 |
| Staff (list, invite dialog) | ok; **A2** | table scroller not focusable on the phone (A6) | ok / ok | ok | staff overflows +336 px at 200% text (A8) | A2, A6, A8 |

## 3. Findings

### High

**A2. Admin modal dialogs do not trap Tab when opened with the keyboard.**
`apps/admin/src/components/ui/dialog.tsx` (`DialogContent`, around line 40) and `sheet.tsx`. A staff member who opens any dialog with Enter and presses Tab past the last control (Close) lands on a focus guard, then on the page: the focus goes to the sidebar links behind the overlay ("Dashboard", "Orders", ...) before it comes back. It happened for Record payment, Cancel order, Start production, Mark as packed, Mark as shipped, Reject proof, Proof zoom, Edit country, Add country, Invite staff member, Create from share link and the partner request sheet (about 8 of 10 runs; when the dialog is opened with the mouse it wraps correctly). The page behind is dimmed and `aria-hidden`, so a sighted keyboard user sees no focus ring and may press Enter on an invisible link, leaving a half-filled payment or shipment form. `modal` is `true` by default in Base UI 1.9.0, so this is a library behaviour that the component has to work around.
Fix (tested in the browser by injecting the same handler: 16 Tab and 4 Shift+Tab presses stayed inside and wrapped), in `DialogContent` and `SheetContent`:

```tsx
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function keepTabInside(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;
  const nodes = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (node) => node.offsetParent !== null,
  );
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (!first || !last) return;
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === event.currentTarget)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

// <DialogPrimitive.Popup ... onKeyDown={(event) => { keepTabInside(event); props.onKeyDown?.(event); }}>
```

Also move the Close button before the content in DOM order (or give it `tabIndex` last on purpose); today it is the last tab stop, which is a common pattern but makes the leak above the first thing a user hits.

### Medium

**W1. White text on the primary pink is 4.1:1 (needs 4.5:1), light theme only.**
`apps/web/src/styles/tokens.css:19` (`--gp-pink: #e8336d`) with `--gp-on-pink: #ffffff`. Hits every filled pink control: skip link (`layout.tsx:41`), "Start building", "Yes, use United States", "Continue to arrange", "Continue to checkout", "Place order", "Track order", "Send request", the current step number (`features/builder/components/progress/index.tsx:20`), the selected "All" tab and "Selected" badge (`checkout/payment-section.tsx:64`). Second pair: the done-step tick `#c41f56` on `#ffd3e0` is 4.25:1 (`progress/index.tsx:22`, `text-pink-strong` on `bg-pink-soft`). Dark theme has no failures.
Fix: `--gp-pink: #d42760;` (white on it 4.93:1; as text on the cream page 4.69:1, so pink text stays legal; hover `--gp-pink-strong #c41f56` stays darker). Change the tick to `text-foreground` (or darken `--gp-pink-soft`'s text to `#a8174a`, 5.6:1).

**A1. Admin focus indicators are below 3:1 in both themes.**
`apps/admin/src/app/globals.css:70` (`--ring: oklch(0.708 0 0)`), `:83` (`--sidebar-ring`), `:105` (dark `--ring: oklch(0.556 0 0)`), and the shadcn recipe `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` in `ui/button.tsx:6`, `ui/input.tsx:11`, `ui/select.tsx`, `ui/textarea.tsx`, `ui/switch.tsx`, `ui/checkbox.tsx`. Measured against the background behind each element: sidebar links 2.48:1 (2 px ring) light, buttons 1.55:1 ring (the 1 px border changes to 2.58:1) light, 1.89:1 ring and about 1.5:1 border dark, in-page links use Chrome's `outline: auto 1px` coloured at 50% alpha (1.9:1 dark). A keyboard user sees almost nothing on a button or input in a dim room. The customer store passes (3 px `#1d4ed8` or `#93b4ff`, 6:1 and above).
Fix:

```css
/* globals.css */
:root { --ring: oklch(0.42 0 0); --sidebar-ring: oklch(0.42 0 0); }   /* about 9:1 on white */
.dark { --ring: oklch(0.85 0 0); --sidebar-ring: oklch(0.85 0 0); }   /* about 13:1 on the dark page */
```

and replace `focus-visible:ring-ring/50` by `focus-visible:ring-ring` in the six components (an opaque 3 px ring; keep `border-ring`). For `*{outline-ring/50}` in `@layer base` use `outline-ring`. Re-run `node ax-focus.cjs`-style measurement after the change.

**A3. Admin has no skip link and no navigation landmark; content outside landmarks.**
`apps/admin/src/components/app-sidebar.tsx:66` renders the menu as `<ul aria-label="Main">` (role list, not a `nav`), and `ui/sidebar.tsx` renders neither `aside` nor `nav`. axe `region` (3 nodes on every page): the "The Giftpop / Admin" title, the "Manage" label and the sidebar container sit outside any landmark. Every page costs a keyboard user 8 sidebar Tab stops (7 links and the account menu) before the heading, with no way to skip.
Fix: in `app-sidebar.tsx` wrap the group in `<nav aria-label="Main">` and drop the `aria-label` from the `SidebarMenu`; render the sidebar root as `<aside aria-label="Sidebar">` (`<Sidebar render={<aside aria-label="Sidebar" />}>` in base-ui); in `(dashboard)/layout.tsx` add as first child of `SidebarProvider`:

```tsx
<a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">Skip to content</a>
...
<SidebarInset id="admin-main" tabIndex={-1}>{children}</SidebarInset>
```

**A5. Destructive buttons and the login error fail 4.5:1.**
`apps/admin/src/components/ui/button.tsx:17` (`bg-destructive/10 text-destructive`). Light: "Cancel order" 3.81:1, "Reject proof" 3.82:1 (`#e7000b` on `#f8e1e2`), login error paragraph 3.97:1. Dark: "Cancel order" 4.26:1 (`#ff6467` on `#4b2d2d`). These are the buttons that carry the most consequence.
Fix: `globals.css:67` `--destructive: oklch(0.505 0.213 27.518);` (Tailwind red-700, about 6:1 on the 10% tint) and `:102` dark `--destructive: oklch(0.78 0.16 22);` then re-check with axe; keep the same variable for the login error.

**W3. Route changes in the builder leave focus on the page body.**
Every step transition (Format to Items to Arrange to Personalise to Review to Checkout) ends with `document.activeElement === body`. The next Tab starts at the top: skip link, logo, country button, 3 nav links, 3 country-banner controls before the step's content, 9 stops each step. The Next route announcer does say the new title, so a screen-reader user is told, but a keyboard user pays 9 Tab presses per step, six times per order.
Fix: a tiny client component rendered at the top of each step view that focuses the heading:

```tsx
"use client";
export function FocusOnMount({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }); }, []);
  return <div ref={ref}>{children}</div>;
}
```

with `tabIndex={-1} className="outline-none"` on the step `h1` (the partner form already does this at `features/partners/form-frame.tsx:24`).

**W4. Nested `<main>` landmarks and duplicate `id="main"`.**
`apps/web/src/features/builder/steps/arrange/arrange-view.tsx:52,79` and `personalise/personalise-view.tsx:45,56` render `<main>` inside the layout's `<main id="main">` (`app/layout.tsx:46`); the share page does it with `<main id="main">` at `features/share/shared-gift-screen.tsx:124`, so `id="main"` is duplicated and the skip link target is ambiguous. axe: `landmark-main-is-top-level`, `landmark-no-duplicate-main`, `landmark-unique` on arrange, personalise and share.
Fix: change the inner `<main className=...>` to `<div className=...>` (four places) and the share one to `<div id="gift">`.

**W8. Share page: nine invisible header controls are tabbable behind the overlay.**
`shared-gift-screen.tsx:108` covers the site chrome with a `fixed inset-0 z-[60]` layer, but the header, country banner and footer links stay in the tab order: skip link, logo, country button, 3 nav links and 3 banner controls get focus with no visible ring before "Order this gift" (tab order recorded: Skip, home, Country, Build, Track, Partner, Yes use US, Choose another, Not now, then the overlay).
Fix: render the share route without the chrome (route group with its own layout) or put `inert` on the chrome while the overlay is mounted; the cheapest patch is `<div className="fixed inset-0 ..." role="dialog" aria-modal="true" aria-label="Shared gift">` plus `inert` set by an effect on `document.querySelector("body > header, body > footer, [aria-label='Country suggestion']")`.

**W6. Order status pills fail in dark theme.**
`apps/web/src/features/order/status-labels.ts:55-56` (`bg-butter text-foreground`, `bg-mint text-foreground`): in dark the pastel backgrounds (`--gp-mint #4f9c7f`, `--gp-butter #d9b24a`) carry light text: "Delivered" 2.92:1 on the track page. Same pattern: `features/order/proof-panel.tsx:136`, `features/builder/steps/review/review-screen.tsx:57` (the amber notice), `features/share/shared-gift-screen.tsx:35`.
Fix: add `--gp-on-accent: #3a2230;` (light) and `#1d1219` (dark) to `tokens.css` plus `--color-on-accent`, and use `text-on-accent` with `bg-mint`, `bg-butter`, `bg-sky`, `bg-lilac` (dark ratios then 5.5:1 or better; light stays 6:1 and above).

**A6. Scrollable tables are not keyboard reachable.**
`apps/admin/src/components/ui/table.tsx:9` wraps every table in `overflow-x-auto` with no tabindex. axe `scrollable-region-focusable` (serious): order detail items table, staff table at 390 px, orders list at 390 px dark. A keyboard user on a narrow window cannot scroll to the hidden columns (price, actions).
Fix: `<div data-slot="table-container" role="region" tabIndex={0} aria-label={label} className="relative w-full overflow-x-auto focus-visible:ring-3 ...">` with a `label` prop (the tables already have captions; reuse the caption text).

**W5 (and the same pattern in four more files). Invalid `<dl>` markup.**
`apps/web/src/features/builder/steps/review/price-section.tsx:46-52,58` wraps a `Row` (which already renders a `<div>`) in another `<div className="border-border border-t pt-1.5">`, giving `dl > div > div > dt/dd`. axe `definition-list` and `dlitem` (serious, 6 nodes on review and checkout). Same shape in `features/order/amounts-panel.tsx:34,44`, `features/checkout/payment-section.tsx:68,76`, `features/checkout/gift-summary.tsx:47`. Chrome still exposes term/definition, other readers may not.
Fix: give `Row` a `className` prop and put the border on it instead of wrapping: `<Row className="border-border border-t pt-1.5" label=... strong>`.

**A8. Admin pages stretch the layout at 200% text.**
At 1280 px with root font 200%, `/catalog/packaging` overflows by 290 px and `/staff` by 336 px (the `main` element becomes 1570 to 1616 px wide). Cause: `ui/sidebar.tsx:294` (`SidebarInset`, a flex child) has no `min-w-0`, so the table's min-content width pushes the page wider instead of scrolling inside its `overflow-x-auto`. Also the sidebar links clip 4 px of text (68 px content in a 64 px `h-8`, `ui/sidebar.tsx:458`).
Fix: add `min-w-0` to `SidebarInset`'s class list and change the menu button `h-8` to `min-h-8`.

**W11. Phone layout does not survive 200% text on the home, country and format screens.**
Root font 200% at 390 px: overflow +94 px (home templates/format cards), +110 px (countries list row with `span.shrink-0` at `features/country/countries-screen.tsx:36`), +123 px (format cards, `features/builder/steps/format/format-view.tsx:58`). Browser zoom (200% to 400%) is fine, 320 px is fine, 640 px is fine; this is the "large OS text size on a phone" case. Not tested on the later builder steps because the script could not click through at 200% (the sticky header covered the card; itself a sign of the same problem).
Fix: `min-w-0` on the card and flex children, `flex-wrap` on rows that hold a trailing price, and `grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))]` for the cards.

**W10. Partner form success state has no h1.**
`apps/web/src/features/partners/form-frame.tsx:24` swaps the page content for an `h2` "Request sent"; axe `page-has-heading-one` on the success view. Focus does move to that heading.
Fix: render it as `h1` (the form's real `h1` is replaced, so the document keeps one h1).

**A9. Focus is lost after recording a payment.**
`apps/admin/src/features/orders/actions/components/payment-dialog.tsx:87` uses `finalFocus={triggerRef}`, but once the order is paid the trigger is `disabled` (`:75`, `paymentBlockedReason`), so the dialog cannot return focus and it falls to `body`. A keyboard user is back at the top of the page after the most common admin action. The toast does announce "Payment recorded". The inline "Accept proof" button (`proof-review.tsx`) acts immediately with no confirmation (it is the opposite of Reject, which asks), and focus is also lost there.
Fix: on success `document.getElementById("order-heading")?.focus()` (give the page `h1` `tabIndex={-1}`), or point `finalFocus` at the "Change status" button.

### Low

- **L1** Page titles: the 404 and every country home are just "The Giftpop"; `apps/web/src/app/not-found.tsx` should export `metadata = { title: "Page not found" }`, `[country]/page.tsx` should include the country ("The Giftpop Pakistan").
- **L2** Checkout shows per-field errors but no summary at the top of the form; with 6 errors a screen-reader user hears only the first. Add a `role="alert"` summary that links to each field, or at least "6 fields need attention" (`features/checkout`).
- **L3** Login: the fields are not marked `aria-invalid` after a failed sign-in (`apps/admin/src/features/auth`); the alert and focus move are correct.
- **L4** Order detail shows wrapper and ribbon colours as raw hex ("#f9c6d3", `features/orders/detail/gift-section.tsx`); add the colour name from the packaging palette (the packing sheet already has names) and a swatch with `aria-hidden`.
- **L5** `/catalog/packaging` has h1 "Catalog" like `/catalog` (title says "Packaging"); use "Packaging" as the h1.
- **L6** The partner request sheet opens with focus on the contact e-mail link, not the title; set `initialFocus` to the status select or the heading.
- **W9** `aria-label` on the cards replaces the visible text, so axe `label-content-name-mismatch` (serious in axe, a false alarm for voice control since the name contains the product name): item cards (`features/builder/steps/items/item-card.tsx:62`), format cards on the country home (`features/home/format-strip.tsx:17`), template cards, dashboard cards ("1 payment proofs to check" vs "1 Payment proofs to check"). The "+" stepper button has the visible text "+" with the name "Add one more X", so a voice-control user cannot say "click plus". Fix: drop the `aria-hidden` on the visible name/price spans and use `aria-labelledby` pointing at them, or begin the label with the visible text ("Ceramic mug, PKR 3,080.00, add").
- **W7** Colour and focus transitions: the web `:focus-visible` ring fades in from the text colour over 150 ms (the `transition: ... outline-color` on buttons), so for 150 ms a ring on a pink button is white. Add `transition: none` for `outline-color`, or set `outline-color` at rest. Not a failure at steady state.
- **W12** Reduced motion: colour and border transitions (150 ms) are not removed in the store (`motion-reduce:transition-none` is only on the item card and format card). This is colour only, not motion, so it passes WCAG 2.3.3; for consistency add the same global rule the admin has (`globals.css:133`) to `apps/web/src/app/globals.css`.
- **W13** Targets: all controls on the phone layout are at least 24 px (min 32 px high header links, 40 px Move up/down and completed-step links, 32 px "Not now"); only the 44 px preference is missed by the header links, the country banner buttons and arrange arrows. Raise `min-h-11` on the header links and Move buttons.
- **W14** Validation fires on blur, so merely tabbing through the partner form marks every empty required field invalid. Show errors on submit and on blur after the field has been edited.
- **A7** Admin switch is 32 x 18 px (`ui/switch.tsx`): below 24 px high on the price grid (9 per row) and in the item forms; spacing keeps it legal only where the rows are 32 px apart. Make the track `h-6 w-11`.
- **W15** The country suggestion banner ("Shipping to United States?") is on every page including checkout and adds 3 Tab stops; "Not now" drops focus to the body (already in decisions, entry 55). Consider hiding it inside the builder and checkout.

## 4. Contrast: worst offenders

Store, light theme (all other text passes; dark theme: one failure, W6):

| Ratio | Needs | Colours | Selector |
|---|---|---|---|
| 4.10 | 4.5 | `#fff` on `#e8336d` | `a.bg-pink.text-on-pink` (skip link, Start building, Continue to checkout, Track order, Send request, Yes use ...), `button.bg-pink` (Place order, Continue to arrange), `span.grid.size-9` (current step), `button[role=tab]` (selected All), `span.rounded-full` (Selected badge) |
| 4.25 | 4.5 | `#c41f56` on `#ffd3e0` | `ol.flex > li > a > span.grid.size-9` (done tick) |
| 2.92 (dark) | 4.5 | `#fdeef3` on `#4f9c7f` | `header.bg-surface > span.bg-mint.text-foreground` (Delivered) |

Admin (axe, since axe handles Tailwind v4 colours): `#e7000b` on `#f8e1e2` 3.82 (`.bg-destructive/10`, Reject proof), 3.81 (Cancel order), 3.97 (login error); dark 4.24 (`#ff6467` on `#4b2d2d`, Cancel order). Disabled controls (for example the greyed "Change status" at 3.71) are exempt and not counted. UI colours and focus rings: see A1 (admin) and the passing store rings.

## 5. Things that work well (keep them)

Store: skip link first in tab order and it works; one h1 per route with a title per route; country, builder progress and footer navs are labelled; the gift scene has a real text alternative that lists every item and quantity and is repeated on review, share, order and admin; arrange offers buttons for everything the drag offers, announces moves and shuffles, and keeps focus on the pressed button; items picker is fully keyboard operable with disabled reasons described, a live counter and sensible focus return; colour choices are named; forms use labels, `aria-invalid`, `aria-describedby`, `autocomplete` and move focus to the first error; polite live regions for counter, quote, payment amount, proof status and track results; status is always text (never colour alone); 3 px high-contrast focus ring everywhere in the store; no horizontal scroll at 320 px or 200% zoom on any of the 17 store screens; honeypot field is hidden from keyboard and screen readers.
Admin: every page has one h1 and a unique title; status and payment pills are words; tables have captions and header cells; filters are a labelled `search` with a pressed-state toggle group; every action dialog has a title, a description, labelled fields, linked errors with `role="alert"`, opens on a sensible field, closes on Esc and returns focus to its opener (except A9); the status menu only offers legal moves; the global reduced-motion rule works (dialog animation goes from 100 ms to 0 ms); toasts are polite live regions; zero horizontal scroll at 320 px and at 640 px (200% zoom) on all admin screens; with 200% text only two pages stretch (A8).

## 6. Suggested order of work

1. A2 (dialog trap), A1 (focus ring colours), W1 and A5 (colour tokens): four small diffs, together they remove most of the AA failures.
2. W4, W5, A6, A3 (markup): structural, no visual change.
3. W3, W8, A9 (focus management).
4. W6, W11, A8 (dark pills, large text).
5. The low items as time allows. Re-run the scripts in the scratchpad after the fixes (`ax-web.cjs`, `ax-admin.cjs`, `ax-focus.cjs`, `ax-admin-flow.cjs`, `ax-reflow.cjs`); they need no installs.

## 7. Notes and limits of the numbers

- Screens counted in the table: 14 store screens and 15 admin screens; each ran in 4 combinations (light and dark x 390 and 1280). Order confirmation, share, track result and the dialogs were run in all four; flows that change data (placing an order, shipping) were run once in light 1280.
- Keyboard "ring present" was true for every tab stop on every screen in both apps; the findings are about ring contrast (A1), not absence.
- The 200% text test at 390 px stopped after the format screen (see W11); the 1280 px run covered everything and the 640 px run (equivalent to 200% browser zoom at 1280) covered all 29 screens with no overflow.
- Pastel pill colours in dark (W6) only show on the states that use them (delivered, issue notices); the scan only reports what was on screen, so also check the "Proof accepted" message (`proof-panel.tsx:136`) and the "items dropped" notice once the fix lands.
- The partner request list, template list and staff list had no rows (except the one partner request I created), so the row-level screens for templates could only be checked through the empty state and the create dialog.
