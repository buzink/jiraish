---
title: "The sprint page header has a < before and a > after the team name and dates to step through sprints; Review sits right, next to Group by"
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 11439 }
id: l-7498397b
scope: repo
status: active
replaces: l-3060e7cd
src: agent
touches:
  - public/index.html
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted to flip through sprints quickly from the sprint page header. The line under the sprint title reads "< WISH Team · dates >": "<" (previous, older sprint) at the start and ">" (next, newer) right after the dates. They step through the team's sprints in date order and load the sprint the same way as picking it from the title menu. At the oldest or newest sprint the matching button is disabled; both are hidden in the multi-sprint filtered view, like the Review link.

The Review link moved out of that line to the right side of the header, directly left of the Group by control.

## Tried and ruled out
Both arrows together between the dates and Review, and then both together at the start of the line: the user asked to move them each time.

In the code: public/index.html #sprintPrevious and #sprintNext around #sprintMeta, #sprintReviewLink first in .heading-actions; public/app.js adjacentIteration, renderSprintStepper (called from render), stepSprint → selectOverviewIteration; CSS #sprintPrevious/#sprintNext margins and .sprint-step-button in public/styles.css.
