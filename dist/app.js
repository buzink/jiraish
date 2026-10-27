const STORAGE = {
  pat: "wish-board.azure-pat",
  url: "wish-board.azure-url",
  team: "wish-board.team-id",
  project: "wish-board.project-name",
  mapping: "wish-board.state-mapping",
  mappingVersion: "wish-board.state-mapping-version",
  iteration: "wish-board.iteration-id",
  theme: "wish-board.theme"
};

const DEFAULT_URL = "https://dev.azure.com/organization/project/";
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

const STATE_TONES = {
  "active": "blue",
  "pr under review": "sky",
  "test on dev": "magenta",
  "rework dev": "yellow",
  "ready for release to accept": "red",
  "ready to release to accept": "red",
  "test on acc": "purple",
  "rework acc": "orange",
  "resolved": "blue",
  "closed": "green"
};

const state = {
  orgUrl: localStorage.getItem(STORAGE.url) || DEFAULT_URL,
  pat: localStorage.getItem(STORAGE.pat) || "",
  teams: [],
  teamId: localStorage.getItem(STORAGE.team) || "",
  projectName: localStorage.getItem(STORAGE.project) || "",
  teamName: "",
  authenticatedUser: null,
  teamMembers: [],
  iterations: [],
  currentIterationId: "",
  iteration: null,
  stories: [],
  knownStates: new Set(Object.keys(DEFAULT_MAPPING)),
  mapping: readMapping(),
  search: "",
  filters: {
    type: new Set(),
    assignee: new Set(),
    priority: new Set(),
    sprint: new Set(),
    itemState: new Set(),
    area: new Set(),
    tag: new Set(),
    feature: new Set()
  },
  detailsCache: new Map(),
  iterationStoriesCache: new Map(),
  backlogItems: [],
  backlogTeamId: "",
  forYouProjectName: "",
  forYouWorkItems: [],
  forYouMentions: [],
  forYouActivity: [],
  forYouErrors: {},
  forYouExpanded: { work: false, mentions: false, activity: false },
  forYouSelectedUser: null,
  forYouUserKey: "",
  forYouRequestToken: 0,
  currentView: "board",
  detailsRequestTokens: new Map(),
  commentsCache: new Map(),
  commentsRequestTokens: new Map(),
  historyCache: new Map(),
  richImageCache: new Map(),
  workItemTypeStatesCache: new Map(),
  workItemTypeFieldsCache: new Map(),
  areaPathsCache: null,
  teamIterationsCache: null,
  commentsErrors: new Map(),
  historyErrors: new Map(),
  selectedItemId: null,
  selectedItem: null,
  loading: false
};

const FILTER_DEFINITIONS = [
  { key: "type", label: "Types", value: item => item.type },
  { key: "assignee", label: "Assigned to", value: item => item.assignee || "Unassigned" },
  { key: "priority", label: "Priority", value: item => item.priority != null ? String(item.priority) : "No priority" },
  { key: "sprint", label: "Sprint", value: item => item.iterationName },
  { key: "itemState", label: "States", value: item => item.state },
  { key: "area", label: "Area", value: item => item.area || "No area" },
  { key: "tag", label: "Tags", values: item => item.tags },
  { key: "feature", label: "Feature", value: item => item.featureLabel || "No parent" }
];

const HISTORY_FIELDS = {
  "System.Title": "Title",
  "System.State": "State",
  "System.Reason": "Reason",
  "System.AssignedTo": "Assigned to",
  "System.WorkItemType": "Type",
  "System.AreaPath": "Area",
  "System.IterationPath": "Sprint",
  "System.Tags": "Tags",
  "System.Description": "Description",
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
  appBrand: document.querySelector("#appBrand"),
  brandName: document.querySelector("#brandName"),
  headerAvatar: document.querySelector("#headerAvatar"),
  projectTeamLabels: [...document.querySelectorAll("[data-project-team]")],
  forYouNav: document.querySelector("#forYouNav"),
  sprintBoardNav: document.querySelector("#sprintBoardNav"),
  backlogNav: document.querySelector("#backlogNav"),
  listViews: [...document.querySelectorAll("[data-list-view]")],
  boardViews: [...document.querySelectorAll("[data-board-view]")],
  backlogViews: [...document.querySelectorAll("[data-backlog-view]")],
  forYouViews: [...document.querySelectorAll("[data-for-you-view]")],
  forYouTitle: document.querySelector("#forYouTitle"),
  forYouMeta: document.querySelector("#forYouMeta"),
  forYouPersonControl: document.querySelector("#forYouPersonControl"),
  forYouPerson: document.querySelector("#forYouPerson"),
  forYouPersonName: document.querySelector("#forYouPersonName"),
  forYouPersonMenu: document.querySelector("#forYouPersonMenu"),
  forYouPersonSearch: document.querySelector("#forYouPersonSearch"),
  forYouPersonOptions: document.querySelector("#forYouPersonOptions"),
  forYouTeamName: document.querySelector("#forYouTeamName"),
  forYouWorkCount: document.querySelector("#forYouWorkCount"),
  forYouWorkDescription: document.querySelector("#forYouWorkDescription"),
  forYouWorkStatus: document.querySelector("#forYouWorkStatus"),
  forYouWorkList: document.querySelector("#forYouWorkList"),
  forYouWorkShowAll: document.querySelector("#forYouWorkShowAll"),
  forYouMentionsCount: document.querySelector("#forYouMentionsCount"),
  forYouMentionsDescription: document.querySelector("#forYouMentionsDescription"),
  forYouMentionsStatus: document.querySelector("#forYouMentionsStatus"),
  forYouMentionsList: document.querySelector("#forYouMentionsList"),
  forYouMentionsShowAll: document.querySelector("#forYouMentionsShowAll"),
  forYouActivityCount: document.querySelector("#forYouActivityCount"),
  forYouActivityDescription: document.querySelector("#forYouActivityDescription"),
  forYouActivityStatus: document.querySelector("#forYouActivityStatus"),
  forYouActivityList: document.querySelector("#forYouActivityList"),
  forYouActivityShowAll: document.querySelector("#forYouActivityShowAll"),
  backlogView: document.querySelector("#backlogView"),
  backlogMeta: document.querySelector("#backlogMeta"),
  backlogContent: document.querySelector("#backlogContent"),
  board: document.querySelector("#board"),
  status: document.querySelector("#statusRegion"),
  theme: document.querySelector("#themeButton"),
  refresh: document.querySelector("#refreshButton"),
  search: document.querySelector("#searchInput"),
  filterControls: document.querySelector("#filterControls"),
  activeFilters: document.querySelector("#activeFilters"),
  clearFilters: document.querySelector("#clearFilters"),
  filterResultCount: document.querySelector("#filterResultCount"),
  sprintBadge: document.querySelector("#sprintBadge"),
  sprintTitle: document.querySelector("#sprintTitle"),
  sprintTitleControl: document.querySelector("#sprintTitleControl"),
  sprintMenu: document.querySelector("#sprintMenu"),
  sprintMenuSearch: document.querySelector("#sprintMenuSearch"),
  sprintMenuOptions: document.querySelector("#sprintMenuOptions"),
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
  workItemTitleForm: document.querySelector("#workItemTitleForm"),
  workItemTitleInput: document.querySelector("#workItemTitleInput"),
  workItemTitleCancel: document.querySelector("#workItemTitleCancel"),
  workItemTitleSubmit: document.querySelector("#workItemTitleSubmit"),
  workItemTitleStatus: document.querySelector("#workItemTitleStatus"),
  workItemStateControl: document.querySelector("#workItemStateControl"),
  workItemState: document.querySelector("#workItemState"),
  workItemStateMenu: document.querySelector("#workItemStateMenu"),
  workItemStateOptions: document.querySelector("#workItemStateOptions"),
  workItemReason: document.querySelector("#workItemReason"),
  workItemDescription: document.querySelector("#workItemDescription"),
  descriptionEditButton: document.querySelector("#descriptionEditButton"),
  descriptionEditorForm: document.querySelector("#descriptionEditorForm"),
  descriptionEditor: document.querySelector("#descriptionEditor"),
  descriptionMentionMenu: document.querySelector("#descriptionMentionMenu"),
  descriptionMentionOptions: document.querySelector("#descriptionMentionOptions"),
  descriptionEditorCancel: document.querySelector("#descriptionEditorCancel"),
  descriptionEditorSubmit: document.querySelector("#descriptionEditorSubmit"),
  descriptionEditorStatus: document.querySelector("#descriptionEditorStatus"),
  workItemAssignee: document.querySelector("#workItemAssignee"),
  workItemAssigneeControl: document.querySelector("#workItemAssigneeControl"),
  workItemAssigneeMenu: document.querySelector("#workItemAssigneeMenu"),
  workItemAssigneeSearch: document.querySelector("#workItemAssigneeSearch"),
  workItemAssigneeSource: document.querySelector("#workItemAssigneeSource"),
  workItemAssigneeOptions: document.querySelector("#workItemAssigneeOptions"),
  workItemReporter: document.querySelector("#workItemReporter"),
  workItemPriority: document.querySelector("#workItemPriority"),
  workItemPriorityControl: document.querySelector("#workItemPriorityControl"),
  workItemPriorityMenu: document.querySelector("#workItemPriorityMenu"),
  workItemPriorityOptions: document.querySelector("#workItemPriorityOptions"),
  workItemPoints: document.querySelector("#workItemPoints"),
  workItemPointsControl: document.querySelector("#workItemPointsControl"),
  workItemPointsMenu: document.querySelector("#workItemPointsMenu"),
  workItemPointsQuick: document.querySelector("#workItemPointsQuick"),
  workItemPointsForm: document.querySelector("#workItemPointsForm"),
  workItemPointsInput: document.querySelector("#workItemPointsInput"),
  workItemArea: document.querySelector("#workItemArea"),
  workItemAreaControl: document.querySelector("#workItemAreaControl"),
  workItemAreaMenu: document.querySelector("#workItemAreaMenu"),
  workItemAreaSearch: document.querySelector("#workItemAreaSearch"),
  workItemAreaOptions: document.querySelector("#workItemAreaOptions"),
  workItemIteration: document.querySelector("#workItemIteration"),
  workItemIterationControl: document.querySelector("#workItemIterationControl"),
  workItemIterationMenu: document.querySelector("#workItemIterationMenu"),
  workItemIterationSearch: document.querySelector("#workItemIterationSearch"),
  workItemIterationOptions: document.querySelector("#workItemIterationOptions"),
  workItemParent: document.querySelector("#workItemParent"),
  workItemTags: document.querySelector("#workItemTags"),
  workItemTagsControl: document.querySelector("#workItemTagsControl"),
  workItemTagsMenu: document.querySelector("#workItemTagsMenu"),
  workItemTagsSelected: document.querySelector("#workItemTagsSelected"),
  workItemTagsInput: document.querySelector("#workItemTagsInput"),
  workItemTagsHint: document.querySelector("#workItemTagsHint"),
  workItemTagsOptions: document.querySelector("#workItemTagsOptions"),
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
  commentComposerPrompt: document.querySelector("#commentComposerPrompt"),
  commentComposerForm: document.querySelector("#commentComposerForm"),
  commentComposerInput: document.querySelector("#commentComposerInput"),
  commentMentionMenu: document.querySelector("#commentMentionMenu"),
  commentMentionOptions: document.querySelector("#commentMentionOptions"),
  commentComposerCancel: document.querySelector("#commentComposerCancel"),
  commentComposerSubmit: document.querySelector("#commentComposerSubmit"),
  commentComposerStatus: document.querySelector("#commentComposerStatus"),
  workItemHistoryStatus: document.querySelector("#workItemHistoryStatus"),
  workItemHistory: document.querySelector("#workItemHistory"),
  workItemLoadStatus: document.querySelector("#workItemLoadStatus"),
  openInAzure: document.querySelector("#openInAzure")
};

const mentionState = {
  description: { query: "", range: null, activeIndex: 0, choices: [] },
  comment: { query: "", range: null, activeIndex: 0, choices: [] }
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
  els.theme.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  els.theme.title = isDark ? "Light mode" : "Dark mode";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#0c1524" : "#0747a6";
}

function parseAzureUrl(input) {
  const url = new URL(input.trim());
  const parts = url.pathname.split("/").filter(Boolean).map(part => decodeURIComponent(part));
  const isModernUrl = url.hostname === "dev.azure.com";
  const organization = isModernUrl ? parts[0] : url.hostname.split(".")[0];
  const rawProject = isModernUrl ? parts[1] : parts[0];
  const project = rawProject && !rawProject.startsWith("_") ? rawProject : "";
  const projectTail = isModernUrl ? parts.slice(2) : parts.slice(1);
  let pathTeam = projectTail[0] && !projectTail[0].startsWith("_") ? projectTail[0] : "";
  if (projectTail[0] === "_boards") {
    const teamMarker = projectTail.indexOf("t");
    pathTeam = teamMarker >= 0 ? projectTail[teamMarker + 1] || "" : "";
  } else if (["_backlogs", "_sprints"].includes(projectTail[0])) {
    pathTeam = projectTail[2] || "";
  }
  const team = url.searchParams.get("team") || url.searchParams.get("teamId") || pathTeam;
  if (!organization) throw new Error("Enter at least a valid Azure DevOps organization URL.");
  const orgBase = `https://dev.azure.com/${encodeURIComponent(organization)}`;
  const projectBase = project ? `${orgBase}/${encodeURIComponent(project)}` : orgBase;
  return {
    organization,
    project: project || "",
    team,
    orgBase,
    base: projectBase,
    webBase: projectBase
  };
}

function activeAzureContext() {
  const parsed = parseAzureUrl(state.orgUrl);
  const project = parsed.project || state.projectName;
  const projectBase = project ? `${parsed.orgBase}/${encodeURIComponent(project)}` : parsed.orgBase;
  return { ...parsed, project, base: projectBase, webBase: projectBase };
}

function updateBranding(team = null) {
  let configuredProject = "";
  try { configuredProject = parseAzureUrl(state.orgUrl).project; } catch {}
  if (configuredProject) state.projectName = configuredProject;
  const project = state.projectName;
  state.teamName = team?.name || "";
  const displayName = state.teamName || "Jiraish";
  const profileName = state.authenticatedUser?.displayName || state.teamName || displayName;
  els.brandName.textContent = displayName;
  els.appBrand.setAttribute("aria-label", `${displayName} · Jiraish`);
  els.headerAvatar.textContent = initialsFor(profileName);
  els.headerAvatar.setAttribute("aria-label", `Open settings for ${profileName}`);
  els.headerAvatar.title = `${profileName} · Settings`;
  const contextLabel = project
    ? `PROJECT / ${project}${state.teamName && state.teamName.toLocaleLowerCase("en") !== project.toLocaleLowerCase("en") ? ` · TEAM / ${state.teamName}` : ""}`
    : "PROJECT";
  els.projectTeamLabels.forEach(label => { label.textContent = contextLabel; });
  document.title = state.teamName ? `${state.teamName} · Jiraish` : "Jiraish";
}

