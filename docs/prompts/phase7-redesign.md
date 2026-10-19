Start from `origin/main` at commit `fd6aae7` or later (`git fetch && git checkout main && git pull`), then create branch `feat/phase7-redesign` from it. Ignore any other plan or attachment; this prompt is the task. You are the lead for this phase: do the work yourself and with subagents, don't write prompts for another session. Do not edit CLAUDE.md lessons except to add new ones.

# Phase 7: Giftpop redesign (home hero + guided builder + store reskin)

Read CLAUDE.md (all rules and every Lesson), `docs/product.md`, `docs/decisions.md`, then everything in `docs/reference/`. Follow the CLAUDE.md parallel work protocol (Step A → B → C) exactly. This must be finished today, so plan tightly and fan out wide, but the gates below are not optional. The previous redesign attempt produced a weak, generic design; the gates exist to stop that happening again.

## The brief

Giftpop is a small, warm, handmade gift business (Instagram: the_giftpop). Customers build a gift: pick the outside (box, bouquet, basket...), fill it, personalise it, order it. The current site looks basic and generic. The goal is a design that feels premium, warm, playful and crafted, like opening a gift, while staying clean and fast.

### References (study all of them before designing anything)
- `docs/reference/instagram/feed-01..07.png`: the real product range. Look at every tile. Note the formats (chocolate bouquets in wrapping paper, hamper boxes with lids, open trays and baskets, filled mugs, round hat boxes, heart boxes, explosion boxes, acrylic boxes, balloon bouquets, frames), the items (chocolate bars, Ferrero, snacks, scrunchies, candles, glass cups, skincare, perfume, plush toys, satin roses, balloons, polaroids, cake toppers, cards) and the brand palette (pinks, lavender and purple, gold, kraft brown, black accents) and the pink gift-box logo.
- `docs/reference/notion-DESIGN.md`: borrow its **structure only**: generous white space, a strong tight-tracked type scale, soft radii (4/8/12/full), whisper-light layered shadows, one clear action colour, hairline borders. Do NOT copy Notion's brand, blue, illustrations, fonts or near-monochrome mood. Fonts: open-source substitutes only.
- Bloom & Wild (bloomandwild.com) for warmth and a clear buying flow: patterns only, never their brand or assets.
- prompt-motion.com: a gallery of Claude-made motion pieces. Open these in a real browser and **watch** them before designing the hero: `/gorden-sun-041f56` (Three.js ball drops and bounces with physics and lighting) and `/nft-chen-5f8bb0` (Three.js cinematic lighting and camera). Browse the Particles and Shapes filters (`/?filter=Particles`, `/?filter=Shapes`) for a burst/reveal you can adapt. Write down which pieces you borrow from and what exactly you take.

### 1. Home page: one screen, no scroll
- Exactly one viewport (`100dvh`), no vertical or horizontal scroll at 320×568, 360×640, 375×667, 390×844, 768×1024, 1440×900.
- Hero animation in Three.js (React Three Fiber is fine), built in code, no model files: a realistic soft-lit gift box (matte card, satin ribbon, bow, soft contact shadow) **drops from the top, bounces twice with real-feeling physics, settles, the ribbon slips and the lid lifts, and gift item illustrations float out in a soft burst**, then a gentle idle (slow float, slight camera drift). Under 4 s to the resting state. Colours from the brand palette.
- An SEO headline (`h1`) that names what we sell and the customer's country (country name from the country document, never hard-coded), one short supporting line, and one primary button: **"Build your gift"**. The country picker stays reachable. Legal and footer links fit in a slim bar inside the viewport.
- Featured templates no longer live on home: move "Start from a ready-made gift" into the builder's first question.
- Performance: the 3D scene is lazy-loaded in a `"use client"` module only on home, behind a static poster (an SVG or WebP of the resting state) that paints first. Measure with a production build and `next start` (CLAUDE.md lesson): LCP is the headline or poster, not the canvas. 60 fps on a mid phone; cap device pixel ratio at 2.
- `prefers-reduced-motion`: show the poster only, no WebGL. No-WebGL or error fallback: the poster.

### 2. Builder: guided questions over a live overview
Replace the "each step is its own screen" flow. A live **overview** of the gift stays on screen the whole time (`<GiftScene/>`), and each question appears as a pop-up: a bottom sheet on phones, a floating card beside the overview on desktop. Each answer updates the overview immediately. Each question leads into the next with a spring transition (Motion, already installed); Back reverses it. A progress indicator shows where you are.
1. "What should your gift come in?": packaging options grouped by kind (box, bouquet, basket...), from the database, plus "Start from a ready-made gift" (featured templates for the country).
2. "Pick your colours": wrapper and ribbon; the overview recolours live.
3. "What goes inside?": category tabs, live counter ("4 of 6–10 picked"), disabled items keep their reason. Items animate into the overview.
4. "Happy with the layout?": shuffle and reorder (slot-based, never free drag).
5. "Who's it for?": recipient name, card message, item names.
6. Review: overview, price breakdown from the API quote for both payment modes, "Save and share", "Continue to checkout".

