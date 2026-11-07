---
title: The sprint review shows an extra Live chat slide when the additional source has a JSON file for that sprint
author: RobertB
date: 2026-11-07
branch: main
cost: { minutes: 9, tokens: 326958 }
id: l-eb7c9599
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
  - public/index.html
---

## Decided
Settings has "Analytics additional source", a base URL. The sprint review fetches <base>/sprint-<number>.json and adds a Live chat slide right after the Analytics slide only when that file exists; a missing file or empty setting simply means no slide. The slide renders the ServiceNow live chat and CSAT shape published from the sndata repo: six key numbers, top business services and assignment groups as bars, and the CSAT distribution.
Business services are shown as "Name" with their category below; assignment groups keep their full name because the faculty prefix is the meaningful part.

## Watch out
Bump the ?v= on app.js and styles.css in index.html when shipping front-end changes: the browser kept serving the old app.js under an unchanged version. The setting's storage key starts with "wish-board." so settings export/import picks it up without extra code.

In the code: public/app.js loadSprintReviewExtraData, sprintReviewExtraUrl, sprintReviewExtraSlideHtml, STORAGE.analyticsExtraSource; public/index.html #analyticsExtraSourceInput; styles under "Sprint review: additional source slide".