async function loadAuthenticatedUser() {
  try {
    const connection = await azure("/_apis/connectionData?connectOptions=0&lastChangeId=-1&lastChangeId64=-1", {}, "organization");
    const identity = connection.authenticatedUser || connection.authorizedUser;
    if (!identity) return null;
    const properties = identity.properties || {};
    const displayName = identity.customDisplayName
      || identity.providerDisplayName
      || identity.displayName
      || properties.DisplayName?.$value
      || properties.Account?.$value
      || identity.uniqueName
      || "";
    return displayName ? {
      id: identity.id || "",
      displayName,
      uniqueName: identity.uniqueName || identity.mailAddress || identity.properties?.Account?.$value || ""
    } : null;
  } catch (error) {
    console.warn("The user associated with the PAT could not be determined; team initials will be used.", error);
    return null;
  }
}

function workItemKey(itemId) {
  const prefix = String(state.projectName || "")
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLocaleUpperCase("en")
    .slice(0, 24);
  return prefix ? `${prefix}-${itemId}` : `#${itemId}`;
}

async function azure(path, options = {}, scope = "project") {
  const parsed = activeAzureContext();
  if (scope === "project" && !parsed.project) throw new Error("No Azure DevOps project has been selected yet.");
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
    const error = new Error("The PAT is invalid, expired, or does not have the required read permissions.");
    error.auth = true;
    throw error;
  }
  if (!response.ok) {
    let detail = "";
    try { detail = (await response.json())?.message || ""; } catch {}
    throw new Error(detail || `Azure DevOps returned error ${response.status}.`);
  }
  return response.json();
}

async function loadBoard({ openSettings = false } = {}) {
  if (!state.pat) {
    showConnection();
    renderEmptyBoard();
    return;
  }
  state.forYouProjectName = "";
  setLoading(true);
  clearNotice();
  try {
    const configured = parseAzureUrl(state.orgUrl);
    let project = configured.project;
    if (!project) {
      const projectsResult = await azure("/_apis/projects?$top=1000&api-version=7.1", {}, "organization");
      const projects = projectsResult.value || [];
      if (!projects.length) throw new Error("No Azure DevOps projects were found in this organization.");
      project = projects.find(value => value.name === state.projectName)?.name || projects[0].name;
    }
    state.projectName = project;
    localStorage.setItem(STORAGE.project, project);
    const teamsResult = await azure(`/_apis/projects/${encodeURIComponent(project)}/teams?api-version=7.1`, {}, "organization");
    state.teams = teamsResult.value || [];
    if (!state.teams.length) throw new Error("No Azure DevOps teams were found in this project.");
    const configuredTeam = configured.team.toLocaleLowerCase("en");
    const selectedTeam = state.teams.find(team => team.id === state.teamId)
      || state.teams.find(team => configuredTeam && (team.id.toLocaleLowerCase("en") === configuredTeam || team.name.toLocaleLowerCase("en") === configuredTeam))
      || state.teams[0];
    state.teamId = selectedTeam.id;
    updateBranding(selectedTeam);
    localStorage.setItem(STORAGE.team, state.teamId);
    [state.teamMembers, state.authenticatedUser] = await Promise.all([
      loadTeamMembers(project, selectedTeam),
      loadAuthenticatedUser()
    ]);
    updateBranding(selectedTeam);

    const teamSegment = encodeURIComponent(selectedTeam.name);
    const [iterationsResult, currentIterationResult] = await Promise.all([
      azure(`/${teamSegment}/_apis/work/teamsettings/iterations?api-version=7.1`),
      azure(`/${teamSegment}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1`)
    ]);
    state.iterations = iterationsResult.value || [];
    state.iterationStoriesCache.clear();
    state.currentIterationId = currentIterationResult.value?.[0]?.id || "";
    const storedIterationId = localStorage.getItem(STORAGE.iteration) || "";
    state.iteration = state.iterations.find(iteration => iteration.id === storedIterationId)
      || state.iterations.find(iteration => iteration.id === state.currentIterationId)
      || nearestIteration(state.iterations);
    if (!state.iteration) {
      state.stories = [];
      render();
      showNotice(`No sprints are configured for team “${selectedTeam.name}”.`, "error");
      if (state.currentView === "backlog") await loadBacklog(true);
      if (state.currentView === "for-you") await loadForYou(true);
      if (openSettings) showSettings();
      return;
    }
    localStorage.setItem(STORAGE.iteration, state.iteration.id);
    state.teamIterationsCache = Promise.resolve(newestIterations().map(iteration => iteration.path || iteration.name).filter(Boolean));
    await loadIterationStories(selectedTeam, state.iteration);
    if (state.filters.sprint.size) await applySprintFilter();
    render();
    if (state.currentView === "backlog") await loadBacklog(true);
    if (state.currentView === "for-you") await loadForYou(true);
    if (openSettings) showSettings();
  } catch (error) {
    console.error(error);
    showNotice(error.message, "error", error.auth ? "Enter PAT again" : "Try again", error.auth ? showConnection : loadBoard);
    if (error.auth) showConnection(error.message);
    renderEmptyBoard();
  } finally {
    setLoading(false);
  }
}

async function loadIterationStories(team, iteration) {
  const stories = await fetchIterationStories(team, iteration);
  applyBoardStories(stories);
}

async function fetchIterationStories(team, iteration) {
    const cached = state.iterationStoriesCache.get(iteration.id);
    if (cached) return cached;
    const teamSegment = encodeURIComponent(team.name);
    const workResult = await azure(`/${teamSegment}/_apis/work/teamsettings/iterations/${encodeURIComponent(iteration.id)}/workitems?api-version=7.1`);
    const ids = [...new Set((workResult.workItemRelations || []).map(item => item.target?.id).filter(Boolean))];
    const items = [];
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      const fields = [
        "System.Id", "System.Title", "System.State", "System.WorkItemType",
        "System.AssignedTo", "Microsoft.VSTS.Scheduling.StoryPoints",
        "Microsoft.VSTS.Scheduling.Effort", "Microsoft.VSTS.Common.Priority",
        "System.Tags", "System.AreaPath", "System.IterationPath", "System.Parent"
      ].join(",");
      const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`);
      items.push(...(result.value || []));
    }
    const stories = items.map(normalizeWorkItem).map(story => ({
      ...story,
      iterationId: iteration.id,
      iterationName: iteration.name
    }));
    await loadParentDetails(stories);
    state.iterationStoriesCache.set(iteration.id, stories);
    return stories;
}

function applyBoardStories(stories) {
    state.stories = stories;
    state.detailsCache.clear();
    state.detailsRequestTokens.clear();
    state.commentsCache.clear();
    state.commentsRequestTokens.clear();
    state.historyCache.clear();
    state.workItemTypeStatesCache.clear();
    state.workItemTypeFieldsCache.clear();
    state.areaPathsCache = null;
    state.commentsErrors.clear();
    state.historyErrors.clear();
    state.stories.forEach(item => state.knownStates.add(item.state));
    addSmartMappings();
    if (state.currentView !== "backlog") pruneFilters(state.stories);
}

function nearestIteration(iterations) {
  const now = Date.now();
  return [...iterations].sort((a, b) => {
    const aStart = new Date(a.attributes?.startDate || 0).getTime();
    const bStart = new Date(b.attributes?.startDate || 0).getTime();
    return Math.abs(aStart - now) - Math.abs(bStart - now);
  })[0] || null;
}

async function loadTeamMembers(project, team) {
  try {
    const result = await azure(`/_apis/projects/${encodeURIComponent(project)}/teams/${encodeURIComponent(team.id)}/members?api-version=7.1`, {}, "organization");
    return (result.value || []).map(member => member.identity || member).map(identity => ({
      id: identity.id || "",
      name: identity.displayName || identity.uniqueName || "Unknown user",
      uniqueName: identity.uniqueName || identity.displayName || ""
    })).filter(member => member.uniqueName);
  } catch (error) {
    console.warn("Team members could not be loaded; assignees from the sprint will be used.", error);
    return [];
  }
}

function normalizeWorkItem(item) {
  const fields = item.fields || {};
  const assigned = fields["System.AssignedTo"];
  const changedBy = fields["System.ChangedBy"];
  const storyPoints = fields["Microsoft.VSTS.Scheduling.StoryPoints"];
  const effort = fields["Microsoft.VSTS.Scheduling.Effort"];
  const iterationPath = fields["System.IterationPath"] || "";
  return {
    id: item.id,
    title: fields["System.Title"] || "Untitled",
    state: fields["System.State"] || "Unknown",
    type: fields["System.WorkItemType"] || "Work item",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    assigneeUniqueName: assigned?.uniqueName || assigned?.displayName || "",
    assigneeId: assigned?.id || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] ?? null,
    iterationPath,
    iterationName: iterationPath.split("\\").filter(Boolean).pop() || "No sprint",
    area: fields["System.AreaPath"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    parentId: fields["System.Parent"] || null,
    featureLabel: "",
    points: storyPoints ?? effort ?? null,
    changedDate: fields["System.ChangedDate"] || "",
    changedBy: changedBy?.displayName || changedBy?.uniqueName || "",
    changedById: changedBy?.id || "",
    changedByUniqueName: changedBy?.uniqueName || changedBy?.displayName || "",
    descriptionHtml: fields["System.Description"] || "",
    pointsField: storyPoints !== undefined ? "Microsoft.VSTS.Scheduling.StoryPoints"
      : effort !== undefined ? "Microsoft.VSTS.Scheduling.Effort" : ""
  };
}

async function fetchWorkItems(ids, { includeDescription = false } = {}) {
  const uniqueIds = [...new Set(ids.map(Number).filter(Boolean))];
  const items = [];
  const fields = [
    "System.Id", "System.Title", "System.State", "System.WorkItemType", "System.AssignedTo",
    "System.IterationPath", "System.AreaPath", "System.Tags", "System.Parent", "System.ChangedDate",
    "System.ChangedBy", "Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints",
    "Microsoft.VSTS.Scheduling.Effort"
  ];
  if (includeDescription) fields.push("System.Description");
  for (let index = 0; index < uniqueIds.length; index += 200) {
    const chunk = uniqueIds.slice(index, index + 200);
    const result = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields.join(","))}&errorPolicy=Omit&api-version=7.1`);
    items.push(...(result.value || []).map(normalizeWorkItem));
  }
  return items;
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
  const filteredIterations = selectedSprintIterations();
  if (filteredIterations.length) {
    els.sprintTitle.textContent = filteredIterations.map(iteration => iteration.name).join(", ");
    els.sprintTitle.setAttribute("aria-label", `Filtered sprints: ${els.sprintTitle.textContent}. Click to choose another sprint.`);
    els.sprintBadge.textContent = "Filtered view";
    els.sprintBadge.dataset.sprintKind = "filtered-view";
    els.sprintMeta.textContent = `${team?.name || "Team"} · ${filteredIterations.length} ${filteredIterations.length === 1 ? "sprint" : "sprints"}`;
  } else if (state.iteration) {
    els.sprintTitle.textContent = state.iteration.name;
    els.sprintTitle.setAttribute("aria-label", `Sprint ${state.iteration.name}. Click to choose another sprint.`);
    const label = iterationLabel(state.iteration);
    els.sprintBadge.textContent = label;
    els.sprintBadge.dataset.sprintKind = label.toLowerCase().replace(/\s+/g, "-");
    const start = formatDate(state.iteration.attributes?.startDate);
    const end = formatDate(state.iteration.attributes?.finishDate);
    els.sprintMeta.textContent = `${team?.name || "Team"}${start && end ? ` · ${start} – ${end}` : ""}`;
  } else {
    els.sprintTitle.textContent = "No sprint";
    els.sprintBadge.textContent = "Current sprint";
    els.sprintBadge.dataset.sprintKind = "current-sprint";
    els.sprintMeta.textContent = team ? `Team ${team.name}` : "Azure DevOps is not connected";
  }

  const query = state.search.trim().toLowerCase();
  const visibleStories = state.stories.filter(item => matchesFilters(item, query));
  renderFilters();
  for (const column of ["todo", "active", "done"]) {
    const list = document.querySelector(`[data-list="${column}"]`);
    const stories = visibleStories.filter(item => state.mapping[item.state] === column);
    document.querySelector(`[data-count="${column}"]`).textContent = stories.length;
    const mappedStates = [...state.knownStates].filter(itemState => state.mapping[itemState] === column);
    document.querySelector(`[data-states="${column}"]`).textContent = mappedStates.join(", ") || "No states configured";
    list.replaceChildren(...(stories.length ? stories.map(createCard) : [emptyNode()]));
  }
}

function selectedSprintIterations() {
  if (!state.filters.sprint.size) return [];
  return newestIterations().filter(iteration => state.filters.sprint.has(iteration.name));
}

function chronologicalIterations() {
  return [...state.iterations].sort((a, b) => {
    const aDate = new Date(a.attributes?.startDate || a.attributes?.finishDate || 0).getTime();
    const bDate = new Date(b.attributes?.startDate || b.attributes?.finishDate || 0).getTime();
    return aDate - bDate || a.name.localeCompare(b.name, "en", { numeric: true });
  });
}

function newestIterations() {
  return chronologicalIterations().reverse();
}

function iterationLabel(iteration) {
  if (iteration.id === state.currentIterationId) return "Current sprint";
  const ordered = chronologicalIterations();
  const currentIndex = ordered.findIndex(value => value.id === state.currentIterationId);
  if (currentIndex > 0 && ordered[currentIndex - 1]?.id === iteration.id) return "Previous sprint";
  if (currentIndex >= 0 && ordered[currentIndex + 1]?.id === iteration.id) return "Next sprint";
  const now = Date.now();
  const finish = new Date(iteration.attributes?.finishDate || 0).getTime();
  const start = new Date(iteration.attributes?.startDate || 0).getTime();
  if (finish && finish < now) return "Closed sprint";
  if (start && start > now) return "Future sprint";
  const iterationIndex = ordered.findIndex(value => value.id === iteration.id);
  return currentIndex >= 0 && iterationIndex < currentIndex ? "Closed sprint" : "Future sprint";
}

function toggleSprintMenu() {
  if (!els.sprintMenu.hidden) return closeSprintMenu();
  if (!state.iterations.length || state.loading) return;
  els.sprintMenu.hidden = false;
  els.sprintTitle.setAttribute("aria-expanded", "true");
  els.sprintMenuSearch.value = "";
  renderSprintMenuOptions();
  requestAnimationFrame(() => els.sprintMenuSearch.focus());
}

function closeSprintMenu() {
  els.sprintMenu.hidden = true;
  els.sprintTitle.setAttribute("aria-expanded", "false");
}

function renderSprintMenuOptions() {
  const query = els.sprintMenuSearch.value.trim().toLocaleLowerCase("en");
  const iterations = newestIterations().filter(iteration => !query
    || iteration.name.toLocaleLowerCase("en").includes(query)
    || String(iteration.path || "").toLocaleLowerCase("en").includes(query)
    || iterationLabel(iteration).toLocaleLowerCase("en").includes(query));
  if (!iterations.length) {
    const empty = document.createElement("div");
    empty.className = "sprint-menu-empty";
    empty.textContent = "No sprints found.";
    els.sprintMenuOptions.replaceChildren(empty);
    return;
  }
  els.sprintMenuOptions.replaceChildren(...iterations.map(iteration => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sprint-menu-option";
    button.setAttribute("role", "option");
    const selected = iteration.id === state.iteration?.id;
    button.setAttribute("aria-selected", String(selected));
    button.disabled = selected;
    const content = document.createElement("span");
    content.className = "sprint-menu-option-content";
    const name = document.createElement("strong");
    name.textContent = iteration.name;
    const dates = document.createElement("small");
    const start = formatDate(iteration.attributes?.startDate);
    const end = formatDate(iteration.attributes?.finishDate);
    dates.textContent = start && end ? `${start} – ${end}` : iteration.path || "";
    content.append(name, dates);
    const label = document.createElement("span");
    label.className = `sprint-menu-label ${iterationLabel(iteration).toLowerCase().replace(/\s+/g, "-")}`;
    label.textContent = iterationLabel(iteration);
    const check = document.createElement("span");
    check.className = "sprint-menu-check";
    check.textContent = selected ? "✓" : "";
    button.append(content, label, check);
    if (!selected) button.addEventListener("click", () => selectOverviewIteration(iteration));
    return button;
  }));
}

