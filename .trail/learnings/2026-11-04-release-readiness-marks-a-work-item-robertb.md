---
title: "Release readiness marks a work item Ready only in a finished state, never while it still has to be tested"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 18, tokens: 12614 }
id: l-263f3d3d
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Ready is shown only when the work item state is Closed, Resolved, Done or Completed, because only those mean the work was tested and accepted. In the Development → Acceptance lane, "Ready for release to accept" also counts, because that state is the explicit sign-off for moving to Acceptance. Every other state shows Needs attention.

## Tried and ruled out
Matching "test on dev" style states as Ready: wrong, because "Test on dev" means the item still has to be tested on Development. Following the board's "done" column mapping: dropped because it also turned states like Removed into Ready; Removed must stay Needs attention since removed work should not ship unnoticed.

In the code: readinessState in public/app.js (explicit state list, no longer isFinishedWorkItem).
