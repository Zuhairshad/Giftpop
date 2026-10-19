---
version: alpha
name: The Giftpop
description: "Warm, handmade and playful, set on a cream canvas with deep aubergine ink. One confident raspberry pink carries every primary action and every price emphasis; bubblegum pink, lavender, gold and kraft appear only inside illustration and small chips. Type is a tight-tracked rounded grotesque (Bricolage Grotesque) for display and a quiet Inter for text. Geometry is soft (4/8/12/20/full) and depth comes from hairlines plus whisper-light layered shadows. The gift itself, drawn in one consistent soft-shaded illustration style, is always the hero."
status: draft for design gate 1
motion-references: "prompt-motion.com returned HTTP 403 from the build environment, so the two named pieces could not be watched. The storyboard below is first-principles and marked DRAFT until the owner pastes notes."
---

# The Giftpop design system

## Overview

The Instagram feed (the_giftpop) is a wall of colour: bubblegum and hot pinks, lavender and purple, gold, kraft brown, with black as a punchy accent, and always a physical gift photographed from above or held in a hand. The store should feel like the moment of opening one of those gifts. So: a calm cream page, one confident pink to click, and illustrated gifts that carry all the colour.

Structure borrowed from the Notion reference (structure only, no brand, blue, illustration or fonts): generous white space, a steep type scale with tight tracking at display sizes, soft radii, hairline borders, whisper-light layered shadows, and one action colour. Patterns borrowed from Bloom & Wild (patterns only): a short, linear buying flow, reassurance copy near the action, warm photography-first presentation. Motion references: see front matter.

**Key characteristics**
- **Cream canvas, aubergine ink.** `canvas` #FFF8F4 with `ink` #2B1733. Never pure black on pure white.
- **One action colour.** `primary` raspberry #D6246E for primary buttons, selected states, progress, focus accents on dark. Nothing else is a button colour.
- **Handmade signature.** Script accents, gift tags ("For Sara"), die-cut stickers with a white outline, polaroids and a lavender highlighter mark under the country name. These are the feed's lettering and stickers, used sparingly.
- **The gift is the colour.** Pinks, lavenders, gold and kraft live in illustration, chips and swatches, never in buttons, links or body text.
- **Illustrated, not photographed.** One SVG style: soft flat fills, a darker outline (fill darkened 35–40%), a highlight stripe, a little dot texture. Items are tinted by their `color`.
- **Display type is tight and warm.** Bricolage Grotesque 700, tracking -1.6px at 44px, -3.2px at 80px.
- **Soft depth.** 1px hairlines for separation, layered low-opacity shadows for floating objects (the question card, the price pill), never one dark drop shadow.
- **Motion is a reward, not a toll.** Springs for the builder, one scripted moment for the hero, everything reduced to opacity or nothing under `prefers-reduced-motion`.

## Colors

Tokens are CSS variables under `:root`, redefined for dark under `@media (prefers-color-scheme: dark)`. Components use the token names, never hex.

```yaml
colors:
  # light
  canvas: "#FFF8F4"        # page
  surface: "#FFFFFF"       # cards, sheets
  warm: "#FBEFEA"          # tile wells behind illustrations, alternating bands
  warm-2: "#F6E4DE"        # progress track, skeleton
  ink: "#2B1733"           # headlines, body
  ink-2: "#66506E"         # secondary text  (6.4:1 on canvas)
  muted: "#96839E"         # meta text, large text only (3.2:1)
  hairline: "rgba(43,23,51,0.10)"
  hairline-2: "rgba(43,23,51,0.16)"
  primary: "#D6246E"       # (4.9:1 with white text)
  primary-pressed: "#AE1659"
  primary-tint: "#FFE3EF"  # tinted secondary button, selected chip fill
  on-primary: "#FFFFFF"
  focus: "#2B1733"         # 3px ring, 3px offset, plus white inner gap
  lavender: "#E9DDFB"      # eyebrow chip, accent wash
  lavender-deep: "#6B3FB5" # text on lavender (6.9:1)
  gold: "#D9A92E"          # illustration and sparkles only
  kraft: "#C69C6D"         # illustration only
  success: "#1E8E5A"
  success-tint: "#D9F4E6"
  warning: "#A05A00"       # out-of-stock and "why disabled" reasons
  danger: "#B3261E"
  # dark
  dark:
    canvas: "#1B1020"
    surface: "#271A2E"
    warm: "#33233B"
    warm-2: "#40304A"
    ink: "#FDF1F6"
    ink-2: "#CDB8D6"
    muted: "#9C88A6"
    hairline: "rgba(253,241,246,0.12)"
    primary: "#FF6B9D"      # on-primary becomes #2A0F1C
    primary-pressed: "#FF8FB5"
    primary-tint: "#4A2038"
    lavender: "#3E2F5C"
    lavender-deep: "#CDB8FF"
    focus: "#FDF1F6"
```

