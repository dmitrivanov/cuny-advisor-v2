import { test, expect, type Page } from "@playwright/test";
import cs from "./fixtures/catalog-cs.json" with { type: "json" };
import cis from "./fixtures/catalog-cis.json" with { type: "json" };
import releases from "./fixtures/releases.json" with { type: "json" };
import progress from "./fixtures/progress.json" with { type: "json" };
const csIndex = releases.findIndex(
  (item) => item.program_id === "bmcc-program-cs-as",
);
const cisIndex = releases.findIndex(
  (item) => item.program_id === "bmcc-program-cis-aas",
);
const key = (index: number) =>
  JSON.stringify([
    releases[index].campus_id,
    releases[index].program_id,
    releases[index].release_id,
  ]);
async function mockCatalog(page: Page) {
  await page.route("**/api/academic/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/releases")) return route.fulfill({ json: releases });
    if (path.endsWith("/preview")) return route.fulfill({ json: progress });
    return route.fulfill({ json: path.includes("cis-aas") ? cis : cs });
  });
}
async function choose(page: Page, index = csIndex) {
  if (!(await page.getByLabel("Program / catalog release").isVisible()))
    await page.getByText("Choose / change catalog", { exact: true }).click();
  await page.getByLabel("Program / catalog release").selectOption(key(index));
  await expect(
    page
      .getByRole("heading", {
        name: index === csIndex ? "Major Requirements" : "Required Common Core",
        exact: true,
      })
      .or(page.getByRole("heading", { name: "Requirements & categories" }))
      .or(page.getByRole("button", { name: "Run deterministic preview" })),
  ).toBeVisible();
}
async function openTool(page: Page, name: string) {
  await page
    .getByRole("log")
    .getByRole("button", { name: `Open ${name}`, exact: true })
    .last()
    .click();
}
async function prompt(page: Page, text: string) {
  await page.getByLabel("Your navigation prompt").fill(text);
  await page.getByRole("button", { name: "Send", exact: true }).click();
}
const back = (page: Page) =>
  page.getByRole("button", { name: "Return to chatbot" }).click();
async function shot(page: Page, name: string) {
  if (process.env.CAPTURE_WORKSPACE_SHOTS === "1")
    await page.screenshot({
      path: `${process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images"}/phase03a-${name}.png`,
      fullPage: !name.includes("mobile") && name !== "course-details",
    });
}

test("minimal chat home has no dashboard, context selector or module menu; disclosures remain accessible", async ({
  page,
}) => {
  let academicRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/academic/")) academicRequests++;
  });
  await page.goto("/campus/bmcc");
  await expect(
    page.getByRole("heading", { name: "What’s your next step?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Program / catalog release")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Academic modules" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Workspace modules", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Semester Planner", { exact: true })).toHaveCount(
    0,
  );
  expect(academicRequests).toBe(0);
  await shot(page, "chat-home");
  await page.getByText("About this prototype", { exact: true }).click();
  await expect(page.getByText(/No CUNY or BMCC endorsement/)).toBeVisible();
});

test("conversation actions → focused selector → chat → preview retain context and explicit uncertainty", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/campus/bmcc");
  await prompt(page, "Open completed courses.");
  await shot(page, "chat-action");
  const action = page
    .getByRole("log")
    .getByRole("button", { name: "Open Completed Courses", exact: true })
    .last();
  await action.click();
  await expect(
    page.getByRole("heading", { name: "Completed Courses", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Your navigation prompt")).not.toBeVisible();
  await choose(page);
  for (const code of ["MAT 301", "CSC 101"])
    await page
      .getByRole("checkbox", { name: new RegExp(code) })
      .first()
      .check();
  await back(page);
  await expect(action).toBeFocused();
  await expect(
    page.getByText(/2 unique hypothetical selections retained/),
  ).toBeVisible();
  await expect(page.getByRole("log")).toContainText("Open completed courses.");
  await prompt(page, "I want to review my degree requirements.");
  await openTool(page, "Degree Progress");
  await page
    .getByRole("checkbox", { name: /For this fictional scenario/ })
    .check();
  const request = page.waitForRequest((request) =>
    request.url().endsWith("/preview"),
  );
  await page.getByRole("button", { name: "Run deterministic preview" }).click();
  expect((await request).postDataJSON().selected_course_ids).toEqual([
    "bmcc-course-mat-301",
    "bmcc-course-csc-101",
  ]);
  await expect(
    page.getByRole("heading", { name: "Requirement outcomes" }),
  ).toBeVisible();
  await expect(
    page.getByText(/overall degree status: unresolved/),
  ).toBeVisible();
});

test("four ordered columns, compact consistent course cards, details and incomplete requirements", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/campus/bmcc#completed");
  await choose(page);
  expect(await page.locator(".selector-heading").allTextContents()).toEqual([
    "Major Requirements",
    "Major Electives",
    "Required Common Core",
    "Flexible Core",
  ]);
  const cards = page.locator(".selector-course");
  expect(await cards.count()).toBeGreaterThan(2);
  for (const card of await cards.all()) {
    await expect(card.getByRole("checkbox")).toHaveCount(1);
    await expect(card.locator(".course-code")).toBeVisible();
    await expect(card.locator(".course-title")).toBeVisible();
    expect(await card.innerText()).not.toMatch(
      /bmcc-course-|specified course condition|required · target/,
    );
  }
  const styles = await cards.evaluateAll((items) =>
    items.map((item) => {
      const s = getComputedStyle(item);
      return [s.padding, s.borderWidth, s.borderRadius].join("|");
    }),
  );
  expect(new Set(styles).size).toBe(1);
  await expect(
    page.getByText(/Eligible courses not yet verified · unresolved/).first(),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  await shot(page, "selector-desktop");
  const mat = page
    .getByRole("article", { name: "MAT 301", exact: true })
    .first();
  await mat.getByText("Class details", { exact: false }).click();
  await expect(mat.getByText("Catalog credits: 4")).toBeVisible();
  await expect(mat.getByText(/Prerequisites:/)).toBeVisible();
  await mat.scrollIntoViewIfNeeded();
  await shot(page, "course-details");
  await mat.getByText("Class details", { exact: false }).click();
  await expect(mat.getByText("Catalog credits: 4")).not.toBeVisible();
  await expect(mat.getByRole("checkbox")).toBeChecked();
});

test("shared selection and exact allocation survive chat; deselection and release change clear them", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/campus/bmcc#completed");
  await choose(page);
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  for (const box of await page.getByRole("checkbox", { name: /MAT 301/ }).all())
    await expect(box).toBeChecked();
  await page.getByLabel("Apply MAT 301 to").selectOption({ index: 1 });
  await page
    .getByLabel("Proposed credits for MAT 301")
    .fill("3.00000000000000000000100");
  await back(page);
  await openTool(page, "Completed Courses");
  await expect(page.getByLabel("Proposed credits for MAT 301")).toHaveValue(
    "3.00000000000000000000100",
  );
  await choose(page, cisIndex);
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
  await expect(page.getByLabel("Apply MAT 301 to")).toHaveCount(0);
});

test("unsupported prompt discloses deterministic boundary; future deep link offers return only", async ({
  page,
}) => {
  await page.goto("/campus/bmcc");
  await prompt(page, "Am I eligible to graduate?");
  await expect(
    page.getByText(/Live AI advising is not available yet/),
  ).toBeVisible();
  await page.goto("/campus/bmcc#planner");
  await expect(page.getByText(/Not implemented. No upload/)).toBeVisible();
  await expect(page.getByLabel("Program / catalog release")).toHaveCount(0);
  await back(page);
  await expect(page.getByLabel("Your navigation prompt")).toBeVisible();
});

test("unavailable catalog exposes safe error only inside a tool", async ({
  page,
}) => {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({ status: 503, json: { detail: "private" } }),
  );
  await page.goto("/campus/bmcc#catalog");
  await expect(
    page.getByRole("alert").filter({ hasText: "README" }),
  ).toBeVisible();
  await back(page);
  await expect(
    page.getByRole("alert").filter({ hasText: "README" }),
  ).toHaveCount(0);
});

