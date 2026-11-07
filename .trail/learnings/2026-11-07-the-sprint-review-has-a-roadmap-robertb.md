---
title: "The sprint review has a Roadmap slide after the analytics slides: a gantt of the sprint's quarter that pages to the previous and next quarter"
author: RobertB
date: 2026-11-07
branch: main
cost: { minutes: 1, tokens: 1780 }
id: l-7a135db8
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The user wanted the Roadmap slide to follow the Analytics and Live chat slides. It shows the quarter of the reviewed sprint as a gantt: months and sprints on a date-proportional time axis, one swimlane per Epic, and each Feature as bars over the sprints it is in. Committed bars (Stories in that sprint) are solid, forecasted bars (forecast:<sprint>:<lane> tags) are dashed; neighbouring sprints with the same status merge into one bar, and Frontend/Backend lanes are merged (lanes only appear in the tooltip). A red line marks today.
Paging is limited to the previous and next quarter so that all three can be loaded up front: the HTML export then carries all three panels and its runtime switches them without app code.
The slide uses sprints that overlap the quarter (clipped at its edges), not only those starting in it, and also lists Epics that only have forecasted Features, so a forecast is never invisible on the slide.

## Watch out
The data comes from buildRoadmapData, extracted from loadRoadmap so the Roadmap page and the slide share it; it takes year and quarter as arguments instead of reading state.roadmapYear/Quarter. Stories per sprint are memoised per review load because neighbouring quarters share overlapping sprints. Export awaits state.reviewRoadmap.promise before rendering.

In the code: public/app.js buildRoadmapData, loadSprintReviewRoadmap, sprintReviewRoadmapSlideHtml, roadmapSlidePanelHtml, roadmapSlideFeatureRows, data-roadmap-step in sprintReviewExportRuntime; styles under "Sprint review: Roadmap slide".
