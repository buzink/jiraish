---
title: "Sprint dates in the work-item view are looked up by sprint path from the team's loaded sprints"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 1, tokens: 58056 }
id: l-129058ff
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
The Sprint field in the work-item Details and every option in its sprint picker show the sprint's start–end dates after the name (muted, e.g. "2 Nov – 13 Nov"). A sprint without both dates shows only its name.

## Watch out
The picker's sprint list is only paths, not sprint objects, so the dates have to be looked up separately by path: first in the team's sprints that are already loaded, then in a path-to-sprint map filled while the picker loads. Paths are compared case-insensitively, ignoring leading and trailing backslashes. If a sprint isn't in either list, it has no dates to show and shows without them.

In the code: public/app.js — iterationPathKey, iterationForPath, iterationDateRangeForPath, renderWorkItemIterationValue; loadTeamIterations fills state.teamIterationsByPath; createDetailFieldOption takes an optional third "meta" argument for the dates. CSS: .issue-detail-field-dates and .issue-detail-field-option-label in public/styles.css.
