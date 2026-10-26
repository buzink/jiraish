const STORAGE = {
  pat: "wish-board.azure-pat",
  url: "wish-board.azure-url",
  team: "wish-board.team-id",
  mapping: "wish-board.state-mapping",
  mappingVersion: "wish-board.state-mapping-version",
  theme: "wish-board.theme"
};

const DEFAULT_URL = "https://dev.azure.com/UvA-WISH/WISH/";
const DEFAULT_MAPPING_VERSION = 1;
const ACTIVE_DEFAULT_STATES = [
  "PR under review",
  "Ready for release to accept",
  "Rework ACC",
  "Test on acc",
  "Test on dev"
];
const DEFAULT_MAPPING = {
  New: "todo",
  Proposed: "hidden",
  "To Do": "hidden",
  Open: "hidden",
  Approved: "hidden",
  Active: "active",
  Committed: "hidden",
  "In Progress": "hidden",
  Doing: "hidden",
  "PR under review": "active",
  "Ready for release to accept": "active",
  "Rework ACC": "active",
  "Test on acc": "active",
  "Test on dev": "active",
  Resolved: "done",
  Closed: "done",
  Done: "done",
  Completed: "hidden",
  Removed: "hidden"
};

const state = {
  orgUrl: localStorage.getItem(STORAGE.url) || DEFAULT_URL,
  pat: localStorage.getItem(STORAGE.pat) || "",
  teams: [],
  teamId: localStorage.getItem(STORAGE.team) || "",
  iteration: null,
  stories: [],
  knownStates: new Set(Object.keys(DEFAULT_MAPPING)),
  mapping: readMapping(),
  search: "",
  filters: {
    type: new Set(),
    assignee: new Set(),
    itemState: new Set(),
    area: new Set(),
    tag: new Set(),
    feature: new Set()
  },
  detailsCache: new Map(),
  commentsCache: new Map(),
  historyCache: new Map(),
  richImageCache: new Map(),
  commentsErrors: new Map(),
  historyErrors: new Map(),
  selectedItemId: null,
  loading: false
};

const FILTER_DEFINITIONS = [
  { key: "type", label: "Types", value: item => item.type },
  { key: "assignee", label: "Assigned to", value: item => item.assignee || "Niet toegewezen" },
  { key: "itemState", label: "States", value: item => item.state },
  { key: "area", label: "Area", value: item => item.area || "Geen area" },
  { key: "tag", label: "Tags", values: item => item.tags },
  { key: "feature", label: "Feature", value: item => item.featureLabel || "Geen parent" }
];

const HISTORY_FIELDS = {
  "System.Title": "Titel",
  "System.State": "State",
  "System.Reason": "Reden",
  "System.AssignedTo": "Assigned to",
  "System.WorkItemType": "Type",
  "System.AreaPath": "Area",
  "System.IterationPath": "Sprint",
  "System.Tags": "Tags",
  "System.Description": "Beschrijving",
  "System.Parent": "Parent",
  "Microsoft.VSTS.Common.Priority": "Priority",
  "Microsoft.VSTS.Scheduling.StoryPoints": "Story points",
  "Microsoft.VSTS.Scheduling.Effort": "Effort"
};

const RICH_TEXT_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "del", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
  "hr", "i", "img", "li", "ol", "p", "pre", "s", "span", "strike", "strong", "table", "tbody",
  "td", "th", "thead", "tr", "u", "ul"
]);
const RICH_TEXT_STYLES = new Set([
  "background-color", "color", "font-style", "font-weight", "height", "margin-left", "max-width",
  "text-align", "text-decoration", "vertical-align", "width"
]);

