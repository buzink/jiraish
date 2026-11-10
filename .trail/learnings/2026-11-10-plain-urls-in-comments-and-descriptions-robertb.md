---
title: "Plain URLs in comments and descriptions become links when shown, not when saved"
author: RobertB
date: 2026-11-10
branch: main
cost: { minutes: 2, tokens: 108126 }
id: l-bb73fa8b
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/styles.css
---

## Decided
Bare http(s) URLs in comments and work-item descriptions are turned into links when the text is shown, not when it is saved. This also fixes old comments that Azure already stores with plain-text URLs (pasted URLs stay plain text in the editor). Long URLs and words wrap inside the box instead of overflowing.

## Watch out
Text inside an existing link, pre or code is left alone. Trailing punctuation stays outside the link, and a closing bracket is kept only when it is balanced. A URL to an Azure work item gets the same in-app link as the sanitizer gives it.

In the code: linkifyBareUrls in public/app.js, called from setRichContent for both the HTML and plain-text paths; CSS overflow-wrap: anywhere on .rich-content and .comment-content in public/styles.css.
