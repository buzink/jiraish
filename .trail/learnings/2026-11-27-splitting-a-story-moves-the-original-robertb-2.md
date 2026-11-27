---
title: Splitting a story moves the original to the next sprint and leaves a closed duplicate with the done points in the current sprint
author: RobertB
date: 2026-11-27
branch: main
cost: { minutes: 1, tokens: 21264 }
id: l-59f43b0f
scope: repo
status: active
replaces: l-775113bb
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
When an in-progress story moves to another sprint and is split, the original work item moves to the new sprint with the remaining points, so its comments and pull request links carry on there. A duplicate with the done points stays in the current sprint, only for bookkeeping, and is always closed: Closed, or the type's first Completed state when the process has no Closed (Done in Scrum).

Titles: "Title" becomes "Title - 1" (duplicate) and "Title - 2" (original). An original that was split before ("Title - 2") gives "Title - 2" (duplicate) and "Title - 3" (original).

## Tried and ruled out
Keeping the original in the current sprint and creating the copy in the next sprint: comments and PR links stayed behind on the finished part.
Giving the duplicate the original's state (e.g. Active): the user wanted the bookkeeping duplicate always closed.

## Watch out
If the process does not allow creating an item directly in the closed state, the duplicate is created first and closed with a second PATCH. The duplicate links to the original as Successor (Dependency-Forward).

In the code: splitWorkItemIntoSprint, closedStateName and numberedSplitTitles in public/app.js; dialog text in #remainingPointsDialog in public/index.html.