const els = {
  board: document.querySelector("#board"),
  status: document.querySelector("#statusRegion"),
  theme: document.querySelector("#themeButton"),
  refresh: document.querySelector("#refreshButton"),
  settings: document.querySelector("#settingsButton"),
  search: document.querySelector("#searchInput"),
  filterControls: document.querySelector("#filterControls"),
  activeFilters: document.querySelector("#activeFilters"),
  clearFilters: document.querySelector("#clearFilters"),
  filterResultCount: document.querySelector("#filterResultCount"),
  sprintBadge: document.querySelector("#sprintBadge"),
  sprintMeta: document.querySelector("#sprintMeta"),
  connectionDialog: document.querySelector("#connectionDialog"),
  connectionForm: document.querySelector("#connectionForm"),
  orgUrl: document.querySelector("#orgUrlInput"),
  pat: document.querySelector("#patInput"),
  connectionError: document.querySelector("#connectionError"),
  cancelConnection: document.querySelector("#cancelConnection"),
  togglePat: document.querySelector("#togglePat"),
  settingsDialog: document.querySelector("#settingsDialog"),
  settingsForm: document.querySelector("#settingsForm"),
  teamSelect: document.querySelector("#teamSelect"),
  stateMappings: document.querySelector("#stateMappings"),
  changeConnection: document.querySelector("#changeConnection"),
  workItemDialog: document.querySelector("#workItemDialog"),
  workItemLoading: document.querySelector("#workItemLoading"),
  workItemType: document.querySelector("#workItemType"),
  workItemKey: document.querySelector("#workItemKey"),
  workItemTitle: document.querySelector("#workItemTitle"),
  workItemState: document.querySelector("#workItemState"),
  workItemReason: document.querySelector("#workItemReason"),
  workItemDescription: document.querySelector("#workItemDescription"),
  workItemAssignee: document.querySelector("#workItemAssignee"),
  workItemReporter: document.querySelector("#workItemReporter"),
  workItemPriority: document.querySelector("#workItemPriority"),
  workItemPoints: document.querySelector("#workItemPoints"),
  workItemArea: document.querySelector("#workItemArea"),
  workItemIteration: document.querySelector("#workItemIteration"),
  workItemParent: document.querySelector("#workItemParent"),
  workItemTags: document.querySelector("#workItemTags"),
  workItemChanged: document.querySelector("#workItemChanged"),
  workItemCommentCount: document.querySelector("#workItemCommentCount"),
  workItemHistoryCount: document.querySelector("#workItemHistoryCount"),
  workItemAllPanel: document.querySelector("#workItemAllPanel"),
  workItemCommentsPanel: document.querySelector("#workItemCommentsPanel"),
  workItemHistoryPanel: document.querySelector("#workItemHistoryPanel"),
  workItemActivityStatus: document.querySelector("#workItemActivityStatus"),
  workItemActivity: document.querySelector("#workItemActivity"),
  workItemCommentsStatus: document.querySelector("#workItemCommentsStatus"),
  workItemComments: document.querySelector("#workItemComments"),
  workItemHistoryStatus: document.querySelector("#workItemHistoryStatus"),
  workItemHistory: document.querySelector("#workItemHistory"),
  workItemLoadStatus: document.querySelector("#workItemLoadStatus"),
  openInAzure: document.querySelector("#openInAzure")
};

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function readMapping() {
  const mapping = { ...DEFAULT_MAPPING, ...readJson(STORAGE.mapping, {}) };
  const storedVersion = Number(localStorage.getItem(STORAGE.mappingVersion) || 0);
  if (storedVersion < DEFAULT_MAPPING_VERSION) {
    ACTIVE_DEFAULT_STATES.forEach(itemState => { mapping[itemState] = "active"; });
    localStorage.setItem(STORAGE.mapping, JSON.stringify(mapping));
    localStorage.setItem(STORAGE.mappingVersion, String(DEFAULT_MAPPING_VERSION));
  }
  return mapping;
}

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  if (persist) localStorage.setItem(STORAGE.theme, theme);
  const isDark = theme === "dark";
  els.theme.setAttribute("aria-pressed", String(isDark));
  els.theme.setAttribute("aria-label", isDark ? "Schakel naar lichte modus" : "Schakel naar donkere modus");
  els.theme.title = isDark ? "Lichte modus" : "Donkere modus";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#0c1524" : "#0747a6";
}

function parseAzureUrl(input) {
  const url = new URL(input.trim());
  const parts = url.pathname.split("/").filter(Boolean);
  const organization = url.hostname === "dev.azure.com" ? parts[0] : url.hostname.split(".")[0];
  const project = url.hostname === "dev.azure.com" ? parts[1] : parts[0];
  if (!organization || !project) throw new Error("Gebruik een URL met organisatie én project.");
  return {
    organization,
    project,
    orgBase: `https://dev.azure.com/${encodeURIComponent(organization)}`,
    base: `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}`,
    webBase: `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}`
  };
}

async function azure(path, options = {}, scope = "project") {
  const parsed = parseAzureUrl(state.orgUrl);
  const apiBase = scope === "organization" ? parsed.orgBase : parsed.base;
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${btoa(`:${state.pat}`)}`,
      ...options.headers
    }
  });
  if (response.status === 401 || response.status === 403) {
    const error = new Error("De PAT is ongeldig, verlopen of mist de benodigde leesrechten.");
    error.auth = true;
    throw error;
  }
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json())?.message || ""; } catch {}
    throw new Error(detail || `Azure DevOps gaf fout ${response.status}.`);
  }
  return response.json();
}

async function loadBoard({ openSettings = false } = {}) {
  if (!state.pat) {
    showConnection();
    renderEmptyBoard();
    return;
  }
  setLoading(true);
  clearNotice();
  try {
    const { project } = parseAzureUrl(state.orgUrl);
    const teamsResult = await azure(`/_apis/projects/${encodeURIComponent(project)}/teams?api-version=7.1`, {}, "organization");
    state.teams = teamsResult.value || [];
    if (!state.teams.length) throw new Error("Geen Azure DevOps-teams gevonden in dit project.");
    const selectedTeam = state.teams.find(team => team.id === state.teamId)
      || state.teams.find(team => team.name.toLowerCase().includes("wish"))
      || state.teams[0];
    state.teamId = selectedTeam.id;
    localStorage.setItem(STORAGE.team, state.teamId);

    const teamSegment = encodeURIComponent(selectedTeam.name);
    const iterationResult = await azure(`/${teamSegment}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1`);
    state.iteration = iterationResult.value?.[0] || null;
    if (!state.iteration) {
      state.stories = [];
      render();
      showNotice(`Voor team “${selectedTeam.name}” is geen huidige sprint ingesteld.`, "error");
      if (openSettings) showSettings();
      return;
    }

    const workResult = await azure(`/${teamSegment}/_apis/work/teamsettings/iterations/${encodeURIComponent(state.iteration.id)}/workitems?api-version=7.1`);
    const ids = [...new Set((workResult.workItemRelations || []).map(item => item.target?.id).filter(Boolean))];
    const items = [];
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      const fields = [
        "System.Id", "System.Title", "System.State", "System.WorkItemType",
        "System.AssignedTo", "Microsoft.VSTS.Scheduling.StoryPoints",
        "Microsoft.VSTS.Scheduling.Effort", "System.Tags", "System.AreaPath", "System.Parent"
      ].join(",");
      const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`);
      items.push(...(result.value || []));
    }
    state.stories = items.map(normalizeWorkItem);
    state.detailsCache.clear();
    state.commentsCache.clear();
    state.historyCache.clear();
    state.commentsErrors.clear();
    state.historyErrors.clear();
    await loadParentDetails(state.stories);
    state.stories.forEach(item => state.knownStates.add(item.state));
    addSmartMappings();
    pruneFilters();
    render();
    if (openSettings) showSettings();
  } catch (error) {
    console.error(error);
    showNotice(error.message, "error", error.auth ? "PAT opnieuw invoeren" : "Opnieuw proberen", error.auth ? showConnection : loadBoard);
    if (error.auth) showConnection(error.message);
    renderEmptyBoard();
  } finally {
    setLoading(false);
  }
}

