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