async function selectOverviewIteration(iteration) {
  const previous = state.iteration;
  const previousSprintFilter = new Set(state.filters.sprint);
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team || iteration.id === previous?.id) return closeSprintMenu();
  closeSprintMenu();
  setLoading(true);
  clearNotice();
  state.filters.sprint.clear();
  state.iteration = iteration;
  try {
    await loadIterationStories(team, iteration);
    localStorage.setItem(STORAGE.iteration, iteration.id);
    render();
  } catch (error) {
    console.error(error);
    state.iteration = previous;
    state.filters.sprint = previousSprintFilter;
    render();
    showNotice(error.message || "The sprint could not be loaded.", "error", "Try again", () => selectOverviewIteration(iteration));
  } finally {
    setLoading(false);
  }
}

async function applySprintFilter() {
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team) return;
  const iterations = selectedSprintIterations();
  if (!iterations.length) {
    if (state.iteration) await loadIterationStories(team, state.iteration);
    return;
  }
  const groups = await Promise.all(iterations.map(iteration => fetchIterationStories(team, iteration)));
  const uniqueStories = new Map();
  groups.flat().forEach(story => uniqueStories.set(story.id, story));
  applyBoardStories([...uniqueStories.values()]);
}

async function showMainView(view) {
  const enteringForYou = view === "for-you" && state.currentView !== "for-you";
  state.currentView = view;
  const showForYou = view === "for-you";
  const showBacklog = view === "backlog";
  const showBoard = view === "board";
  els.listViews.forEach(element => { element.hidden = showForYou; });
  els.boardViews.forEach(element => { element.hidden = !showBoard; });
  els.backlogViews.forEach(element => { element.hidden = !showBacklog; });
  els.forYouViews.forEach(element => { element.hidden = !showForYou; });
  els.forYouNav.classList.toggle("is-active", showForYou);
  els.sprintBoardNav.classList.toggle("is-active", showBoard);
  els.backlogNav.classList.toggle("is-active", showBacklog);
  els.forYouNav.toggleAttribute("aria-current", showForYou);
  els.sprintBoardNav.toggleAttribute("aria-current", showBoard);
  els.backlogNav.toggleAttribute("aria-current", showBacklog);
  if (!showForYou) closeForYouPersonMenu();
  if (showForYou) {
    if (enteringForYou) {
      state.forYouSelectedUser = null;
      state.forYouUserKey = "";
      state.forYouExpanded = { work: false, mentions: false, activity: false };
    }
    await loadForYou();
    return;
  }
  if (showBacklog) {
    await loadBacklog();
    return;
  }
  if (state.filters.sprint.size) {
    setLoading(true);
    try { await applySprintFilter(); }
    catch (error) { console.error(error); showNotice(error.message || "The sprints could not be loaded.", "error"); }
    finally { setLoading(false); }
  }
  render();
}

async function queryWorkItemIds(query, top = 100) {
  const result = await azure(`/_apis/wit/wiql?$top=${top}&api-version=7.1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });
  return (result.workItems || []).map(item => item.id).filter(Boolean);
}

function wiqlText(value) {
  return String(value || "").replace(/'/g, "''");
}

function isFinishedWorkItem(item) {
  if (state.mapping[item.state] === "done") return true;
  return /^(closed|done|completed|removed|resolved)$/i.test(item.state.trim());
}

async function mapWithConcurrency(values, limit, mapper) {
  const results = new Array(values.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < values.length) {
      const index = nextIndex++;
      results[index] = await mapper(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return results;
}

function forYouTargetUser() {
  return state.forYouSelectedUser || state.authenticatedUser;
}

function forYouTargetKey(user = forYouTargetUser()) {
  return String(user?.id || user?.uniqueName || user?.displayName || "@me").toLocaleLowerCase("en");
}

function forYouIdentityQuery(user, isSelf) {
  if (isSelf) return "@Me";
  return `'${wiqlText(user?.uniqueName || user?.displayName)}'`;
}

async function loadForYou(force = false) {
  if (!state.projectName) {
    state.forYouProjectName = "";
    state.forYouWorkItems = [];
    state.forYouMentions = [];
    state.forYouActivity = [];
    state.forYouErrors = {};
    renderForYou();
    return;
  }
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const userKey = forYouTargetKey(user);
  if (!force && state.forYouProjectName === state.projectName && state.forYouUserKey === userKey) {
    renderForYou();
    return;
  }

  const requestToken = ++state.forYouRequestToken;
  state.forYouErrors = {};
  renderForYouLoading();
  els.refresh.disabled = true;
  els.refresh.classList.add("is-spinning");
  const sections = await Promise.allSettled([
    loadForYouWorkItems(user, isSelf),
    loadForYouMentions(user),
    loadForYouActivity(user, isSelf)
  ]);
  if (requestToken !== state.forYouRequestToken) return;
  const [work, mentions, activity] = sections;
  if (work.status === "fulfilled") state.forYouWorkItems = work.value;
  else {
    console.error(work.reason);
    state.forYouWorkItems = [];
    state.forYouErrors.work = work.reason?.message || "Work in progress could not be loaded.";
  }
  if (mentions.status === "fulfilled") state.forYouMentions = mentions.value;
  else {
    console.error(mentions.reason);
    state.forYouMentions = [];
    state.forYouErrors.mentions = mentions.reason?.message || "Mentions could not be loaded.";
  }
  if (activity.status === "fulfilled") state.forYouActivity = activity.value;
  else {
    console.error(activity.reason);
    state.forYouActivity = [];
    state.forYouErrors.activity = activity.reason?.message || "Activity could not be loaded.";
  }
  state.forYouProjectName = state.projectName;
  state.forYouUserKey = userKey;
  renderForYou();
  els.refresh.disabled = false;
  els.refresh.classList.remove("is-spinning");
}

async function loadForYouWorkItems(user, isSelf) {
  const identity = forYouIdentityQuery(user, isSelf);
  const ids = await queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.AssignedTo] = ${identity}
    ORDER BY [System.ChangedDate] DESC
  `, 100);
  const items = await fetchWorkItems(ids);
  return items.filter(item => !isFinishedWorkItem(item))
    .sort((a, b) => new Date(b.changedDate) - new Date(a.changedDate));
}

async function loadForYouMentions(user) {
  if (!user?.displayName) throw new Error("The selected user could not be identified for mentions.");
  const recentIdsPromise = queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
    ORDER BY [System.ChangedDate] DESC
  `, 100);
  const historyIdsPromise = queryWorkItemIds(`
    SELECT [System.Id]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.History] CONTAINS WORDS '${wiqlText(user.displayName)}'
    ORDER BY [System.ChangedDate] DESC
  `, 50).catch(error => {
    console.warn("Azure's history index could not be used to supplement mention candidates.", error);
    return [];
  });
  const [recentIds, historyIds] = await Promise.all([recentIdsPromise, historyIdsPromise]);
  const ids = [...new Set([...recentIds, ...historyIds])];
  const items = await fetchWorkItems(ids, { includeDescription: true });
  const mentionGroups = await mapWithConcurrency(items, 6, async item => {
    const mentions = [];
    if (htmlMentionsUser(item.descriptionHtml, user)) {
      mentions.push({
        item,
        mention: {
          author: item.changedBy || "Unknown user",
          authorId: item.changedById,
          authorUniqueName: item.changedByUniqueName,
          html: item.descriptionHtml,
          createdDate: item.changedDate,
          kind: "Description"
        }
      });
    }
    try {
      const result = await azure(`/_apis/wit/workItems/${item.id}/comments?$top=100&order=desc&$expand=renderedText&api-version=7.1-preview.4`);
      const comments = normalizeComments(result);
      state.commentsCache.set(item.id, comments);
      mentions.push(...comments
        .filter(comment => commentMentionsUser(comment, user))
        .map(comment => ({ item, mention: { ...comment, kind: "Comment" } })));
    } catch (error) {
      console.warn(`Comments for work item ${item.id} could not be checked for mentions.`, error);
    }
    return mentions;
  });
  return mentionGroups.flat()
    .sort((a, b) => new Date(b.mention.createdDate) - new Date(a.mention.createdDate));
}

async function loadForYouActivity(user, isSelf) {
  if (!user) {
    const ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] = @Me
      ORDER BY [System.ChangedDate] DESC
    `, 20);
    const items = await fetchWorkItems(ids);
    return items.map(item => ({
      item,
      entry: {
        id: `latest-${item.id}`,
        revision: "",
        author: item.changedBy || "You",
        date: item.changedDate,
        created: false,
        changes: []
      }
    })).sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date));
  }
  const identity = forYouIdentityQuery(user, isSelf);
  let ids;
  try {
    ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] EVER ${identity}
      ORDER BY [System.ChangedDate] DESC
    `, 25);
  } catch (error) {
    console.warn("The historical Changed By query was not supported; using the latest changes instead.", error);
    ids = await queryWorkItemIds(`
      SELECT [System.Id]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.ChangedBy] = ${identity}
      ORDER BY [System.ChangedDate] DESC
    `, 25);
  }
  const items = await fetchWorkItems(ids);
  const activityGroups = await mapWithConcurrency(items, 5, async item => {
    const result = await azure(`/_apis/wit/workItems/${item.id}/updates?api-version=7.1`);
    const history = normalizeHistory(result);
    state.historyCache.set(item.id, history);
    return (result.value || []).filter(update => identityMatches(update.revisedBy, user))
      .map(update => ({ item, entry: normalizeHistoryUpdate(update) }));
  });
  return activityGroups.flat()
    .sort((a, b) => new Date(b.entry.date) - new Date(a.entry.date))
    .slice(0, 20);
}

function identityMatches(identity, user) {
  if (!identity || !user) return false;
  const normalized = value => String(value || "").trim().toLocaleLowerCase("en");
  if (identity.id && user.id && normalized(identity.id) === normalized(user.id)) return true;
  const identityNames = [identity.uniqueName, identity.displayName].map(normalized).filter(Boolean);
  const userNames = [user.uniqueName, user.displayName].map(normalized).filter(Boolean);
  return identityNames.some(name => userNames.includes(name));
}

function commentMentionsUser(comment, user) {
  return htmlMentionsUser(comment.html, user);
}

function htmlMentionsUser(html, user) {
  const source = String(html || "");
  const sourceKey = source.toLocaleLowerCase("en");
  const textKey = htmlToText(source).toLocaleLowerCase("en");
  const idKeys = [user.id, user.uniqueName].map(value => String(value || "").toLocaleLowerCase("en")).filter(Boolean);
  if (sourceKey.includes("data-vss-mention") && idKeys.some(value => sourceKey.includes(value))) return true;
  const displayName = String(user.displayName || "").trim().toLocaleLowerCase("en");
  return Boolean(displayName && (textKey.includes(`@${displayName}`)
    || (sourceKey.includes("data-vss-mention") && sourceKey.includes(displayName))));
}

function forYouUserChoices() {
  const choices = [];
  choices.push(state.authenticatedUser
    ? { ...state.authenticatedUser, isSelf: true }
    : { id: "", displayName: "You", uniqueName: "", isSelf: true });
  const members = state.teamMembers.length
    ? state.teamMembers
    : [...state.stories, ...state.backlogItems].filter(item => item.assignee).map(item => ({
      id: "",
      name: item.assignee,
      uniqueName: item.assigneeUniqueName || item.assignee
    }));
  members.forEach(member => choices.push({
    id: member.id,
    displayName: member.name,
    uniqueName: member.uniqueName,
    isSelf: identityMatches(member, state.authenticatedUser)
  }));
  const unique = new Map();
  choices.forEach(choice => {
    const key = forYouTargetKey(choice);
    if (!unique.has(key) || choice.isSelf) unique.set(key, choice);
  });
  return [...unique.values()].sort((a, b) => {
    if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
    return a.displayName.localeCompare(b.displayName, "en", { sensitivity: "base" });
  });
}

function renderForYouIdentity() {
  const team = state.teams.find(value => value.id === state.teamId);
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const displayName = user?.displayName || "You";
  els.forYouTitle.textContent = isSelf ? "For you" : `For ${displayName}`;
  els.forYouPersonName.textContent = displayName;
  els.forYouPerson.setAttribute("aria-label", `Choose a team member. Currently ${displayName}.`);
  els.forYouTeamName.textContent = team?.name || state.projectName || "Team";
  els.forYouWorkDescription.textContent = isSelf
    ? "Open work items assigned to you."
    : `Open work items assigned to ${displayName}.`;
  els.forYouMentionsDescription.textContent = isSelf
    ? "Recent mentions of you in comments and descriptions."
    : `Recent mentions of ${displayName} in comments and descriptions.`;
  els.forYouActivityDescription.textContent = isSelf
    ? "Your latest changes across work items."
    : `${displayName}'s latest changes across work items.`;
}

function renderForYouPersonOptions() {
  const query = els.forYouPersonSearch.value.trim().toLocaleLowerCase("en");
  const selected = forYouTargetUser();
  const choices = forYouUserChoices().filter(choice => !query
    || choice.displayName.toLocaleLowerCase("en").includes(query)
    || choice.uniqueName.toLocaleLowerCase("en").includes(query));
  if (!choices.length) {
    const empty = document.createElement("div");
    empty.className = "for-you-person-empty";
    empty.textContent = "No team members found.";
    els.forYouPersonOptions.replaceChildren(empty);
    return;
  }
  els.forYouPersonOptions.replaceChildren(...choices.map(choice => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "for-you-person-option";
    option.setAttribute("role", "option");
    const selectedChoice = choice.isSelf
      ? !state.forYouSelectedUser
      : Boolean(state.forYouSelectedUser && identityMatches(choice, selected));
    option.setAttribute("aria-selected", String(selectedChoice));
    option.disabled = selectedChoice;
    const avatar = document.createElement("span");
    avatar.className = "for-you-person-avatar";
    avatar.textContent = initialsFor(choice.displayName);
    const label = document.createElement("span");
    label.className = "for-you-person-label";
    const name = document.createElement("strong");
    name.textContent = choice.displayName;
    const detail = document.createElement("small");
    detail.textContent = choice.isSelf ? "You" : choice.uniqueName;
    label.append(name, detail);
    const check = document.createElement("span");
    check.className = "for-you-person-check";
    check.textContent = selectedChoice ? "✓" : "";
    option.append(avatar, label, check);
    option.addEventListener("click", () => selectForYouUser(choice));
    return option;
  }));
}

