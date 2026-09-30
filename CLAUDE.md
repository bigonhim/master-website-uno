# Project rules for Claude Code

## Every feature ships as a pull request, merged into main

When you finish implementing a new feature, bug fix, or any other self-contained change, run the `ship-feature` skill (`.claude/skills/ship-feature/SKILL.md`) without being asked:

1. Create a `feat/…` (or `fix/…` / `chore/…`) branch from `origin/main`.
2. Run lint, tests, and build for the areas you touched.
3. Commit, push, and open a PR against `main` with `gh pr create`.
4. Merge the PR into `main` with `gh pr merge --squash --delete-branch`, then pull `main` locally.

The user has given standing authorization to open **and merge** these PRs. Never commit or push feature work directly to `main`/`master`. If checks fail or the PR has conflicts, leave it open and report back instead of merging.