Rules
- Contrast: body text 4.5:1 or better, large text and UI 3:1. `muted` is for 18px+ or non-essential meta only.
- Gradients exist in exactly one place: the soft pink and lavender light pools behind the hero and builder overview (radial, below 12% opacity, decorative). No gradient on buttons, cards or text.
- Dark mode keeps illustration colours (they are objects) but lowers the light pool to 14% opacity and swaps the shadow for a 1px hairline.

## Typography

- **Display:** Bricolage Grotesque (open source, variable, `opsz` auto). Headlines and prices only.
- **Text:** Inter (open source, variable). Everything else.
- **Script (handmade accent):** Caveat 700 (open source). Only for the home eyebrow, the builder step label ("Question 3 of 6"), gift tags and stickers inside illustrations. 20px or larger, never body copy.
- **Wordmark:** Pacifico 400 in `primary-pressed` as a placeholder for the owner's real logo (swap the file when supplied).
- Fallbacks: `system-ui, sans-serif`. Fonts load with `next/font`, `display: swap`, subset latin.

| Token | Size | Weight | Line | Tracking | Use |
|---|---|---|---|---|---|
| `display-xl` | 80px (desktop) | 700 | 1.0 | -3.2px | Home h1, one per page |
| `display-lg` | 44px (phone h1), 56px | 700 | 1.02 | -1.6px / -2.2px | Page titles |
| `display-md` | 30px | 700 | 1.1 | -0.9px | Question titles (desktop), section h2 |
| `title` | 22–26px | 700 | 1.1 | -0.6px | Question titles (phone), card titles, prices |
| `lede` | 20px desktop, 17px phone | 400 | 1.45 | -0.125px / 0 | One supporting line |
| `body` | 16px | 400 | 1.5 | 0 | Running text |
| `label` | 14px | 500–600 | 1.2 | 0 | Buttons, tabs, counters |
| `meta` | 13px | 500 | 1.3 | 0 | Item names in tiles, prices |
| `caption` | 12px | 500 | 1.3 | +0.125px | Step label, hints |

Rules: negative tracking only at 20px and above; never below 12px; weights are tied to the token. Customer-typed text (card message, names) uses `wrap-anywhere`.

## Layout

- Spacing scale (px): 4, 8, 12, 16, 20, 24, 32, 48, 64. Gutter 16 on phones, 40 on desktop.
- Home is exactly `100dvh`: header 64, footer bar 44, stage fills the rest. No section below. Desktop: copy 5fr, scene 7fr. Under the button, three factual reassurance ticks (Made by hand, Packed with care, Track your order); hidden on phones. Footer bar: Track an order and Partner with us left, the Instagram handle right.
- Builder: overview fills what the question surface leaves.
  - Phone (below 900px): header 56, overview flexible, question as a bottom sheet that hugs its content; items sit in one horizontally scrolling row so the overview keeps more than half the screen.
  - Desktop (900px and up): overview left, floating question card 460px wide, 28px from the bottom and 40px from the right.
- Touch targets 44px minimum on phones; primary buttons 52–56px.
- Containers: content pages max 1100px; reading text max 62ch.

## Elevation and shape

| Level | Treatment | Use |
|---|---|---|
| 0 | none | canvas, bands |
| 1 | `0 0 0 1px hairline` | item tiles, chips, the country pill |
| 2 | four-layer soft shadow, max 6% ink | price pill, swatch pill, hovered tiles |
| 3 | six-layer deep shadow, max 7% ink | question card, bottom sheet |
| Focus | 3px `focus` outline, 3px offset, never removed | every control |

