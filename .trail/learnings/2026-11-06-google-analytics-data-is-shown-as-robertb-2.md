---
title: "Google Analytics data is shown as the second sprint review slide, not as its own page"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 1, tokens: 2149 }
id: l-cb7e918b
scope: repo
status: active
replaces: l-d14e5c4b
src: agent
touches:
  - public/app.js
---

## Decided
The GA4 dashboard is slide 2 of the sprint review and only exists when both the OAuth client ID and GA4 property ID are filled in Settings; without a valid token it shows "Sign in with Google". Data covers the sprint from its start date to its end date, cut off at today while it runs; a future sprint shows a message and no data.
Left: Views and Active users (clickable, switch the chart) plus Mobile views (share of views on mobile phones, change in percentage points). The daily chart shows this sprint, the previous sprint (the equally long period right before it) dashed, and the same dates last year dotted.
Right: Biggest riser and Biggest faller (largest absolute change in views versus the previous sprint, not percentage, so tiny pages don't win), then a top pages table for this sprint, previous sprint and last year with arrows paging through ranks 1–50, top aligned with the chart. Below it Top event (URL contains /events/) and Top news (/artikelen/ or /articles/).

## Tried and ruled out
A separate "Analytics" menu page with its own sprint picker was built first; the user wanted it inside the sprint review presentation instead. Sessions and Event count were shown first and removed by the user.

## Watch out
Sign-in uses Google Identity Services' token client (as in the wish-ga-test example) and must start directly from the click, or the popup is blocked. The token lives only in memory. Totals come from GA's TOTAL aggregation because active users cannot be summed per day. The site's origin must be an authorized JavaScript origin of the OAuth client. The slide is tightly packed: adding rows or lines under the table makes it overflow the 16:9 slide, so check the fit.

In the code: public/app.js sprintReviewAnalyticsSlideHtml, loadSprintReviewAnalytics, analyticsPageMovers, analyticsTopPagesHtml, runAnalyticsTopPageMatching, ANALYTICS_EVENT_PATHS / ANALYTICS_NEWS_PATHS; settings #gaClientIdInput / #gaPropertyIdInput; styles under "Sprint review: Google Analytics slide".
