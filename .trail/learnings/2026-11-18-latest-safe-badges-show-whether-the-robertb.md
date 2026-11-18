---
title: Latest safe badges show whether the commit still has to be deployed (→ ACC) or is already there (✓ ACC)
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 2, tokens: 20365 }
id: l-009c172c
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted to see at a glance whether a latest safe commit still needs action. Chosen from several suggestions: a filled green badge "→ ACC"/"→ PRD" when the commit is not yet on the target environment, an outlined badge "✓ ACC"/"✓ PRD" when it already is. The repository summary reads "ACC: up to date (sha)" or "PRD: release sha (N commits ahead)", where N counts the loaded commits from the safe commit down to the first one already on the target. The badge tooltip starts with "Already on …, nothing to do." or "Not yet on …: deploy this commit to release it.", followed by the rule.

## Tried and ruled out
Suggested but not chosen: longer badge text ("Release to ACC" / "On ACC") and a green row only when action is needed. The row stays green for every latest safe commit, also because ACC and PRD can land on the same commit with one done and one not.

## Watch out
While deployments load, a commit counts as not on the target, so the badge shows → until the Environments column is filled. The "commits ahead" count is left out when no loaded commit is on the target.

In the code: latestSafeCommitStatus, createLatestCommitRow (badges), createLatestCommitsRepository (summary) in public/app.js; .latest-commits-safe-badge.is-on-target in public/styles.css.
