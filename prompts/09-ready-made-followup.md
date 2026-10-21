# Phase 9: Ready-made gifts, one-tap ordering and sharing

Requires: phase 8 merged. Start in Plan mode. Read `CLAUDE.md` and the newest "Ready-made gifts" lines in `docs/decisions.md` first. Commit as the owner only, no attribution lines, no push until the owner says "push".

1. On the review question, when the design came from a ready-made gift (`?from=`), show the gift's name and a clear "Ordered as is" or "You changed this gift" state, so the customer knows the price may differ from the catalog card. Test the logic (the diff between the loaded design and the current one), not the markup.
2. Add Open Graph metadata and a share button to each ready-made gift, reusing the `/g/<shareId>` share page. It already hides `customRequest`; keep that test passing.
3. Add an "unavailable" treatment on a catalog card when an item sold out after the list was cached (the list is cached 5 minutes). The order API stays the final authority (422 `DESIGN_INVALID`, as today).
4. A bug found on the way starts with a failing test.

Verify with `pnpm verify`, then run the web at 390px and screenshot the review step and the catalog.
