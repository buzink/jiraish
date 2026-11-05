---
title: "Tag filters switch between OR and AND inside the Tags dropdown, not as a separate control"
author: RobertB
date: 2026-11-05
branch: main
cost: { minutes: 2, tokens: 73241 }
id: l-3dc51057
scope: repo
status: active
src: agent
touches:
  - public/index.html
  - public/app.js
  - public/styles.css
---

## Decided
The user wanted the AND/OR choice to show up only once you open the tags to change them, so it is a two-button switch (OR – any tag / AND – all tags) at the top of the Tags dropdown on the Sprint page, the Backlog page and the For you custom section. The For you section used to have a separate "Match" select next to Tags; that select was removed. OR is the default.
Sprint and Backlog share one mode, and it is stored in the browser even though the filters themselves are not. The For you mode is saved with the rest of that table's settings.

## Watch out
The For you query to Azure already joined the tag conditions with AND or OR, so only the control moved. Sprint and Backlog filter in the browser, so AND is checked in the client-side filter code there.
When AND is on and more than one tag is picked, the filter chips are labelled "Tags (AND)" so you can tell the mode with the dropdown closed.

In the code: public/app.js matchesFilters, createFilterMenu, createTagMatchToggle / setTagMatchToggle / tagMatchToggleValue; state.filterTagMode with localStorage key wish-board.filter-tag-mode; For you markup #forYouCustomTagMode (radio group) inside #forYouCustomTags in public/index.html; styles .tag-match-toggle in public/styles.css.
