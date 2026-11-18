---
title: Releases shows a latest safe ACC and a latest safe PRD commit; commits without a work item block only while they are not yet on the target environment
author: RobertB
date: 2026-11-18
branch: feature/release-safe-acc-prd
id: l-3623369a
scope: repo
status: active
replaces: l-471fd20e
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The Releases page marks two commits per repository: "Latest safe ACC" (Development → Acceptance) and "Latest safe PRD" (Acceptance → Production). Both are the newest commit whose own work item and those of all older commits are finished. For ACC "Ready for release to accept" also counts, because that state is the sign-off for moving to Acceptance; for PRD only Closed, Resolved, Done or Completed count, since only those mean the work was tested and accepted. A commit's work item comes from its pull request first, the same rule Release readiness uses.

A commit without a work item never becomes the safe commit. It is ignored when it is already on the target environment (Acceptance for ACC, Production for PRD), because it is already there and does not hold the release back. When it is not yet there it blocks, because nothing records that it was tested. This replaces the earlier rule that such commits were always ignored. Commits that do have a work item are judged on their state only, also when they are already on the target.

Only the repositories ticked in the Repositories filter are loaded, because every commit needs a GitHub pull-request lookup.

## Watch out
Whether a commit is on an environment comes from the Environments column (loadLatestCommitEnvironments). While that is still loading, or when no deployment was found for the repository, commits without a work item block, so the safe commits can move down until the deployments are in. The safe commits are only searched within the commits already loaded (30 per GitHub page); "Show more" extends the search.

In the code: LATEST_SAFE_TARGETS, latestCommitWorkItemTested(item, target), latestSafeCommitSha(entry, target) and latestSafeCommits in public/app.js; badges in createLatestCommitRow, summary in createLatestCommitsRepository; intro text in public/index.html.
