---
title: "A commit already on the target environment is always safe to release there again, whatever its work item says"
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 2, tokens: 12962 }
id: l-0fc65038
scope: repo
status: active
replaces: l-b49dc80e
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The Releases page marks "Latest safe ACC" (Development → Acceptance) and "Latest safe PRD" (Acceptance → Production): the newest commit for which it and every older commit are safe for that target. The user set the rule: a commit that is already on the target environment is safe, even when its work item is not finished, because deploying it there again changes nothing. This overrides the work item state rule.

A commit not yet on the target is safe when all its work items are Closed, Resolved, Done or Completed; for ACC also "Ready for release to accept" and "Test on acc" (the latter because such work is already on Acceptance). A commit without a work item that is not on the target blocks, since nothing records that it was tested.

## Tried and ruled out
Applying the environment rule only to commits without a work item: then a commit whose story was Test on acc and already on ACC still blocked Latest safe ACC.

## Watch out
Whether a commit is on an environment comes from the Environments column. While that loads, or when no deployment is found for the repository, nothing counts as on the target. Only loaded commits are searched (30 per GitHub page).

In the code: LATEST_SAFE_TARGETS, latestCommitWorkItemTested(item, target), latestSafeCommitSha(entry, target), latestSafeCommits in public/app.js; intro text in public/index.html.