function normalizeWorkItem(item) {
  const fields = item.fields || {};
  const assigned = fields["System.AssignedTo"];
  return {
    id: item.id,
    title: fields["System.Title"] || "Zonder titel",
    state: fields["System.State"] || "Onbekend",
    type: fields["System.WorkItemType"] || "Work item",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    area: fields["System.AreaPath"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    parentId: fields["System.Parent"] || null,
    featureLabel: "",
    points: fields["Microsoft.VSTS.Scheduling.StoryPoints"] ?? fields["Microsoft.VSTS.Scheduling.Effort"] ?? null
  };
}

async function loadParentDetails(items) {
  const parentIds = [...new Set(items.map(item => item.parentId).filter(Boolean))];
  if (!parentIds.length) return;
  const parents = new Map();
  for (let index = 0; index < parentIds.length; index += 200) {
    const chunk = parentIds.slice(index, index + 200);
    const fields = "System.Id,System.Title,System.WorkItemType";
    const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&errorPolicy=Omit&api-version=7.1`);
    for (const parent of result.value || []) {
      const parentFields = parent.fields || {};
      parents.set(parent.id, {
        title: parentFields["System.Title"] || `Work item ${parent.id}`,
        type: parentFields["System.WorkItemType"] || "Work item"
      });
    }
  }
  for (const item of items) {
    const parent = parents.get(item.parentId);
    if (parent) item.featureLabel = `${parent.title} (#${item.parentId})`;
  }
}

function addSmartMappings() {
  for (const itemState of state.knownStates) {
    if (state.mapping[itemState]) continue;
    const normalized = itemState.toLowerCase();
    if (/closed|done|complete|resolved/.test(normalized)) state.mapping[itemState] = "done";
    else if (/active|progress|committed|doing/.test(normalized)) state.mapping[itemState] = "active";
    else state.mapping[itemState] = "todo";
  }
  localStorage.setItem(STORAGE.mapping, JSON.stringify(state.mapping));
}

function render() {
  const team = state.teams.find(item => item.id === state.teamId);
  if (state.iteration) {
    els.sprintBadge.textContent = state.iteration.name;
    const start = formatDate(state.iteration.attributes?.startDate);
    const end = formatDate(state.iteration.attributes?.finishDate);
    els.sprintMeta.textContent = `${team?.name || "Team"}${start && end ? ` · ${start} – ${end}` : ""}`;
  } else {
    els.sprintBadge.textContent = "Geen actieve sprint";
    els.sprintMeta.textContent = team ? `Team ${team.name}` : "Azure DevOps niet verbonden";
  }

  const query = state.search.trim().toLowerCase();
  const visibleStories = state.stories.filter(item => matchesFilters(item, query));
  renderFilters();
  for (const column of ["todo", "active", "done"]) {
    const list = document.querySelector(`[data-list="${column}"]`);
    const stories = visibleStories.filter(item => state.mapping[item.state] === column);
    document.querySelector(`[data-count="${column}"]`).textContent = stories.length;
    const mappedStates = [...state.knownStates].filter(itemState => state.mapping[itemState] === column);
    document.querySelector(`[data-states="${column}"]`).textContent = mappedStates.join(", ") || "Geen states ingesteld";
    list.replaceChildren(...(stories.length ? stories.map(createCard) : [emptyNode()]));
  }
}

function matchesFilters(item, query = "") {
  if (query && !item.title.toLowerCase().includes(query) && !String(item.id).includes(query)) return false;
  return FILTER_DEFINITIONS.every(definition => {
    const selected = state.filters[definition.key];
    if (!selected.size) return true;
    const values = definition.values
      ? definition.values(item)
      : [definition.value(item)];
    return values.some(value => selected.has(value));
  });
}

function getFilterOptions(definition) {
  const values = new Set();
  for (const item of state.stories) {
    if (state.mapping[item.state] === "hidden") continue;
    const itemValues = definition.values ? definition.values(item) : [definition.value(item)];
    itemValues.forEach(value => { if (value) values.add(value); });
  }
  if (definition.key === "tag" && state.filters.tag.size && !values.size) return [...state.filters.tag];
  return [...values].sort((a, b) => a.localeCompare(b, "nl", { numeric: true, sensitivity: "base" }));
}

function renderFilters() {
  els.filterControls.replaceChildren(...FILTER_DEFINITIONS.map(createFilterMenu));
  const chips = [];
  for (const definition of FILTER_DEFINITIONS) {
    for (const value of state.filters[definition.key]) chips.push(createFilterChip(definition, value));
  }
  els.activeFilters.replaceChildren(...chips);
  els.activeFilters.hidden = !chips.length;
  els.clearFilters.hidden = !chips.length;
  const totalOnBoard = state.stories.filter(item => state.mapping[item.state] !== "hidden").length;
  const visibleOnBoard = state.stories.filter(item => state.mapping[item.state] !== "hidden" && matchesFilters(item, state.search.trim().toLowerCase())).length;
  els.filterResultCount.textContent = chips.length || state.search ? `${visibleOnBoard} van ${totalOnBoard}` : `${totalOnBoard} items`;
}

function createFilterMenu(definition) {
  const details = document.createElement("details");
  details.className = "filter-menu";
  const summary = document.createElement("summary");
  const selectedCount = state.filters[definition.key].size;
  summary.innerHTML = `<span>${escapeHtml(definition.label)}</span>${selectedCount ? `<b>${selectedCount}</b>` : ""}<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>`;
  const dropdown = document.createElement("div");
  dropdown.className = "filter-dropdown";
  dropdown.addEventListener("click", event => event.stopPropagation());
  const options = getFilterOptions(definition);
  if (!options.length) {
    const empty = document.createElement("p");
    empty.className = "filter-empty";
    empty.textContent = "Geen opties beschikbaar";
    dropdown.append(empty);
  } else {
    for (const option of options) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.filters[definition.key].has(option);
      input.addEventListener("change", () => {
        if (input.checked) state.filters[definition.key].add(option);
        else state.filters[definition.key].delete(option);
        render();
        const reopened = [...els.filterControls.querySelectorAll(".filter-menu")][FILTER_DEFINITIONS.indexOf(definition)];
        if (reopened) reopened.open = true;
      });
      const text = document.createElement("span");
      text.textContent = option;
      label.append(input, text);
      dropdown.append(label);
    }
  }
  details.append(summary, dropdown);
  return details;
}

function createFilterChip(definition, value) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "filter-chip";
  chip.setAttribute("aria-label", `Verwijder filter ${definition.label}: ${value}`);
  chip.innerHTML = `<span>${escapeHtml(definition.label)}:</span> ${escapeHtml(value)} <b aria-hidden="true">×</b>`;
  chip.addEventListener("click", () => {
    state.filters[definition.key].delete(value);
    render();
  });
  return chip;
}

