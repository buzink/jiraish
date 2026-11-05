---
title: Backlog issues are copied as a table through a dialog where you pick Markdown or HTML and the columns
author: RobertB
date: 2026-11-05
branch: main
cost: { minutes: 8, tokens: 56975 }
id: l-120cb39c
scope: repo
status: active
src: agent
touches:
  - public/styles.css
  - public/app.js
  - public/index.html
---

## Decided
The backlog row menu has one "Copy as table" item (it replaced an earlier Copy as → HTML/Markdown submenu at the user's request). It opens a dialog where you pick the format (Markdown or HTML) and which backlog columns to include, and it copies the selected issues, or only that row if it isn't selected. The last format and columns are remembered per browser. HTML is written as text/html with the HTML source as text/plain, so it pastes as a real table in Word/Confluence/mail and as markup in an editor. HTML column widths copy the backlog table's UI widths; Summary takes the rest. Markdown can't carry widths.

## Watch out
The copy columns (label, value, width) are their own list, not read from the table header or the CSS. If you add or resize a backlog column, update that list too. Columns always copy in backlog order, whatever order they were ticked in.

In the code: public/app.js BACKLOG_COPY_COLUMNS, showBacklogCopyDialog, submitBacklogCopyDialog, copyBacklogItemsAsTable; dialog #backlogCopyDialog in public/index.html; widths mirror .backlog-table nth-child rules in public/styles.css; preference key localStorage "jiraish.backlogCopyTable".
