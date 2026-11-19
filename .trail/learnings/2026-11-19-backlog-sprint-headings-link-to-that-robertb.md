---
title: "Backlog sprint headings link to that sprint's board and show its dates before the label"
author: RobertB
date: 2026-11-19
branch: main
cost: { minutes: 1, tokens: 70859 }
id: l-db762822
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted each sprint heading on the backlog page (e.g. "Sprint 135") to link to that sprint and to show its start–end dates after the title and before the label (CURRENT SPRINT etc.). The link goes to the sprint board for that sprint, the same target as the sprint links in the latest commits table. The dates are muted, in the same "12 Nov – 26 Nov" format as the work-item Sprint field. The "Other" group has no link and no dates; a sprint missing a start or end date shows no dates.

## Watch out
In dark mode the heading text (#42526e) has poor contrast; that predates this change and was left as is.

In the code: public/app.js — createBacklogSection takes an optional fourth "iteration" argument; renderBacklog passes group.iteration; link href is appRouteHash({ view: "board", sprint: sprintRouteValue(iteration) }). CSS: .backlog-group-link and .backlog-group-dates in public/styles.css.
