import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("compares consumer tariffs and ranks the cheapest calculable option", async ({ page }) => {
  await page.locator('[data-test-id="fromPostalCode"]').fill("20100");
  await page.locator('[data-test-id="toPostalCode"]').fill("00100");
  await page.locator('[data-test-id="weightKg"]').fill("1");
  await page.locator('[data-test-id="lengthCm"]').fill("20");
  await page.locator('[data-test-id="widthCm"]').fill("15");
  await page.locator('[data-test-id="heightCm"]').fill("5");
  await page.locator('[data-test-id="comparePrices"]').click();

  await expect(page.getByText("Matkahuolto").first()).toBeVisible();
  await expect(page.locator('[data-test-id="bestPrice"]')).toContainText("8,80");
  await expect(page.getByText("Exact public tariff").first()).toBeVisible();
});

test("business mode exposes PostNord list-rate calculations", async ({ page }) => {
  await page.getByRole("button", { name: "Business / list rates" }).click();
  await page.locator('[data-test-id="comparePrices"]').click();

  await expect(page.getByText("PostNord").first()).toBeVisible();
  await expect(page.getByText("Contract list calculation").first()).toBeVisible();
  await expect(page.getByText(/Fuel surcharge: 10\.4%/).first()).toBeVisible();
});

test("editing an input invalidates the visible comparison", async ({ page }) => {
  await page.locator('[data-test-id="comparePrices"]').click();
  await expect(page.getByText("Comparison")).toBeVisible();

  await page.locator('[data-test-id="weightKg"]').fill("2");

  await expect(page.getByText("Comparison")).toHaveCount(0);
});

test("rejects invalid postal codes before calculating", async ({ page }) => {
  await page.locator('[data-test-id="fromPostalCode"]').fill("2010");
  await page.locator('[data-test-id="comparePrices"]').click();

  await expect(page.getByText("Use a 5-digit Finnish postal code.")).toBeVisible();
  await expect(page.getByText("Comparison")).toHaveCount(0);
});

test("has no serious or critical WCAG A/AA violations", async ({ page }) => {
  await page.locator('[data-test-id="comparePrices"]').click();
  await expect(page.getByText("Comparison")).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});

test("does not overflow horizontally", async ({ page }) => {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.innerWidth);
});
