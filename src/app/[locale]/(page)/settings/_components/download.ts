// Downloads from the settings screens: "Download your data" (GET /api/me/export) and files built
// in the browser (the usage CSV).

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

/** "Download your data": the account's JSON export from the server. Rejects when it fails. */
export async function downloadAccountData() {
  const res = await fetch("/api/me/export", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`export ${res.status}`);
  const name =
    /filename="([^"]+)"/.exec(
      res.headers.get("content-disposition") ?? "",
    )?.[1] ?? "multiaideck-data.json";
  downloadFile(name, "application/json", await res.text());
}
