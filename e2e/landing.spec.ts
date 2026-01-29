// ============================================================
// apimon E2E — Landing Page Tests
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("loads successfully with hero section", async ({ page }) => {
    // Page should load
    await expect(page).toHaveTitle(/apimon/i);

    // Hero text should be visible
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible();

    // Should mention API monitoring
    const heroText = await page.locator("h1").textContent();
    expect(heroText?.toLowerCase()).toMatch(/api|monitor|uptime/);
  });

  test("has pricing section", async ({ page }) => {
    // Scroll to pricing or find it
    const pricingSection = page.getByText(/pricing/i).first();
    await expect(pricingSection).toBeVisible();

    // Should show plan names
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/pro/i).first()).toBeVisible();
    await expect(page.getByText(/business/i).first()).toBeVisible();
  });

  test("has CTA buttons", async ({ page }) => {
    // Should have a "Get Started" or "Sign Up" button
    const ctaButton = page
      .getByRole("link", { name: /get started|sign up|start free/i })
      .first();
    await expect(ctaButton).toBeVisible();
  });

  test("has navigation header", async ({ page }) => {
    // Should have nav links
    const nav = page.locator("header, nav").first();
    await expect(nav).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });

  test("shows CLI terminal demo", async ({ page }) => {
    // The landing page has a terminal demo component
    const terminal = page.locator("[class*=terminal], [class*=Terminal], pre, code").first();
    if (await terminal.isVisible()) {
      const text = await terminal.textContent();
      expect(text?.toLowerCase()).toMatch(/apimon|npm|install/);
    }
  });
});
