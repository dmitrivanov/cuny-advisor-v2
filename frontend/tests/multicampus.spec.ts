import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import releases from "./fixtures/releases.json" with { type: "json" };
import cs from "./fixtures/catalog-cs.json" with { type: "json" };
import cis from "./fixtures/catalog-cis.json" with { type: "json" };
test.use({
  video: process.env.CAPTURE_MULTICAMPUS_SHOTS === "1" ? "on" : "off",
});
const info = (page: Page) => page.locator("#campus-information");
const node = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`^${name} ·`) });
async function shot(page: Page, name: string) {
  if (process.env.CAPTURE_MULTICAMPUS_SHOTS === "1") {
    await page.waitForTimeout(420);
    await page.screenshot({
      path: `${process.env.WORKSPACE_SCREENSHOT_DIR ?? "../docs/images"}/phase03b-${name}.png`,
      fullPage: true,
    });
  }
}
async function mock(page: Page) {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/releases")
        ? releases
        : route.request().url().includes("cis-aas")
          ? cis
          : cs,
    }),
  );
}

test("graph-first landing exposes contextual details and a dismissible unavailable notice", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Choose your campus." }),
  ).toBeVisible();
  await expect(page.locator(".campus-node")).toHaveCount(8);
  await expect(info(page)).toHaveCount(0);
  await shot(page, "landing-1440");
  await node(page, "BMCC").focus();
  await expect(info(page)).toContainText(
    "Borough of Manhattan Community College",
  );
  await expect(node(page, "BMCC")).toHaveAttribute(
    "aria-describedby",
    "campus-information",
  );
  await shot(page, "bmcc-focus");
  await node(page, "CCNY").focus();
  await expect(info(page)).toContainText("The City College of New York");
  await shot(page, "ccny-focus");
  await node(page, "CCNY").click();
  await expect(page.getByRole("status")).toContainText("Assistant unavailable");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Dismiss campus notice" }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await node(page, "BMCC").hover();
  await expect(info(page)).toContainText("Local pilot available");
  await node(page, "BMCC").press("Escape");
  await expect(info(page)).toHaveCount(0);
  await page.getByText("Accessible campus list", { exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Talk to BMCC Advisor", exact: true }),
  ).toBeVisible();
});

for (const key of ["Enter", "Space"])
  test(`native ${key} opens BMCC directly`, async ({ page }) => {
    await page.goto("/");
    await node(page, "BMCC").focus();
    await node(page, "BMCC").press(key);
    await expect(page).toHaveURL(/\/campus\/bmcc$/);
  });

test.describe("ambient motion verification", () => {
  test("ambient layers animate while all campus targets stay fixed, pause on focus, and respect reduced motion", async ({
    page,
  }) => {
    await page.goto("/");
    const orbit = page.locator(".constellation-orbit");
    await expect(orbit).toHaveCSS("animation-name", "orbital-drift");
    const before = await node(page, "BMCC").boundingBox();
    const initialTransform = await orbit.evaluate(
      (el) => getComputedStyle(el).transform,
    );
    await page.waitForTimeout(1800);
    expect(
      await orbit.evaluate((el) => getComputedStyle(el).transform),
    ).not.toBe(initialTransform);
    expect(await node(page, "BMCC").boundingBox()).toEqual(before);
    await node(page, "CCNY").focus();
    await expect(orbit).toHaveCSS("animation-play-state", "paused");
    await expect(node(page, "CCNY")).toHaveCSS("outline-style", "solid");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(orbit).toHaveCSS("animation-name", "none");
    await expect(node(page, "CCNY")).toHaveCSS("transition-duration", "0s");
    await node(page, "BMCC").hover();
    await node(page, "BMCC").click();
    await expect(page).toHaveURL(/\/campus\/bmcc$/);
  });
});

