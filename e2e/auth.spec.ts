// ============================================================
// apimon E2E — Auth Pages Tests
// ============================================================

import { test, expect } from "@playwright/test";

test.describe("Auth - Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login form renders with email and password fields", async ({ page }) => {
    // Email input
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();

    // Password input
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    await expect(passwordInput).toBeVisible();

    // Submit button
    const submitButton = page.getByRole("button", { name: /log in|sign in|submit/i });
    await expect(submitButton).toBeVisible();
  });

  test("shows link to signup page", async ({ page }) => {
    const signupLink = page.getByRole("link", { name: /sign up|create account|register/i });
    await expect(signupLink).toBeVisible();
  });
});

test.describe("Auth - Signup Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup");
  });

  test("signup form renders with name, email, and password fields", async ({ page }) => {
    // Name input
    const nameInput = page.getByLabel(/name/i).or(page.locator('input[name="name"]'));
    await expect(nameInput).toBeVisible();

    // Email input
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    await expect(emailInput).toBeVisible();

    // Password input
    const passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    await expect(passwordInput).toBeVisible();

    // Submit button
    const submitButton = page.getByRole("button", { name: /sign up|create|register|get started/i });
    await expect(submitButton).toBeVisible();
  });

  test("shows link to login page", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /log in|sign in|already have/i });
    await expect(loginLink).toBeVisible();
  });
});
