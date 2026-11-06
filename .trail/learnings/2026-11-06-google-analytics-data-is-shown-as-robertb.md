---
title: "Google Analytics data is shown as the second sprint review slide, not as its own page"
author: RobertB
date: 2026-11-06
branch: feature/analytics-page
cost: { minutes: 1, tokens: 0 }
id: l-d14e5c4b
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The GA4 dashboard (Views, Active users, Sessions, Event count with change vs. the previous equally long period, and a daily line chart with the previous period dashed, modelled on GA's own overview card) is slide 2 of the sprint review. It only exists when both the OAuth client ID and GA4 property ID are filled in Settings. Without a valid token the slide shows a "Sign in with Google" button.
The data covers the sprint from its start date to its end date, cut off at today while the sprint runs. A sprint that starts in the future shows a message and no data.

## Tried and ruled out
A separate "Analytics" menu page with its own sprint picker was built first; the user wanted it inside the sprint review presentation instead, so the nav item, route and page were removed.

## Watch out
Sign-in uses Google Identity Services' token client (as in the wish-ga-test example) and must be started directly from the click, or the popup is blocked. The token lives only in memory, never in localStorage. Totals come from GA's TOTAL aggregation because active users cannot be summed per day. The site's origin must be an authorized JavaScript origin of the OAuth client.

In the code: public/app.js sprintReviewAnalyticsSlideHtml, loadSprintReviewAnalytics, analyticsPeriod, runAnalyticsReport, signInToAnalytics; settings fields #gaClientIdInput / #gaPropertyIdInput; styles under "Sprint review: Google Analytics slide".
