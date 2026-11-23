---
title: "The analytics slide splits views into desktop, mobile app and mobile browser, counted with app_page_load"
author: RobertB
date: 2026-11-23
branch: main
cost: { minutes: 27, tokens: 70955 }
id: l-91676356
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The metrics row is Views, Mobile app, Mobile browser, Active users, App users (order and labels chosen by the user). The UvA app is recognised by its webview browser in GA4 ("Safari (in-app)" on iOS, "Android Webview"); the app on an iPad reports as a desktop browser and counts as no segment. The shares and the top pages are counted with the app_page_load event, not screenPageViews: page_view missed every first load until 23 November 2026 (GTM send_page_view false), and app sessions nearly always start with one, so screenPageViews overstated the app (63% instead of 54% in sprint 134). At the user's request every view count on the slide now uses app_page_load (eventCount filtered on ANALYTICS_PAGE_LOAD_FILTER): Views and its chart, Biggest riser and faller, Top event and Top news. Active users is not filtered, so runAnalyticsReport makes one request per metric. The metric keeps its id screenPageViews on the slide (data-analytics-metric and state), only its GA request changed.
The top 10 table with three periods (and its pager) was replaced, first by a top 3 per segment and then, at the user's request, by a pie chart of views per page category for the sprint: Dashboard (homepage "student.uva.nl"), Timetable (timetable, personal timetable, academic calendar), Study results, Contact (service desks, education desk, exam board, study advisers, counsellors, psychologists, confidential advisers and similar; ANALYTICS_PAGE_CATEGORIES), News and Events, and Other. News and Events match on the URL path (/artikelen, /en/articles, /events, /en/events: the overview pages and every single article or event) and win over a title match. Other is the segment total minus the categorised views, so the long tail of titles is never fetched. Below it, toggle buttons Desktop / Mobile app / Mobile browser filter the pie (all on by default, at least one stays on). Top event and Top news moved above the pie, directly under Biggest riser and faller.

## Watch out
Five facts in the metrics row only fit with the smaller gap (2cqi) and bottom alignment; "Mobile browser" wraps. The exported file renders the pie for every combination of segments (7) and its runtime only switches which one is visible. Pie colours are the dataviz default categorical slots 1–6 plus a neutral grey for Other, validated for light and dark. Bump the ?v= in index.html after CSS changes or the browser keeps the old stylesheet.
