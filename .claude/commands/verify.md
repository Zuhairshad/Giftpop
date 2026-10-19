---
description: Run lint, typecheck and tests for the repo and fix failures until green
argument-hint: [package-filter]
allowed-tools: Bash(pnpm verify *), Bash(pnpm --filter *)
---

Run the verification loop.

If an argument was given, run `pnpm --filter $ARGUMENTS verify`. Otherwise run `pnpm verify`.

If it fails, fix the cause (not the test, unless the test is wrong) and run it again. If the same failure comes back three times, stop and report the failure, what you tried, and what you think the cause is.

Finish with the final command and its result.