function toggleForYouPersonMenu(force) {
  const open = force ?? els.forYouPersonMenu.hidden;
  els.forYouPersonMenu.hidden = !open;
  els.forYouPerson.setAttribute("aria-expanded", String(open));
  if (!open) {
    els.forYouPersonSearch.value = "";
    return;
  }
  renderForYouPersonOptions();
  requestAnimationFrame(() => els.forYouPersonSearch.focus());
}

function closeForYouPersonMenu() {
  toggleForYouPersonMenu(false);
}

async function selectForYouUser(choice) {
  state.forYouSelectedUser = choice.isSelf ? null : {
    id: choice.id || "",
    displayName: choice.displayName,
    uniqueName: choice.uniqueName || choice.displayName
  };
  state.forYouUserKey = "";
  state.forYouExpanded = { work: false, mentions: false, activity: false };
  closeForYouPersonMenu();
  renderForYouIdentity();
  await loadForYou(true);
}

function renderForYouLoading() {
  renderForYouIdentity();
  for (const [count, status, list, showAll] of [
    [els.forYouWorkCount, els.forYouWorkStatus, els.forYouWorkList, els.forYouWorkShowAll],
    [els.forYouMentionsCount, els.forYouMentionsStatus, els.forYouMentionsList, els.forYouMentionsShowAll],
    [els.forYouActivityCount, els.forYouActivityStatus, els.forYouActivityList, els.forYouActivityShowAll]
  ]) {
    count.textContent = "—";
    status.textContent = "";
    status.classList.remove("is-error");
    showAll.hidden = true;
    list.replaceChildren(...Array.from({ length: 3 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "for-you-skeleton";
      return skeleton;
    }));
  }
}

function renderForYou() {
  const user = forYouTargetUser();
  const isSelf = !state.forYouSelectedUser;
  const displayName = user?.displayName || "the selected user";
  renderForYouIdentity();
  renderForYouSection("work", state.forYouWorkItems, createForYouWorkItem,
    isSelf ? "No open work items are assigned to you." : `No open work items are assigned to ${displayName}.`);
  renderForYouSection("mentions", state.forYouMentions, createForYouMention,
    isSelf ? "No recent mentions need a reply." : `No recent mentions of ${displayName} were found.`);
  renderForYouSection("activity", state.forYouActivity, createForYouActivity,
    isSelf ? "No recent activity was found." : `No recent activity by ${displayName} was found.`);
}

function renderForYouSection(kind, items, renderer, emptyMessage) {
  const title = kind[0].toUpperCase() + kind.slice(1);
  const count = els[`forYou${title}Count`];
  const status = els[`forYou${title}Status`];
  const list = els[`forYou${title}List`];
  const showAll = els[`forYou${title}ShowAll`];
  const error = state.forYouErrors[kind] || "";
  const expanded = state.forYouExpanded[kind];
  const visibleItems = expanded ? items : items.slice(0, 5);
  count.textContent = String(items.length);
  status.classList.toggle("is-error", Boolean(error));
  status.textContent = error || (!items.length ? emptyMessage : "");
  list.replaceChildren(...visibleItems.map(renderer));
  showAll.hidden = items.length <= 5;
  showAll.textContent = expanded ? "Show less" : "Show all";
  showAll.setAttribute("aria-expanded", String(expanded));
  showAll.setAttribute("aria-controls", list.id);
}

function toggleForYouSection(kind) {
  state.forYouExpanded[kind] = !state.forYouExpanded[kind];
  renderForYou();
  if (!state.forYouExpanded[kind]) {
    const title = kind[0].toUpperCase() + kind.slice(1);
    els[`forYou${title}ShowAll`].scrollIntoView({ block: "nearest" });
  }
}

function forYouLeadingIcon(item) {
  const icon = document.createElement("span");
  icon.className = `for-you-type-icon ${item.type.toLocaleLowerCase("en") === "bug" ? "is-bug" : ""}`;
  icon.textContent = item.type.toLocaleLowerCase("en") === "bug" ? "!" : "◆";
  return icon;
}

function createForYouItem(item, leading, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "for-you-item";
  button.setAttribute("aria-label", ariaLabel);
  const body = document.createElement("span");
  body.className = "for-you-item-body";
  const title = document.createElement("span");
  title.className = "for-you-item-title";
  title.textContent = item.title;
  body.append(title);
  button.append(leading, body);
  button.addEventListener("click", () => showWorkItem(item));
  return { button, body };
}

function createForYouWorkItem(item) {
  const { button, body } = createForYouItem(item, forYouLeadingIcon(item), `${item.type} ${workItemKey(item.id)}: ${item.title}`);
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${workItemKey(item.id)} · ${item.iterationName}`;
  body.append(meta);
  const itemState = document.createElement("span");
  itemState.className = "card-state";
  itemState.dataset.stateTone = stateTone(item.state);
  itemState.textContent = item.state;
  button.append(itemState);
  return button;
}

function createForYouMention(mention) {
  const avatar = document.createElement("span");
  avatar.className = "for-you-avatar";
  avatar.textContent = initialsFor(mention.mention.author);
  const { button, body } = createForYouItem(mention.item, avatar, `Mention by ${mention.mention.author} on ${workItemKey(mention.item.id)}: ${mention.item.title}`);
  const excerpt = document.createElement("span");
  excerpt.className = "for-you-item-excerpt";
  excerpt.textContent = htmlToText(mention.mention.html) || `Mentioned you in the ${mention.mention.kind.toLocaleLowerCase("en")}.`;
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${mention.mention.author} · ${mention.mention.kind} · ${workItemKey(mention.item.id)} · ${formatDateTime(mention.mention.createdDate)}`;
  body.append(excerpt, meta);
  return button;
}

function createForYouActivity(activity) {
  const symbol = document.createElement("span");
  symbol.className = "for-you-activity-symbol";
  symbol.textContent = "↺";
  const { button, body } = createForYouItem(activity.item, symbol, `Your activity on ${workItemKey(activity.item.id)}: ${activity.item.title}`);
  const excerpt = document.createElement("span");
  excerpt.className = "for-you-item-excerpt";
  excerpt.textContent = activitySummary(activity.entry);
  const meta = document.createElement("span");
  meta.className = "for-you-item-meta";
  meta.textContent = `${workItemKey(activity.item.id)} · ${formatDateTime(activity.entry.date)}`;
  body.append(excerpt, meta);
  return button;
}

function activitySummary(entry) {
  if (entry.created) return "Created this work item.";
  const fields = [...new Set(entry.changes.map(change => change.label))];
  if (!fields.length) return "Updated this work item.";
  return `Updated ${fields.slice(0, 3).join(", ")}${fields.length > 3 ? ` and ${fields.length - 3} more` : ""}.`;
}

async function loadBacklog(force = false) {
  const team = state.teams.find(value => value.id === state.teamId);
  if (!team) {
    els.backlogMeta.textContent = "Connect Azure DevOps to load the backlog.";
    els.backlogContent.replaceChildren();
    return;
  }
  if (!force && state.backlogTeamId === team.id) return renderBacklog();
  els.backlogMeta.textContent = `${team.name} · Loading backlog…`;
  renderBacklogLoading();
  els.refresh.disabled = true;
  els.refresh.classList.add("is-spinning");
  try {
    const teamSegment = encodeURIComponent(team.name);
    const levels = await azure(`/${teamSegment}/_apis/work/backlogs?api-version=7.1`);
    const backlog = (levels.value || []).find(level => level.type === "requirement" && !level.isHidden)
      || (levels.value || []).find(level => /requirement/i.test(level.id || ""))
      || (levels.value || []).find(level => !level.isHidden && level.type !== "task");
    if (!backlog) throw new Error("No requirement backlog was found for this team.");
    const result = await azure(`/${teamSegment}/_apis/work/backlogs/${encodeURIComponent(backlog.id)}/workItems?api-version=7.1`);
    const ids = (result.workItems || []).map(link => link.target?.id).filter(Boolean);
    const itemsById = new Map();
    for (let index = 0; index < ids.length; index += 200) {
      const chunk = ids.slice(index, index + 200);
      const fields = [
        "System.Id", "System.Title", "System.State", "System.WorkItemType", "System.AssignedTo",
        "System.IterationPath", "System.AreaPath", "System.Tags", "System.Parent",
        "Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"
      ].join(",");
      const batch = await azure(`/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&errorPolicy=Omit&api-version=7.1`);
      (batch.value || []).forEach(workItem => itemsById.set(workItem.id, normalizeWorkItem(workItem)));
    }
    state.backlogItems = ids.map(id => itemsById.get(id)).filter(Boolean);
    await loadParentDetails(state.backlogItems);
    pruneFilters(state.backlogItems);
    state.backlogTeamId = team.id;
    renderBacklog();
  } catch (error) {
    console.error(error);
    els.backlogMeta.textContent = `${team.name} · The backlog could not be loaded`;
    const message = document.createElement("div");
    message.className = "backlog-error";
    message.textContent = error.message || "The backlog could not be loaded.";
    els.backlogContent.replaceChildren(message);
  } finally {
    els.refresh.disabled = false;
    els.refresh.classList.remove("is-spinning");
  }
}

function renderBacklogLoading() {
  els.backlogContent.replaceChildren(...Array.from({ length: 3 }, () => {
    const section = document.createElement("div");
    section.className = "backlog-skeleton";
    return section;
  }));
}

function renderBacklog() {
  const team = state.teams.find(value => value.id === state.teamId);
  const visibleItems = state.backlogItems.filter(item => matchesFilters(item));
  els.backlogMeta.textContent = `${team?.name || "Team"} · ${visibleItems.length}${visibleItems.length !== state.backlogItems.length ? ` of ${state.backlogItems.length}` : ""} items`;
  renderFilters();
  const assignedIds = new Set();
  const sections = [];
  chronologicalIterations().forEach(iteration => {
    const path = String(iteration.path || "").toLocaleLowerCase("en");
    const items = visibleItems.filter(item => path && item.iterationPath.toLocaleLowerCase("en") === path);
    if (!items.length) return;
    items.forEach(item => assignedIds.add(item.id));
    sections.push(createBacklogSection(iteration.name, items, iterationLabel(iteration)));
  });
  const remaining = visibleItems.filter(item => !assignedIds.has(item.id));
  sections.push(createBacklogSection("Other", remaining, "Backlog"));
  els.backlogContent.replaceChildren(...sections);
}

function createBacklogSection(title, items, label) {
  const section = document.createElement("section");
  section.className = "backlog-group";
  const header = document.createElement("header");
  const heading = document.createElement("h2");
  heading.textContent = title;
  const badge = document.createElement("span");
  badge.className = "backlog-group-label";
  badge.textContent = label;
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = String(items.length);
  header.append(heading, badge, count);
  const wrapper = document.createElement("div");
  wrapper.className = "backlog-table-wrap";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "backlog-empty";
    empty.textContent = "No items.";
    wrapper.append(empty);
  } else {
    const table = document.createElement("table");
    table.className = "backlog-table";
    table.innerHTML = "<thead><tr><th>Type</th><th>Key</th><th>Summary</th><th>State</th><th>Priority</th><th>Points</th><th>Assigned to</th></tr></thead>";
    const body = document.createElement("tbody");
    items.forEach(item => body.append(createBacklogRow(item)));
    table.append(body);
    wrapper.append(table);
  }
  section.append(header, wrapper);
  return section;
}

function createBacklogRow(item) {
  const row = document.createElement("tr");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  row.setAttribute("aria-label", `${item.type} ${workItemKey(item.id)}: ${item.title}`);
  const type = document.createElement("td");
  const typeBadge = document.createElement("span");
  typeBadge.className = `backlog-type ${item.type.toLowerCase() === "bug" ? "is-bug" : ""}`;
  typeBadge.textContent = item.type;
  type.append(typeBadge);
  const key = document.createElement("td");
  key.className = "backlog-key";
  key.textContent = workItemKey(item.id);
  const summary = document.createElement("td");
  summary.className = "backlog-summary";
  summary.textContent = item.title;
  const itemState = document.createElement("td");
  const stateBadge = document.createElement("span");
  stateBadge.className = "card-state";
  stateBadge.dataset.stateTone = stateTone(item.state);
  stateBadge.textContent = item.state;
  itemState.append(stateBadge);
  const priority = document.createElement("td");
  priority.textContent = item.priority ?? "—";
  const points = document.createElement("td");
  points.textContent = item.points ?? "—";
  const assignee = document.createElement("td");
  assignee.textContent = item.assignee || "Unassigned";
  row.append(type, key, summary, itemState, priority, points, assignee);
  row.addEventListener("click", () => showWorkItem(item));
  row.addEventListener("keydown", event => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    showWorkItem(item);
  });
  return row;
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

function activeFilterItems() {
  return state.currentView === "backlog" ? state.backlogItems : state.stories;
}

