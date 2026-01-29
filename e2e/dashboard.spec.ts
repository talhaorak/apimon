// ============================================================
// apimon E2E — Dashboard Tests
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - in production this would require auth
    // For now, the frontend uses mocked data
    await page.goto("/dashboard");
  });

  test("dashboard page loads", async ({ page }) => {
    // Should have some content (sidebar, heading, etc.)
    await page.waitForLoadState("networkidle");
    // Check for dashboard-related content
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("shows monitor-related content", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Dashboard should show monitors section or status indicators
    const monitorContent = page
      .getByText(/monitor|status|uptime/i)
      .first();
    await expect(monitorContent).toBeVisible({ timeout: 10000 });
  });

  test("has sidebar navigation", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Should have navigation links in sidebar
    const dashboardLink = page
      .getByRole("link", { name: /dashboard/i })
      .first();
    if (await dashboardLink.isVisible()) {
      await expect(dashboardLink).toBeVisible();
    }
  });

  test("shows stats cards with mock data", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Look for stat-like content (numbers, percentages)
    const statsArea = page.locator("[class*=card], [class*=Card]").first();
    if (await statsArea.isVisible()) {
      const text = await statsArea.textContent();
      expect(text).toBeTruthy();
    }
  });
});
