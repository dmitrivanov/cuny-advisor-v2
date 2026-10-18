import { test, expect } from "@playwright/test";
import fixture from "./fixtures/bmcc-browse.json" with { type: "json" };
test("source browsing keeps catalog years, raw rules and draft audit context separate", async ({
  page,
}) => {
  await page.route("**/api/bmcc-catalog/**", async (r) => {
    const url = new URL(r.request().url()),
      tail = url.pathname.split("/").at(-1)!;
    if (tail === "snapshots") return r.fulfill({ json: fixture.snapshot });
    if (tail === "departments" || tail === "programs" || tail === "sources")
      return r.fulfill({ json: fixture[tail] });
    if (tail === "courses") {
      const query = (url.searchParams.get("q") ?? "").toLowerCase();
      const items = fixture.page.items.filter((c) =>
        `${c.code} ${c.title}`.toLowerCase().includes(query),
      );
      return r.fulfill({
        json: { ...fixture.page, total: items.length, items },
      });
    }
    return r.fulfill({ status: 404, json: { detail: "not found" } });
  });
  await page.goto("/campus/bmcc#catalog");
  await page.getByText("Browse BMCC source catalog", { exact: true }).click();
  await page
    .getByLabel("Browsing snapshot", { exact: true })
    .selectOption(fixture.page.snapshot_id);
  await expect(
    page.getByRole("status").filter({ hasText: "3 courses match" }),
  ).toBeVisible();
  await page.getByLabel("Search BMCC courses", { exact: true }).fill("MAT 301");
  await page
    .getByRole("button", { name: "Search courses", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "1 courses match" }),
  ).toBeVisible();
  await page
    .getByText("Course description and source details for MAT 301", {
      exact: true,
    })
    .click();
  await page.getByText("Prerequisites · provisional", { exact: true }).click();
  const prerequisite = page
    .locator("details.class-details")
    .filter({
      has: page.getByText("Prerequisites · provisional", { exact: true }),
    });
  await expect(
    prerequisite.getByText(
      "Structured interpretation: unresolved. Academic review required.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(prerequisite.getByText(/MAT 206 or MAT 206.5/)).toBeVisible();
  await expect(
    prerequisite.getByText(/Supporting evidence candidate only/),
  ).toBeVisible();
  await page
    .getByText("Departments and program identities", { exact: true })
    .click();
  await expect(
    page.getByText(
      /Computer Science · AS · requirements pending · year unconfirmed/,
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run deterministic preview" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "← Return to chatbot" }).click();
  await expect(
    page.getByRole("heading", { name: "What’s your next step?" }),
  ).toBeVisible();
});
test("unavailable browsing does not substitute fixtures or remove BMCC navigation", async ({
  page,
}) => {
  await page.route("**/api/bmcc-catalog/**", (r) =>
    r.fulfill({ status: 503, json: { detail: "unavailable" } }),
  );
  await page.goto("/campus/bmcc#catalog");
  await page.getByText("Browse BMCC source catalog", { exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "BMCC source catalog unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Retry BMCC source catalog" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "← Return to chatbot" }).click();
  await expect(
    page.getByRole("heading", { name: "What’s your next step?" }),
  ).toBeVisible();
});

for (const width of [375, 768, 1440])
  test(`source course browsing fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route("**/api/bmcc-catalog/**", (r) => {
      const tail = new URL(r.request().url()).pathname.split("/").at(-1)!;
      return r.fulfill({
        json:
          tail === "snapshots"
            ? fixture.snapshot
            : tail === "courses"
              ? fixture.page
              : fixture[tail as "sources" | "departments" | "programs"],
      });
    });
    await page.route("**/api/academic/releases", (r) =>
      r.fulfill({ json: [] }),
    );
    await page.goto("/campus/bmcc#catalog");
    await page.getByText("Browse BMCC source catalog", { exact: true }).click();
    await page
      .getByLabel("Browsing snapshot", { exact: true })
      .selectOption(fixture.page.snapshot_id);
    await expect(
      page.getByRole("status").filter({ hasText: "3 courses match" }),
    ).toBeVisible();
    await page
      .getByText("Course description and source details for MAT 301", {
        exact: true,
      })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (process.env.CAPTURE_BMCC_SHOTS === "1")
      await page.screenshot({
        path: `${process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images"}/phase04c1-browse-${width}.png`,
        fullPage: true,
      });
  });