function getFilterOptions(definition, items = activeFilterItems()) {
  if (definition.key === "sprint") return [...new Set(newestIterations().map(iteration => iteration.name))];
  const values = new Set();
  for (const item of items) {
    if (state.currentView !== "backlog" && state.mapping[item.state] === "hidden") continue;
    const itemValues = definition.values ? definition.values(item) : [definition.value(item)];
    itemValues.forEach(value => { if (value) values.add(value); });
  }
  if (definition.key === "tag" && state.filters.tag.size && !values.size) return [...state.filters.tag];
  return [...values].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));
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
  const items = activeFilterItems();
  const availableItems = state.currentView === "backlog" ? items : items.filter(item => state.mapping[item.state] !== "hidden");
  const query = state.currentView === "backlog" ? "" : state.search.trim().toLowerCase();
  const visibleItems = availableItems.filter(item => matchesFilters(item, query));
  els.filterResultCount.textContent = chips.length || query ? `${visibleItems.length} of ${availableItems.length}` : `${availableItems.length} items`;
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
    empty.textContent = "No options available";
    dropdown.append(empty);
  } else {
    for (const option of options) {
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.filters[definition.key].has(option);
      input.addEventListener("change", async () => {
        const previousValues = new Set(state.filters[definition.key]);
        if (input.checked) state.filters[definition.key].add(option);
        else state.filters[definition.key].delete(option);
        if (definition.key === "sprint" && state.currentView !== "backlog") {
          setLoading(true);
          clearNotice();
          try {
            await applySprintFilter();
          } catch (error) {
            console.error(error);
            state.filters.sprint = previousValues;
            showNotice(error.message || "The sprints could not be loaded.", "error");
          } finally {
            setLoading(false);
          }
        }
        renderCurrentView();
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
  chip.setAttribute("aria-label", `Remove filter ${definition.label}: ${value}`);
  chip.innerHTML = `<span>${escapeHtml(definition.label)}:</span> ${escapeHtml(value)} <b aria-hidden="true">×</b>`;
  chip.addEventListener("click", async () => {
    state.filters[definition.key].delete(value);
    if (definition.key === "sprint" && state.currentView !== "backlog") {
      setLoading(true);
      clearNotice();
      try { await applySprintFilter(); }
      catch (error) {
        console.error(error);
        state.filters.sprint.add(value);
        showNotice(error.message || "The sprints could not be loaded.", "error");
      } finally { setLoading(false); }
    }
    renderCurrentView();
  });
  return chip;
}

function pruneFilters(items = activeFilterItems()) {
  for (const definition of FILTER_DEFINITIONS) {
    const available = new Set(getFilterOptions(definition, items));
    for (const value of state.filters[definition.key]) if (!available.has(value)) state.filters[definition.key].delete(value);
  }
}

function renderCurrentView() {
  if (state.currentView === "for-you") renderForYou();
  else if (state.currentView === "backlog") renderBacklog();
  else render();
}

function createCard(item) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "story-card";
  card.setAttribute("aria-label", `${item.type} ${item.id}: ${item.title}. View details`);
  card.addEventListener("click", () => showWorkItem(item));
  const initials = item.assignee ? item.assignee.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase() : "?";
  const isBug = item.type.toLowerCase() === "bug";
  card.innerHTML = `
    <div class="card-topline">
      <span class="work-type"><span class="type-icon ${isBug ? "bug" : ""}">${isBug ? "!" : "◆"}</span>${escapeHtml(item.type)}</span>
      <span class="card-state" data-state-tone="${stateTone(item.state)}">${escapeHtml(item.state)}</span>
    </div>
    <h3>${escapeHtml(item.title)}</h3>
    <div class="card-footer">
      <span class="story-id">${escapeHtml(workItemKey(item.id))}</span>
      ${item.points !== null ? `<span class="points" title="Story points">${escapeHtml(String(item.points))}</span>` : ""}
      <span class="assignee ${item.assignee ? "" : "unassigned"}" title="${escapeHtml(item.assignee || "Unassigned")}">${initials}</span>
    </div>`;
  return card;
}

async function showWorkItem(item) {
  state.selectedItemId = item.id;
  state.selectedItem = item;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  resetDescriptionEditor();
  resetWorkItemTitleEditor();
  resetCommentComposer();
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
  if (!els.workItemDialog.open) {
    els.workItemDialog.showModal();
    els.workItemDialog.focus({ preventScroll: true });
  }

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
  const requestToken = (state.detailsRequestTokens.get(item.id) || 0) + 1;
  state.detailsRequestTokens.set(item.id, requestToken);
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?$expand=relations&api-version=7.1`);
    if (state.detailsRequestTokens.get(item.id) !== requestToken) return;
    const detail = normalizeWorkItemDetail(result);
    state.detailsCache.set(item.id, detail);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, detail, false);
  } catch (error) {
    if (state.detailsRequestTokens.get(item.id) !== requestToken) return;
    console.error(error);
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, null, false, "Additional details could not be loaded.");
  }
}

async function loadWorkItemComments(item) {
  const requestToken = (state.commentsRequestTokens.get(item.id) || 0) + 1;
  state.commentsRequestTokens.set(item.id, requestToken);
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/comments?$top=100&order=desc&$expand=renderedText&api-version=7.1-preview.4`);
    if (state.commentsRequestTokens.get(item.id) !== requestToken) return;
    const comments = normalizeComments(result);
    state.commentsCache.set(item.id, comments);
    state.commentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderComments(comments, false);
      renderCombinedActivity();
    }
  } catch (error) {
    if (state.commentsRequestTokens.get(item.id) !== requestToken) return;
    console.error(error);
    state.commentsErrors.set(item.id, "Comments could not be loaded.");
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
    state.historyErrors.set(item.id, "History could not be loaded.");
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
  const storyPoints = fields["Microsoft.VSTS.Scheduling.StoryPoints"];
  const effort = fields["Microsoft.VSTS.Scheduling.Effort"];
  return {
    descriptionHtml: fields["System.Description"] || "",
    assignee: assigned?.displayName || assigned?.uniqueName || "",
    assigneeUniqueName: assigned?.uniqueName || assigned?.displayName || "",
    assigneeId: assigned?.id || "",
    reporter: reporter?.displayName || reporter?.uniqueName || "",
    priority: fields["Microsoft.VSTS.Common.Priority"] ?? null,
    points: storyPoints ?? effort ?? null,
    pointsField: storyPoints !== undefined ? "Microsoft.VSTS.Scheduling.StoryPoints"
      : effort !== undefined ? "Microsoft.VSTS.Scheduling.Effort" : "",
    area: fields["System.AreaPath"] || "",
    iteration: fields["System.IterationPath"] || "",
    reason: fields["System.Reason"] || "",
    tags: String(fields["System.Tags"] || "").split(";").map(tag => tag.trim()).filter(Boolean),
    changedDate: fields["System.ChangedDate"] || ""
  };
}

function normalizeComments(result) {
  const comments = result.comments || result.value || [];
  return comments.filter(comment => !comment.isDeleted).map(normalizeComment);
}

function normalizeComment(comment) {
  return {
    id: comment.commentId ?? comment.id,
    author: comment.createdBy?.displayName || comment.createdBy?.uniqueName || "Unknown user",
    authorId: comment.createdBy?.id || "",
    authorUniqueName: comment.createdBy?.uniqueName || "",
    html: comment.renderedText || comment.text || "",
    createdDate: comment.createdDate || "",
    modifiedDate: comment.modifiedDate || ""
  };
}

function normalizeHistory(result) {
  return (result.value || []).map(normalizeHistoryUpdate)
    .filter(entry => entry.created || entry.changes.length)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function normalizeHistoryUpdate(update) {
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
    author: update.revisedBy?.displayName || update.revisedBy?.uniqueName || "Unknown user",
    authorId: update.revisedBy?.id || "",
    authorUniqueName: update.revisedBy?.uniqueName || "",
    date: historyDateFor(update),
    created: update.rev === 1,
    changes
  };
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
  if (typeof value === "object") return value.displayName || value.uniqueName || "Updated";
  const rawText = String(value).trim();
  const text = /<[a-z][\s\S]*>/i.test(rawText) ? htmlToText(rawText) : rawText;
  return text.length > 90 ? `${text.slice(0, 87)}…` : text;
}

function humanizeField(value) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[._-]+/g, " ");
}

function renderWorkItemDetail(item, detail, loading = false, error = "") {
  const { webBase } = activeAzureContext();
  els.workItemType.textContent = item.type;
  els.workItemKey.textContent = workItemKey(item.id);
  els.workItemTitle.textContent = item.title;
  els.workItemState.textContent = item.state;
  els.workItemState.dataset.stateTone = stateTone(item.state);
  els.workItemState.setAttribute("aria-label", `State ${item.state}. Click to change.`);
  els.workItemReason.textContent = detail?.reason || "";
  els.workItemReason.hidden = !detail?.reason;
  setRichContent(els.workItemDescription, detail?.descriptionHtml, loading ? "Loading description…" : "No description added.");
  els.descriptionEditButton.disabled = loading;
  els.workItemAssignee.textContent = detail?.assignee || item.assignee || "Unassigned";
  els.workItemAssignee.setAttribute("aria-label", `Assigned to ${detail?.assignee || item.assignee || "Unassigned"}. Click to change.`);
  els.workItemReporter.textContent = detail?.reporter || "—";
  els.workItemPriority.textContent = detail?.priority ?? "—";
  els.workItemPoints.textContent = detail?.points ?? item.points ?? "—";
  els.workItemArea.textContent = detail?.area || item.area || "—";
  els.workItemIteration.textContent = detail?.iteration || state.iteration?.name || "—";
  els.workItemPriority.setAttribute("aria-label", `Priority ${detail?.priority ?? "not set"}. Click to change.`);
  els.workItemPoints.setAttribute("aria-label", `Story points ${detail?.points ?? item.points ?? "not set"}. Click to change.`);
  els.workItemArea.setAttribute("aria-label", `Area ${detail?.area || item.area || "not set"}. Click to change.`);
  els.workItemIteration.setAttribute("aria-label", `Sprint ${detail?.iteration || state.iteration?.name || "not set"}. Click to change.`);
  els.workItemParent.textContent = item.featureLabel || "No parent";
  renderDetailTags(detail?.tags || item.tags);
  els.workItemTags.setAttribute("aria-label", `Tags: ${(detail?.tags || item.tags || []).join(", ") || "none"}. Click to change.`);
  els.workItemChanged.textContent = detail?.changedDate ? formatDateTime(detail.changedDate) : "—";
  els.workItemLoading.classList.toggle("is-active", loading);
  els.workItemLoadStatus.textContent = error || (loading ? "Loading additional details…" : "");
  els.workItemLoadStatus.classList.toggle("is-error", Boolean(error));
  els.openInAzure.href = `${webBase}/_workitems/edit/${item.id}`;
}

function assigneeChoices(item) {
  const choices = state.teamMembers.length
    ? [...state.teamMembers]
    : state.stories.filter(story => story.assignee).map(story => ({ name: story.assignee, uniqueName: story.assigneeUniqueName || story.assignee }));
  const detail = state.detailsCache.get(item.id);
  const currentName = detail?.assignee || item.assignee || "";
  if (currentName && !choices.some(choice => choice.name === currentName || choice.uniqueName === currentName)) {
    choices.push({ name: currentName, uniqueName: detail?.assigneeUniqueName || item.assigneeUniqueName || currentName });
  }
  const seen = new Set();
  return choices.filter(choice => {
    const key = String(choice.uniqueName || choice.name).trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, "en"));
}

function toggleWorkItemAssigneeMenu() {
  if (!els.workItemAssigneeMenu.hidden) return closeWorkItemAssigneeMenu();
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemStateMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemAssigneeMenu.hidden = false;
  els.workItemAssignee.setAttribute("aria-expanded", "true");
  els.workItemAssigneeSearch.value = "";
  els.workItemAssigneeSource.textContent = state.teamMembers.length ? "Team members" : "Users in this sprint";
  renderWorkItemAssigneeOptions(item);
  requestAnimationFrame(() => els.workItemAssigneeSearch.focus());
}

function renderWorkItemAssigneeOptions(item) {
  const detail = state.detailsCache.get(item.id);
  const currentName = detail?.assignee || item.assignee || "";
  const query = els.workItemAssigneeSearch.value.trim().toLocaleLowerCase("en");
  const choices = assigneeChoices(item).filter(choice => !query
    || choice.name.toLocaleLowerCase("en").includes(query)
    || choice.uniqueName.toLocaleLowerCase("en").includes(query));
  const options = [];
  if (!query || "unassigned".includes(query)) {
    options.push(createAssigneeOption(item, null, currentName === ""));
  }
  options.push(...choices.map(choice => createAssigneeOption(item, choice, choice.name === currentName || choice.uniqueName === currentName)));
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "issue-assignee-empty";
    empty.textContent = "No users found.";
    options.push(empty);
  }
  els.workItemAssigneeOptions.replaceChildren(...options);
}

function createAssigneeOption(item, choice, selected) {
  const name = choice?.name || "Unassigned";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-assignee-option";
  button.setAttribute("role", "option");
  button.setAttribute("aria-selected", String(selected));
  button.disabled = selected;
  const avatar = document.createElement("span");
  avatar.className = `issue-assignee-avatar${choice ? "" : " is-unassigned"}`;
  avatar.textContent = choice ? initialsFor(name) : "×";
  const label = document.createElement("span");
  label.className = "issue-assignee-label";
  const primary = document.createElement("strong");
  primary.textContent = name;
  label.append(primary);
  if (choice?.uniqueName && choice.uniqueName !== choice.name) {
    const secondary = document.createElement("small");
    secondary.textContent = choice.uniqueName;
    label.append(secondary);
  }
  const check = document.createElement("span");
  check.className = "issue-assignee-check";
  check.textContent = selected ? "✓" : "";
  button.append(avatar, label, check);
  if (!selected) button.addEventListener("click", () => changeWorkItemAssignee(item, choice));
  return button;
}

function initialsFor(name) {
  return String(name || "?").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
}

function closeWorkItemAssigneeMenu() {
  els.workItemAssigneeMenu.hidden = true;
  els.workItemAssignee.setAttribute("aria-expanded", "false");
}

async function changeWorkItemAssignee(item, choice) {
  closeWorkItemAssigneeMenu();
  const nextName = choice?.name || "Unassigned";
  els.workItemAssignee.disabled = true;
  els.workItemAssignee.classList.add("is-saving");
  els.workItemLoadStatus.textContent = `Changing assignee to ${nextName}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    const operation = choice
      ? { op: "add", path: "/fields/System.AssignedTo", value: choice.uniqueName }
      : { op: "add", path: "/fields/System.AssignedTo", value: "" };
    const result = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([operation])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const assigned = result.fields?.["System.AssignedTo"];
    item.assignee = assigned?.displayName || assigned?.uniqueName || "";
    item.assigneeUniqueName = assigned?.uniqueName || assigned?.displayName || "";
    item.assigneeId = assigned?.id || "";
    let detail = state.detailsCache.get(item.id);
    if (!detail) {
      detail = normalizeWorkItemDetail(result);
      state.detailsCache.set(item.id, detail);
    }
    if (detail) {
      detail.assignee = item.assignee;
      detail.assigneeUniqueName = item.assigneeUniqueName;
      detail.assigneeId = item.assigneeId;
      detail.changedDate = result.fields?.["System.ChangedDate"] || detail.changedDate;
    }
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = `Assignee changed to ${item.assignee || "Unassigned"}.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "The assignee could not be changed. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The assignee could not be changed.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemAssignee.disabled = false;
    els.workItemAssignee.classList.remove("is-saving");
  }
}

function stateTone(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return STATE_TONES[normalized] || "neutral";
}

async function toggleWorkItemStateMenu() {
  if (!els.workItemStateMenu.hidden) {
    closeWorkItemStateMenu();
    return;
  }
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemStateMenu.hidden = false;
  els.workItemState.setAttribute("aria-expanded", "true");
  const loading = document.createElement("div");
  loading.className = "issue-state-menu-message";
  loading.textContent = "Loading states…";
  els.workItemStateOptions.replaceChildren(loading);
  try {
    let pending = state.workItemTypeStatesCache.get(item.type);
    if (!pending) {
      pending = azure(`/_apis/wit/workitemtypes/${encodeURIComponent(item.type)}/states?api-version=7.1`)
        .then(result => result.value || []);
      state.workItemTypeStatesCache.set(item.type, pending);
      pending.catch(() => state.workItemTypeStatesCache.delete(item.type));
    }
    const options = await pending;
    if (state.selectedItemId === item.id && !els.workItemStateMenu.hidden) renderWorkItemStateOptions(item, options);
  } catch (error) {
    console.error(error);
    const message = document.createElement("div");
    message.className = "issue-state-menu-message is-error";
    message.textContent = "States could not be loaded.";
    els.workItemStateOptions.replaceChildren(message);
  }
}

function renderWorkItemStateOptions(item, options) {
  const states = options.length ? options : [{ name: item.state, color: "0052cc" }];
  els.workItemStateOptions.replaceChildren(...states.map(option => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-state-option";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(option.name === item.state));
    button.disabled = option.name === item.state;
    const dot = document.createElement("span");
    dot.className = "issue-state-dot";
    dot.style.backgroundColor = /^[0-9a-f]{6}$/i.test(option.color || "") ? `#${option.color}` : "#6b778c";
    const label = document.createElement("span");
    label.textContent = option.name;
    const check = document.createElement("span");
    check.className = "issue-state-check";
    check.textContent = option.name === item.state ? "✓" : "";
    button.append(dot, label, check);
    if (!button.disabled) button.addEventListener("click", () => changeWorkItemState(item, option.name));
    return button;
  }));
}

function closeWorkItemStateMenu() {
  els.workItemStateMenu.hidden = true;
  els.workItemState.setAttribute("aria-expanded", "false");
}

