---
description: Commit the current work, push the branch and open a pull request
allowed-tools: Bash(git status *), Bash(git diff *), Bash(git log *), Bash(git branch *), Bash(git add *), Bash(git commit *), Bash(git push *), Bash(gh pr create *), Bash(pnpm verify *)
---

## Current state

!`git branch --show-current`

!`git status --short`

!`git diff HEAD --stat`

!`git log --oneline -5`

## Task

1. If the branch is `main`, stop and say so. Never commit to `main`.
2. Run `pnpm verify`. If it fails, stop and report; do not commit.
3. Stage the changes and commit with a conventional message (`feat:`, `fix:`, `chore:`, `test:`, `docs:`) that says what changed and why.
4. Push the branch with `git push -u origin <branch>`.
5. Open a PR with `gh pr create`. Title: the commit subject. Body: what changed (bullets), how it was verified (the `pnpm verify` result), and anything left for later.
6. Reply with the PR URL.
