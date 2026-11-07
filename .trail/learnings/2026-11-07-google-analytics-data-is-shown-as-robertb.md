---
title: "Google Analytics data is shown as the second sprint review slide, not as its own page"
author: RobertB
date: 2026-11-07
branch: main
cost: { minutes: 6, tokens: 22223 }
id: l-34ba1cda
scope: repo
status: active
replaces: l-cb7e918b
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
The GA4 dashboard is slide 2 of the sprint review and only exists when both the OAuth client ID and GA4 property ID are filled in Settings; without a valid token it shows "Sign in with Google". Data covers the sprint from its start date to its end date, cut off at today while it runs; a future sprint shows a message and no data.
Left: Views and Active users (clickable, switch the chart) plus Mobile views (share of views on mobile phones, change in percentage points). The daily chart shows this sprint, the previous sprint dashed and the same dates last year dotted.
Right: Biggest riser and Biggest faller (largest absolute change in views versus the previous sprint), a top pages table for three periods paging through ranks 1–50, then Top event (/events/) and Top news (/artikelen/ or /articles/).
The Google token is kept in localStorage until it expires (about an hour) so a page refresh does not ask for a new sign-in; the user asked for this. After it expires, the stored client ID marks an earlier sign-in and the sign-in skips the account picker (prompt "").

## Tried and ruled out
A separate "Analytics" menu page with its own sprint picker was built first; the user wanted it inside the sprint review presentation instead. Sessions and Event count were shown first and removed by the user. Keeping the token only in memory (as in the wish-ga-test example) made every refresh ask for a sign-in.

## Watch out
Google gives a browser-only app no refresh token, so staying signed in longer than the token's hour needs a backend. Sign-in must start directly from the click, or the popup is blocked. Totals come from GA's TOTAL aggregation because active users cannot be summed per day. The site's origin must be an authorized JavaScript origin of the OAuth client. The slide is tightly packed: adding rows or lines makes it overflow the 16:9 slide.

In the code: public/app.js sprintReviewAnalyticsSlideHtml, loadSprintReviewAnalytics, signInToAnalytics, restoreAnalyticsToken / storeAnalyticsToken (STORAGE.gaToken), analyticsPageMovers, analyticsTopPagesHtml; settings #gaClientIdInput / #gaPropertyIdInput.
