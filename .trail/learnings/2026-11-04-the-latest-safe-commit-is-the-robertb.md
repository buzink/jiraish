---
title: The latest safe commit is the newest commit whose work item and all older linked work items are finished
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 9, tokens: 212722 }
id: l-471fd20e
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
Teams often release a specific "safe" commit instead of everything on main. The Releases page shows the latest commits per GitHub repository and highlights the newest commit for which its own work item and those of all older commits are Closed, Resolved, Done or Completed, because only those states mean the work was tested. Commits without a work item (no AB#, AB#0000, or an ID that no longer exists) are ignored: they neither block nor qualify as the safe commit, since nothing records that they were tested. A commit's work item comes from its pull request first, the same rule Release readiness uses.

Only the repositories ticked in the Repositories filter are loaded, because every commit needs a GitHub pull-request lookup and loading all repositories at once was too slow. The selection is remembered per browser; the first visit selects one repository.

## Watch out
The safe commit is only searched within the commits already loaded (30 per GitHub page); "Show more" extends the search.

In the code: latestSafeCommitSha, loadLatestCommitsPage, loadLatestCommits and setLatestCommitRepositories in public/app.js; the pull lookup is shared through githubCommitWorkItemIds; selection stored under wish-board.latest-commit-repos.
