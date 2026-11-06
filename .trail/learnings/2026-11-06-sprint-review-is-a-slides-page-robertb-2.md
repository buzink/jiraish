---
title: "Sprint review is a slides page per sprint with title, sprint items, demo items and next sprint"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 8, tokens: 15495 }
id: l-6e37139f
scope: repo
status: active
replaces: l-e1e7e9b1
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The sprint page shows a "Review" link after the sprint dates. It opens #/sprint-review?sprint=N: four click-through slides in a fixed order the user asked for: a title slide (Sprint N, dates, "Meetings will be recorded"), all stories and bugs in the sprint, the ones tagged "demo", and the stories and bugs of the next sprint. Sprint tables show Name, Type, Area; the demo table adds Person (Assigned to).
Sorting, as the user asked: both sprint tables by area, then story points (most first, unestimated last), then title alphabetically. The demo table sorts by person alphabetically (unassigned last), then title. The demo slide subtitle is just the sprint name, without a "tagged demo" note.
"Stories and bugs" means User Story, Product Backlog Item, Requirement and Bug; Tasks and items in state Removed are left out. The demo tag matches case-insensitively. The next sprint is the one after it in date order. Area shows only the last segment of the area path, and sorting uses that segment.
The link is hidden when the sprint filter (multiple sprints) is active, because a review belongs to one sprint.

## Watch out
The review uses the board's state.iteration, so the route's sprint param is applied like the board's (applyRouteSprint handles both views). Slide navigation: arrows, PageUp/Down, space, Home/End, F for full screen, or click the left/right part of the slide.

In the code: public/app.js loadSprintReview, sprintReviewItems, sprintReviewTableSlide, handleSprintReviewKeydown; APP_ROUTE_PATHS review → "sprint-review"; public/index.html #sprintReviewView; styles under "Sprint review slides" in public/styles.css.
