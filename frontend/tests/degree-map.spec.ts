import { test, expect, type Page } from "@playwright/test";
import cs from "./fixtures/catalog-cs.json" with { type: "json" };
import cis from "./fixtures/catalog-cis.json" with { type: "json" };
import releases from "./fixtures/releases.json" with { type: "json" };
import response from "./fixtures/progress.json" with { type: "json" };
import synthetic from "./fixtures/degree-map-synthetic.json" with { type: "json" };
const item = releases[0];
const context = (module = "map", release = item.release_id) =>
  `/campus/bmcc?campus=bmcc&program=${item.program_id}&release=${release}#${module}`;
async function mock(page: Page, catalog: unknown = cs) {
  await page.route("**/api/academic/**", (r) => {
    const path = new URL(r.request().url()).pathname;
    if (path.endsWith("/releases")) return r.fulfill({ json: releases });
    if (path.endsWith("/preview")) {
      const ids = r.request().postDataJSON().selected_course_ids;
      return r.fulfill({
        json: {
          ...response,
          snapshot: {
            ...response.snapshot,
            earned_credits:
              ids.length === 2 ? "7" : ids.length === 1 ? "4" : "0",
          },
        },
      });
    }
    return r.fulfill({ json: path.includes("cis-aas") ? cis : catalog });
  });
}
async function add(page: Page, code: string) {
  const input = page.getByRole("combobox", { name: "Add completed courses" });
  await input.fill(code);
  await expect(
    page.getByRole("listbox", { name: "Course suggestions" }),
  ).toBeVisible();
  await input.press("Enter");
}
const map = (page: Page) =>
  page.getByRole("region", { name: "Program degree map", exact: true });
