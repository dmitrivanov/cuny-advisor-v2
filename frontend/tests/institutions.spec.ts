import { test, expect } from "@playwright/test";
import registry from "./fixtures/institutions.json" with { type: "json" };
async function shot(page: import("@playwright/test").Page, name: string) {
  if (process.env.CAPTURE_INSTITUTION_SHOTS === "1")
    await page.screenshot({
      path: `${process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images"}/phase04b-${name}.png`,
      fullPage: true,
    });
}
test("registry response drives all nodes, categories and unsupported institutions", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".campus-node")).toHaveCount(
    registry.institutions.length,
  );
  await expect(
    page.getByText(
      `${registry.institutions.length} institutions · BMCC is the only local academic pilot.`,
    ),
  ).toBeVisible();
  await shot(page, "registry-desktop");
  await page
    .getByRole("button", { name: "Medicine · Future assistant unavailable" })
    .focus();
  await expect(page.getByRole("tooltip")).toContainText(
    "Graduate / professional",
  );
  await expect(page.getByRole("tooltip")).toContainText(
    "CUNY School of Medicine",
  );
  await page
    .getByRole("button", { name: "Medicine · Future assistant unavailable" })
    .click();
  await expect(page.getByRole("status")).toContainText("Assistant unavailable");
  await page.getByRole("button", { name: "Dismiss campus notice" }).click();
  await page
    .getByRole("button", { name: "Macaulay · Future assistant unavailable" })
    .focus();
  await expect(page.getByRole("tooltip")).toContainText("Honors college");
  await expect(page.getByRole("tooltip")).toContainText("Consortial");
  await shot(page, "specialized-institution");
  await page.getByRole("button", { name: "BMCC · Pilot available" }).click();
  await expect(
    page.getByRole("heading", { name: "What’s your next step?" }),
  ).toBeVisible();
});
for (const width of [375, 768, 1440])
  test(`full registry at ${width}px stays accessible and separate`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.locator(".campus-node")).toHaveCount(
      registry.institutions.length,
    );
    const boxes = await page.locator(".campus-node").evaluateAll((nodes) =>
      nodes.map((n) => {
        const b = n.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          r: b.right,
          b: b.bottom,
          w: b.width,
          h: b.height,
        };
      }),
    );
    expect(
      boxes.every((b) => b.x >= 0 && b.r <= width && b.w >= 44 && b.h >= 44),
    ).toBe(true);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        expect(a.r <= b.x || b.r <= a.x || a.b <= b.y || b.b <= a.y).toBe(true);
      }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await shot(page, `registry-${width}`);
  });
test("loading, failure, retry and empty states never substitute a static registry", async ({
  page,
}) => {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/institutions", async (r) => {
    await gate;
    await r.fulfill({ status: 503, json: { error: "unavailable" } });
  });
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText("Loading");
  await expect(page.locator(".campus-node")).toHaveCount(0);
  release();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Institution registry unavailable" }),
  ).toContainText("Institution registry unavailable");
  await expect(page.locator(".campus-node")).toHaveCount(0);
  await shot(page, "registry-unavailable");
  await page.route("**/api/institutions", (r) =>
    r.fulfill({ json: { ...registry, institutions: [] } }),
  );
  await page
    .getByRole("button", { name: "Retry institution registry" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "No institutions have been imported",
  );
  await expect(page.locator(".campus-node")).toHaveCount(0);
});
test("response data, not frontend constants, determines display names", async ({
  page,
}) => {
  const value = {
    ...registry,
    institutions: registry.institutions.map((i) =>
      i.id === "bmcc" ? { ...i, display_name: "BMCC registry test" } : i,
    ),
  };
  await page.route("**/api/institutions", (r) => r.fulfill({ json: value }));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "BMCC registry test · Pilot available" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "BMCC · Pilot available", exact: true }),
  ).toHaveCount(0);
});
