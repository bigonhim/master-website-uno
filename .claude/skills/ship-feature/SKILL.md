---
name: ship-feature
description: Ship a finished feature - put it on a feature branch, commit, push, open a GitHub PR against main, then merge that PR into main. Use whenever a new feature (or any self-contained change) has been implemented in this repo, and when the user says "ship it", "open a PR", or "merge it".
---

# Ship a feature: branch → PR → merge into main

Every new feature in this repo lands on `main` through a pull request. Never commit feature work directly to `main` or `master`.

## 1. Preflight

- `git status` and `git fetch origin`.
- Confirm `gh` works: `gh auth status`. If `gh` is missing or not authenticated, stop at step 5 and follow **Fallback without gh**.
- Only include files that belong to this feature. If the working tree holds unrelated changes, leave them unstaged and tell the user which files you left out.

## 2. Branch

- Create the branch from the latest `origin/main`:
  `git switch -c feat/<short-kebab-name> origin/main`
  If the feature work is already sitting uncommitted in the working tree, `git switch -c feat/<name>` carries it along. Rebase onto `origin/main` before pushing if the branch is behind.
- Use `fix/` for bug fixes, `chore/` for tooling or config.

## 3. Verify

Run the checks for the parts you touched and fix failures before going on:

- Frontend (`frontend/`): `npm run lint`, `npm test`, `npm run build`
- Backend (`backend/`): `pytest` (using `backend/.venv`)

If a check fails and you can't fix it, stop. Report the output. Do not open or merge the PR.

## 4. Commit and push

- Stage the feature's files by name (not `git add -A`). Never stage `.env` or other secrets.
- Write a commit message in the repo's style: short imperative subject, body explaining why.
- `git push -u origin feat/<name>`

## 5. Open the PR

```
gh pr create --base main --head feat/<name> --title "<subject>" --body "<body>"
```

The body covers: **Summary** (what the feature does and why), **Changes** (main files or areas), and **Verification** (the checks you ran and their results). End it with the attribution line from the session instructions.

## 6. Merge into main

When the checks in step 3 passed:

```
gh pr checks --watch        # only if the repo has CI; skip if there are no checks
gh pr merge --squash --delete-branch
```

Then sync the local checkout:

```
git switch master
git pull origin main
```

(The local branch is named `master` but tracks `origin/main`.)

Don't merge if the PR has conflicts, failing checks, or requested changes. Report the problem and leave the PR open.

## Fallback without gh

If `gh` isn't installed or isn't logged in, still do steps 1–4, then:

1. Give the user the compare link to open the PR:
   `https://github.com/bigonhim/master-website-uno/compare/main...feat/<name>?expand=1`
2. Tell them to install and log in so future runs work end to end:
   `winget install GitHub.cli`, then `gh auth login`.
3. Don't merge locally and push to `main`. That skips the PR, and the PR is the point of this rule.

## Report

Finish with the PR URL, whether it merged, and anything you left out or skipped.
