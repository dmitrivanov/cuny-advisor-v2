import { test, expect, type Page } from "@playwright/test";
import cs from "./fixtures/catalog-cs.json" with { type: "json" };
import cis from "./fixtures/catalog-cis.json" with { type: "json" };
import releases from "./fixtures/releases.json" with { type: "json" };
import progress from "./fixtures/progress.json" with { type: "json" };
const key = (index: number) =>
  JSON.stringify([
    releases[index].campus_id,
    releases[index].program_id,
    releases[index].release_id,
  ]);
async function mockCatalog(page: Page) {
  await page.route("**/api/academic/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/releases"))
      return route.fulfill({ json: releases });
    if (url.pathname.endsWith("/preview"))
      return route.fulfill({ json: progress });
    return route.fulfill({ json: url.pathname.includes("cis-aas") ? cis : cs });
  });
}
async function chooseCS(page: Page) {
  if (!(await page.getByLabel("Program / catalog release").isVisible()))
    await page.getByText("Choose / change catalog", { exact: true }).click();
  await page.getByLabel("Program / catalog release").selectOption(key(0));
  await expect(
    page.getByText(cs.release.id, { exact: false }).first(),
  ).toBeVisible();
}
const nav = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Academic modules" })
    .getByRole("link", { name, exact: false });

test("chat → persisted-shaped catalog → selections → chat → progress; context clears on switch", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A little more clarity." }),
  ).toBeVisible();
  await page
    .getByLabel("Your navigation prompt")
    .fill("Show me the academic programs.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page
    .getByRole("log")
    .getByRole("button", { name: "Academic Catalog" })
    .last()
    .click();
  await chooseCS(page);
  await expect(
    page.getByRole("heading", { name: "Requirements & categories" }),
  ).toBeVisible();
  await nav(page, "Chat Workspace").click();
  await page
    .getByLabel("Your navigation prompt")
    .fill("Open completed courses");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page
    .getByRole("log")
    .getByRole("button", { name: "Completed Courses" })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Required Common Core", exact: true }),
  ).toBeVisible();
  for (const code of ["MAT 301", "CSC 101"])
    await page
      .getByRole("checkbox", { name: new RegExp(code) })
      .first()
      .check();
  await expect(
    page.getByRole("heading", { name: "Selected once · 2 courses" }),
  ).toBeVisible();
  await nav(page, "Chat Workspace").click();
  await expect(
    page.getByText(/2 unique hypothetical selections/),
  ).toBeVisible();
  await nav(page, "Degree Progress").click();
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
  await page.getByLabel("Program / catalog release").selectOption(key(1));
  await expect(
    page.getByText(/0 unique hypothetical selections/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Requirement outcomes" }),
  ).not.toBeVisible();
  await nav(page, "Academic Catalog").click();
  await expect(page.getByText(/CIS is a partial reference/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByText(/0 unique hypothetical selections/),
  ).toBeVisible();
});

test("shared checkboxes have a single selection; exact allocations survive navigation", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.goto("/#completed");
  await chooseCS(page);
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  for (const checkbox of await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .all())
    await expect(checkbox).toBeChecked();
  await page.getByLabel("Apply MAT 301 to").selectOption({ index: 1 });
  await page
    .getByLabel("Proposed credits for MAT 301")
    .fill("3.00000000000000000000100");
  await nav(page, "Chat Workspace").click();
  await nav(page, "Completed Courses").click();
  await expect(page.getByLabel("Proposed credits for MAT 301")).toHaveValue(
    "3.00000000000000000000100",
  );
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .uncheck();
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
});

test("unsupported questions, future modules, empty catalog and unavailable/missing release", async ({
  page,
}) => {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({ status: 503, json: { detail: "unavailable" } }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("alert").filter({ hasText: "README" }),
  ).toContainText("README");
  await page
    .getByLabel("Your navigation prompt")
    .fill("Am I eligible to graduate?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText(/Live AI advising is not available yet/),
  ).toBeVisible();
  await nav(page, "Semester Planner").click();
  await expect(page.getByText(/Not implemented. No upload/)).toBeVisible();
  await page.unroute("**/api/academic/**");
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.goto("/");
  await expect(page.getByText(/No catalog releases imported/)).toBeVisible();
  await page.unroute("**/api/academic/**");
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({ status: 404, json: { detail: "not found" } }),
  );
  await page.goto("/?campus=bmcc&program=missing&release=missing#catalog");
  await expect(
    page.getByRole("alert").filter({ hasText: "not found" }).last(),
  ).toContainText("not found");
});

test("invalid evaluation response displays safe error", async ({ page }) => {
  await mockCatalog(page);
  await page.route("**/preview", (route) =>
    route.fulfill({ status: 422, json: { detail: "invalid" } }),
  );
  await page.goto("/#progress");
  await chooseCS(page);
  await page
    .getByRole("checkbox", { name: /For this fictional scenario/ })
    .check();
  await page.getByRole("button", { name: "Run deterministic preview" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Invalid selection" }),
  ).toContainText("Invalid selection");
});

for (const width of [375, 768, 1440])
  test(`responsive ${width}px, keyboard, reduced motion and screenshot`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockCatalog(page);
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeFocused();
    await chooseCS(page);
    await page.getByText("Choose / change catalog", { exact: true }).click();
    await page.getByRole("heading", { name: "A little more clarity." }).click();
    if (width === 1440 && process.env.CAPTURE_WORKSPACE_SHOTS === "1")
      await page.screenshot({
        path: "../docs/images/phase02d-home1440.png",
        fullPage: false,
      });
    if (width === 1440) await nav(page, "Completed Courses").click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    if (process.env.CAPTURE_WORKSPACE_SHOTS === "1")
      await page.screenshot({
        path: `../docs/images/phase02d-${width}.png`,
        fullPage: false,
      });
  });

test("deep links and browser history preserve same-context selections but clear on context change", async ({
  page,
}) => {
  await mockCatalog(page);
  await page.goto(
    `/?campus=${releases[0].campus_id}&program=${releases[0].program_id}&release=${releases[0].release_id}#completed`,
  );
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  await nav(page, "Chat Workspace").click();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Selected once · 1 courses" }),
  ).toBeVisible();
  await page.getByText("Choose / change catalog", { exact: true }).click();
  await page.getByLabel("Program / catalog release").selectOption(key(1));
  await expect(
    page.getByText(/0 unique hypothetical selections/),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Selected once · 0 courses" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => [localStorage.length, sessionStorage.length]),
  ).toEqual([0, 0]);
});
