import { test, expect, type Page } from "@playwright/test";
const proposal = {
  mode: "gemini",
  message: "We can explore your next steps together.",
  updates: [
    { key: "currentInstitution", value: "bmcc" },
    {
      key: "currentProgram",
      value: { name: "Computer Science", institutionId: "bmcc" },
    },
  ],
  goal: "next_semester",
  action: "completed",
  clarification_needed: true,
  reason: null,
};
async function enable(page: Page) {
  await page.route("**/api/conversation/status", (r) =>
    r.fulfill({ json: { enabled: true } }),
  );
  await page.route("**/api/conversation/session", (r) =>
    r.fulfill({ json: { session_id: "synthetic-browser-session-only" } }),
  );
  await page.goto("/campus/bmcc");
  await page
    .getByRole("checkbox", {
      name: "Use external AI for fictional conversation",
    })
    .check();
}
async function send(page: Page, text: string) {
  await page.getByLabel("Your message", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}
async function screenshot(page: Page, name: string) {
  if (process.env.CAPTURE_CONVERSATION_SHOTS === "1")
    await page.screenshot({
      path: `${process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images"}/phase04a-${name}.png`,
      fullPage: true,
    });
}
test("natural chat proposes all changes for review then reuses deterministic next question", async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/conversation", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ json: proposal });
  });
  await enable(page);
  await expect(page.getByText(/sends your fictional messages/)).toBeVisible();
  await send(
    page,
    "I'm studying computer science at BMCC and want to plan next semester.",
  );
  await expect(
    page.getByRole("region", { name: "Review proposed fictional changes" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Next useful question" }),
  ).toHaveCount(0);
  await screenshot(page, "pending-proposal");
  await page.getByRole("button", { name: "Apply reported changes" }).click();
  await expect(
    page.getByRole("region", { name: "Next useful question" }),
  ).toContainText("Which classes have you already finished?");
  await expect(page.getByRole("log")).toContainText(
    "AI assistant · Unverified conversation",
  );
  await screenshot(page, "confirmed-chat");
  await send(page, "Thanks, I have another question.");
  await expect(
    page.getByRole("region", { name: "Review proposed fictional changes" }),
  ).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests[1].history).not.toEqual([]);
  expect(JSON.stringify(requests[1].facts)).toContain("Computer Science");
  expect(requests[1].campus_id).toBe("bmcc");
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page
    .getByRole("log")
    .getByRole("button", { name: "Open Completed Courses", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Completed Courses", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await expect(page.getByRole("log")).toContainText(
    "Thanks, I have another question.",
  );
});
test("malformed or unavailable provider keeps local mode honest and never mutates profile", async ({
  page,
}) => {
  await page.route("**/api/conversation", (r) =>
    r.fulfill({ json: { ...proposal, action: "planner" } }),
  );
  await enable(page);
  await send(page, "Let us explore together.");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "AI conversation is unavailable" }),
  ).toContainText("proposal was rejected");
  await expect(
    page.getByRole("region", { name: "Review proposed fictional changes" }),
  ).toHaveCount(0);
  await expect(page.getByRole("log")).not.toContainText(
    "AI assistant · Unverified conversation",
  );
  await screenshot(page, "safe-fallback");
  await page
    .getByRole("button", { name: "Use local mode", exact: true })
    .click();
  await expect(
    page.getByLabel("Your navigation prompt", { exact: true }),
  ).toBeVisible();
});
test("no external call without explicit consent and disabled mode retains navigation", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/conversation/status", (r) =>
    r.fulfill({ json: { enabled: false } }),
  );
  await page.route("**/api/conversation", (r) => {
    calls++;
    return r.fulfill({ json: proposal });
  });
  await page.goto("/campus/bmcc");
  await page
    .getByLabel("Your navigation prompt", { exact: true })
    .fill("Open completed courses");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page
      .getByRole("log")
      .getByRole("button", { name: "Open Completed Courses", exact: true })
      .last(),
  ).toBeVisible();
  expect(calls).toBe(0);
});
test("context edits while a proposal is pending disable stale confirmation", async ({
  page,
}) => {
  await page.route("**/api/conversation", (r) => r.fulfill({ json: proposal }));
  await enable(page);
  await send(page, "Help with fictional plans.");
  await expect(
    page.getByRole("button", { name: "Apply reported changes" }),
  ).toBeEnabled();
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await page
    .getByLabel("Advising goal", { exact: true })
    .selectOption("explore_programs");
  await expect(
    page.getByRole("button", { name: "Apply reported changes" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("alert").filter({ hasText: "Context changed" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await page
    .getByLabel("Review or correct a fact")
    .selectOption("currentInstitution");
  await expect(
    page.getByText("Current answer: unknown", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Next useful question" }),
  ).not.toContainText("Which classes have you already finished?");
});

test("configured AI still requires consent before any generation", async ({
  page,
}) => {
  let calls = 0;
  await page.route("**/api/conversation/status", (r) =>
    r.fulfill({ json: { enabled: true } }),
  );
  await page.route("**/api/conversation", (r) => {
    calls++;
    return r.fulfill({ json: proposal });
  });
  await page.goto("/campus/bmcc");
  await expect(
    page.getByRole("checkbox", {
      name: "Use external AI for fictional conversation",
    }),
  ).not.toBeChecked();
  await page
    .getByLabel("Your navigation prompt", { exact: true })
    .fill("Open completed courses");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText("Local guide");
  expect(calls).toBe(0);
});

test("mobile chat shows bounded loading and safe provider fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  let finish = () => {};
  const gate = new Promise<void>((resolve) => {
    finish = resolve;
  });
  await page.route("**/api/conversation", async (r) => {
    await gate;
    await r.fulfill({
      json: {
        mode: "fallback",
        message: "Unavailable",
        updates: [],
        goal: null,
        action: null,
        reason: "limited",
      },
    });
  });
  await enable(page);
  await send(page, "I want to explore fictional interests.");
  await expect(
    page.getByRole("status").filter({ hasText: "Preparing a response" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send", exact: true }),
  ).toBeDisabled();
  finish();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "AI conversation is unavailable" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await screenshot(page, "mobile-fallback");
});
