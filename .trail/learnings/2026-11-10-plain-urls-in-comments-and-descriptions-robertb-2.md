---
title: Plain URLs in comments and descriptions are saved to Azure as real links and also linked when shown
author: RobertB
date: 2026-11-10
branch: main
cost: { minutes: 1, tokens: 14282 }
id: l-16559fee
scope: repo
status: active
replaces: l-bb73fa8b
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Azure DevOps does not turn plain URLs in comment or description HTML into links, so a URL that Jiraish only linked when showing it stayed plain text in Azure. Jiraish now turns bare http(s) URLs into real <a> links in the HTML it saves. It still links them when showing too, so older comments with plain URLs look right in Jiraish. Long URLs and words wrap inside the box instead of overflowing.

## Tried and ruled out
Linking only when showing: looked fine in Jiraish, but the user saw the URL as plain text in Azure DevOps.

## Watch out
The same linking runs in the HTML comparison used for "unsaved changes", so opening an old comment with a plain URL and cancelling doesn't count as a change. Text inside an existing link, pre or code is left alone. Trailing punctuation stays outside the link; a closing bracket is kept only when balanced.

In the code: linkifyBareUrls in public/app.js, called from setRichContent (showing), richEditorHtml (saving comments and descriptions) and sanitizedRichHtmlString (comparison); CSS overflow-wrap: anywhere on .rich-content and .comment-content in public/styles.css.