async function changeWorkItemState(item, nextState) {
  if (!nextState || nextState === item.state) return closeWorkItemStateMenu();
  closeWorkItemStateMenu();
  els.workItemState.disabled = true;
  els.workItemState.classList.add("is-saving");
  els.workItemLoadStatus.textContent = `Changing state to ${nextState}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    const result = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: "/fields/System.State", value: nextState }])
    });
    const fields = result.fields || {};
    item.state = fields["System.State"] || nextState;
    state.knownStates.add(item.state);
    if (!state.mapping[item.state]) addSmartMappings();
    const detail = state.detailsCache.get(item.id);
    if (detail) {
      detail.reason = fields["System.Reason"] || detail.reason;
      detail.changedDate = fields["System.ChangedDate"] || detail.changedDate;
    }
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = `State changed to ${item.state}.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "The state could not be changed. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The state could not be changed.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemState.disabled = false;
    els.workItemState.classList.remove("is-saving");
  }
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

function workItemTagsFor(item) {
  return [...(state.detailsCache.get(item.id)?.tags || item.tags || [])];
}

function sprintTagChoices() {
  const tags = state.stories.flatMap(story => story.tags || []);
  return [...new Set(tags.map(tag => tag.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "en"));
}

function toggleWorkItemTagsMenu() {
  if (!els.workItemTagsMenu.hidden) return closeWorkItemTagsMenu();
  const item = selectedWorkItem();
  if (!item) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemTagsMenu.hidden = false;
  els.workItemTags.setAttribute("aria-expanded", "true");
  els.workItemTagsInput.value = "";
  renderWorkItemTagsEditor(item);
  requestAnimationFrame(() => els.workItemTagsInput.focus());
}

function renderWorkItemTagsEditor(item) {
  const selectedTags = workItemTagsFor(item);
  els.workItemTagsSelected.replaceChildren(...selectedTags.map(tag => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-tags-selected-chip";
    button.title = `Remove tag ${tag}`;
    const label = document.createElement("span");
    label.textContent = tag;
    const remove = document.createElement("span");
    remove.className = "issue-tags-remove";
    remove.setAttribute("aria-hidden", "true");
    remove.textContent = "×";
    button.append(label, remove);
    button.addEventListener("click", () => updateWorkItemTags(item, selectedTags.filter(value => value !== tag)));
    return button;
  }));
  if (!selectedTags.length) {
    const empty = document.createElement("span");
    empty.className = "issue-tags-selected-empty";
    empty.textContent = "No tags yet";
    els.workItemTagsSelected.append(empty);
  }
  renderWorkItemTagOptions(item);
}

function renderWorkItemTagOptions(item) {
  const selectedTags = workItemTagsFor(item);
  const selectedKeys = new Set(selectedTags.map(tag => tag.toLocaleLowerCase("en")));
  const query = els.workItemTagsInput.value.trim();
  const queryKey = query.toLocaleLowerCase("en");
  const suggestions = sprintTagChoices().filter(tag => !selectedKeys.has(tag.toLocaleLowerCase("en"))
    && (!queryKey || tag.toLocaleLowerCase("en").includes(queryKey)));
  const options = suggestions.map(tag => createWorkItemTagOption(item, tag));
  if (query && !selectedKeys.has(queryKey) && !suggestions.some(tag => tag.toLocaleLowerCase("en") === queryKey)) {
    const add = createWorkItemTagOption(item, query);
    add.classList.add("is-create");
    add.querySelector("span:last-child").textContent = "Add new tag";
    options.unshift(add);
  }
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "issue-tags-options-empty";
    empty.textContent = query ? "No other tags found." : "No other sprint tags.";
    options.push(empty);
  }
  els.workItemTagsOptions.replaceChildren(...options);
}

function createWorkItemTagOption(item, tag) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-tags-option";
  const label = document.createElement("strong");
  label.textContent = tag;
  const meta = document.createElement("span");
  meta.textContent = "Add sprint tag";
  button.append(label, meta);
  button.addEventListener("click", () => addWorkItemTag(item, tag));
  return button;
}

function addWorkItemTag(item, rawTag) {
  const tag = String(rawTag || "").trim().replace(/;/g, "");
  if (!tag) return;
  const tags = workItemTagsFor(item);
  if (tags.some(value => value.toLocaleLowerCase("en") === tag.toLocaleLowerCase("en"))) return;
  updateWorkItemTags(item, [...tags, tag]);
}

function closeWorkItemTagsMenu() {
  els.workItemTagsMenu.hidden = true;
  els.workItemTags.setAttribute("aria-expanded", "false");
}

async function updateWorkItemTags(item, nextTags) {
  const currentTags = workItemTagsFor(item);
  const savedTags = [...new Map(nextTags.map(tag => {
    const value = String(tag || "").trim();
    return [value.toLocaleLowerCase("en"), value];
  }).filter(([, value]) => value)).values()];
  els.workItemTagsInput.disabled = true;
  els.workItemTagsMenu.classList.add("is-saving");
  els.workItemLoadStatus.textContent = "Saving tags…";
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{
        op: currentTags.length ? "replace" : "add",
        path: "/fields/System.Tags",
        value: savedTags.join("; ")
      }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const detail = normalizeWorkItemDetail(verifiedItem);
    const verifiedTags = detail.tags;
    item.tags = verifiedTags;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail || null, false);
      els.workItemLoadStatus.textContent = "Tags saved.";
      els.workItemTagsInput.value = "";
      renderWorkItemTagsEditor(item);
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
    if (tagSetKey(verifiedTags) !== tagSetKey(savedTags)) {
      throw new Error("Azure DevOps did not apply the tag change. The current tags have been reloaded.");
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? "Tags could not be saved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "Tags could not be saved.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemTagsInput.disabled = false;
    els.workItemTagsMenu.classList.remove("is-saving");
    if (!els.workItemTagsMenu.hidden) els.workItemTagsInput.focus();
  }
}

function tagSetKey(tags) {
  return tags.map(tag => tag.trim().toLocaleLowerCase("en")).filter(Boolean).sort().join("\n");
}

const PRIORITY_OPTIONS = [
  { value: 1, label: "Highest" },
  { value: 2, label: "High" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Low" }
];

function selectedWorkItem() {
  return state.selectedItem;
}

function closeWorkItemDetailFieldMenus(except = null) {
  [
    [els.workItemPriority, els.workItemPriorityMenu],
    [els.workItemPoints, els.workItemPointsMenu],
    [els.workItemArea, els.workItemAreaMenu],
    [els.workItemIteration, els.workItemIterationMenu]
  ].forEach(([trigger, menu]) => {
    if (menu === except) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  });
}

function openDetailFieldMenu(trigger, menu) {
  const wasOpen = !menu.hidden;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus(menu);
  menu.hidden = wasOpen;
  trigger.setAttribute("aria-expanded", String(!wasOpen));
  return !wasOpen;
}

function toggleWorkItemPriorityMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemPriority, els.workItemPriorityMenu)) return;
  const current = state.detailsCache.get(item.id)?.priority;
  els.workItemPriorityOptions.replaceChildren(...PRIORITY_OPTIONS.map(option => {
    const button = createDetailFieldOption(`${option.value} · ${option.label}`, Number(current) === option.value);
    if (!button.disabled) button.addEventListener("click", () => updateWorkItemField(item, "Microsoft.VSTS.Common.Priority", option.value, "Priority"));
    return button;
  }));
}

function toggleWorkItemPointsMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemPoints, els.workItemPointsMenu)) return;
  const current = state.detailsCache.get(item.id)?.points ?? item.points;
  els.workItemPointsInput.value = current ?? "";
  els.workItemPointsQuick.replaceChildren(...[1, 2, 3, 5, 8, 13].map(value => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(value);
    button.className = Number(current) === value ? "is-selected" : "";
    button.addEventListener("click", () => {
      els.workItemPointsInput.value = String(value);
      els.workItemPointsForm.requestSubmit();
    });
    return button;
  }));
  requestAnimationFrame(() => els.workItemPointsInput.select());
}

async function toggleWorkItemAreaMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemArea, els.workItemAreaMenu)) return;
  els.workItemAreaSearch.value = "";
  renderDetailFieldLoading(els.workItemAreaOptions, "Loading areas…");
  requestAnimationFrame(() => els.workItemAreaSearch.focus());
  try {
    const paths = await loadAreaPaths();
    if (!els.workItemAreaMenu.hidden && state.selectedItemId === item.id) renderAreaOptions(item, paths);
  } catch (error) {
    console.error(error);
    renderDetailFieldError(els.workItemAreaOptions, "Areas could not be loaded.");
  }
}

async function toggleWorkItemIterationMenu() {
  const item = selectedWorkItem();
  if (!item || !openDetailFieldMenu(els.workItemIteration, els.workItemIterationMenu)) return;
  els.workItemIterationSearch.value = "";
  renderDetailFieldLoading(els.workItemIterationOptions, "Loading sprints…");
  requestAnimationFrame(() => els.workItemIterationSearch.focus());
  try {
    const paths = await loadTeamIterations();
    if (!els.workItemIterationMenu.hidden && state.selectedItemId === item.id) renderIterationOptions(item, paths);
  } catch (error) {
    console.error(error);
    renderDetailFieldError(els.workItemIterationOptions, "Sprints could not be loaded.");
  }
}

async function loadAreaPaths() {
  if (!state.areaPathsCache) {
    state.areaPathsCache = azure(`/_apis/wit/classificationnodes/areas?$depth=10&api-version=7.1`)
      .then(root => flattenClassificationPaths(root));
    state.areaPathsCache.catch(() => { state.areaPathsCache = null; });
  }
  return state.areaPathsCache;
}

function flattenClassificationPaths(root) {
  const paths = [];
  const visit = node => {
    if (node?.path) paths.push(node.path.startsWith("\\") ? node.path.slice(1) : node.path);
    (node?.children || []).forEach(visit);
  };
  visit(root);
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b, "en"));
}

async function loadTeamIterations() {
  if (!state.teamIterationsCache) {
    const team = state.teams.find(value => value.id === state.teamId);
    if (!team) return [];
    state.teamIterationsCache = azure(`/${encodeURIComponent(team.name)}/_apis/work/teamsettings/iterations?api-version=7.1`)
      .then(result => [...(result.value || [])]
        .sort((a, b) => {
          const aDate = new Date(a.attributes?.startDate || a.attributes?.finishDate || 0).getTime();
          const bDate = new Date(b.attributes?.startDate || b.attributes?.finishDate || 0).getTime();
          return bDate - aDate || b.name.localeCompare(a.name, "en", { numeric: true });
        })
        .map(iteration => iteration.path || iteration.name)
        .filter((path, index, paths) => path && paths.indexOf(path) === index));
    state.teamIterationsCache.catch(() => { state.teamIterationsCache = null; });
  }
  return state.teamIterationsCache;
}

function renderAreaOptions(item, paths) {
  renderSearchableDetailOptions({
    item,
    paths,
    query: els.workItemAreaSearch.value,
    current: state.detailsCache.get(item.id)?.area || item.area,
    container: els.workItemAreaOptions,
    field: "System.AreaPath",
    label: "Area"
  });
}

function renderIterationOptions(item, paths) {
  renderSearchableDetailOptions({
    item,
    paths,
    query: els.workItemIterationSearch.value,
    current: state.detailsCache.get(item.id)?.iteration || state.iteration?.path || state.iteration?.name,
    container: els.workItemIterationOptions,
    field: "System.IterationPath",
    label: "Sprint"
  });
}

function renderSearchableDetailOptions({ item, paths, query, current, container, field, label }) {
  const queryKey = query.trim().toLocaleLowerCase("en");
  const filtered = paths.filter(path => !queryKey || path.toLocaleLowerCase("en").includes(queryKey));
  if (!filtered.length) return renderDetailFieldError(container, `No ${label.toLocaleLowerCase("en")} found.`);
  container.replaceChildren(...filtered.map(path => {
    const button = createDetailFieldOption(path, path === current);
    if (!button.disabled) button.addEventListener("click", () => updateWorkItemField(item, field, path, label));
    return button;
  }));
}

function createDetailFieldOption(label, selected = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "issue-detail-field-option";
  button.disabled = selected;
  button.setAttribute("aria-selected", String(selected));
  const text = document.createElement("span");
  text.textContent = label;
  const check = document.createElement("span");
  check.className = "issue-detail-field-check";
  check.textContent = selected ? "✓" : "";
  button.append(text, check);
  return button;
}

function renderDetailFieldLoading(container, message) {
  const node = document.createElement("div");
  node.className = "issue-detail-field-message";
  node.textContent = message;
  container.replaceChildren(node);
}

function renderDetailFieldError(container, message) {
  const node = document.createElement("div");
  node.className = "issue-detail-field-message";
  node.textContent = message;
  container.replaceChildren(node);
}

async function resolvePointsField(item) {
  const known = state.detailsCache.get(item.id)?.pointsField || item.pointsField;
  if (known) return known;
  let pending = state.workItemTypeFieldsCache.get(item.type);
  if (!pending) {
    pending = azure(`/_apis/wit/workitemtypes/${encodeURIComponent(item.type)}/fields?api-version=7.1`)
      .then(result => result.value || []);
    state.workItemTypeFieldsCache.set(item.type, pending);
    pending.catch(() => state.workItemTypeFieldsCache.delete(item.type));
  }
  const fields = await pending;
  const references = new Set(fields.map(field => field.referenceName));
  const preferred = /task/i.test(item.type)
    ? ["Microsoft.VSTS.Scheduling.Effort", "Microsoft.VSTS.Scheduling.StoryPoints"]
    : ["Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"];
  return preferred.find(reference => references.has(reference)) || "";
}

async function updateWorkItemField(item, field, value, label) {
  closeWorkItemDetailFieldMenus();
  els.workItemLoadStatus.textContent = `Saving ${label.toLocaleLowerCase("en")}…`;
  els.workItemLoadStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: `/fields/${field}`, value }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const normalized = normalizeWorkItem(verifiedItem);
    const detail = normalizeWorkItemDetail(verifiedItem);
    item.points = normalized.points;
    item.pointsField = normalized.pointsField;
    item.priority = normalized.priority;
    item.area = normalized.area;
    item.tags = normalized.tags;
    item.iterationPath = normalized.iterationPath;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    pruneFilters();
    render();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
    }
    if (!workItemFieldValueMatches(field, verifiedItem.fields?.[field], value)) {
      throw new Error(`Azure DevOps did not apply the ${label.toLocaleLowerCase("en")} change. The current value has been reloaded.`);
    }
    if (isSelectedWorkItem(item.id)) {
      els.workItemLoadStatus.textContent = `${label} saved.`;
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.auth
      ? `${label} could not be saved. The PAT requires ‘Work Items: Read & write’.`
      : error.message || `${label} could not be saved.`;
    els.workItemLoadStatus.classList.add("is-error");
  }
}

function workItemFieldValueMatches(field, actual, expected) {
  if (["Microsoft.VSTS.Common.Priority", "Microsoft.VSTS.Scheduling.StoryPoints", "Microsoft.VSTS.Scheduling.Effort"].includes(field)) {
    return Number(actual) === Number(expected);
  }
  return String(actual || "").toLocaleLowerCase("en") === String(expected || "").toLocaleLowerCase("en");
}

