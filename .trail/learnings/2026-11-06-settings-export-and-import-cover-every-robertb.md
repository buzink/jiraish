---
title: "Settings export and import cover every stored setting including API keys, and import is also offered before connecting"
author: RobertB
date: 2026-11-06
branch: main
cost: { minutes: 2, tokens: 50973 }
id: l-6ef89b9c
scope: repo
status: active
src: agent
touches:
  - public/app.js
  - public/index.html
---

## Decided
- Export writes every local-storage entry the app owns (keys starting with "wish-board." or "jiraish.") to a JSON file, tokens and API keys included, because the user wants to move a full setup to another browser.
- Import replaces all app-owned entries (stale ones are removed), asks for confirmation, then reloads the page, since app state is read from storage at startup.
- Import is also in the Connect dialog: the settings dialog only opens once an Azure token exists, so a fresh browser could otherwise never import.

## Watch out
- A new storage key outside those two prefixes will not be exported; keep new keys under "wish-board." or add the prefix to the list.

In the code: public/app.js SETTINGS_STORAGE_PREFIXES, exportSettings, importSettingsFile; public/index.html [data-export-settings], [data-import-settings], #importSettingsFile. Export file format: { format: "jiraish-settings", version: 1, settings: {...} }.
