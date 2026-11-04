---
title: "State mapping settings list every state Azure defines, not only loaded ones"
author: RobertB
date: 2026-11-04
branch: main
cost: { minutes: 1, tokens: 46909 }
id: l-099c4023
scope: repo
status: active
src: agent
touches:
  - public/app.js
---

## Decided
The settings dialog's state-to-column list is filled from the Azure work item type state definitions (common backlog types plus types on the board), not only from defaults and items in the loaded sprint. A state such as "Rework dev" was missing because no loaded sprint item was in it, so it could not be mapped to Doing.
New states containing rework/test/review smart-map to Doing.

## Watch out
The extra states load asynchronously after the dialog opens; re-rendering keeps the user's unsaved select choices. A fresh open discards stale drafts (keepDraft: false).

In the code: public/app.js showSettings, renderStateMappings, loadSettingsWorkItemStates, SETTINGS_STATE_TYPES, addSmartMappings; states come from workItemTypeStates (/_apis/wit/workitemtypes/{type}/states).
