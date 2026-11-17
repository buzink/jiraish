---
title: Moving several backlog items to another sprint never asks to split a story; moving one still does
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 56844 }
id: l-5427006e
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The user wanted bulk moves (2+ selected items) via the backlog context menu "Move to sprint" to just change the sprint, without the "remaining story points" split dialog per story. Moving a single story still asks whether to split it, as before. The Sprint field in the work-item Details is unchanged (always one item).

## In the code
public/app.js updateBacklogItemsToSprint: the requestRemainingPoints loop only runs when targets.length === 1.
