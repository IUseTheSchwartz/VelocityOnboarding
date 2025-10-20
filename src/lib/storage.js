const AGENCY_KEY = "vo_agency_settings";
const AGENCIES_KEY = "vo_agencies_list"; // for Super Admin demo
const AGENTS_KEY = "vo_agents_demo";

export function saveAgency(settings) {
  localStorage.setItem(AGENCY_KEY, JSON.stringify(settings));
  // also add to agencies list (for Super Admin demo)
  const list = loadAgencies();
  const idx = list.findIndex(a => a.slug === settings.slug);
  if (idx >= 0) list[idx] = settings; else list.push(settings);
  localStorage.setItem(AGENCIES_KEY, JSON.stringify(list));
}

export function loadAgency() {
  const raw = localStorage.getItem(AGENCY_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function loadAgencies() {
  const raw = localStorage.getItem(AGENCIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function seedAgentsIfEmpty() {
  if (!localStorage.getItem(AGENTS_KEY)) {
    const seed = [
      { name: "Avery L.", status: "Invited", progress: 0 },
      { name: "Jordan S.", status: "Active", progress: 12 },
      { name: "Riley P.", status: "Active", progress: 0 }
    ];
    localStorage.setItem(AGENTS_KEY, JSON.stringify(seed));
  }
}

export function loadAgents() {
  seedAgentsIfEmpty();
  return JSON.parse(localStorage.getItem(AGENTS_KEY) || "[]");
}