function pruneFilters() {
  for (const definition of FILTER_DEFINITIONS) {
    const available = new Set(getFilterOptions(definition));
    for (const value of state.filters[definition.key]) if (!available.has(value)) state.filters[definition.key].delete(value);
  }
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "story-card";
  card.setAttribute("aria-label", `${item.type} ${item.id}: ${item.title}. Bekijk details`);
  card.addEventListener("click", () => showWorkItem(item));
  const initials = item.assignee ? item.assignee.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  const isBug = item.type.toLowerCase() === "bug";
  card.innerHTML = `
    <div class="card-topline">
      <span class="work-type"><span class="type-icon ${isBug ? "bug" : ""}">${isBug ? "!" : "◆"}</span>${escapeHtml(item.type)}</span>
      <span class="card-state">${escapeHtml(item.state)}</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <div class="card-footer">
      <span class="story-id">WISH-${item.id}</span>
      ${item.points !== null ? `<span class="points" title="Story points">${escapeHtml(String(item.points))}</span>` : ""}
      <span class="assignee ${item.assignee ? "" : "unassigned"}" title="${escapeHtml(item.assignee || "Niet toegewezen")}">${initials}</span>
    </div>`;
  return card;
}

async function showWorkItem(item) {
  state.selectedItemId = item.id;
  const hasCachedDetail = state.detailsCache.has(item.id);
  const hasCachedComments = state.commentsCache.has(item.id);
  const hasCachedHistory = state.historyCache.has(item.id);
  const cachedDetail = state.detailsCache.get(item.id) || null;
  const cachedComments = state.commentsCache.get(item.id) || [];
  const cachedHistory = state.historyCache.get(item.id) || [];
  if (!hasCachedComments) state.commentsErrors.delete(item.id);
  if (!hasCachedHistory) state.historyErrors.delete(item.id);
  renderWorkItemDetail(item, cachedDetail, !hasCachedDetail);
  renderComments(cachedComments, !hasCachedComments);
  renderHistory(cachedHistory, !hasCachedHistory);
  renderCombinedActivity();
  setActivityTab("comments");
  if (!els.workItemDialog.open) els.workItemDialog.showModal();

  if (!hasCachedDetail) {
    loadWorkItemDetail(item);
  }
  if (!hasCachedComments) {
    loadWorkItemComments(item);
  }
  if (!hasCachedHistory) {
    loadWorkItemHistory(item);
  }
}

