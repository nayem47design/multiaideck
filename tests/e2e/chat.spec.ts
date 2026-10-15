import { expect, test, type Page } from "@playwright/test";

// Asking, comparing and following up, against the real API with the scripted demo model (no
// provider keys). The demo model takes cues in the prompt text — #slow, #timeout, #unavailable,
// #error, optionally ":gpt,claude" — and answers normally on retry (src/lib/ai/demo.ts).
// Tests start signed in as the demo user (tests/e2e/auth.setup.ts).

/** The dev server may compile a route on first visit, under load from other tests. */
const NAV = 30_000;
const ANSWER = 30_000;

const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 768;
const visible = <T extends { filter: (o: { visible: boolean }) => T }>(l: T) =>
  l.filter({ visible: true });

test.describe.configure({ timeout: 120_000 });

test.beforeEach(async ({ page }) => {
  // Make sure this context has the demo session (and the demo data exists).
  const res = await page.request.post("/api/dev/sign-in-demo");
  expect(res.ok()).toBeTruthy();
});

async function newChat(
  page: Page,
  text: string,
  mode: "best" | "compare" = "compare",
  models = ["gpt", "claude", "gemini"],
) {
  const res = await page.request.post("/api/chats", {
    data: { text, mode, models },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return (await res.json()) as { chatId: string; promptId: string };
}

async function chat(page: Page, id: string) {
  const res = await page.request.get(`/api/chats/${id}`);
  expect(res.ok()).toBeTruthy();
  return (await res.json()) as {
    promptsList: {
      models: string[];
      status: string;
      answers: {
        model: string;
        status: string;
        credits: number;
        retryOf: string | null;
      }[];
    }[];
  };
}

test("ask → thinking → the Best answer streams in", async ({ page }) => {
  await page.goto("/", { timeout: NAV });
  const box = visible(page.getByRole("textbox", { name: "Message" }));
  // Claude is cued to be slow, so the thinking screen stays up for a few seconds.
  await box.fill(
    "Give me 3 name ideas for a small coffee shop in Dhaka #slow:claude",
  );
  await visible(page.getByRole("button", { name: "Send" })).click();
  await expect(page).toHaveURL(/\/c\/[\w-]+$/, { timeout: NAV });
  await expect(visible(page.getByText("Asking 3 AIs…"))).toBeVisible({
    timeout: NAV,
  });
  // The merge step cites the model each idea came from (the prototype's Best answer).
  await expect(
    visible(page.getByText(/Built from|from 3 AIs/)).first(),
  ).toBeVisible({
    timeout: ANSWER,
  });
  await expect(visible(page.getByText(/Golpo Coffee/)).first()).toBeVisible({
    timeout: ANSWER,
  });
  // Each point shows the logo of the model it came from (labelled "from Claude").
  await expect(
    visible(page.getByRole("img", { name: /from Claude/ })).first(),
  ).toBeVisible();
});

test("compare with a failure: refunded, then answered on retry", async ({
  page,
}) => {
  test.skip(isMobile(page), "desktop cards; mobile shows one answer at a time");
  const { chatId } = await newChat(
    page,
    "Plan a picnic in Ramna Park #unavailable:gemini",
  );
  await page.goto(`/c/${chatId}`, { timeout: NAV });
  await expect(visible(page.getByText("Couldn’t answer")).first()).toBeVisible({
    timeout: ANSWER,
  });
  await expect(visible(page.getByText(/Refunded/)).first()).toBeVisible();
  await expect(visible(page.getByText(/Refunded: Gemini/))).toBeVisible();

  await visible(page.getByRole("button", { name: /^Retry · ≈/ })).click();
  await expect(visible(page.getByText("Answered on retry"))).toBeVisible({
    timeout: ANSWER,
  });
  await expect(visible(page.getByText("Couldn’t answer"))).toHaveCount(0);
  const detail = await chat(page, chatId);
  const answers = detail.promptsList[0].answers;
  expect(answers.find((a) => a.status === "failed")?.credits).toBe(0);
  expect(answers.find((a) => a.retryOf)?.status).toBe("done");
});

test("follow-up goes only to the recipients chosen", async ({ page }) => {
  test.skip(isMobile(page), "desktop recipients bar; mobile uses the sheet");
  const { chatId } = await newChat(
    page,
    "Name a bakery in Sylhet #timeout:gpt",
  );
  await page.goto(`/c/${chatId}`, { timeout: NAV });
  await expect(visible(page.getByText("Couldn’t answer")).first()).toBeVisible({
    timeout: ANSWER,
  });
  const box = visible(page.getByRole("textbox", { name: "Message" }));
  await box.fill("Make it shorter");
  await expect(
    visible(page.getByText("Not every AI answered last time. Send to:")),
  ).toBeVisible();
  await visible(page.getByText("Only Claude")).click();
  await box.press("Enter");
  await expect
    .poll(async () => (await chat(page, chatId)).promptsList.length, {
      timeout: NAV,
    })
    .toBe(2);
  const second = (await chat(page, chatId)).promptsList[1];
  expect(second.models).toEqual(["claude"]);
  expect(second.answers.map((a) => a.model)).toEqual(["claude"]);
});

test("stop costs nothing", async ({ page }) => {
  const { chatId, promptId } = await newChat(page, "Write a long story #slow");
  await page.goto(`/c/${chatId}`, { timeout: NAV });
  const stop = visible(page.getByRole("button", { name: "Stop" })).first();
  await expect(stop).toBeVisible({ timeout: NAV });
  await stop.click();
  await expect
    .poll(async () => (await chat(page, chatId)).promptsList[0].status, {
      timeout: ANSWER,
    })
    .toBe("stopped");
  const [p] = (await chat(page, chatId)).promptsList;
  // Answers that hadn't finished were stopped and cost nothing.
  const stopped = p.answers.filter((a) => a.status === "stopped");
  expect(stopped.length).toBeGreaterThan(0);
  for (const a of stopped) expect(a.credits).toBe(0);
  expect(promptId).toBeTruthy();
});

test("the chats list and search show a new chat", async ({ page }) => {
  const word = `Zebra${Math.floor(Math.random() * 1e6)}`;
  const { chatId } = await newChat(page, `${word} crossing ideas for a poster`);
  await page.goto("/chats", { timeout: NAV });
  await expect(
    visible(page.getByText(`${word} crossing ideas`)).first(),
  ).toBeVisible({
    timeout: NAV,
  });

  await visible(page.getByRole("button", { name: /Search your chats/ }))
    .first()
    .click();
  const search = page.getByRole("dialog").getByRole("combobox");
  await search.fill(word);
  const result = page.getByRole("dialog").getByText(`${word} crossing ideas`);
  await expect(result.first()).toBeVisible({ timeout: NAV });
  await result.first().click();
  await expect(page).toHaveURL(new RegExp(`/c/${chatId}$`), { timeout: NAV });
});
