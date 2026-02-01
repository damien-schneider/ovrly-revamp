import { expect, test } from "@playwright/test";

const OVRLY_TITLE_REGEX = /Ovrly/;
const GET_STARTED_REGEX = /Get started/i;
const LOGIN_URL_REGEX = /\/login/;

test("landing page loads correctly", async ({ page }) => {
  await page.goto("/");

  // Check title
  await expect(page).toHaveTitle(OVRLY_TITLE_REGEX);

  // Check for main heading - wait for auth to resolve
  await expect(page.locator("h1")).toContainText(
    "Stream overlays made simple",
    {
      timeout: 10_000,
    }
  );

  // Check for some features
  await expect(page.getByText("Chat & emotes")).toBeVisible();
  await expect(page.getByText("One URL for OBS")).toBeVisible();
  await expect(page.getByText("Customize live")).toBeVisible();

  // Check for CTA
  const getStarted = page
    .getByRole("link", { name: GET_STARTED_REGEX })
    .first();
  await expect(getStarted).toBeVisible();
});

test("navigation to login works", async ({ page }) => {
  await page.goto("/");
  // Wait for content to load
  await expect(page.locator("h1")).toContainText("Stream overlays", {
    timeout: 10_000,
  });
  await page.getByRole("link", { name: GET_STARTED_REGEX }).first().click();
  await expect(page).toHaveURL(LOGIN_URL_REGEX);
});