async function loadWorkItemDetail(item) {
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?$expand=relations&api-version=7.1`);
    const detail = normalizeWorkItemDetail(result);
    state.detailsCache.set(item.id, detail);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, detail, false);
  } catch (error) {
    console.error(error);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, null, false, "Extra gegevens konden niet worden geladen.");
  }
}

async function loadWorkItemComments(item) {
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/comments?$top=100&order=desc&$expand=renderedText&api-version=7.1-preview.4`);
    const comments = normalizeComments(result);
    state.commentsCache.set(item.id, comments);
    state.commentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderComments(comments, false);
      renderCombinedActivity();
    }
  } catch (error) {
    console.error(error);
    state.commentsErrors.set(item.id, "Comments konden niet worden geladen.");
    if (isSelectedWorkItem(item.id)) {
      renderComments([], false, state.commentsErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

async function loadWorkItemHistory(item) {
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/updates?api-version=7.1`);
    const history = normalizeHistory(result);
    state.historyCache.set(item.id, history);
    state.historyErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderHistory(history, false);
      renderCombinedActivity();
    }
  } catch (error) {
    console.error(error);
    state.historyErrors.set(item.id, "Historie kon niet worden geladen.");
    if (isSelectedWorkItem(item.id)) {
      renderHistory([], false, state.historyErrors.get(item.id));
      renderCombinedActivity();
    }
  }
}

function isSelectedWorkItem(itemId) {
  return state.selectedItemId === itemId && els.workItemDialog.open;
}

function normalizeWorkItemDetail(item) {
  const fields = item.fields || {};
  const assigned = fields["System.AssignedTo"];
  const reporter = fields["System.CreatedBy"];
  return {
    descriptionHtml: fields["System.Description"] || "",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    reporter: reporter?.displayName || reporter?.uniqueName || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] ?? null,
    points: fields["Microsoft.VSTS.Scheduling.StoryPoints"] ?? fields["Microsoft.VSTS.Scheduling.Effort"] ?? null,
    area: fields["System.AreaPath"] || "",
    iteration: fields["System.IterationPath"] || "",
    reason: fields["System.Reason"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    changedDate: fields["System.ChangedDate"] || ""
  };
}

function normalizeComments(result) {
  const comments = result.comments || result.value || [];
  return comments.filter(comment => !comment.isDeleted).map(comment => ({
    id: comment.commentId ?? comment.id,
    author: comment.createdBy?.displayName || comment.createdBy?.uniqueName || "Onbekende gebruiker",
    html: comment.renderedText || comment.text || "",
    createdDate: comment.createdDate || "",
    modifiedDate: comment.modifiedDate || ""
  }));
}

function normalizeHistory(result) {
  return (result.value || []).map(update => {
    const changes = Object.entries(update.fields || {}).flatMap(([field, change]) => {
      const label = HISTORY_FIELDS[field] || (field.startsWith("Custom.") ? humanizeField(field.slice(7)) : "");
      if (!label) return [];
      return [{
        label,
        compact: field === "System.Description",
        oldValue: formatHistoryValue(change.oldValue),
        newValue: formatHistoryValue(change.newValue)
      }];
    });
    return {
      id: update.id,
      revision: update.rev,
      author: update.revisedBy?.displayName || update.revisedBy?.uniqueName || "Onbekende gebruiker",
      date: historyDateFor(update),
      created: update.rev === 1,
      changes
    };
  }).filter(entry => entry.created || entry.changes.length)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function historyDateFor(update) {
  const changedDate = update.fields?.["System.ChangedDate"]?.newValue;
  for (const value of [changedDate, update.revisedDate]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime()) && date.getUTCFullYear() < 9000) return value;
  }
  return "";
}

function formatHistoryValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "object") return value.displayName || value.uniqueName || "Bijgewerkt";
  const rawText = String(value).trim();
  const text = /<[a-z][\s\S]*>/i.test(rawText) ? htmlToText(rawText) : rawText;
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

function humanizeField(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
}

function renderWorkItemDetail(item, detail, loading = false, error = "") {
  const { webBase } = parseAzureUrl(state.orgUrl);
  els.workItemType.textContent = item.type;
  els.workItemKey.textContent = `WISH-${item.id}`;
  els.workItemTitle.textContent = item.title;
  els.workItemState.textContent = item.state;
  els.workItemReason.textContent = detail?.reason || "";
  els.workItemReason.hidden = !detail?.reason;
  setRichContent(els.workItemDescription, detail?.descriptionHtml, loading ? "Beschrijving wordt geladen…" : "Geen beschrijving toegevoegd.");
  els.workItemAssignee.textContent = detail?.assignee || item.assignee || "Niet toegewezen";
  els.workItemReporter.textContent = detail?.reporter || "—";
  els.workItemPriority.textContent = detail?.priority ?? "—";
  els.workItemPoints.textContent = detail?.points ?? item.points ?? "—";
  els.workItemArea.textContent = detail?.area || item.area || "—";
  els.workItemIteration.textContent = detail?.iteration || state.iteration?.name || "—";
  els.workItemParent.textContent = item.featureLabel || "Geen parent";
  renderDetailTags(detail?.tags || item.tags);
  els.workItemChanged.textContent = detail?.changedDate ? formatDateTime(detail.changedDate) : "—";
  els.workItemLoading.classList.toggle("is-active", loading);
  els.workItemLoadStatus.textContent = error || (loading ? "Extra gegevens laden…" : "");
  els.workItemLoadStatus.classList.toggle("is-error", Boolean(error));
  els.openInAzure.href = `${webBase}/_workitems/edit/${item.id}`;
}

function renderDetailTags(tags) {
  if (!tags?.length) {
    els.workItemTags.textContent = "—";
    return;
  }
  els.workItemTags.replaceChildren(...tags.map(tag => {
    const chip = document.createElement("span");
    chip.textContent = tag;
    return chip;
  }));
}

function renderComments(comments, loading = false, error = "") {
  els.workItemCommentCount.textContent = String(comments.length);
  els.workItemCommentsStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemCommentsStatus.textContent = "Comments laden…";
    els.workItemComments.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemCommentsStatus.textContent = error || (!comments.length ? "Nog geen comments." : "");
  els.workItemComments.replaceChildren(...comments.map(createComment));
}

function createComment(comment) {
  const article = document.createElement("article");
  article.className = "comment";
  const avatar = document.createElement("span");
  avatar.className = "comment-avatar";
  avatar.textContent = initialsFor(comment.author);
  const body = document.createElement("div");
  body.className = "comment-body";
  const header = document.createElement("header");
  const author = document.createElement("strong");
  author.textContent = comment.author;
  const time = document.createElement("time");
  time.dateTime = comment.createdDate;
  time.textContent = comment.createdDate ? formatDateTime(comment.createdDate) : "";
  header.append(author, time);
  const content = document.createElement("div");
  content.className = "comment-content rich-content";
  setRichContent(content, comment.html, "Lege comment");
  body.append(header, content);
  article.append(avatar, body);
  return article;
}

function renderHistory(history, loading = false, error = "") {
  els.workItemHistoryCount.textContent = String(history.length);
  els.workItemHistoryStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemHistoryStatus.textContent = "Historie laden…";
    els.workItemHistory.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemHistoryStatus.textContent = error || (!history.length ? "Nog geen historie." : "");
  els.workItemHistory.replaceChildren(...history.map(createHistoryEntry));
}

function createHistoryEntry(entry) {
  const article = document.createElement("article");
  article.className = "history-entry";
  const marker = document.createElement("span");
  marker.className = "history-marker";
  marker.textContent = initialsFor(entry.author);
  const body = document.createElement("div");
  body.className = "history-body";
  const header = document.createElement("header");
  const author = document.createElement("strong");
  author.textContent = entry.author;
  const time = document.createElement("time");
  time.dateTime = entry.date;
  time.textContent = entry.date ? formatDateTime(entry.date) : "";
  const revision = document.createElement("span");
  revision.className = "revision-label";
  revision.textContent = `rev ${entry.revision}`;
  header.append(author, time, revision);
  body.append(header);

  if (entry.created) {
    const created = document.createElement("p");
    created.className = "history-summary";
    created.textContent = "heeft dit item aangemaakt.";
    body.append(created);
  } else if (entry.changes.length) {
    const list = document.createElement("ul");
    entry.changes.forEach(change => list.append(createHistoryChange(change)));
    body.append(list);
  } else {
    const updated = document.createElement("p");
    updated.className = "history-summary";
    updated.textContent = "heeft dit item bijgewerkt.";
    body.append(updated);
  }
  article.append(marker, body);
  return article;
}

function createHistoryChange(change) {
  const row = document.createElement("li");
  const label = document.createElement("strong");
  label.textContent = change.label;
  row.append(label);
  if (change.compact) {
    row.append(document.createTextNode(" bijgewerkt"));
    return row;
  }
  const oldValue = document.createElement("span");
  oldValue.className = "history-old";
  oldValue.textContent = change.oldValue;
  const newValue = document.createElement("span");
  newValue.className = "history-new";
  newValue.textContent = change.newValue;
  row.append(document.createTextNode(" "), oldValue, document.createTextNode(" → "), newValue);
  return row;
}

function renderCombinedActivity() {
  const itemId = state.selectedItemId;
  if (itemId === null) return;
  const comments = state.commentsCache.get(itemId) || [];
  const history = state.historyCache.get(itemId) || [];
  const loading = (!state.commentsCache.has(itemId) && !state.commentsErrors.has(itemId))
    || (!state.historyCache.has(itemId) && !state.historyErrors.has(itemId));
  const errors = [state.commentsErrors.get(itemId), state.historyErrors.get(itemId)].filter(Boolean);
  const activity = [
    ...comments.map(comment => ({ kind: "comment", date: comment.createdDate, value: comment })),
    ...history.map(entry => ({ kind: "history", date: entry.date, value: entry }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  els.workItemActivityStatus.classList.toggle("is-error", Boolean(errors.length));
  els.workItemActivityStatus.textContent = errors.length
    ? errors.join(" ")
    : loading
      ? "Activiteit laden…"
      : !activity.length ? "Nog geen activiteit." : "";
  els.workItemActivity.replaceChildren(...activity.map(item =>
    item.kind === "comment" ? createComment(item.value) : createHistoryEntry(item.value)
  ));
}

function initialsFor(name) {
  return name.split(/\s+/).filter(Boolean).map(part => part[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function setActivityTab(tab) {
  document.querySelectorAll("[data-activity-tab]").forEach(button => {
    const active = button.dataset.activityTab === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  els.workItemAllPanel.hidden = tab !== "all";
  els.workItemCommentsPanel.hidden = tab !== "comments";
  els.workItemHistoryPanel.hidden = tab !== "history";
}

function htmlToText(value) {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  return (parsed.body.innerText || parsed.body.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
}

function setRichContent(element, value, fallback) {
  if (!value) {
    element.textContent = fallback;
    return;
  }
  if (!/<[a-z][\s\S]*>/i.test(value)) {
    const plain = document.createElement("span");
    plain.className = "plain-rich-text";
    plain.textContent = value;
    element.replaceChildren(plain);
    return;
  }
  element.replaceChildren(sanitizeRichHtml(value));
  hydrateRichTextImages(element);
}

function sanitizeRichHtml(value) {
  const parsed = new DOMParser().parseFromString(value, "text/html");
  const fragment = document.createDocumentFragment();
  parsed.body.childNodes.forEach(node => appendSafeNode(fragment, node));
  return fragment;
}

function appendSafeNode(parent, source) {
  if (source.nodeType === Node.TEXT_NODE) {
    parent.append(document.createTextNode(source.textContent || ""));
    return;
  }
  if (source.nodeType !== Node.ELEMENT_NODE) return;
  const tag = source.tagName.toLowerCase();
  if (!RICH_TEXT_TAGS.has(tag)) {
    source.childNodes.forEach(child => appendSafeNode(parent, child));
    return;
  }

  const target = document.createElement(tag);
  copySafeRichTextAttributes(source, target, tag);
  source.childNodes.forEach(child => appendSafeNode(target, child));
  parent.append(target);
}

function copySafeRichTextAttributes(source, target, tag) {
  if (tag === "a") {
    const href = safeRichTextUrl(source.getAttribute("href"), false);
    if (href) {
      target.href = href;
      target.target = "_blank";
      target.rel = "noopener noreferrer";
    }
  }
  if (tag === "img") {
    const src = safeRichTextUrl(source.getAttribute("src"), true);
    if (src && isConfiguredAzureUrl(src)) {
      target.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      target.dataset.authSrc = src;
      target.classList.add("is-loading");
      target.setAttribute("aria-busy", "true");
    } else if (src) {
      target.src = src;
    }
    target.alt = source.getAttribute("alt") || "";
    target.loading = "lazy";
  }
  if (source.hasAttribute("title")) target.title = source.getAttribute("title").slice(0, 300);
  for (const attribute of ["colspan", "rowspan"]) {
    const value = Number(source.getAttribute(attribute));
    if (Number.isInteger(value) && value > 0 && value <= 20) target.setAttribute(attribute, String(value));
  }
  for (const property of RICH_TEXT_STYLES) {
    const value = source.style.getPropertyValue(property);
    if (value && !/url\s*\(|expression\s*\(/i.test(value)) target.style.setProperty(property, value);
  }
}

function safeRichTextUrl(value, image) {
  if (!value) return "";
  if (image && /^data:image\/(png|gif|jpe?g|webp);base64,/i.test(value)) return value;
  try {
    const { webBase } = parseAzureUrl(state.orgUrl);
    const url = new URL(value, `${webBase}/`);
    const protocols = image ? ["https:", "http:"] : ["https:", "http:", "mailto:"];
    return protocols.includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function isConfiguredAzureUrl(value) {
  try {
    const url = new URL(value);
    const { organization } = parseAzureUrl(state.orgUrl);
    const expectedOrganization = organization.toLowerCase();
    if (url.hostname === "dev.azure.com") {
      const pathOrganization = decodeURIComponent(url.pathname.split("/").filter(Boolean)[0] || "").toLowerCase();
      return pathOrganization === expectedOrganization;
    }
    return url.hostname.toLowerCase() === `${expectedOrganization}.visualstudio.com`;
  } catch { return false; }
}

function hydrateRichTextImages(element) {
  element.querySelectorAll("img[data-auth-src]").forEach(async image => {
    const source = image.dataset.authSrc;
    try {
      let pending = state.richImageCache.get(source);
      if (!pending) {
        pending = fetchAzureImage(source);
        state.richImageCache.set(source, pending);
        pending.catch(() => state.richImageCache.delete(source));
      }
      image.src = await pending;
      image.classList.remove("is-loading");
      image.removeAttribute("aria-busy");
    } catch {
      image.classList.remove("is-loading");
      image.classList.add("is-broken");
      image.removeAttribute("aria-busy");
      image.title = "Afbeelding kon niet worden geladen.";
    }
  });
}

async function fetchAzureImage(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "image/*",
      Authorization: `Basic ${btoa(`:${state.pat}`)}`
    }
  });
  if (!response.ok) throw new Error(`Afbeelding laden mislukt (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") && blob.type !== "application/octet-stream") {
    throw new Error("Bijlage is geen afbeelding.");
  }
  return URL.createObjectURL(blob);
}

function emptyNode() {
  return document.querySelector("#emptyTemplate").content.firstElementChild.cloneNode(true);
}

function renderEmptyBoard() {
  state.stories = [];
  state.iteration = null;
  render();
}

function showSettings() {
  if (!state.pat) return showConnection();
  els.teamSelect.replaceChildren(...state.teams.map(team => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    option.selected = team.id === state.teamId;
    return option;
  }));
  els.stateMappings.replaceChildren(...[...state.knownStates].sort((a, b) => a.localeCompare(b, "nl")).map(itemState => {
    const row = document.createElement("div");
    row.className = "mapping-row";
    const label = document.createElement("strong");
    label.textContent = itemState;
    const select = document.createElement("select");
    select.name = `state-${itemState}`;
    select.dataset.state = itemState;
    [["todo", "To do"], ["active", "Active"], ["done", "Done"], ["hidden", "Niet tonen"]].forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      option.selected = state.mapping[itemState] === value;
      select.append(option);
    });
    row.append(label, select);
    return row;
  }));
  els.settingsDialog.showModal();
}

