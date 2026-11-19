---
title: "Backlog sprint headings link to that sprint's board and show its dates after the label"
author: RobertB
date: 2026-11-19
branch: main
cost: { minutes: 1, tokens: 6696 }
id: l-f83f77d1
scope: repo
status: active
replaces: l-db762822
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Each sprint heading on the backlog page (e.g. "Sprint 135") links to the sprint board for that sprint, the same target as the sprint links in the latest commits table. After the title comes the label (CURRENT SPRINT etc.), then the start–end dates, muted, in the "12 Nov – 26 Nov" format of the work-item Sprint field. The "Other" group has no link and no dates; a sprint missing a start or end date shows none.

## Tried and ruled out
Dates between the title and the label: the user asked to swap them so the label comes first.

## Watch out
The heading text was #42526e in dark mode too, unreadable on the dark header; dark mode now uses the theme text color #b6c2cf, with lighter blue on hover and #9fadbc for the dates.

In the code: public/app.js — createBacklogSection takes an optional fourth "iteration" argument; renderBacklog passes group.iteration; href is appRouteHash({ view: "board", sprint: sprintRouteValue(iteration) }). CSS: .backlog-group-link, .backlog-group-dates and their [data-theme="dark"] rules in public/styles.css.