test("empty catalog is explicit and never fabricated", async ({ page }) => {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/campus/bmcc#catalog");
  await expect(page.getByText(/No catalog releases imported/)).toBeVisible();
});

test("missing exact release displays a safe scope error", async ({ page }) => {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill(
      new URL(route.request().url()).pathname.endsWith("/releases")
        ? { json: releases }
        : { status: 404, json: { detail: "not found" } },
    ),
  );
  await page.goto(
    "/campus/bmcc?campus=bmcc&program=missing&release=missing#catalog",
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "not found" }),
  ).toBeVisible();
});

test("invalid preview displays a safe validation error", async ({ page }) => {
  await mockCatalog(page);
  await page.route("**/preview", (route) =>
    route.fulfill({ status: 422, json: { detail: "private" } }),
  );
  await page.goto("/campus/bmcc#progress");
  await choose(page);
  await page
    .getByRole("checkbox", { name: /For this fictional scenario/ })
    .check();
  await page.getByRole("button", { name: "Run deterministic preview" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid selection" }),
  ).toBeVisible();
});

for (const width of [375, 768, 1440])
  test(`responsive ${width}px; keyboard, focus and readable titles`, async ({
    page,
  }) => {
    await mockCatalog(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/campus/bmcc");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    if (width === 375) {
      await page.getByText("A place to begin", { exact: true }).click();
      await shot(page, "chat-mobile");
    }
    await page
      .getByRole("log")
      .getByRole("button", { name: "Open Completed Courses", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("heading", { name: "Completed Courses", exact: true }),
    ).toBeFocused();
    await choose(page);
    await page.getByRole("link", { name: "Skip to workspace" }).press("Enter");
    await expect(page.locator("main")).toBeFocused();
    await expect(
      page.getByRole("heading", { name: "Completed Courses", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const titles = await page
      .locator(".selector-course .course-title")
      .evaluateAll((items) =>
        items.map((item) => {
          const s = getComputedStyle(item);
          return {
            size: parseFloat(s.fontSize),
            break: s.wordBreak,
            wrap: s.overflowWrap,
            overflow: item.scrollWidth > item.clientWidth,
          };
        }),
      );
    expect(
      titles.every(
        (title) =>
          title.size >= 13 &&
          title.break === "normal" &&
          title.wrap === "normal" &&
          !title.overflow,
      ),
    ).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    if (width === 375) await shot(page, "selector-mobile");
    await page
      .getByRole("button", { name: "Return to chatbot" })
      .press("Enter");
    await expect(
      page
        .getByRole("log")
        .getByRole("button", { name: "Open Completed Courses", exact: true }),
    ).toBeFocused();
  });

test("refresh and browser history restore exact context only; same-context navigation retains selections", async ({
  page,
}) => {
  await mockCatalog(page);
  const item = releases[csIndex];
  await page.goto(
    `/campus/bmcc?campus=${item.campus_id}&program=${item.program_id}&release=${item.release_id}#completed`,
  );
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  await back(page);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Selected once · 1 courses" }),
  ).toBeVisible();
  await choose(page, cisIndex);
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
});
