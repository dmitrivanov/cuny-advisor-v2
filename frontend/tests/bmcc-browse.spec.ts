import { test, expect, type Page } from "@playwright/test";
import fixture from "./fixtures/bmcc-browse.json" with { type: "json" };
async function mock(page: Page) {
  await page.route("**/api/bmcc-catalog/**", async (r) => {
    const u = new URL(r.request().url()),
      tail = u.pathname.split("/").at(-1)!;
    if (tail === "snapshots") return r.fulfill({ json: fixture.snapshot });
    if (tail === "departments" || tail === "programs" || tail === "sources")
      return r.fulfill({ json: fixture[tail] });
    if (tail === "courses") {
      const q = (u.searchParams.get("q") ?? "").toLowerCase();
      const items = fixture.page.items.filter((c) =>
        `${c.code} ${c.title}`.toLowerCase().includes(q),
      );
      return r.fulfill({
        json: { ...fixture.page, total: items.length, items },
      });
    }
    const c = fixture.page.items.find((c) => c.id === tail);
    return c
      ? r.fulfill({ json: c })
      : r.fulfill({ status: 404, json: { detail: "not found" } });
  });
}
const explorer = (page: Page) => page.locator(".academic-explorer");
test("departments, programs and independent courses never invent academic membership", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/campus/bmcc#catalog");
  const e = explorer(page);
  await expect(
    e.getByRole("heading", { name: "Find your field." }),
  ).toBeVisible();
  await e.getByRole("button", { name: /Mathematics Explore courses/ }).click();
  await expect(
    e.getByText(/Program connections haven’t been confirmed/),
  ).toBeVisible();
  await expect(e.getByRole("button", { name: /View MAT 301/ })).toBeVisible();
  await e.getByRole("button", { name: "Programs", exact: true }).click();
  await e
    .getByRole("textbox", { name: "Search programs" })
    .fill("Computer Science");
  await e.getByRole("button", { name: "Search", exact: true }).click();
  await e
    .getByRole("button", { name: /Computer Science Associate in Science/ })
    .click();
  await expect(
    e.getByText(/Courses for this program haven’t been confirmed/),
  ).toBeVisible();
  await expect(
    e.getByRole("link", { name: /Explore this program/ }),
  ).toHaveAttribute("href", /bmcc.cuny.edu/);
  await e.getByRole("button", { name: /Browse all courses/ }).click();
  await expect(e.getByRole("button", { name: /View CSC 101/ })).toBeVisible();
  await page.goBack();
  await expect(
    e.getByText(/Courses for this program haven’t been confirmed/),
  ).toBeVisible();
  await page.goForward();
  await expect(e.getByRole("button", { name: /View CSC 101/ })).toBeVisible();
  await expect(e).not.toContainText(fixture.page.snapshot_id);
  await expect(e).not.toContainText("page_host_only");
});
test("course search, modal keyboard, source qualification and real pathway empty state", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/campus/bmcc?explore=courses#catalog");
  const e = explorer(page);
  await e
    .getByRole("textbox", { name: "Search courses", exact: true })
    .fill("MAT 301");
  await e.getByRole("button", { name: "Search", exact: true }).click();
  await expect(e.getByRole("button", { name: /View / })).toHaveCount(1);
  const trigger = e.getByRole("button", { name: /View MAT 301/ });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Close course details" }),
  ).toBeFocused();
  await expect(
    dialog.getByText(/Confirm this requirement with BMCC/).first(),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: /View official BMCC source/ }),
  ).toHaveAttribute("href", /^https:/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole("button", { name: /Explore course pathway/ }).click();
  await expect(
    e.getByText(/A verified pathway for this course isn’t available/),
  ).toBeVisible();
  await expect(e.locator(".react-flow")).toHaveCount(0);
  await expect(
    e.getByRole("heading", { name: "See how learning connects." }),
  ).toBeFocused();
  await page.reload();
  await expect(
    e.getByText(/A verified pathway for this course isn’t available/),
  ).toBeVisible();
});
test("validated chat deep links, return context, history and unavailable courses", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/campus/bmcc");
  await page
    .getByLabel("Your navigation prompt")
    .fill(`Open course ${fixture.page.items[0].id}`);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page
    .getByRole("button", { name: "Open Academic Explorer" })
    .last()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "← Return to chatbot" }).click();
  await expect(
    page.getByText(`Open course ${fixture.page.items[0].id}`, { exact: true }),
  ).toBeVisible();
  await page.goto("/campus/bmcc?explore=courses&course=not-found#catalog");
  await expect(explorer(page).getByRole("alert")).toContainText("try again");
});
test("synthetic graph has AND/OR, bidirectional selection, keyboard list, pan zoom fit and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mock(page);
  await page.goto("/campus/bmcc?explore=pathways&demo=pathway#catalog");
  const e = explorer(page);
  await expect(
    e.getByText("Fictional demonstration", { exact: true }),
  ).toBeVisible();
  await expect(
    e.getByRole("button", { name: "Select AND: Both branches" }),
  ).toBeVisible();
  await expect(
    e.getByRole("button", { name: "Select OR: One of these" }),
  ).toBeVisible();
  const node = e.getByRole("button", {
    name: "Select DEMO 201: Methods & practice",
  });
  await node.focus();
  await page.keyboard.press("Enter");
  await expect(e.locator(".pathway-summary")).toContainText(
    "Earlier steps: AND, OR, DEMO 101, DEMO 110, DEMO 120",
  );
  await expect(e.locator(".pathway-summary")).toContainText(
    "Later steps: DEMO 301",
  );
  await expect(e.locator(".pathway-node.is-upstream")).toHaveCount(5);
  await expect(e.locator(".pathway-node.is-downstream")).toHaveCount(1);
  await e.getByRole("button", { name: "Zoom In", exact: true }).click();
  await e.getByRole("button", { name: "Fit selected pathway" }).click();
  await expect(
    e.locator(".pathway-edge.is-upstream .react-flow__edge-path").first(),
  ).toHaveCSS("animation-name", "none");
  const pane = e.locator(".react-flow__pane");
  const box = (await pane.boundingBox())!;
  const transform = await e
    .locator(".react-flow__viewport")
    .getAttribute("style");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height - 70);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height - 100);
  await page.mouse.up();
  await expect(e.locator(".react-flow__viewport")).not.toHaveAttribute(
    "style",
    transform!,
  );
  await e.getByRole("button", { name: "Show accessible list" }).click();
  await expect(
    e.getByText("One of: DEMO 110, DEMO 120", { exact: true }),
  ).toBeVisible();
  await expect(
    e.getByText("All of: OR, DEMO 101", { exact: true }),
  ).toBeVisible();
  await e.getByRole("button", { name: "DEMO 101 · Foundations" }).click();
  await expect(e.locator(".pathway-summary")).toContainText(
    "Earlier steps: None shown",
  );
});
test("API failure stays plain, retryable and does not substitute fixtures", async ({
  page,
}) => {
  await page.route("**/api/bmcc-catalog/**", (r) =>
    r.fulfill({ status: 503, json: { detail: "private" } }),
  );
  await page.goto("/campus/bmcc#catalog");
  const e = explorer(page);
  await expect(e.getByRole("alert")).toContainText(
    "We couldn’t load this information. Please try again.",
  );
  await expect(e.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(e).not.toContainText("README");
  await expect(e.getByRole("button", { name: /View MAT/ })).toHaveCount(0);
});
for (const width of [375, 768, 1440])
  test(`explorer, detail and demo fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await mock(page);
    await page.goto("/campus/bmcc?explore=courses#catalog");
    const e = explorer(page);
    await expect(e.getByRole("button", { name: /View MAT 301/ })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const dir = process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images";
    if (process.env.CAPTURE_EXPLORER_SHOTS === "1")
      await page.screenshot({
        path: `${dir}/phase04c-ux-courses-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    await e.getByRole("button", { name: /View MAT 301/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (process.env.CAPTURE_EXPLORER_SHOTS === "1")
      await page.screenshot({
        path: `${dir}/phase04c-ux-detail-${width}.png`,
        fullPage: false,
        animations: "disabled",
      });
    await page.keyboard.press("Escape");
    await e.getByRole("button", { name: "Pathways", exact: true }).click();
    await e.getByRole("button", { name: "Try a fictional pathway" }).click();
    await expect(e.locator(".pathway-node")).toHaveCount(7);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (process.env.CAPTURE_EXPLORER_SHOTS === "1")
      await page.screenshot({
        path: `${dir}/phase04c-ux-pathway-${width}.png`,
        fullPage: true,
        animations: "disabled",
      });
  });
