---
title: "The roadmap Forecast toggle comes first in the header, label before switch, and empty lanes are left blank"
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 7, tokens: 62536 }
id: l-1b255ba1
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The user wanted the Forecast toggle left of "Create sprints" and "Current quarter", with the word "Forecast" before the switch. Empty roadmap lanes show nothing instead of "No features".

## Watch out
The checkbox must stay directly before the switch span: the on/off look uses the adjacent-sibling selector `input:checked + .roadmap-forecast-switch`, so the text label goes before the input, not between them.
The empty lane cell is kept (only its text is gone) because its min-height keeps a lane without features as tall as one with features.

In the code: public/index.html `.roadmap-heading-actions`; public/styles.css `.roadmap-forecast-toggle` (margin-right), `.roadmap-lane-empty`; public/app.js the two `roadmap-lane-empty` spans.
