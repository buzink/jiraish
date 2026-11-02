---
title: Progress states navigate through board grouping
author: RobertB
date: 2026-11-02
branch: main
id: l-13b6009f
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Sprint progress state segments and labels are navigation controls. Clicking either persists Group by State, rerenders the board, and scrolls to the matching state group in its mapped column. The controls retain the original bar and badge appearance until interaction.

In the code: `showBoardState`, `createSprintProgressLegendGroup`, `renderSprintProgress`, and `createBoardGroup` in `public/app.js`; transparent segment hit targets and the responsive one-line legend in `public/styles.css`.

## Tried and ruled out
A separate progress-only state view was unnecessary because the board already supports grouping by state.

## Watch out
Progress uses the complete sprint while board filters may hide a target state. In that case grouping still changes to State, but no hidden group can be scrolled to.
