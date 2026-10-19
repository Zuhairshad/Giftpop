# How to run the phase prompts

Put this whole kit in the root of an empty git repo before phase 0. Claude Code reads `CLAUDE.md`, `.claude/settings.json`, `.claude/agents/` and `.claude/commands/` from there automatically.

## Order

```
00 foundation
  └─ 01 admin login, countries, catalog
       └─ 02 gift builder
            ├─ 03 checkout, orders, tracking ──┐
            └─ 05 home, partners, templates ───┤   (03 and 05 can run in parallel sessions)
                                               └─ 04 admin orders and shipping
                                                    └─ 06 hardening and deploy
```

Merge 03 before 05. Run 04 after both, since it is the last thing that changes the order model.

## Running one phase

1. `claude` at the repo root (or `claude --worktree phase-3` for a parallel session).
2. `/model` and pick Sonnet 5.5; set effort to medium.
3. Switch to Plan mode, paste the phase file, and read the plan before accepting. Check that every Step B agent has its own paths and that nothing overlaps. A good plan matters more than anything after it.
4. Accept edits. The lead does Step A, launches at least 5 `builder` agents in parallel for Step B, then merges and verifies in Step C.
5. Review the PR that `/commit-push-pr` opens.

## What each piece is for

| Piece | Why |
|---|---|
| `CLAUDE.md` | The standards every agent reads. When Claude gets something wrong, add a line to its Lessons section so it doesn't happen again. |
| `docs/product.md` | The business rules. Items marked ASSUMPTION need the owner's confirmation. |
| `.claude/agents/builder.md` | The parallel worker. Runs in its own git worktree, edits only its own paths, commits on its own branch, and reports in a fixed format. |
| `.claude/agents/verifier.md` | A read-only checker that grades the phase against the rules, so the work isn't grading itself. |
| `.claude/agents/code-simplifier.md` | Cleans up after the merge without changing behaviour. |
| `/verify` | Lint, typecheck and tests until green. This is the feedback loop. |
| `/commit-push-pr` | Commits, pushes and opens the PR with git state already loaded. |
| `.claude/settings.json` | Pre-approves safe commands so agents don't stop for permission, blocks reading `.env` and destructive git, formats every edited file, and makes agent worktrees start from the lead's current commit. |
| `.worktreeinclude` | Copies your local `.env` files into each agent's worktree. |

## Why the phases are shaped this way

Parallel agents only go fast when they can't collide. Each phase does three things in order:

1. **Step A** (one agent) writes the shared contracts, installs packages and creates stub files. These are the only things two agents would both need to edit.
2. **Step B** (at least 5 agents at once) builds against those contracts, each in its own folder.
3. **Step C** (one agent) merges, runs the checks, and fixes what the merge broke.

If you skip Step A and let 5 agents start cold, they each invent their own types and edit the same files, and the merge costs more than the parallelism saved.

## Before you start

- Install Node LTS, pnpm, Docker and `jq` (the format hook uses it).
- Connect GitHub (`gh auth login`) so `/commit-push-pr` can open PRs.
- Copy each `.env.example` to `.env` or `.env.local` once phase 0 creates them.

## Things the owner still has to answer

These are written as ASSUMPTIONs in `docs/product.md`. Agents build them as stated until you change that file.

1. The 20% rules: full prepayment gets 20% off the goods, and cash on delivery needs a 20% advance.
2. Shipping rates and delivery times per country (seed data uses fake ones).
3. Whether cash on delivery is offered in every country.
4. Which card or wallet gateway to use, if any. Until then, "pay now" is a manual transfer.