All existing rules in `docs/product.md` still hold (server owns money, API enforces every rule). Update the builder section of `docs/product.md` to describe the new flow. If grouping packagings by kind needs a new field, that is a contract change: the lead makes it in Step A (contract, model, admin form, seed), never an agent.

### 3. Illustrations instead of per-product assets
We cannot photograph every product. Replace the placeholder silhouettes with **one polished illustration per item `shape`** (bar, bottle, jar, box, mug, flower, card, soft-toy, balloon, other) and one per packaging `layoutType`, drawn as SVG in a single consistent digibouquet-like style (soft shading, gentle outlines, a little texture), **tinted by the item's `color`**. A real uploaded image still wins over the illustration. These same illustrations float out of the hero box.

### 4. Rest of the store, then admin
Reskin every web route with the new tokens (country pages, checkout, order tracking, share page `/g/<id>`, account, errors and empty states). Admin gets the new tokens (colour, type, radius) only; no layout changes. Respect the shadcn accessibility edits listed in CLAUDE.md Lessons.

## Step A (lead only)
1. Plan in Plan mode.
2. **Design gate 1 (must pass before any building):**
   - Write `docs/design/giftpop-DESIGN.md` in the same format as the Notion file: tokens (colours with light and dark values, type scale, radius, spacing, shadow, motion durations and springs), the component rules, the builder question pattern, the hero storyboard (frame by frame with timings), do's and don'ts.
   - Build a throwaway static mockup page (home hero poster + one builder question over the overview) at 390px and 1440px.
   - Screenshot both with Playwright into `test-results/design/`.
   - Run a fresh `general-purpose` agent as a **design critic**. It sees only the screenshots, the references and the DESIGN.md, and scores 1–10 on: brand fit to the Instagram feed, hierarchy, typography, colour, spacing rhythm, polish, "would a customer trust and enjoy this". It lists concrete fixes. Iterate until every score is ≥ 8.
   - Then **show me the screenshots and wait for my approval.**
3. After approval:
   - Install every dependency (three, @react-three/fiber, @react-three/drei if needed; current stable versions, check before pinning).
   - Make any contract changes.
   - Create the shared stubs: token files, the builder question registry, illustration registry.
   - Run `pnpm verify` and commit on branch `feat/phase7-redesign`.

## Step B: at least 7 `builder` agents in parallel, one message, `isolation: worktree`
After reading the code, give each agent an exact list of paths it owns, and include the approved DESIGN.md path and the mockup screenshots in every agent's prompt. Suggested slices:
1. Design tokens and shared primitives (buttons, inputs, sheet, dialog, tabs, chips) in `apps/web`.
2. Illustrations: shape and packaging SVGs plus tinting in `packages/renderer`, with tests.
3. Home hero 3D scene, poster, fallbacks, reduced motion.
4. Home page layout (headline, CTA, country picker, slim footer) and SEO metadata.
5. Builder shell: overview panel, question sheet and card, transitions, progress, back.
6. Builder question contents (packaging, colours, items, layout, personalise, review).
7. Rest-of-store reskin.
8. Admin token reskin.

Each agent: runs its package `verify`, takes its own Playwright screenshots at 320, 390 and 1440 into `test-results/design/<slice>/`, and lists any needs it could not meet itself.

## Step C (lead only)
1. Merge in the order you set, with `pnpm verify` after each merge; fix breakages.
2. Start the real app (`docker compose up -d`, `pnpm seed`, `pnpm dev`) and click through home → full builder → checkout → share page yourself.
3. **Design gate 2:** screenshot every route at 320, 390, 768 and 1440, light and dark. Run the design critic again against the approved mockup; iterate until every score is ≥ 8.
4. **Quality gate:**
   - `scrollWidth - innerWidth === 0` at 320/360/375/390 in a non-mobile context.
   - Home has zero vertical scroll at every size listed above.
   - Every touch target is at least 44px on phones; focus is visible everywhere.
   - Reduced motion is respected.
   - Per-route JavaScript is measured from a production build (three.js loads only on home).
   - Lighthouse on home and builder: Performance ≥ 85 on mobile, Accessibility ≥ 95. If Lighthouse cannot run in your environment, say so in the report; do not skip it silently.
   - The full Playwright e2e suite is green; update selectors only where names changed on purpose.
5. Run the `verifier` agent, then `code-simplifier`, then `/commit-push-pr`.
6. Final report: before and after screenshots side by side, critic scores, Lighthouse numbers, bundle sizes, anything left undone. Add new lessons to CLAUDE.md.

## Hard rules
- Never claim done without screenshots and green `pnpm verify` and e2e.
- No brand assets copied from Notion, Bloom & Wild or prompt-motion entries.
- Nothing country-specific in code; all of it comes from data.
- Throwaway files go in `test-results/`; never name a `/dev/*` path or write outside the repo.
- If you're unsure about a product rule, ask me; for a technical choice, pick the simplest option and record it in `docs/decisions.md`.
