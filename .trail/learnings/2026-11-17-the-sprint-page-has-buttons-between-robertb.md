---
title: "The sprint page has < > buttons between the sprint dates and the Review link to step to the previous or next sprint"
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 12175 }
id: l-3060e7cd
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The user wanted to flip through sprints quickly from the sprint page header. Two small buttons, "<" (previous, older) and ">" (next, newer), sit between the sprint dates and the Review link. They step through the team's sprints in date order and load the sprint the same way as picking it from the title menu. At the oldest or newest sprint the matching button is disabled. They are hidden in the multi-sprint filtered view, like the Review link.

In the code: public/index.html #sprintStepper / #sprintPrevious / #sprintNext; public/app.js adjacentIteration, renderSprintStepper (called from render), stepSprint → selectOverviewIteration; CSS .sprint-stepper, .sprint-step-button in public/styles.css.
