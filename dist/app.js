const STORAGE = {
  pat: "wish-board.azure-pat",
  url: "wish-board.azure-url",
  team: "wish-board.team-id",
  mapping: "wish-board.state-mapping"
};

const DEFAULT_URL = "https://dev.azure.com/UvA-WISH/WISH/";
const DEFAULT_MAPPING = {
  New: "todo",
  Proposed: "todo",
  "To Do": "todo",
  Open: "todo",
  Approved: "todo",
  Active: "active",
  Committed: "active",
  "In Progress": "active",
  Doing: "active",
  Resolved: "done",
  Closed: "done",
  Done: "done",
  Completed: "done",
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
  mapping: readJson(STORAGE.mapping, { ...DEFAULT_MAPPING }),
  search: "",
  loading: false
};

const els = {
  board: document.querySelector("#board"),
  status: document.querySelector("#statusRegion"),
  refresh: document.querySelector("#refreshButton"),
  settings: document.querySelector("#settingsButton"),
  configure: document.querySelector("#configureButton"),
  search: document.querySelector("#searchInput"),
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
  changeConnection: document.querySelector("#changeConnection")
};

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
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
        "Microsoft.VSTS.Scheduling.Effort", "System.Tags"
      ].join(",");
      const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`);
      items.push(...(result.value || []));
    }
    state.stories = items
      .map(normalizeWorkItem)
      .filter(item => ["user story", "product backlog item", "bug", "requirement"].includes(item.type.toLowerCase()));
    state.stories.forEach(item => state.knownStates.add(item.state));
    addSmartMappings();
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
    points: fields["Microsoft.VSTS.Scheduling.StoryPoints"] ?? fields["Microsoft.VSTS.Scheduling.Effort"] ?? null
  };
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
  for (const column of ["todo", "active", "done"]) {
    const list = document.querySelector(`[data-list="${column}"]`);
    const stories = state.stories.filter(item =>
      state.mapping[item.state] === column &&
      (!query || item.title.toLowerCase().includes(query) || String(item.id).includes(query))
    );
    document.querySelector(`[data-count="${column}"]`).textContent = stories.length;
    const mappedStates = [...state.knownStates].filter(itemState => state.mapping[itemState] === column);
    document.querySelector(`[data-states="${column}"]`).textContent = mappedStates.join(", ") || "Geen states ingesteld";
    list.replaceChildren(...(stories.length ? stories.map(createCard) : [emptyNode()]));
  }
}

function createCard(item) {
  const { webBase } = parseAzureUrl(state.orgUrl);
  const card = document.createElement("a");
  card.className = "story-card";
  card.href = `${webBase}/_workitems/edit/${item.id}`;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.setAttribute("aria-label", `${item.type} ${item.id}: ${item.title}. Open in Azure DevOps`);
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
els.cancelConnection.addEventListener("click", () => { if (state.pat) els.connectionDialog.close(); });
els.togglePat.addEventListener("click", () => {
  const show = els.pat.type === "password";
  els.pat.type = show ? "text" : "password";
  els.togglePat.textContent = show ? "Verbergen" : "Tonen";
});
els.changeConnection.addEventListener("click", () => showConnection());
els.settings.addEventListener("click", showSettings);
els.configure.addEventListener("click", showSettings);
els.refresh.addEventListener("click", () => loadBoard());
els.search.addEventListener("input", event => { state.search = event.target.value; render(); });

if (state.pat) loadBoard(); else { renderEmptyBoard(); showConnection(); }
