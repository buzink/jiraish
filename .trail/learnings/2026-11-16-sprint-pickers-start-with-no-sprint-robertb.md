---
title: "Sprint pickers start with No sprint, label the current sprint and open scrolled to it"
author: RobertB
date: 2026-11-16
branch: main
cost: { minutes: 5, tokens: 147079 }
id: l-19f27a7d
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Both sprint pickers (the Sprint field in the work-item Details and "Move to sprint" in the backlog row menu, which also handles bulk selections) start with a "No sprint" option at the very top, like "Unassigned" for Assigned to. The current sprint gets a small "Current" label, and when the list opens it is scrolled so the current sprint is in view with one sprint above it. The order of the list stays the same (newest first); the current sprint is not moved to the top.

## Watch out
"No sprint" in Azure DevOps is the project's root iteration path (the project name), not an empty value. A work item on the root path shows "No sprint" in Details. Moving to No sprint skips the remaining-points split dialog, because there is no sprint for the remaining work to go to.

In the code: public/app.js — noSprintIterationPath, isNoSprintPath, isCurrentIterationPath, createCurrentSprintBadge, scrollCurrentSprintIntoView; renderSearchableDetailOptions, createDetailFieldOption (4th arg currentSprint), the sprintMenu in createBacklogRow, updateBacklogItemsToSprint (toNoSprint). CSS: .sprint-current-badge in public/styles.css.
