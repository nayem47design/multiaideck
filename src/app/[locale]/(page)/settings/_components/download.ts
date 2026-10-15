// Demo "Download your data": the profile and preferences as a JSON file, built in the browser.

import type { SavedProfile } from "./SettingsState";

export function downloadFile(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadProfileData(
  profile: SavedProfile,
  extra: Record<string, unknown>,
) {
  downloadFile(
    "multiai-data.json",
    "application/json",
    JSON.stringify({ profile, ...extra }, null, 2),
  );
}
