// Sidebar preference (desktop): "expanded" or "collapsed" to the rail. Stored per device and
// applied as <html data-sidebar> before first paint; the `rail:` CSS variant reads it.

export type SidebarPreference = "expanded" | "collapsed";
export const SIDEBAR_STORAGE_KEY = "multiai-sidebar";

export const SIDEBAR_SCRIPT = `(function(){try{document.documentElement.dataset.sidebar=localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="collapsed"?"collapsed":"expanded"}catch(e){}})()`;

export function readSidebar(): SidebarPreference {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed"
      ? "collapsed"
      : "expanded";
  } catch {
    return "expanded";
  }
}

export function applySidebar(preference: SidebarPreference) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, preference);
  } catch {}
  document.documentElement.dataset.sidebar = preference;
}

// Folded sidebar sections ("projects", "today"…) and whether Credits is unfolded, remembered per
// device. Read after hydration (the server renders everything unfolded and Credits folded).

export const SIDEBAR_FOLDS_KEY = "multiai-sidebar-folds";

export interface SidebarFolds {
  /** Folded section ids. */
  sections: string[];
  /** Credits State=Expanded. */
  credits: boolean;
}

const DEFAULT_FOLDS: SidebarFolds = { sections: [], credits: false };
let folds: SidebarFolds | null = null;
const listeners = new Set<() => void>();

function readFolds(): SidebarFolds {
  if (folds) return folds;
  try {
    const raw = JSON.parse(localStorage.getItem(SIDEBAR_FOLDS_KEY) ?? "null");
    folds = {
      sections: Array.isArray(raw?.sections)
        ? raw.sections.filter((s: unknown) => typeof s === "string")
        : [],
      credits: raw?.credits === true,
    };
  } catch {
    folds = DEFAULT_FOLDS;
  }
  return folds;
}

function writeFolds(next: SidebarFolds) {
  folds = next;
  try {
    localStorage.setItem(SIDEBAR_FOLDS_KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export const sidebarFolds = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: readFolds,
  getServer: () => DEFAULT_FOLDS,
  toggleSection(id: string) {
    const f = readFolds();
    writeFolds({
      ...f,
      sections: f.sections.includes(id)
        ? f.sections.filter((s) => s !== id)
        : [...f.sections, id],
    });
  },
  toggleCredits() {
    const f = readFolds();
    writeFolds({ ...f, credits: !f.credits });
  },
};
