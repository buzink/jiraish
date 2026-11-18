---
title: "Connection settings live in the Settings dialog, one section per app with the connection first and a Test button"
author: RobertB
date: 2026-11-18
branch: main
cost: { minutes: 5, tokens: 151924 }
id: l-5549cf81
scope: repo
status: active
src: agent
touches:
  - public/index.html
  - public/app.js
---

## Decided
The user wanted no separate connection dialog. Settings has one section per connected app (Azure DevOps, GitHub, AI, Google Analytics, Live chat data). Each section starts with its connection fields and a "Test connection" button, followed by that app's preferences (Azure: team and state mapping; GitHub: owners and repositories; AI: model).
Without a PAT, or after an auth error, the same Settings dialog opens with the error under the Azure test button; the board part of the Azure section stays hidden until a connection is saved and teams are loaded.

## Watch out
Tests use the values typed in the fields, not the saved state, so they work before saving. The Google Analytics test needs a sign-in popup, which only opens from a real user click. Changing the Azure URL or PAT on Save reloads the whole board (and reopens Settings when no team is known); a changed GitHub key hides the owner/repository choices until it is saved.

In the code: public/index.html #settingsDialog; public/app.js showSettings, showConnection (now opens Settings), applyConnectionSettings, applyGithubConnectionSettings, runConnectionTest and the test* functions.
