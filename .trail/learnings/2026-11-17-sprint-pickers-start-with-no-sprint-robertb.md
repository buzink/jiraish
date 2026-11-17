---
title: "Sprint pickers start with No sprint, label the current sprint and open scrolled to it"
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 14021 }
id: l-9652da3d
scope: repo
status: active
replaces: l-19f27a7d
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Both work-item sprint pickers (the Sprint field in the work-item Details and "Move to sprint" in the backlog row menu, which also handles bulk selections) start with a "No sprint" option at the very top, like "Unassigned" for Assigned to. The current sprint gets a small "Current" label, and when the list opens it is scrolled so the current sprint is in view with one sprint above it. The order of the list stays the same (newest first); the current sprint is not moved to the top.

On the sprint page the user means the menu under the sprint title (click "Sprint 134") when they say "the sprint dropdown", not the Sprint filter in the filter bar. That title menu also opens with the current sprint on the second row, so the next and previous sprint are one click away. The Sprint filter got the same behaviour too (Current label, scrolled on open).

## Watch out
"No sprint" in Azure DevOps is the project's root iteration path (the project name), not an empty value. A work item on the root path shows "No sprint" in Details. Moving to No sprint skips the remaining-points split dialog, because there is no sprint for the remaining work to go to.

The title menu focuses its search box on open; that focus uses preventScroll so it does not undo the scroll. The Sprint filter re-renders the filter bar after each checkbox change; it passes the old scroll position via data-keep-scroll so ticking a box does not jump back.

In the code: public/app.js — noSprintIterationPath, isNoSprintPath, isCurrentIterationPath, currentIterationName, createCurrentSprintBadge, scrollCurrentSprintIntoView; toggleSprintMenu and renderSprintMenuOptions (title menu); renderSearchableDetailOptions, createDetailFieldOption (4th arg currentSprint), the sprintMenu in createBacklogRow, updateBacklogItemsToSprint (toNoSprint), createFilterMenu (sprint toggle handler). CSS: .sprint-current-badge in public/styles.css.
