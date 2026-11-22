import screenSummariesJson from "./legacyScreenSummaries.json";
import navigationJson from "./legacyNavigation.json";

export interface ScreenField {
  name: string;
  label: string;
  type: string;
  section?: string | null;
  tab?: string | null;
  options?: string[];
  required?: boolean | null;
  sourceType?: string;
  readOnly?: boolean;
  maxLength?: number | null;
  visibleByDefault?: boolean;
}

export interface ScreenAction {
  name: string;
  label: string;
  handler?: string | null;
  kind: string;
  sourceType?: string;
  destinationScreenIds?: string[];
  reportTargets?: string[];
}

export interface GridColumn {
  name: string;
  label: string;
}

export interface ScreenGrid {
  name: string;
  columns: GridColumn[];
}

export interface LegacyScreen {
  id: string;
  name: string;
  title: string;
  category: string;
  source: string;
  line: number;
  fields: ScreenField[];
  actions: ScreenAction[];
  grids: ScreenGrid[];
  sections: { field: string; label: string }[];
  tabs: { field: string; label: string }[];
  hasDirectDatabaseCalls: boolean;
  dialogCallCount: number;
  screenConfidence: string;
}

export interface LegacyScreenSummary {
  id: string;
  name: string;
  title: string;
  category: string;
  source: string;
  line: number;
  fieldCount: number;
  actionCount: number;
  gridCount: number;
  hasDirectDatabaseCalls: boolean;
  screenConfidence: string;
}

export interface NavigationEntry {
  id: string;
  label: string;
  group: string;
  menuPath: string[];
  field: string;
  handler?: string | null;
  line: number;
  source: string;
  destinationScreenIds: string[];
  reportTargets?: string[];
  kind: "action" | "group";
}

export interface NavigationNode {
  label: string;
  field: string;
  group: string;
  entryId: string | null;
  children: NavigationNode[];
}

interface NavigationData {
  topLevel: string[];
  tree: NavigationNode[];
  entries: NavigationEntry[];
}

export const screenSummaries = screenSummariesJson as LegacyScreenSummary[];
export const navigation = navigationJson as NavigationData;
export const navigationEntries = navigation.entries;
export const screenSummariesById = new Map(screenSummaries.map((screen) => [screen.id, screen]));
export const navigationById = new Map(navigationEntries.map((entry) => [entry.id, entry]));
export const screenCategories = Array.from(new Set(screenSummaries.map((screen) => screen.category))).sort();

const screenModules = import.meta.glob<{ default: LegacyScreen }>("./screens/*.json");
const loadedScreens = new Map<string, LegacyScreen>();

export async function loadScreen(id: string): Promise<LegacyScreen | undefined> {
  const cached = loadedScreens.get(id);
  if (cached) return cached;
  const loader = screenModules["./screens/" + id + ".json"];
  if (!loader) return undefined;
  const module = await loader();
  loadedScreens.set(id, module.default);
  return module.default;
}

export async function loadScreens(ids: string[]): Promise<LegacyScreen[]> {
  const loaded = await Promise.all(ids.map((id) => loadScreen(id)));
  return loaded.filter((screen): screen is LegacyScreen => Boolean(screen));
}

export function screenPath(id: string): string {
  return "/app/screens/" + id;
}

export function actionPath(id: string): string {
  return "/app/actions/" + id;
}

export function browsePath(id: string): string {
  return "/app/browse/" + id;
}

export function findNodeByEntryId(nodes: NavigationNode[], id: string): NavigationNode | undefined {
  for (const node of nodes) {
    if (node.entryId === id) return node;
    const nested = findNodeByEntryId(node.children, id);
    if (nested) return nested;
  }
  return undefined;
}
