import { expect, test } from "@playwright/test";

const OVRLY_TITLE_REGEX = /Ovrly/;
const START_FOR_FREE_REGEX = /Start for free/i;
const LOGIN_URL_REGEX = /\/login/;

test("landing page loads correctly", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log(`Error: "${msg.text()}"`);
      errors.push(msg.text());
    }
  });

  await page.goto("/");

  // Check title
  await expect(page).toHaveTitle(OVRLY_TITLE_REGEX);

  // Check for main heading
  // The word "made simple" is typed by typewriter effect, so we might need to wait or just check for "Chat overlays"
  await expect(page.locator("h1")).toContainText("Chat overlays");

  // Check for "made simple" which is typed by typewriter effect
  // We use a regex or wait for it to be visible
  await expect(page.getByText("made simple")).toBeVisible({ timeout: 10_000 });

  expect(errors).toEqual([]);

  // Check for some features
  await expect(page.getByText("Instant setup")).toBeVisible();
  await expect(page.getByText("Real-time sync")).toBeVisible();
  await expect(page.getByText("Fully customizable")).toBeVisible();

  // Check for CTA
  const startForFree = page
    .getByRole("link", { name: START_FOR_FREE_REGEX })
    .first();
  await expect(startForFree).toBeVisible();
});

test("navigation to login works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: START_FOR_FREE_REGEX }).first().click();
  await expect(page).toHaveURL(LOGIN_URL_REGEX);
});