Radius: `xs` 4 (inputs' inner details, tags), `sm` 8 (tile art wells), `md` 12 (buttons, tiles, inputs), `lg` 20 (question card, bottom sheet top corners, hero chips), `full` (tabs, chips, counters, swatches). Primary buttons are 12px rectangles, never pills.

## Illustration

- One component per `ItemShape` (bar, bottle, jar, box, mug, flower, card, soft-toy, balloon, other) and per packaging `layoutType`, in a 200x200 viewBox.
- Scenes carry detail: pleated wrapper layers, cellophane sheen, a real ribbon bow (hollow loops, notched tails, gold piping), tissue crinkle, a gift tag. The hero adds a die-cut topper sticker and a polaroid.
- Recipe: fill = `color`; outline = fill darkened 38%, 3px, round joins; highlight = fill lightened 55% at 55% opacity, one stripe; texture = a few dots at 25% opacity; fixed accents only where the object has them (gold wrapper band on bars, green stem on flowers, white label).
- A real uploaded image always wins over the illustration.
- The same illustrations are the sprites that float out of the hero box.

## Components

- **Button, primary:** `primary` fill, `on-primary` label 16px/600, 12px radius, 48px (52–56px on phones for the main CTA), inner 1px highlight and one pink-tinted lift shadow. Hover/press `primary-pressed`.
- **Button, tint:** `primary-tint` fill, `primary-pressed` label. **Button, ghost:** transparent, ink label, 44px minimum.
- **Chip:** pill, `surface`, hairline, 14px/500, 44px tall when interactive (country, tabs).
- **Tab:** pill; selected is `ink` fill with white label (not pink: pink means "act"); a count badge shows picks per category; the row fades at its scroll edge.
- **Item tile:** `surface`, hairline, 12px radius; art on a `warm` well; name 13px/500; price 12px `ink-2`. Selected: 2px `primary` ring and a quantity badge top-right. Disabled: 55% opacity, a one-line reason in `warning` ("Out of stock", "Box is full", "Not available in Pakistan").
- **Counter:** "8 of 6–10 picked" 14px/600 with a 72px `primary` progress bar and a `success` check plus `success` text once the minimum is met; "2 spaces left" on the right.
- **Overview toolbar:** price pill and swatch pill sit together top-left of the overview.
- **Price pill:** floating over the overview, "Your gift so far" 12px `muted`, amount in `title`. Always from the API quote.
- **Swatch pill:** wrapper and ribbon colour dots, 28px dots inside a 44px hit area.
- **Input:** 48px, 12px radius, hairline-2 border, label always visible above, error text below in `danger` with an icon.

## Builder question pattern

1. The overview (`<GiftScene/>`) is always visible and always current: it recolours, gains items, re-arranges as answers change.
2. One question at a time in the question surface (bottom sheet on phones, floating card on desktop): a 6-segment progress bar, "Question 3 of 6", a plain-language title, the answer controls, then `Back` (ghost) and one primary button that names the next move ("Continue to layout").
3. Springs: forward = new content enters from the right 24px with `opacity`, old content exits left 24px (stiffness 380, damping 34, about 320ms); Back mirrors. Sheet height animates with the same spring. Reduced motion: cross-fade 120ms, no movement.
4. Questions: 1 "What should your gift come in?" (packagings grouped by `kind`, plus "Start from a ready-made gift" with templates), 2 "Pick your colours", 3 "What goes inside?", 4 "Happy with the layout?", 5 "Who's it for?", 6 Review.
5. Focus moves to the question title on each change; the progress bar has `aria-valuenow`.
6. Nothing the customer typed or chose is lost on Back.

## Home hero storyboard (DRAFT, timings are targets; pending owner notes on the prompt-motion pieces)

The overview always draws exactly the items picked (the counter, the tile badges and the scene agree).

The page paints the SVG poster first (resting state). The WebGL scene loads after first paint and takes over only if WebGL works and motion is allowed. Camera: slight three-quarter view, FOV 32, soft key light upper-left, fill light lavender, warm bounce from below, contact shadow disc; pixel ratio capped at 2.

| t (s) | Frame |
|---|---|
| 0.00 | Poster visible. Canvas fades in over it (the box is out of frame above). |
| 0.00–0.55 | Box drops from above with gravity 22 u/s². Slight spin (3°) so it does not look rigid. |
| 0.55 | First impact: squash 12% on Y over 80ms, shadow tightens and darkens, tiny dust ring. Rebound at 45% of impact speed. |
| 0.55–0.95 | First bounce arc (about 0.9 box heights), lid chatters 2°. |
| 0.95 | Second impact: squash 6%, rebound at 30%. |
| 1.05–1.30 | Second bounce arc (about 0.3 box heights). |
| 1.30 | Settles; small damped wobble 1.5° over 250ms. |
| 1.55–1.90 | The ribbon slips: band loosens and slides to one side, a tail unrolls down the front. |
| 1.90–2.50 | Lid lifts 1.2 box heights, tilts -12°, drifts left; bow stays on the lid. |
| 2.10–3.20 | Burst: 8 to 9 item sprites (the same illustrations as flat cards in 3D) fly out on ballistic arcs with spin, stagger 60ms, ease out to their floating spots. Sparkles and confetti pop with them. |
| 3.20–3.80 | Everything eases to the resting pose, matching the poster. Headline and button never move (they are HTML). |
| 3.80+ | Idle: 6s float cycle (±8px, ±1.2°), items float out of phase, camera drifts ±1.5° on a 14s sine. |

Budget: under 4s to rest; first frame under 16ms on a mid phone; no model files (all geometry from primitives: rounded box, extruded ribbon bands, torus-knot-free bow made from bent planes); textures are canvas-generated.

## Do's and don'ts

**Do**
- Make "Build your gift" the only primary action on home; one primary action per screen everywhere.
- Name the country in the h1 from the country document ("Handmade gift boxes & bouquets in Pakistan").
- Keep copy plain and specific: buttons say what they do ("Continue to layout", "Place order").
- Show disabled things with a reason, not a vanishing act.
- Tint illustrations from data, and let uploaded images replace them.
- Show focus on every control; respect `prefers-reduced-motion`.

**Don't**
- Don't use pink for anything that is not an action, a selection or progress.
- Don't add radii outside 4/8/12/20/full, or pill primary buttons.
- Don't put gradients on UI surfaces, or heavy single drop shadows.
- Don't hard-code country names, currencies, prefixes or formats.
- Don't use photography or per-product assets we cannot supply for every item.
- Don't animate layout properties that cause shift; transform and opacity only.

## Responsive behaviour

- 320 to 899px: bottom sheet, single column, 56px main CTA, hero copy above the scene, CTA below it.
- 900px and up: floating question card; home becomes two columns (copy 5fr, scene 6fr).
- Phone checks: `scrollWidth - innerWidth` is 0 at 320, 360, 375, 390 in a plain (non-mobile) context; home has no vertical scroll at 320x568, 360x640, 375x667, 390x844, 768x1024, 1440x900. On very short screens (568px) the eyebrow chip hides first, then the lede.

## Admin

Admin takes colour, type and radius tokens only (`primary`, `ink`, `canvas`, Inter, 8/12px radii), no layout changes, and keeps the manual accessibility edits listed under CLAUDE.md Lessons (dialog, sheet, table, sidebar, switch, `ring-ring`).

## Known gaps

- Hero storyboard timings await the owner's notes on the prompt-motion pieces.
- The mockup bouquet is kraft with a hot-pink ribbon and 8 items, the hero box is black with gold dots and a pink ribbon; both are examples of wrapper and ribbon colour options, not fixed art.
- Real packaging illustrations beyond `bouquet-fan` and `box-grid` (round hat box, basket, mug) are rendered with those two layouts for now; the mockup shows the bouquet only.
- No Terms or Privacy pages exist; the footer bar shows Track an order and Partner with us, with the Instagram handle on the right. The "Gifts from" price, "3–5 day delivery" and "Cash on delivery" ticks come from the country and catalog documents, not from code.
