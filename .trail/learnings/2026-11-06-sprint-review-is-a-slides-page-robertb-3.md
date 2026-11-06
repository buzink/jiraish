---
title: "Sprint review is a slides page per sprint with title, sprint items, demo items and next sprint"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 9, tokens: 45196 }
id: l-882b3443
scope: repo
status: active
replaces: l-6e37139f
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The sprint page shows a "Review" link after the sprint dates. It opens #/sprint-review?sprint=N: four slides in a fixed order the user asked for: a title slide (Sprint N, dates, "Meeting will be recorded"), all stories and bugs in the sprint, the ones tagged "demo", and the stories and bugs of the next sprint.
Tables: Name, Type, Area. The first sprint table adds a Demo checkmark column; the demo table adds Person (Assigned to). Both sprint tables sort by area, then story points (most first, unestimated last), then title. The demo table sorts by person (unassigned last), then title.
Both sprint table slides show the sprint's Features (parents of type Feature) top right as colored pills with an item count, at most 8 (beyond that 7 plus "+N more", which expands). Clicking a pill filters that slide's table to the feature; a subtle "Reset ×" button, clicking the pill again, or Esc clears it. Filters are kept per slide.
Clicking the slide itself does nothing; the user removed click-to-advance because it clashed with clicking features. Navigate with the pager buttons or arrows, PageUp/Down, space, Home/End; F toggles full screen.
"Stories and bugs" means User Story, Product Backlog Item, Requirement and Bug; Tasks and Removed items are left out. The demo tag matches case-insensitively. The next sprint is the next one in date order. Area shows the last segment of the area path.
The link is hidden while the multi-sprint filter is active, because a review belongs to one sprint.

## Watch out
The review uses the board's state.iteration, so the route's sprint param is applied like the board's (applyRouteSprint handles both views). Slides are render functions taking their slide index, so a slide can re-render with its filter. Feature pills need item.parentType, which loadParentDetails now stores alongside parentTitle.

In the code: public/app.js loadSprintReview, sprintReviewItems, sprintReviewTableSlide, sprintReviewFeaturesHtml, handleSprintReviewKeydown; APP_ROUTE_PATHS review → "sprint-review"; public/index.html #sprintReviewView; styles under "Sprint review slides" in public/styles.css.
