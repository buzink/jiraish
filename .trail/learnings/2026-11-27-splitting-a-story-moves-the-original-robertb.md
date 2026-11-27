---
title: Splitting a story moves the original to the next sprint and keeps a duplicate with the done points in the current sprint
author: RobertB
date: 2026-11-27
branch: main
cost: { minutes: 3, tokens: 144716 }
id: l-775113bb
scope: repo
status: active
src: agent
touches:
  - public/index.html
  - public/app.js
---

## Decided
When an in-progress story moves to another sprint and is split, the original work item moves to the new sprint with the remaining points. A duplicate with the done points and the same state stays in the current sprint. The user wanted this because the comments and pull request links on the original then carry on in the next sprint. The duplicate is only for bookkeeping (velocity of the current sprint).

Titles: "Title" becomes "Title - 1" (duplicate) and "Title - 2" (original). An original that was split before ("Title - 2") gives "Title - 2" (duplicate) and "Title - 3" (original).

## Tried and ruled out
The earlier split kept the original in the current sprint and created the copy in the next sprint. Comments and PR links then stayed behind on the finished part.

## Watch out
The duplicate is created in the original's state (e.g. Active). If the process does not allow a new item in that state, it is created again without the state, so it starts in the first state. The duplicate links to the original as Successor (Dependency-Forward).

In the code: splitWorkItemIntoSprint and numberedSplitTitles in public/app.js; dialog text in #remainingPointsDialog in public/index.html.
