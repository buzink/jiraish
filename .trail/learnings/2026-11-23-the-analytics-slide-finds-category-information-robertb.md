---
title: "The analytics slide finds category, information and campaign pages by their URL, since GA has no page type"
author: RobertB
date: 2026-11-23
branch: main
cost: { minutes: 19, tokens: 259307 }
id: l-0798f9f8
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
  - public/index.html
---

## Decided
The user wanted Top cat, Top info and Top camp above Top event and Top news on the analytics slide. Each one shows the most viewed page of that type in the sprint.
The user wanted no lines under the metrics and the movers, Biggest riser/faller at the very top next to the Analytics title, the Top cat row level with the App users label, and the pie filter buttons level with the chart legend.
The user renamed the visible labels "Mobile app" to "App" and "Mobile browser" to "Mobile", both in the metrics row and in the pie chart filter. The keys (app, mobileBrowser) stay the same.
The user wanted the Desktop/App/Mobile filter below the pie chart to filter all data on the slide: the chart with Views and Active users, Biggest riser and faller with their trends, and the top pages. A filtered view leaves out the share facts (App, Mobile, App users), because within a device selection they say nothing (App would read 100% with only App selected). The user named App users and Mobile; App was left out too for the same reason.
The user wanted a Top contact row built from the same Contact group as the pie chart. That group is a list of page titles (desks, offices, committees, advisers), not a path. Contact pages live under /informatie/ and /information/ too, so Top info leaves them out, because otherwise Study adviser was both Top info and Top contact.
The group was extended after a search in GA (page titles with desk, office, balie, commissie, committee, board, afdeling, department, loket, adviser, reception). Added: Receptie, International Office, Office of International Student Mobility, Bureau Internationale Studentenmobiliteit, Programme Committee, Opleidingscommissie, Board of Studies, the diversity office pages, and the Psychology study adviser pages.
The user hit "Exhausted concurrent requests quota" from GA. GA allows 10 requests at once per property, for all clients together, and the analytics slide asks for more than 20 at once (and 14 per device selection). analyticsRunReport now runs at most 4 at a time, retries a 429 about concurrent requests up to 5 times with a growing pause, sends an identical request that is already running only once, and keeps reports whose end date is more than two days ago in the browser's Cache API (jiraish-ga-reports-v1), because GA no longer changes those days.

## Tried and ruled out
GA4 property 379071837 has no custom dimension for page type (only click_url, component, label, page_language, page_location, study_selected, subcomponent, study_programme), so the page type cannot come from GA.
Before the rename, the labels always reserved two lines and Top cat was pushed down one line, because the longer labels wrapped on smaller slides only. With the short labels every label is one line at 760, 1024, 1400 and 1920 wide, so that reservation was removed and Top cat starts at the top of the metrics row.
Left out on purpose: "Becoming a member of the Programme Committee" and "Lid worden van de opleidingscommissie", the appeal procedures against the Examinations Board, "Contact met medestudenten", vacancies and the Job Board, and articles or events, because they are about a procedure or news rather than a desk to contact. No pages with afdeling or department in the title came up.

## Watch out
Pages are told apart by their path on student.uva.nl: category pages use /categorieen/ and /en/categories/, information pages use /informatie/ and /en/information/, and campaign pages use /campagnes/ and /en/campaigns/. The Dutch and English versions of a page are counted separately, so the top page can be just one language version.

In the code: ANALYTICS_CATEGORY_PATHS, ANALYTICS_INFO_PATHS and ANALYTICS_CAMPAIGN_PATHS next to ANALYTICS_EVENT_PATHS in public/app.js. They are queried with runAnalyticsTopPageMatching and shown with analyticsTopEventHtml in analyticsCategoriesHtml.
The header sits outside the analytics card. The movers can only reach the title's height when they share a grid with the header, so the slide itself became the grid ("header riser" / "metrics pages" / "chart pages" / "footer pages") and the card got display: contents.
The metric labels always reserve two lines, with the text at the bottom, because Mobile app and Mobile browser only wrap on smaller slides. Without that, Top cat was one line (24px) too low at 1920 wide while it was right at 1400. Top cat is then pushed down by exactly one label line.
The legend gets .25em bottom padding, because otherwise its middle sat 3px below the middle of the taller filter buttons.

In the code: the last analytics block in public/styles.css (.sprint-review-analytics-slide:has(.analytics-card), .analytics-metrics .analytics-metric-label, .analytics-top-pages margin-top).
If a longer metric label comes back and wraps, Top cat is no longer level with the labels.

In the code: ANALYTICS_SEGMENTS and analyticsMetricsHtml in public/app.js; .analytics-top-pages margin-top in public/styles.css.
Active users are unique per period, so they cannot be added up from per-device numbers: each device selection is its own set of GA reports (runAnalyticsSegmentView, about a dozen requests). The app loads a selection when it is chosen and shows the unfiltered view dimmed meanwhile. All devices selected is the unfiltered view and also counts tablets, so App + Desktop + Mobile is a little below the total.
The exported file switches without app code, so the export first loads all six filtered selections one after another (about 7 seconds), and every part that follows the filter is rendered once per selection with data-segment-view. The export runtime compares metric buttons by value, because there is now one set of metric buttons per selection.
The pie title and chart sit in a group with margin auto above and below, so they stay centred between the top pages and the filters, which stay at the bottom level with the chart legend.

In the code: analyticsSegmentFilter, runAnalyticsSegmentView, loadAnalyticsSegment, loadAllAnalyticsSegments and sprintReviewAnalyticsSlideHtml in public/app.js; .analytics-pie-title-group and [data-segment-view] in public/styles.css.
Like the pie chart, a page on a news or event path never counts as contact, whatever its title. "Top contact" is the widest label, so the shared label width is 8.2em; a wider new label needs a larger width.

In the code: ANALYTICS_PAGE_CATEGORIES (contact), analyticsCategoryFilter, runAnalyticsTopPage and runAnalyticsSegmentView in public/app.js; .analytics-top-event-label in public/styles.css.
A finished sprint loads entirely from the cache the second time (0 requests to GA, checked). The current sprint's own period is never cached, so it always gets fresh numbers. The cache key is the property id plus the request body, so a change to a report request simply misses the cache. To clear it, delete that cache in the browser or bump the version in its name.

In the code: analyticsRunReport and the ANALYTICS_MAX_CONCURRENT / ANALYTICS_CACHE_NAME helpers just above it in public/app.js.
