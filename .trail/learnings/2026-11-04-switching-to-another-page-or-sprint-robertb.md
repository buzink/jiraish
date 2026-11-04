---
title: Switching to another page or sprint always starts at the top of the page
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 6, tokens: 29364 }
id: l-7c3a76d8
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
  - public/styles.css
---

## Decided
Every navigation to another page or sprint scrolls the window to the top, because the app swaps views inside one long page and otherwise kept the previous page's scroll position (e.g. a sprint link low on the Releases page opened the board halfway down). This covers internal links, the top navigation, Back/Forward and sprint changes through a route. Opening or closing a work item does not scroll, because it is a dialog over the current page.

## Watch out
The route handler sets the current view before the page is shown, so detecting "view changed" only in the view switcher misses link navigation; it is checked in both places. Back/Forward do not restore the old scroll position, since pages are re-rendered asynchronously.

In the code: scrollAppToTop, called from showMainView (view change) and applyAppRoute (view or sprint change) in public/app.js. Sprint names in the latest-commits table link to the app's board route (#/sprint-board?sprint=N) via createLatestCommitSprintLink.