function openWorkItemTitleEditor() {
  const item = selectedWorkItem();
  if (!item || !els.workItemTitleForm.hidden) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  els.workItemTitleInput.value = item.title;
  els.workItemTitle.hidden = true;
  els.workItemTitleForm.hidden = false;
  els.workItemTitleStatus.textContent = "";
  els.workItemTitleStatus.classList.remove("is-error");
  requestAnimationFrame(() => els.workItemTitleInput.select());
}

function resetWorkItemTitleEditor() {
  els.workItemTitleForm.hidden = true;
  els.workItemTitle.hidden = false;
  els.workItemTitleInput.value = "";
  els.workItemTitleStatus.textContent = "";
  els.workItemTitleStatus.classList.remove("is-error");
  setWorkItemTitleEditorBusy(false);
}

function setWorkItemTitleEditorBusy(busy) {
  els.workItemTitleInput.disabled = busy;
  els.workItemTitleCancel.disabled = busy;
  els.workItemTitleSubmit.disabled = busy;
  els.workItemTitleSubmit.textContent = busy ? "Saving…" : "Save";
}

async function submitWorkItemTitle(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  const nextTitle = els.workItemTitleInput.value.trim();
  if (!item || !nextTitle) return;
  if (nextTitle === item.title) return resetWorkItemTitleEditor();
  setWorkItemTitleEditorBusy(true);
  els.workItemTitleStatus.textContent = "Saving title…";
  els.workItemTitleStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: "/fields/System.Title", value: nextTitle }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const normalized = normalizeWorkItem(verifiedItem);
    const detail = normalizeWorkItemDetail(verifiedItem);
    item.title = normalized.title;
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    render();
    if (isSelectedWorkItem(item.id)) renderWorkItemDetail(item, detail, false);
    if (item.title !== nextTitle) {
      throw new Error("Azure DevOps did not apply the title change. The current title has been reloaded.");
    }
    resetWorkItemTitleEditor();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
      els.workItemLoadStatus.textContent = "Title saved.";
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.workItemTitleStatus.textContent = error.auth
      ? "The title could not be saved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The title could not be saved.";
    els.workItemTitleStatus.classList.add("is-error");
    setWorkItemTitleEditorBusy(false);
    els.workItemTitleInput.focus();
  }
}

function mentionChoices() {
  const choices = [];
  if (state.authenticatedUser?.id) choices.push({
    id: state.authenticatedUser.id,
    name: state.authenticatedUser.displayName,
    uniqueName: state.authenticatedUser.uniqueName || ""
  });
  state.teamMembers.forEach(member => choices.push(member));
  [...state.stories, ...state.backlogItems].forEach(item => {
    if (item.assigneeId && item.assignee) choices.push({
      id: item.assigneeId,
      name: item.assignee,
      uniqueName: item.assigneeUniqueName || ""
    });
  });
  const unique = new Map();
  choices.forEach(choice => {
    const id = String(choice.id || "").trim();
    const name = String(choice.name || choice.displayName || "").trim();
    if (id && name && !unique.has(id.toLocaleLowerCase("en"))) {
      unique.set(id.toLocaleLowerCase("en"), { id, name, uniqueName: choice.uniqueName || "" });
    }
  });
  return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

function mentionElements(kind) {
  return kind === "description"
    ? { editor: els.descriptionEditor, menu: els.descriptionMentionMenu, options: els.descriptionMentionOptions }
    : { editor: els.commentComposerInput, menu: els.commentMentionMenu, options: els.commentMentionOptions };
}

function mentionTriggerAtCaret(editor) {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !selection.isCollapsed) return null;
  const caret = selection.getRangeAt(0);
  if (!editor.contains(caret.endContainer)) return null;
  let node = caret.endContainer;
  let offset = caret.endOffset;
  if (node.nodeType !== Node.TEXT_NODE) {
    const child = node.childNodes[Math.max(0, offset - 1)];
    node = child;
    while (node?.lastChild) node = node.lastChild;
    if (node?.nodeType !== Node.TEXT_NODE) return null;
    offset = node.textContent.length;
  }
  const prefix = node.textContent.slice(0, offset);
  const match = prefix.match(/(?:^|\s)@([^@\s]*)$/u);
  if (!match) return null;
  const tokenLength = match[1].length + 1;
  const range = document.createRange();
  range.setStart(node, offset - tokenLength);
  range.setEnd(node, offset);
  return { query: match[1], range };
}

function updateMentionSuggestions(kind) {
  const { editor, menu } = mentionElements(kind);
  const trigger = mentionTriggerAtCaret(editor);
  if (!trigger) return closeMentionMenu(kind);
  const query = trigger.query.toLocaleLowerCase("en");
  const choices = mentionChoices().filter(choice => !query
    || choice.name.toLocaleLowerCase("en").includes(query)
    || choice.uniqueName.toLocaleLowerCase("en").includes(query)).slice(0, 8);
  mentionState[kind] = { query: trigger.query, range: trigger.range.cloneRange(), activeIndex: 0, choices };
  menu.hidden = false;
  editor.setAttribute("aria-expanded", "true");
  editor.setAttribute("aria-controls", menu.id);
  renderMentionOptions(kind);
}