for (const width of [375, 768, 1440])
  test(`landing ${width}px keeps targets separate, unclipped and directly actionable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1050 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const boxes = await page.locator(".campus-node").evaluateAll((nodes) =>
      nodes.map((n) => {
        const b = n.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          right: b.right,
          bottom: b.bottom,
          width: b.width,
          height: b.height,
        };
      }),
    );
    expect(
      boxes.every(
        (b) => b.x >= 0 && b.right <= width && b.width >= 44 && b.height >= 44,
      ),
    ).toBe(true);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        expect(
          a.right <= b.x ||
            b.right <= a.x ||
            a.bottom <= b.y ||
            b.bottom <= a.y,
        ).toBe(true);
      }
    if (width !== 1440) await shot(page, `landing-${width}`);
    await node(page, "CCNY").click();
    await expect(page.getByRole("status")).toContainText(
      "Assistant unavailable",
    );
    await page.getByRole("button", { name: "Dismiss campus notice" }).click();
    await node(page, "BMCC").click();
    await expect(page).toHaveURL(/\/campus\/bmcc$/);
    await expect(page.getByRole("log")).toContainText(
      "BMCC advising assistant prototype",
    );
  });

test("future and unknown campus routes cannot mount BMCC tools even with BMCC query", async ({
  page,
}) => {
  let calls = 0;
  page.on("request", (r) => {
    if (r.url().includes("/api/academic/")) calls++;
  });
  await page.goto(
    "/campus/ccny?campus=bmcc&program=bmcc-program-cs-as&release=bmcc-cs-as-2026-2027-draft-2#completed",
  );
  await expect(page.getByText(/Future assistant · Unavailable/)).toBeVisible();
  await expect(page.getByLabel("Your navigation prompt")).toHaveCount(0);
  expect(calls).toBe(0);
  const response = await page.goto("/campus/unknown");
  expect(response?.status()).toBe(404);
});

test("BMCC legacy deep link migrates deliberately; mismatched campus context is rejected", async ({
  page,
}) => {
  await mock(page);
  await page.goto(
    "/?campus=bmcc&program=bmcc-program-cs-as&release=bmcc-cs-as-2026-2027-draft-2#completed",
  );
  await expect(page).toHaveURL(/\/campus\/bmcc\?/);
  await expect(
    page.getByRole("heading", { name: "Major Requirements", exact: true }),
  ).toBeVisible();
  await page.goto("/campus/bmcc?campus=ccny&program=p&release=r#catalog");
  await expect(
    page.getByRole("alert").filter({ hasText: "another campus" }),
  ).toBeVisible();
});

test("adaptive goal asks one relevant question; correction preserves assistant and invalidates assumptions", async ({
  page,
}) => {
  await page.goto("/campus/bmcc");
  await shot(page, "chat-entry");
  await page
    .getByRole("button", { name: "Plan next semester", exact: true })
    .click();
  const next = page.getByRole("region", { name: "Next useful question" });
  await expect(next).toContainText("Where are you currently studying?");
  await expect(next.getByRole("heading")).toHaveCount(1);
  await next.getByLabel("Fictional answer", { exact: true }).fill("BMCC");
  await next
    .getByRole("button", { name: "Use fictional answer", exact: true })
    .click();
  await expect(next).toContainText("What program are you studying now?");
  await next
    .getByLabel("Fictional answer", { exact: true })
    .fill("Computer Science");
  await next.getByLabel("Institution for this information").fill("BMCC");
  await next
    .getByRole("button", { name: "Use fictional answer", exact: true })
    .click();
  await expect(next).toContainText("Which classes have you already finished?");
  await expect(page.getByText(/grade rank/i)).toHaveCount(0);
  await page
    .getByLabel("Your navigation prompt")
    .fill("Actually, I'm studying at LaGuardia, not BMCC.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "selected assistant is unchanged",
  );
  await expect(next).toContainText("What program are you studying now?");
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await expect(
    page.getByText(/Current answer: known.*LaGuardia/),
  ).toBeVisible();
  await page
    .getByLabel("Advising goal", { exact: true })
    .selectOption("explore_programs");
  await expect(next).toContainText(
    "No course history or scheduling preferences are needed",
  );
  await page.getByRole("link", { name: "Back to campuses" }).click();
  await node(page, "BMCC").click();
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await expect(
    page.getByText(/Current answer: known.*LaGuardia/),
  ).toBeVisible();
  await page.reload();
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await expect(
    page.getByText("Current answer: unknown", { exact: true }),
  ).toBeVisible();
});

test("exploration opens contextual module without collecting planning preferences; explicit profile bridge", async ({
  page,
}) => {
  await mock(page);
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto("/campus/bmcc");
  await page
    .getByRole("button", { name: "Explore academic programs", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Next useful question" }),
  ).toContainText("No course history or scheduling preferences are needed");
  await shot(page, "chat-action");
  await page
    .getByRole("log")
    .getByRole("button", { name: "Open Completed Courses", exact: true })
    .click();
  const summary = releases.find((r) => r.program_id === "bmcc-program-cs-as")!;
  await page
    .getByLabel("Program / catalog release")
    .selectOption(
      JSON.stringify([
        summary.campus_id,
        summary.program_id,
        summary.release_id,
      ]),
    );
  await page
    .getByRole("checkbox", { name: /MAT 301/ })
    .first()
    .check();
  await page
    .getByRole("button", {
      name: "Use these fictional completed courses in my profile",
    })
    .click();
  await shot(page, "completed-courses");
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await page
    .getByLabel("Review or correct a fact")
    .selectOption("completedCourses");
  await expect(page.getByText(/Current answer: known.*MAT 301/)).toBeVisible();
});

test.describe("actual touch input", () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 900 } });
  test("touch dismisses an unavailable notice and opens BMCC in one tap", async ({
    page,
  }) => {
    await page.goto("/");
    await node(page, "CCNY").tap();
    await expect(page.getByRole("status")).toContainText(
      "Assistant unavailable",
    );
    await page.getByRole("button", { name: "Dismiss campus notice" }).tap();
    await node(page, "BMCC").tap();
    await expect(page).toHaveURL(/\/campus\/bmcc$/);
  });
});

test("changing an exact release invalidates fictional profile applicability", async ({
  page,
}) => {
  await mock(page);
  await page.goto("/campus/bmcc#completed");
  const key = (id: string) => {
    const item = releases.find((r) => r.program_id === id)!;
    return JSON.stringify([item.campus_id, item.program_id, item.release_id]);
  };
  await page
    .getByLabel("Program / catalog release")
    .selectOption(key("bmcc-program-cs-as"));
  await page
    .getByRole("button", {
      name: "Use this draft for the fictional scenario only",
    })
    .click();
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await page
    .getByLabel("Review or correct a fact")
    .selectOption("academicContext");
  await expect(
    page.getByText(/Current answer: known.*fictional draft/),
  ).toBeVisible();
  await page
    .getByRole("log")
    .getByRole("button", { name: "Open Completed Courses", exact: true })
    .click();
  await page.getByText("Choose / change catalog", { exact: true }).click();
  await page
    .getByLabel("Program / catalog release")
    .selectOption(key("bmcc-program-cis-aas"));
  await page.getByRole("button", { name: "Return to chatbot" }).click();
  await expect(
    page.getByText("Current answer: unknown", { exact: true }),
  ).toBeVisible();
});

test("an unsure answer stays unresolved without repeating; goal can be cleared", async ({
  page,
}) => {
  await page.goto("/campus/bmcc");
  await page
    .getByRole("button", { name: "Plan next semester", exact: true })
    .click();
  const next = page.getByRole("region", { name: "Next useful question" });
  await next
    .getByRole("button", { name: "I’m not sure yet", exact: true })
    .click();
  await expect(next.getByRole("heading")).toHaveText(
    "What program are you studying now?",
  );
  await page.getByText("Fictional profile & goal", { exact: true }).click();
  await expect(
    page.getByText(/Explicitly unknown: Where are you currently studying/),
  ).toBeVisible();
  await page.getByLabel("Advising goal", { exact: true }).selectOption("");
  await expect(
    page.getByRole("region", { name: "Next useful question" }),
  ).toHaveCount(0);
});

test("mismatched catalog identity fails closed before rendering academic tools", async ({
  page,
}) => {
  await page.route("**/api/academic/**", (route) =>
    route.fulfill({
      json: route.request().url().endsWith("/releases") ? releases : cis,
    }),
  );
  await page.goto(
    "/campus/bmcc?campus=bmcc&program=bmcc-program-cs-as&release=bmcc-cs-as-2026-2027-draft-2#completed",
  );
  await expect(
    page.getByRole("alert").filter({ hasText: "does not match" }),
  ).toBeVisible();
  await expect(page.locator(".selector-course")).toHaveCount(0);
});
