---
title: A commit without a work item that is already on the target environment can itself be the latest safe ACC or PRD commit
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 5, tokens: 23274 }
id: l-b49dc80e
scope: repo
status: active
replaces: l-3623369a
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The Releases page marks "Latest safe ACC" (Development → Acceptance) and "Latest safe PRD" (Acceptance → Production) per repository: the newest commit for which it and every older commit are safe for that target. A commit with a work item is safe when its work items are finished; for ACC "Ready for release to accept" also counts, for PRD only Closed, Resolved, Done or Completed.

A commit without a work item is safe when it is already on the target environment (Acceptance for ACC, Production for PRD), and can then itself be the latest safe commit. The user pointed this out: in uva/wish-ask-your-question the newest commits without a story, all already on ACC and PRD, had to be the latest safe, not the older Closed commit below them. A commit without a work item that is not yet on the target blocks, because nothing records that it was tested.

## Tried and ruled out
Skipping commits without a work item on the target (neither block nor qualify): the safe badge then stayed on an older commit with a story, while the newer commits were just as safe to release.

## Watch out
Whether a commit is on an environment comes from the Environments column. While that loads, or when no deployment is found for the repository, commits without a work item block. Only loaded commits are searched (30 per GitHub page).

In the code: LATEST_SAFE_TARGETS, latestCommitWorkItemTested(item, target), latestSafeCommitSha(entry, target), latestSafeCommits in public/app.js; intro text in public/index.html.
