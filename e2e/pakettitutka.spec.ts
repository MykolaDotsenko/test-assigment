import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("compares consumer tariffs and ranks the cheapest calculable option", async ({ page }) => {
  await page.locator('[data-test-id="weightKg"]').fill("1");
  await page.locator('[data-test-id="lengthCm"]').fill("25");
  await page.locator('[data-test-id="widthCm"]').fill("15");
  await page.locator('[data-test-id="heightCm"]').fill("5");
  await page.locator('[data-test-id="comparePrices"]').click();

  const results = page.locator('[data-test-id="results"]');
  await expect(results).toBeFocused();
  await expect(page.getByText("Matkahuolto").first()).toBeVisible();
  await expect(page.locator('[data-test-id="bestPrice"]')).toContainText("8,80");
  await expect(page.getByText("Published public tariff").first()).toBeVisible();
  await expect(page.locator('[data-test-id="results"]').getByRole("link", { name: /Verify Matkahuolto pricing/ })).toBeVisible();
});

test("business mode exposes PostNord list-rate calculations", async ({ page }) => {
  await page.getByRole("button", { name: "Business list rates" }).click();
  await page.locator('[data-test-id="comparePrices"]').click();

  const results = page.locator('[data-test-id="results"]');
  await expect(results.getByText("PostNord").first()).toBeVisible();
  await expect(results.getByText("Published list calculation").first()).toBeVisible();
  await expect(results.getByText("Matkahuolto")).toHaveCount(0);
  await expect(results.getByText("GLS Finland")).toHaveCount(0);
  await results.getByText("Calculation details").first().click();
  await expect(results.getByText(/Fuel surcharge: 10\.4%/).first()).toBeVisible();
});

test("editing an input invalidates the visible comparison", async ({ page }) => {
  await page.locator('[data-test-id="comparePrices"]').click();
  await expect(page.getByText("Comparison", { exact: true })).toBeVisible();

  await page.locator('[data-test-id="weightKg"]').fill("2");

  await expect(page.getByText("Comparison", { exact: true })).toHaveCount(0);
});

test("rejects invalid parcel measurements before calculating", async ({ page }) => {
  await page.locator('[data-test-id="weightKg"]').fill("0");
  await page.locator('[data-test-id="comparePrices"]').click();

  await expect(page.getByText("Enter a positive weight.")).toBeVisible();
  await expect(page.getByText("Comparison", { exact: true })).toHaveCount(0);
});

test("supports Åland route without asking for a postcode or GPS", async ({ page }) => {
  await page.getByRole("button", { name: /To \/ from Åland/ }).click();
  await page.locator('[data-test-id="comparePrices"]').click();

  const results = page.locator('[data-test-id="results"]');
  await expect(results.getByText("Mainland Finland ↔ Åland")).toBeVisible();
  await results.getByText("Calculation details").first().click();
  await expect(results.getByText("Åland tariff applied")).toBeVisible();
});

test("has no serious or critical WCAG A/AA violations", async ({ page }) => {
  await page.locator('[data-test-id="comparePrices"]').click();
  await expect(page.getByText("Comparison", { exact: true })).toBeVisible();

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


test("filters the carrier directory by pricing availability", async ({ page }) => {
  await page.getByRole("button", { name: /Live quote/ }).click();

  const directory = page.locator("#providers");
  await expect(directory.getByText("FedEx", { exact: true })).toBeVisible();
  await expect(directory.getByText("Posti", { exact: true })).toHaveCount(0);
  await expect(directory.getByText(/8 carriers shown/)).toBeVisible();
});


test("clears hidden GLS modifiers when pricing context changes", async ({ page }) => {
  await page.getByText("GLS options").click();
  const pickup = page.getByRole("checkbox", { name: /Pickup from sender/ });
  await pickup.check();
  await expect(pickup).toBeChecked();

  await page.getByRole("button", { name: "Business list rates" }).click();
  await page.getByRole("button", { name: "Public / no-contract" }).click();
  await page.getByText("GLS options").click();

  await expect(page.getByRole("checkbox", { name: /Pickup from sender/ })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Deliver to recipient/ })).not.toBeChecked();
});


test("guides unsupported shipments to live-quote carriers", async ({ page }) => {
  await page.locator('[data-test-id="weightKg"]').fill("100");
  await page.locator('[data-test-id="lengthCm"]').fill("250");
  await page.locator('[data-test-id="widthCm"]').fill("100");
  await page.locator('[data-test-id="heightCm"]').fill("100");
  await page.locator('[data-test-id="comparePrices"]').click();

  const results = page.locator('[data-test-id="results"]');
  await expect(results).toBeFocused();
  await expect(results.getByText("No tariff-backed option fits these inputs.")).toBeVisible();
  await expect(results.getByRole("link", { name: /Browse live-quote carriers/ })).toHaveAttribute("href", "#providers");
});


test("applies PostNord island and ferry surcharge from an optional destination postcode", async ({ page }) => {
  await page.getByRole("button", { name: "Business list rates" }).click();
  await page.locator('[data-test-id="destinationPostalCode"]').fill("00190");
  await page.locator('[data-test-id="weightKg"]').fill("1");
  await page.locator('[data-test-id="lengthCm"]').fill("15");
  await page.locator('[data-test-id="widthCm"]').fill("10");
  await page.locator('[data-test-id="heightCm"]').fill("1.5");
  await page.locator('[data-test-id="comparePrices"]').click();

  const results = page.locator('[data-test-id="results"]');
  await results.getByText("Calculation details").first().click();
  await expect(results.getByText("Island/ferry surcharge: +€11.63 excl. VAT").first()).toBeVisible();
  await expect(results).toContainText("destination 00190");
});

test("validates the optional business destination postcode without requiring it", async ({ page }) => {
  await page.getByRole("button", { name: "Business list rates" }).click();
  await page.locator('[data-test-id="destinationPostalCode"]').fill("1234");
  await page.locator('[data-test-id="comparePrices"]').click();

  await expect(page.getByText("Use a 5-digit Finnish postal code or leave it blank.")).toBeVisible();
  await expect(page.getByText("Comparison", { exact: true })).toHaveCount(0);
});


test("serves branded install metadata", async ({ page }) => {
  const manifest = await page.evaluate(async () => {
    const response = await fetch("/manifest.webmanifest");
    return {
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      body: await response.json(),
    };
  });

  expect(manifest.ok).toBe(true);
  expect(manifest.contentType).toContain("application/manifest+json");
  expect(manifest.body.name).toContain("Pakettitutka");
  expect(manifest.body.short_name).toBe("Pakettitutka");
  expect(manifest.body.start_url).toBe("/");
});

test("keeps key controls at least 44px tall for touch use", async ({ page }) => {
  const selectors = [
    '[data-test-id="comparePrices"]',
    '.audience-switch .segment',
    '.route-switch .route-option',
    '.preset-row .preset-button',
    '.site-nav a',
    '.directory-filter',
  ];

  for (const selector of selectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await elements.nth(index).boundingBox();
      expect(box, `${selector} should be visible`).not.toBeNull();
      expect(box?.height ?? 0, `${selector} should be at least 44px tall`).toBeGreaterThanOrEqual(44);
    }
  }
});