function renderMentionOptions(kind) {
  const { editor, options } = mentionElements(kind);
  const current = mentionState[kind];
  if (!current.choices.length) {
    const empty = document.createElement("div");
    empty.className = "mention-empty";
    empty.textContent = state.teamMembers.length ? "No matching team members." : "No team members available.";
    options.replaceChildren(empty);
    editor.removeAttribute("aria-activedescendant");
    return;
  }
  options.replaceChildren(...current.choices.map((choice, index) => {
    const option = document.createElement("button");
    option.type = "button";
    option.id = `${kind}MentionOption${index}`;
    option.className = `mention-option${index === current.activeIndex ? " is-active" : ""}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(index === current.activeIndex));
    const avatar = document.createElement("span");
    avatar.className = "mention-avatar";
    avatar.textContent = initialsFor(choice.name);
    const label = document.createElement("span");
    label.className = "mention-label";
    const name = document.createElement("strong");
    name.textContent = choice.name;
    label.append(name);
    if (choice.uniqueName && choice.uniqueName !== choice.name) {
      const detail = document.createElement("small");
      detail.textContent = choice.uniqueName;
      label.append(detail);
    }
    option.append(avatar, label);
    option.addEventListener("mousedown", event => event.preventDefault());
    option.addEventListener("click", () => insertMention(kind, choice));
    return option;
  }));
  editor.setAttribute("aria-activedescendant", `${kind}MentionOption${current.activeIndex}`);
}

function insertMention(kind, choice) {
  const { editor } = mentionElements(kind);
  const range = mentionState[kind].range;
  if (!range) return;
  range.deleteContents();
  const mention = document.createElement("a");
  mention.href = "#";
  mention.className = "user-mention";
  mention.setAttribute("data-vss-mention", `version:2.0,${choice.id}`);
  mention.contentEditable = "false";
  mention.textContent = `@${choice.name}`;
  const space = document.createTextNode(" ");
  range.insertNode(mention);
  mention.after(space);
  const caret = document.createRange();
  caret.setStartAfter(space);
  caret.collapse(true);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(caret);
  closeMentionMenu(kind);
  editor.focus();
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function moveMentionSelection(kind, direction) {
  const current = mentionState[kind];
  if (!current.choices.length) return;
  current.activeIndex = (current.activeIndex + direction + current.choices.length) % current.choices.length;
  renderMentionOptions(kind);
  mentionElements(kind).options.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
}

function closeMentionMenu(kind) {
  const { editor, menu, options } = mentionElements(kind);
  menu.hidden = true;
  options.replaceChildren();
  editor.setAttribute("aria-expanded", "false");
  editor.removeAttribute("aria-controls");
  editor.removeAttribute("aria-activedescendant");
  mentionState[kind] = { query: "", range: null, activeIndex: 0, choices: [] };
}

function handleMentionKeydown(kind, event) {
  const { menu } = mentionElements(kind);
  if (menu.hidden) return false;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveMentionSelection(kind, event.key === "ArrowDown" ? 1 : -1);
    return true;
  }
  if ((event.key === "Enter" || event.key === "Tab") && mentionState[kind].choices.length) {
    event.preventDefault();
    insertMention(kind, mentionState[kind].choices[mentionState[kind].activeIndex]);
    return true;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeMentionMenu(kind);
    return true;
  }
  return false;
}

function openDescriptionEditor() {
  const item = selectedWorkItem();
  if (!item || els.descriptionEditButton.disabled) return;
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  closeMentionMenu("comment");
  const html = state.detailsCache.get(item.id)?.descriptionHtml || "";
  els.descriptionEditor.replaceChildren(sanitizeRichHtml(html));
  els.descriptionEditor.querySelectorAll("a.user-mention").forEach(mention => { mention.contentEditable = "false"; });
  hydrateRichTextImages(els.descriptionEditor);
  els.workItemDescription.hidden = true;
  els.descriptionEditButton.hidden = true;
  els.descriptionEditorForm.hidden = false;
  els.descriptionEditorStatus.textContent = "";
  els.descriptionEditorStatus.classList.remove("is-error");
  requestAnimationFrame(() => els.descriptionEditor.focus());
}

function resetDescriptionEditor() {
  closeMentionMenu("description");
  els.descriptionEditorForm.hidden = true;
  els.workItemDescription.hidden = false;
  els.descriptionEditButton.hidden = false;
  els.descriptionEditor.replaceChildren();
  els.descriptionEditorStatus.textContent = "";
  els.descriptionEditorStatus.classList.remove("is-error");
  setDescriptionEditorBusy(false);
}

function setDescriptionEditorBusy(busy) {
  els.descriptionEditor.contentEditable = String(!busy);
  els.descriptionEditorCancel.disabled = busy;
  els.descriptionEditorSubmit.disabled = busy;
  els.descriptionEditorSubmit.textContent = busy ? "Saving…" : "Save";
}

function applyDescriptionCommand(command) {
  els.descriptionEditor.focus();
  document.execCommand(command, false);
}

function descriptionEditorHtml() {
  return richEditorHtml(els.descriptionEditor);
}

function richEditorHtml(editor) {
  const source = editor.cloneNode(true);
  restoreAuthenticatedImageSources(source);
  const safe = document.createElement("div");
  safe.append(sanitizeRichHtml(source.innerHTML));
  restoreAuthenticatedImageSources(safe);
  const html = safe.innerHTML.trim();
  return html === "<br>" ? "" : html;
}

function restoreAuthenticatedImageSources(container) {
  container.querySelectorAll("img[data-auth-src]").forEach(image => {
    image.src = image.dataset.authSrc;
    image.removeAttribute("data-auth-src");
    image.removeAttribute("aria-busy");
    image.classList.remove("is-loading");
    if (!image.className) image.removeAttribute("class");
  });
}

async function submitDescriptionEditor(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  if (!item) return;
  const descriptionHtml = descriptionEditorHtml();
  setDescriptionEditorBusy(true);
  els.descriptionEditorStatus.textContent = "Saving description…";
  els.descriptionEditorStatus.classList.remove("is-error");
  try {
    await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json-patch+json" },
      body: JSON.stringify([{ op: "add", path: "/fields/System.Description", value: descriptionHtml }])
    });
    state.detailsRequestTokens.set(item.id, (state.detailsRequestTokens.get(item.id) || 0) + 1);
    const verifiedItem = await azure(`/_apis/wit/workitems/${item.id}?api-version=7.1`);
    const detail = normalizeWorkItemDetail(verifiedItem);
    state.detailsCache.set(item.id, detail);
    state.historyCache.delete(item.id);
    state.historyErrors.delete(item.id);
    resetDescriptionEditor();
    if (isSelectedWorkItem(item.id)) {
      renderWorkItemDetail(item, detail, false);
      els.workItemLoadStatus.textContent = "Description saved.";
      renderHistory([], true);
      renderCombinedActivity();
      loadWorkItemHistory(item);
    }
  } catch (error) {
    console.error(error);
    els.descriptionEditorStatus.textContent = error.auth
      ? "The description could not be saved. The PAT requires ‘Work Items: Read & write’."
      : error.message || "The description could not be saved.";
    els.descriptionEditorStatus.classList.add("is-error");
    setDescriptionEditorBusy(false);
    els.descriptionEditor.focus();
  }
}

function renderComments(comments, loading = false, error = "") {
  els.workItemCommentCount.textContent = String(comments.length);
  els.workItemCommentsStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemCommentsStatus.textContent = "Loading comments…";
    els.workItemComments.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemCommentsStatus.textContent = error || (!comments.length ? "No comments yet." : "");
  els.workItemComments.replaceChildren(...comments.map(createComment));
}

function setCommentComposerExpanded(expanded) {
  if (expanded) closeMentionMenu("description");
  els.commentComposerPrompt.hidden = expanded;
  els.commentComposerForm.hidden = !expanded;
  if (!expanded) closeMentionMenu("comment");
  if (expanded) requestAnimationFrame(() => els.commentComposerInput.focus());
}

function resetCommentComposer() {
  els.commentComposerInput.replaceChildren();
  els.commentComposerStatus.textContent = "";
  els.commentComposerStatus.classList.remove("is-error");
  els.commentComposerInput.contentEditable = "true";
  els.commentComposerCancel.disabled = false;
  els.commentComposerSubmit.disabled = false;
  els.commentComposerSubmit.textContent = "Save";
  setCommentComposerExpanded(false);
}

function setCommentComposerBusy(busy) {
  els.commentComposerInput.contentEditable = String(!busy);
  els.commentComposerCancel.disabled = busy;
  els.commentComposerSubmit.disabled = busy;
  els.commentComposerSubmit.textContent = busy ? "Saving…" : "Save";
}

async function submitWorkItemComment(event) {
  event.preventDefault();
  const item = selectedWorkItem();
  const text = richEditorHtml(els.commentComposerInput);
  if (!item || !htmlToText(text).trim()) return;
  setCommentComposerBusy(true);
  els.commentComposerStatus.textContent = "Posting comment…";
  els.commentComposerStatus.classList.remove("is-error");
  try {
    const result = await azure(`/_apis/wit/workItems/${item.id}/comments?api-version=7.1-preview.4`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const comment = normalizeComment(result);
    const existing = state.commentsCache.get(item.id) || [];
    const comments = [comment, ...existing.filter(entry => entry.id !== comment.id)]
      .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    state.commentsCache.set(item.id, comments);
    state.commentsErrors.delete(item.id);
    if (isSelectedWorkItem(item.id)) {
      renderComments(comments, false);
      renderCombinedActivity();
      resetCommentComposer();
      els.workItemLoadStatus.textContent = "Comment posted.";
      els.workItemLoadStatus.classList.remove("is-error");
    }
    loadWorkItemComments(item);
  } catch (error) {
    console.error(error);
    if (isSelectedWorkItem(item.id)) {
      els.commentComposerStatus.textContent = error.auth
        ? "The comment could not be posted. The PAT requires ‘Work Items: Read & write’."
        : error.message || "The comment could not be posted.";
      els.commentComposerStatus.classList.add("is-error");
    }
  } finally {
    if (isSelectedWorkItem(item.id) && !els.commentComposerForm.hidden) setCommentComposerBusy(false);
  }
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
  setRichContent(content, comment.html, "Empty comment");
  body.append(header, content);
  article.append(avatar, body);
  return article;
}

function renderHistory(history, loading = false, error = "") {
  els.workItemHistoryCount.textContent = String(history.length);
  els.workItemHistoryStatus.classList.toggle("is-error", Boolean(error));
  if (loading) {
    els.workItemHistoryStatus.textContent = "Loading history…";
    els.workItemHistory.replaceChildren(...Array.from({ length: 2 }, () => {
      const skeleton = document.createElement("div");
      skeleton.className = "comment-skeleton";
      return skeleton;
    }));
    return;
  }
  els.workItemHistoryStatus.textContent = error || (!history.length ? "No history yet." : "");
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
    created.textContent = "created this item.";
    body.append(created);
  } else if (entry.changes.length) {
    const list = document.createElement("ul");
    entry.changes.forEach(change => list.append(createHistoryChange(change)));
    body.append(list);
  } else {
    const updated = document.createElement("p");
    updated.className = "history-summary";
    updated.textContent = "updated this item.";
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
    row.append(document.createTextNode(" updated"));
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
      ? "Loading activity…"
      : !activity.length ? "No activity yet." : "";
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
    const mention = source.getAttribute("data-vss-mention") || "";
    if (/^version:2\.0,[a-z0-9._:@-]{1,200}$/i.test(mention)) {
      target.setAttribute("href", "#");
      target.setAttribute("data-vss-mention", mention);
      target.classList.add("user-mention");
    } else {
      const href = safeRichTextUrl(source.getAttribute("href"), false);
      if (href) {
        target.href = href;
        target.target = "_blank";
        target.rel = "noopener noreferrer";
      }
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
    const { webBase } = activeAzureContext();
    let url = new URL(value, `${webBase}/`);
    if (image) url = normalizeAzureImageUrl(url);
    const protocols = image ? ["https:", "http:"] : ["https:", "http:", "mailto:"];
    return protocols.includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

function normalizeAzureImageUrl(url) {
  if (url.hostname !== "dev.azure.com") return url;
  const segments = url.pathname.split("/").filter(Boolean);
  const attachmentId = segments.length === 1 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segments[0])
    ? segments[0]
    : "";
  if (attachmentId) {
    const { base } = activeAzureContext();
    const attachmentUrl = new URL(`${base}/_apis/wit/attachments/${attachmentId}`);
    url.searchParams.forEach((value, key) => attachmentUrl.searchParams.append(key, value));
    if (!attachmentUrl.searchParams.has("api-version")) attachmentUrl.searchParams.set("api-version", "7.1");
    return attachmentUrl;
  }
  if (url.pathname.toLowerCase().includes("/_apis/wit/attachments/") && !url.searchParams.has("api-version")) {
    url.searchParams.set("api-version", "7.1");
  }
  return url;
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
      image.title = "The image could not be loaded.";
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
  if (!response.ok) throw new Error(`Failed to load image (${response.status}).`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") && blob.type !== "application/octet-stream") {
    throw new Error("The attachment is not an image.");
  }
  return URL.createObjectURL(blob);
}

function emptyNode() {
  return document.querySelector("#emptyTemplate").content.firstElementChild.cloneNode(true);
}

function renderEmptyBoard() {
  state.stories = [];
  state.iterationStoriesCache.clear();
  state.backlogItems = [];
  state.backlogTeamId = "";
  state.forYouProjectName = "";
  state.forYouWorkItems = [];
  state.forYouMentions = [];
  state.forYouActivity = [];
  state.forYouErrors = {};
  state.forYouSelectedUser = null;
  state.forYouUserKey = "";
  state.iteration = null;
  state.iterations = [];
  state.currentIterationId = "";
  state.filters.sprint.clear();
  closeSprintMenu();
  render();
  if (state.currentView === "backlog") {
    els.backlogMeta.textContent = "Connect Azure DevOps to load the backlog.";
    els.backlogContent.replaceChildren();
  }
  if (state.currentView === "for-you") renderForYou();
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
  els.stateMappings.replaceChildren(...[...state.knownStates].sort((a, b) => a.localeCompare(b, "en")).map(itemState => {
    const row = document.createElement("div");
    row.className = "mapping-row";
    const label = document.createElement("strong");
    label.textContent = itemState;
    const select = document.createElement("select");
    select.name = `state-${itemState}`;
    select.dataset.state = itemState;
    [["todo", "To do"], ["active", "Active"], ["done", "Done"], ["hidden", "Hide"]].forEach(([value, text]) => {
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
  els.sprintTitle.disabled = value || !state.iterations.length;
  els.refresh.classList.toggle("is-spinning", value);
  if (value) {
    closeSprintMenu();
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
function formatDate(value) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value)) : ""; }
function formatDateTime(value) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }

els.connectionForm.addEventListener("submit", event => {
  event.preventDefault();
  try {
    parseAzureUrl(els.orgUrl.value);
    state.orgUrl = els.orgUrl.value.trim();
    state.authenticatedUser = null;
    state.forYouProjectName = "";
    state.forYouSelectedUser = null;
    state.forYouUserKey = "";
    updateBranding();
    state.pat = els.pat.value.trim();
    if (!state.pat) throw new Error("Enter a PAT.");
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
  if (previousTeam !== state.teamId) {
    state.filters.sprint.clear();
    state.backlogItems = [];
    state.backlogTeamId = "";
    loadBoard();
  } else render();
});

document.querySelectorAll("[data-close-settings]").forEach(button => button.addEventListener("click", () => els.settingsDialog.close()));
document.querySelectorAll("[data-close-work-item]").forEach(button => button.addEventListener("click", () => els.workItemDialog.close()));
document.querySelectorAll("[data-activity-tab]").forEach(button => button.addEventListener("click", () => setActivityTab(button.dataset.activityTab)));
els.workItemState.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemStateMenu(); });
els.workItemStateMenu.addEventListener("click", event => event.stopPropagation());
els.workItemAssignee.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemAssigneeMenu(); });
els.workItemAssigneeMenu.addEventListener("click", event => event.stopPropagation());
els.workItemAssigneeSearch.addEventListener("input", () => {
  const item = selectedWorkItem();
  if (item) renderWorkItemAssigneeOptions(item);
});
els.workItemAssigneeSearch.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeWorkItemAssigneeMenu();
    els.workItemAssignee.focus();
  }
});
els.workItemTags.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemTagsMenu(); });
els.workItemTagsMenu.addEventListener("click", event => event.stopPropagation());
els.workItemTagsInput.addEventListener("input", () => {
  const item = selectedWorkItem();
  if (item) renderWorkItemTagOptions(item);
});
els.workItemTagsInput.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeWorkItemTagsMenu();
    els.workItemTags.focus();
  } else if (event.key === "Enter") {
    event.preventDefault();
    const item = selectedWorkItem();
    if (item) addWorkItemTag(item, els.workItemTagsInput.value);
  }
});
els.workItemPriority.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemPriorityMenu(); });
els.workItemPoints.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemPointsMenu(); });
els.workItemArea.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemAreaMenu(); });
els.workItemIteration.addEventListener("click", event => { event.stopPropagation(); toggleWorkItemIterationMenu(); });
[els.workItemPriorityMenu, els.workItemPointsMenu, els.workItemAreaMenu, els.workItemIterationMenu]
  .forEach(menu => menu.addEventListener("click", event => event.stopPropagation()));
els.workItemPointsForm.addEventListener("submit", async event => {
  event.preventDefault();
  const item = selectedWorkItem();
  if (!item) return;
  const value = Number(els.workItemPointsInput.value);
  if (!Number.isFinite(value) || value < 0) return;
  els.workItemPointsInput.disabled = true;
  try {
    const field = await resolvePointsField(item);
    if (!field) throw new Error(`No Story Points or Effort field was found for work item type “${item.type}”.`);
    await updateWorkItemField(item, field, value, "Story points");
  } catch (error) {
    console.error(error);
    els.workItemLoadStatus.textContent = error.message || "Story points could not be saved.";
    els.workItemLoadStatus.classList.add("is-error");
  } finally {
    els.workItemPointsInput.disabled = false;
  }
});
els.workItemAreaSearch.addEventListener("input", async () => {
  const item = selectedWorkItem();
  if (!item) return;
  try { renderAreaOptions(item, await loadAreaPaths()); } catch {}
});
els.workItemIterationSearch.addEventListener("input", async () => {
  const item = selectedWorkItem();
  if (!item) return;
  try { renderIterationOptions(item, await loadTeamIterations()); } catch {}
});
[els.workItemAreaSearch, els.workItemIterationSearch, els.workItemPointsInput].forEach(input => input.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeWorkItemDetailFieldMenus();
}));
els.descriptionEditButton.addEventListener("click", openDescriptionEditor);
els.descriptionEditorCancel.addEventListener("click", resetDescriptionEditor);
els.descriptionEditorForm.addEventListener("submit", submitDescriptionEditor);
document.querySelectorAll("[data-description-command]").forEach(button => {
  button.addEventListener("mousedown", event => event.preventDefault());
  button.addEventListener("click", () => applyDescriptionCommand(button.dataset.descriptionCommand));
});
els.descriptionEditor.addEventListener("keydown", event => {
  if (handleMentionKeydown("description", event)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    resetDescriptionEditor();
    els.descriptionEditButton.focus();
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    els.descriptionEditorForm.requestSubmit();
  }
});
els.descriptionEditor.addEventListener("input", () => updateMentionSuggestions("description"));
els.workItemTitle.addEventListener("click", openWorkItemTitleEditor);
els.workItemTitle.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openWorkItemTitleEditor();
});
els.workItemTitleCancel.addEventListener("click", resetWorkItemTitleEditor);
els.workItemTitleForm.addEventListener("submit", submitWorkItemTitle);
els.workItemTitleInput.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  resetWorkItemTitleEditor();
  els.workItemTitle.focus();
});
els.sprintTitle.addEventListener("click", event => { event.stopPropagation(); toggleSprintMenu(); });
els.sprintMenu.addEventListener("click", event => event.stopPropagation());
els.sprintMenuSearch.addEventListener("input", renderSprintMenuOptions);
els.sprintMenuSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeSprintMenu();
  els.sprintTitle.focus();
});
els.commentComposerPrompt.addEventListener("click", () => setCommentComposerExpanded(true));
els.commentComposerCancel.addEventListener("click", resetCommentComposer);
els.commentComposerForm.addEventListener("submit", submitWorkItemComment);
els.commentComposerInput.addEventListener("keydown", event => {
  if (handleMentionKeydown("comment", event)) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    resetCommentComposer();
  } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    els.commentComposerForm.requestSubmit();
  }
});
els.commentComposerInput.addEventListener("input", () => updateMentionSuggestions("comment"));
els.workItemDialog.addEventListener("cancel", event => {
  if (!els.workItemTitleForm.hidden) {
    event.preventDefault();
    resetWorkItemTitleEditor();
    return;
  }
  if (!els.descriptionEditorForm.hidden) {
    event.preventDefault();
    resetDescriptionEditor();
    return;
  }
  if ([els.workItemPriorityMenu, els.workItemPointsMenu, els.workItemAreaMenu, els.workItemIterationMenu].some(menu => !menu.hidden)) {
    event.preventDefault();
    closeWorkItemDetailFieldMenus();
    return;
  }
  if (!els.workItemTagsMenu.hidden) {
    event.preventDefault();
    closeWorkItemTagsMenu();
    return;
  }
  if (!els.workItemAssigneeMenu.hidden) {
    event.preventDefault();
    closeWorkItemAssigneeMenu();
    return;
  }
  if (!els.workItemStateMenu.hidden) {
    event.preventDefault();
    closeWorkItemStateMenu();
  }
});
els.workItemDialog.addEventListener("close", () => {
  closeWorkItemStateMenu();
  closeWorkItemAssigneeMenu();
  closeWorkItemTagsMenu();
  closeWorkItemDetailFieldMenus();
  resetWorkItemTitleEditor();
  resetDescriptionEditor();
  resetCommentComposer();
  if (state.currentView === "backlog") renderBacklog();
  if (state.currentView === "for-you") renderForYou();
  state.selectedItemId = null;
  state.selectedItem = null;
});
els.workItemDialog.addEventListener("click", event => { if (event.target === els.workItemDialog) els.workItemDialog.close(); });
els.cancelConnection.addEventListener("click", () => { if (state.pat) els.connectionDialog.close(); });
els.togglePat.addEventListener("click", () => {
  const show = els.pat.type === "password";
  els.pat.type = show ? "text" : "password";
  els.togglePat.textContent = show ? "Hide" : "Show";
});
els.changeConnection.addEventListener("click", () => showConnection());
els.theme.addEventListener("click", () => {
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
});
els.headerAvatar.addEventListener("click", showSettings);
els.forYouNav.addEventListener("click", () => showMainView("for-you"));
els.forYouPerson.addEventListener("click", event => {
  event.stopPropagation();
  toggleForYouPersonMenu();
});
els.forYouPersonMenu.addEventListener("click", event => event.stopPropagation());
els.forYouPersonSearch.addEventListener("input", renderForYouPersonOptions);
els.forYouPersonSearch.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  event.stopPropagation();
  closeForYouPersonMenu();
  els.forYouPerson.focus();
});
els.forYouWorkShowAll.addEventListener("click", () => toggleForYouSection("work"));
els.forYouMentionsShowAll.addEventListener("click", () => toggleForYouSection("mentions"));
els.forYouActivityShowAll.addEventListener("click", () => toggleForYouSection("activity"));
els.sprintBoardNav.addEventListener("click", () => showMainView("board"));
els.backlogNav.addEventListener("click", () => showMainView("backlog"));
els.refresh.addEventListener("click", () => loadBoard());
els.search.addEventListener("input", event => { state.search = event.target.value; render(); });
els.clearFilters.addEventListener("click", async () => {
  const hadSprintFilter = Boolean(state.filters.sprint.size);
  Object.values(state.filters).forEach(values => values.clear());
  if (hadSprintFilter && state.currentView !== "backlog") {
    setLoading(true);
    try { await applySprintFilter(); }
    catch (error) { console.error(error); showNotice(error.message || "The current sprint could not be loaded.", "error"); }
    finally { setLoading(false); }
  }
  renderCurrentView();
});

document.addEventListener("click", event => {
  if (event.target.closest?.("a.user-mention")) event.preventDefault();
  if (!els.descriptionMentionMenu.contains(event.target) && !els.descriptionEditor.contains(event.target)) closeMentionMenu("description");
  if (!els.commentMentionMenu.contains(event.target) && !els.commentComposerInput.contains(event.target)) closeMentionMenu("comment");
  if (!els.forYouPersonControl.contains(event.target)) closeForYouPersonMenu();
  if (!els.sprintTitleControl.contains(event.target)) closeSprintMenu();
  if (!els.workItemStateControl.contains(event.target)) closeWorkItemStateMenu();
  if (!els.workItemAssigneeControl.contains(event.target)) closeWorkItemAssigneeMenu();
  if (!els.workItemTagsControl.contains(event.target)) closeWorkItemTagsMenu();
  if (![els.workItemPriorityControl, els.workItemPointsControl, els.workItemAreaControl, els.workItemIterationControl].some(control => control.contains(event.target))) closeWorkItemDetailFieldMenus();
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
