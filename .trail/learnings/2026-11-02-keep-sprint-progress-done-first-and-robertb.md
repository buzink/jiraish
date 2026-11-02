---
title: Keep sprint progress done-first and compact
author: RobertB
date: 2026-11-02
branch: main
id: l-624985e3
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Sprint progress is ordered Done, Doing, To do. Within each group, states are ordered by descending story points. Each legend group is a compact single-line row formatted as Group (points): State (points).

In the code: `SPRINT_PROGRESS_COLUMNS`, `createSprintProgressLegendGroup`, and `renderSprintProgress` in `public/app.js`; compact row styling in `public/styles.css`.

## Tried and ruled out
The To do, Doing, Done bar order and three tall legend panels were rejected because the established bar order is Done first and the grouped labels took too much height.

## Watch out
Keep zero-point states visible in the label row even though they have no width in the bar. Preserve descending story-point order inside each group.
