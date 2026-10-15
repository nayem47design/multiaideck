import { expect, test, type Page } from "@playwright/test";

import { NAV, newPhoneUser } from "./auth";

// Projects (Figma flow "9 · Projects & account menu"): create a project from the New project
// dialog, land on its page, move a chat into it from a chat row's menu, rename it, and delete it
// without losing its chats. Each test signs in as a brand-new phone user (so the shared demo user's
// projects stay as seeded) and gives it one chat through the API (a sandbox top-up, then a prompt).

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;
const v = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

/** A new user with credits (sandbox bKash payment) and one chat; returns the chat's title. */
async function userWithAChat(page: Page) {
  await newPhoneUser(page);
  const paid = await page.request.post("/api/payments", {
    data: { kind: "topup", method: "bkash", customBdt: 50 },
  });
  expect(paid.ok(), await paid.text()).toBeTruthy();
  const { payment } = (await paid.json()) as { payment: { id: string } };
  const ok = await page.request.post(`/api/payments/${payment.id}/sandbox`, {
    data: { outcome: "paid" },
  });
  expect(ok.ok(), await ok.text()).toBeTruthy();
  const tag = Math.random().toString(36).slice(2, 8);
  const sent = await page.request.post("/api/chats", {
    data: {
      text: `Plan a launch party ${tag}`,
      mode: "compare",
      models: ["gpt"],
    },
  });
  expect(sent.ok(), await sent.text()).toBeTruthy();
  const { chatId } = (await sent.json()) as { chatId: string };
  const chat = await page.request.get(`/api/chats/${chatId}`);
  return { chatId, title: ((await chat.json()) as { title: string }).title };
}

async function createProjectFromDialog(page: Page, name: string) {
  await v(page.getByRole("button", { name: "New project" }))
    .first()
    .click();
  const dialog = page.getByRole("dialog", { name: "New project" });
  await expect(dialog).toBeVisible();
  const create = dialog.getByRole("button", { name: "Create project" });
  await expect(create).toBeDisabled(); // empty name
  await dialog.getByLabel("Project name").fill(name);
  await expect(create).toBeEnabled();
  await dialog.getByLabel("Project name").press("Enter"); // Enter submits
}

test("create a project, move a chat in, rename it, delete it and keep the chat", async ({
  page,
}) => {
  test.skip(isMobile(page), "New project opens from the desktop sidebar");
  test.setTimeout(120_000); // a long journey on the dev server
  const { chatId, title } = await userWithAChat(page);
  const name = `Launch ${Math.random().toString(36).slice(2, 7)}`;

  // New project dialog → the project's page (prototype: Create project → Project page).
  await page.goto("/chats");
  await createProjectFromDialog(page, name);
  await expect(page).toHaveURL(/\/projects\/[\w-]+$/, { timeout: NAV });
  const projectUrl = page.url();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible({
    timeout: NAV,
  });
  await expect(page.getByText("0 chats · Projects keep")).toBeVisible();
  await expect(page.getByText("No chats in this project yet")).toBeVisible();

  // The same name again (other case) is refused, and the dialog says why.
  await createProjectFromDialog(page, name.toUpperCase());
  const dialog = page.getByRole("dialog", { name: "New project" });
  await expect(
    dialog.getByText(
      `You already have a project called “${name.toUpperCase()}”.`,
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();

  // Move the chat in from its row menu on the Chats page (the alternative to dragging).
  await page.goto("/chats");
  await page.getByRole("button", { name: `More options for ${title}` }).click();
  await page.getByRole("menuitem", { name: "Move to project…" }).click();
  const move = page.getByRole("dialog", { name: "Move to a project" });
  await move.getByRole("button", { name }).click();
  await expect(page.getByText(`Moved to ${name}`)).toBeVisible();

  // Listed and counted on the project page.
  await page.goto(projectUrl);
  await expect(page.getByText("1 chat · Projects keep")).toBeVisible({
    timeout: NAV,
  });
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(title.slice(0, 15)) }),
  ).toBeVisible();
  const listed = await page.request.get("/api/projects");
  expect(
    (
      (await listed.json()) as {
        projects: { name: string; chatCount: number }[];
      }
    ).projects,
  ).toEqual([expect.objectContaining({ name, chatCount: 1 })]);

  // Rename.
  const renamed = `${name} v2`;
  await page.getByRole("button", { name: "Project options" }).first().click();
  await page.getByRole("menuitem", { name: "Rename project" }).click();
  const rename = page.getByRole("dialog", { name: "Rename project" });
  await rename.getByLabel("Project name").fill(renamed);
  await rename.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: renamed }),
  ).toBeVisible();

  // Delete: back to Chats, and the chat is still there, out of any project.
  await page.getByRole("button", { name: "Project options" }).first().click();
  await page.getByRole("menuitem", { name: "Delete project" }).click();
  await page
    .getByRole("dialog", { name: `Delete “${renamed}”?` })
    .getByRole("button", { name: "Delete project" })
    .click();
  await expect(page).toHaveURL(/\/chats$/, { timeout: NAV });
  await expect(
    page.getByRole("button", { name: `More options for ${title}` }),
  ).toBeVisible();
  const chat = await page.request.get(`/api/chats/${chatId}`);
  expect(((await chat.json()) as { projectId: string | null }).projectId).toBe(
    null,
  );
  await page.goto(projectUrl);
  await expect(page.getByText("This page doesn’t exist")).toBeVisible({
    timeout: NAV,
  });
});

test("project page: remove a chat from the project; mobile top bar goes back to Chats", async ({
  page,
}) => {
  const { chatId, title } = await userWithAChat(page);
  const res = await page.request.post("/api/projects", {
    data: { name: "Thesis research" },
  });
  expect(res.status()).toBe(201);
  const { id } = (await res.json()) as { id: string };
  await page.request.patch(`/api/chats/${chatId}`, { data: { projectId: id } });

  await page.goto(`/projects/${id}`);
  await expect(v(page.getByText("1 chat · Projects keep"))).toBeVisible({
    timeout: NAV,
  });
  const row = v(
    page
      .getByRole("main")
      .getByRole("link", { name: new RegExp(title.slice(0, 15)) }),
  );
  await expect(row).toBeVisible();

  // Remove from project: desktop "more" button, mobile press-and-hold (context menu).
  if (isMobile(page)) {
    await row.click({ button: "right" });
  } else {
    await page
      .getByRole("button", { name: `More options for ${title}` })
      .click();
  }
  await page.getByRole("menuitem", { name: "Remove from project" }).click();
  await expect(v(page.getByText("No chats in this project yet"))).toBeVisible();

  if (isMobile(page)) {
    await page.getByRole("link", { name: "Back to chats" }).click();
    await expect(page).toHaveURL(/\/chats$/, { timeout: NAV });
  }
});

test("an unknown project shows not found", async ({ page }) => {
  await page.goto("/projects/does-not-exist");
  await expect(page.getByText("This page doesn’t exist")).toBeVisible({
    timeout: NAV,
  });
});
