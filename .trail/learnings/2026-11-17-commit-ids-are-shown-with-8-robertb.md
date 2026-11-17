---
title: "Commit ids are shown with 8 characters, the same as Azure DevOps"
author: RobertB
date: 2026-11-17
branch: main
cost: { minutes: 1, tokens: 40071 }
id: l-8b6c0f7d
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The user wants short commit ids everywhere in the app to be 8 characters, not Git's usual 7, so they match what Azure DevOps shows and can be compared by eye.

## Watch out
New code that shows a commit id should also use 8 characters; a 7-character cut would bring back the mismatch.

In the code: public/app.js uses commit.sha.slice(0, 8) (Latest commits table, actions menu, copy message, build panel, latest safe commit, change labels).