test("program chat preview requires an explicit edition then opens the default map", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/campus/bmcc");
  await page
    .getByLabel("Your navigation prompt")
    .fill("Tell me about Computer Science");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".program-map-preview")).toContainText(
    "Computer Science A.S.",
  );
  await page
    .getByRole("button", { name: "Open Degree Map", exact: true })
    .click();
  await expect(map(page)).toHaveCount(0);
  await page
    .getByLabel("Program / catalog release")
    .selectOption(
      JSON.stringify([item.campus_id, item.program_id, item.release_id]),
    );
  await expect(
    map(page).getByRole("heading", { name: "Computer Science A.S." }),
  ).toBeVisible();
  await expect(map(page)).toContainText("not a complete degree plan");
  await expect(map(page).locator(".degree-node--course").first()).toBeVisible();
});
test("real map course detail is edition-bound and never invents prerequisite edges", async ({
  page,
}) => {
  await mock(page);
  await page.goto(context());
  const m = map(page);
  const course = m.getByRole("button", { name: /View CSC 211/ });
  await course.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("2026-2027");
  await expect(dialog).toContainText(
    "description for this catalog edition has not been captured",
  );
  await expect(
    dialog.getByRole("link", { name: /View academic source/ }),
  ).toHaveAttribute("href", /^https:/);
  await expect(
    dialog.getByRole("button", { name: "Close course details" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(course).toBeFocused();
  for (let attempt = 0; attempt < 2; attempt++) {
    await course.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(course).toBeFocused();
  }
  await m
    .getByLabel("Focus a course")
    .selectOption("course:bmcc-course-mat-301");
  await expect(m.getByRole("status")).toContainText(
    "Verified earlier steps: Not established",
  );
  await expect(m.locator(".degree-edge--prerequisite")).toHaveCount(0);
  await expect(m.locator(".degree-edge--membership").first()).toBeAttached();
  await expect(m.locator(".degree-edge--membership").first()).toHaveAttribute(
    "aria-label",
    /^Requirement membership:/,
  );
});
test("compact search/chips update canonical map and the same deterministic preview", async ({
  page,
}) => {
  await mock(page);
  await page.goto(context());
  await map(page)
    .getByRole("button", { name: /Edit completed courses/ })
    .click();
  await expect(page.locator(".selector-grid")).not.toBeVisible();
  await add(page, "MAT 301");
  await add(page, "CSC 101");
  await expect(page.locator(".history-chips li")).toHaveCount(2);
  await page.getByRole("button", { name: /Return to degree map/ }).click();
  const m = map(page);
  await m
    .getByLabel("Focus a course")
    .selectOption("course:bmcc-course-mat-301");
  await expect(m.locator(".degree-node.is-selected")).toContainText(
    "Reported complete",
  );
  await m.getByRole("button", { name: "View deterministic progress" }).click();
  await page
    .getByRole("checkbox", { name: /For this fictional scenario/ })
    .check();
  const request = page.waitForRequest((r) => r.url().endsWith("/preview"));
  await page.getByRole("button", { name: "Run deterministic preview" }).click();
  expect((await request).postDataJSON().selected_course_ids).toEqual([
    "bmcc-course-mat-301",
    "bmcc-course-csc-101",
  ]);
  await expect(page.getByText("7", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Return to degree map/ }).click();
  await expect(map(page).locator(".degree-progress-summary")).toContainText(
    "7 hypothetical unique credits",
  );
  await expect(
    map(page).getByRole("button", { name: /View CSC 211/ }),
  ).toContainText("Requirement remaining in preview");
  await map(page)
    .getByRole("button", { name: /Edit completed courses/ })
    .click();
  const update = page.waitForRequest((r) => r.url().endsWith("/preview"));
  await page.getByRole("button", { name: "Remove CSC 101" }).click();
  expect((await update).postDataJSON().selected_course_ids).toEqual([
    "bmcc-course-mat-301",
  ]);
  await page.getByRole("button", { name: /Return to degree map/ }).click();
  await expect(map(page).locator(".degree-progress-summary")).toContainText(
    "4 hypothetical unique credits",
  );
  await expect(map(page).locator(".degree-progress-summary")).toContainText(
    "degree status remains unresolved",
  );
});
test("synthetic fixture verifies AND/OR directional paths, list parity and collapse without academic mutations", async ({
  page,
}) => {
  await mock(page, synthetic);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(context("map", synthetic.release.id));
  const m = map(page);
  await expect(m.getByText(/Synthetic demonstration · not BMCC/)).toBeVisible();
  await m.getByLabel("Focus a course").selectOption("course:m301");
  await expect(m.locator(".degree-node--all.is-upstream")).toHaveCount(1);
  await expect(m.locator(".degree-node--any.is-upstream")).toHaveCount(1);
  await expect(m.locator(".degree-node.is-downstream")).toHaveCount(1);
  await expect(
    m.locator(".degree-edge.is-emphasized .react-flow__edge-path").first(),
  ).toHaveCSS("animation-name", "none");
  await m.getByRole("button", { name: "Zoom In", exact: true }).click();
  await m.getByRole("button", { name: "Fit selected pathway" }).click();
  await m.getByLabel("Highlight paths").selectOption("upstream");
  await expect(m.locator(".degree-node.is-downstream")).toHaveCount(0);
  await m.getByLabel("Highlight paths").selectOption("downstream");
  await expect(m.locator(".degree-node.is-upstream")).toHaveCount(0);
  await m.getByLabel("Highlight paths").selectOption("both");
  const count = await m.locator(".degree-node").count();
  await m.getByRole("button", { name: "Show accessible list" }).click();
  await expect(m.locator(".degree-map-list>li")).toHaveCount(count);
  await expect(m.locator(".degree-map-list")).toContainText("One of");
  await m.getByRole("button", { name: "Collapse all groups" }).click();
  expect(await m.locator(".degree-map-list>li").count()).toBeLessThan(count);
  await expect(m.locator(".degree-progress-summary")).toContainText(
    "0 courses reported complete",
  );
});
test("map local course and remaining-requirements commands work without Gemini", async ({
  page,
}) => {
  await mock(page);
  await page.goto(context("chat"));
  await page
    .getByLabel("Your navigation prompt")
    .fill("Show prerequisites for MAT 301");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Open Degree Map" }).click();
  await expect(map(page).getByRole("status")).toContainText("MAT 301 pathway");
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await page
    .getByLabel("Your navigation prompt")
    .fill("Show remaining requirements");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Open Degree Progress" }).click();
  await expect(
    page.getByRole("button", { name: "Run deterministic preview" }),
  ).toBeDisabled();
});
test("missing map data stays limited rather than generating a fictional program map", async ({
  page,
}) => {
  const value = { ...cs, degree_map: undefined };
  await mock(page, value);
  await page.goto(context());
  await expect(
    page.getByRole("heading", {
      name: "This program map is not available yet.",
    }),
  ).toBeVisible();
  await expect(page.locator(".degree-node")).toHaveCount(0);
});
for (const width of [375, 768, 1440])
  test(`degree map and compact history fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await mock(page);
    await page.goto(context());
    const m = map(page);
    await expect(m).toContainText("Draft degree map");
    if (width === 375)
      await expect(m.locator(".degree-map-list")).toBeVisible();
    else await expect(m.locator(".degree-node--course").first()).toBeVisible();
    const dir = process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images";
    if (process.env.CAPTURE_DEGREE_SHOTS === "1")
      await page.screenshot({
        path: `${dir}/phase04d-map-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await m.getByRole("button", { name: /Edit completed courses/ }).click();
    await add(page, "MAT 301");
    await add(page, "CSC 101");
    await expect(page.locator(".history-chips li")).toHaveCount(2);
    if (process.env.CAPTURE_DEGREE_SHOTS === "1")
      await page.screenshot({
        path: `${dir}/phase04d-history-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Remove MAT 301" }).press("Enter");
    await expect(page.locator(".history-chips li")).toHaveCount(1);
  });

test("late preview response cannot replace results for newer course selections", async ({
  page,
}) => {
  await mock(page);
  let oldRoute: import("@playwright/test").Route | undefined;
  await page.route("**/preview", async (r) => {
    const ids = r.request().postDataJSON().selected_course_ids;
    if (ids.length === 1) {
      oldRoute = r;
      return;
    }
    return r.fulfill({
      json: {
        ...response,
        snapshot: { ...response.snapshot, earned_credits: "7" },
      },
    });
  });
  await page.goto(context("completed"));
  await add(page, "MAT 301");
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await page
    .getByLabel("Your navigation prompt")
    .fill("Show remaining requirements");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.getByRole("button", { name: "Open Degree Progress" }).click();
  await page
    .getByRole("checkbox", { name: /For this fictional scenario/ })
    .check();
  const oldRequest = page.waitForRequest((r) => r.url().endsWith("/preview"));
  await page.getByRole("button", { name: "Run deterministic preview" }).click();
  await oldRequest;
  await page.getByRole("button", { name: /Return to degree map/ }).click();
  await map(page)
    .getByRole("button", { name: /Edit completed courses/ })
    .click();
  await add(page, "CSC 101");
  await page.getByRole("button", { name: /Return to degree map/ }).click();
  await expect(map(page).locator(".degree-progress-summary")).toContainText(
    "7 hypothetical unique credits",
  );
  await oldRoute!.fulfill({
    json: {
      ...response,
      snapshot: { ...response.snapshot, earned_credits: "4" },
    },
  });
  await expect(map(page).locator(".degree-progress-summary")).toContainText(
    "7 hypothetical unique credits",
  );
});

test("unknown course navigation stays explicit without creating a course", async ({
  page,
}) => {
  await mock(page);
  await page.goto(context().replace("#map", "&focus_code=ZZZ+999#map"));
  await expect(
    page.getByRole("status").filter({ hasText: "That course isn’t captured" }),
  ).toBeVisible();
  await expect(map(page).locator(".degree-node.is-selected")).toHaveCount(0);
});