function showConnection(error = "") {
  els.orgUrl.value = state.orgUrl;
  els.pat.value = state.pat;
  els.connectionError.textContent = error;
  if (els.settingsDialog.open) els.settingsDialog.close();
  if (!els.connectionDialog.open) els.connectionDialog.showModal();
}

function setLoading(value) {
  state.loading = value;
  els.refresh.disabled = value;
  els.refresh.classList.toggle("is-spinning", value);
  if (value) {
    document.querySelectorAll(".card-list").forEach(list => {
      list.replaceChildren(...Array.from({ length: 3 }, () => {
        const node = document.createElement("div");
        node.className = "skeleton";
        return node;
      }));
    });
  }
}

function showNotice(message, type = "info", actionLabel = "", action = null) {
  const notice = document.createElement("div");
  notice.className = `notice ${type === "error" ? "error" : ""}`;
  const text = document.createElement("span");
  text.textContent = message;
  notice.append(text);
  if (actionLabel && action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = actionLabel;
    button.addEventListener("click", action);
    notice.append(button);
  }
  els.status.replaceChildren(notice);
}

function clearNotice() { els.status.replaceChildren(); }
function formatDate(value) { return value ? new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short" }).format(new Date(value)) : ""; }
function formatDateTime(value) { return value ? new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }

els.connectionForm.addEventListener("submit", event => {
  event.preventDefault();
  try {
    parseAzureUrl(els.orgUrl.value);
    state.orgUrl = els.orgUrl.value.trim();
    state.pat = els.pat.value.trim();
    if (!state.pat) throw new Error("Vul een PAT in.");
    localStorage.setItem(STORAGE.url, state.orgUrl);
    localStorage.setItem(STORAGE.pat, state.pat);
    els.connectionDialog.close();
    loadBoard({ openSettings: !state.teamId });
  } catch (error) { els.connectionError.textContent = error.message; }
});

els.settingsForm.addEventListener("submit", event => {
  event.preventDefault();
  const previousTeam = state.teamId;
  state.teamId = els.teamSelect.value;
  els.stateMappings.querySelectorAll("select[data-state]").forEach(select => { state.mapping[select.dataset.state] = select.value; });
  localStorage.setItem(STORAGE.team, state.teamId);
  localStorage.setItem(STORAGE.mapping, JSON.stringify(state.mapping));
  els.settingsDialog.close();
  if (previousTeam !== state.teamId) loadBoard(); else render();
});

document.querySelectorAll("[data-close-settings]").forEach(button => button.addEventListener("click", () => els.settingsDialog.close()));
document.querySelectorAll("[data-close-work-item]").forEach(button => button.addEventListener("click", () => els.workItemDialog.close()));
document.querySelectorAll("[data-activity-tab]").forEach(button => button.addEventListener("click", () => setActivityTab(button.dataset.activityTab)));
els.workItemDialog.addEventListener("close", () => { state.selectedItemId = null; });
els.workItemDialog.addEventListener("click", event => { if (event.target === els.workItemDialog) els.workItemDialog.close(); });
els.cancelConnection.addEventListener("click", () => { if (state.pat) els.connectionDialog.close(); });
els.togglePat.addEventListener("click", () => {
  const show = els.pat.type === "password";
  els.pat.type = show ? "text" : "password";
  els.togglePat.textContent = show ? "Verbergen" : "Tonen";
});
els.changeConnection.addEventListener("click", () => showConnection());
els.theme.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});
els.settings.addEventListener("click", showSettings);
els.refresh.addEventListener("click", () => loadBoard());
els.search.addEventListener("input", event => { state.search = event.target.value; render(); });
els.clearFilters.addEventListener("click", () => {
  Object.values(state.filters).forEach(values => values.clear());
  render();
});

document.addEventListener("click", event => {
  document.querySelectorAll(".filter-menu[open]").forEach(menu => {
    if (!menu.contains(event.target)) menu.removeAttribute("open");
  });
});

const systemTheme = matchMedia("(prefers-color-scheme: dark)");
systemTheme.addEventListener?.("change", event => {
  if (!localStorage.getItem(STORAGE.theme)) applyTheme(event.matches ? "dark" : "light");
});

applyTheme(document.documentElement.dataset.theme || "light");
if (state.pat) loadBoard(); else { renderEmptyBoard(); showConnection(); }
