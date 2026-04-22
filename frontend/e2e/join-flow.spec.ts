/**
 * Sprint 4 — Smoke test: Player Join flow
 *
 * Verifies the /join page renders correctly and validates the form before
 * allowing submission. A real join requires a live backend + Redis, so the
 * test stops short of clicking "Enter Room" and mocks the API response.
 */
import { test, expect } from "@playwright/test";

test.describe("Player Join flow", () => {
  test("renders the Join page with room-code input and nickname field", async ({
    page,
  }) => {
    await page.goto("/join");

    // Page title visible
    await expect(
      page.getByRole("heading", { name: /join a game/i })
    ).toBeVisible();

    // Room code and nickname inputs exist
    const codeInput = page.getByPlaceholder("ABC-XYZ");
    await expect(codeInput).toBeVisible();

    const nickInput = page.getByPlaceholder(/astroalex/i);
    await expect(nickInput).toBeVisible();

    // Submit button is disabled when inputs are empty
    const enterBtn = page.getByRole("button", { name: /enter room/i });
    await expect(enterBtn).toBeDisabled();
  });

  test("enables submit button when both inputs are filled", async ({ page }) => {
    await page.goto("/join");

    await page.getByPlaceholder("ABC-XYZ").fill("ABC-XYZ");
    await page.getByPlaceholder(/astroalex/i).fill("TestPlayer");

    const enterBtn = page.getByRole("button", { name: /enter room/i });
    await expect(enterBtn).toBeEnabled();
  });

  test("pre-fills code from URL param /join/:code", async ({ page }) => {
    await page.goto("/join/QRS-TUV");

    const codeInput = page.getByPlaceholder("ABC-XYZ");
    await expect(codeInput).toHaveValue("QRS-TUV");
  });

  test("shows error when join API returns 404", async ({ page }) => {
    // Intercept the join endpoint and return a 404 error.
    await page.route("**/api/v1/games/by-code/**/join", (route) => {
      route.fulfill({
        status: 404,
        contentType: "application/problem+json",
        body: JSON.stringify({ title: "room not found", status: 404 }),
      });
    });

    await page.goto("/join");
    await page.getByPlaceholder("ABC-XYZ").fill("XYZ-000");
    await page.getByPlaceholder(/astroalex/i).fill("TestPlayer");
    await page.getByRole("button", { name: /enter room/i }).click();

    await expect(
      page.getByText(/could not join/i)
    ).toBeVisible();
  });
});

test.describe("Landing page", () => {
  test("has Enter Room button and game masters login", async ({ page }) => {
    await page.goto("/");

    // Hero headline is split across two elements: "Enter The" + "Nebula."
    await expect(page.getByText(/nebula\./i)).toBeVisible();
    await expect(page.getByRole("button", { name: /enter room/i })).toBeVisible();
    await expect(page.getByText(/game masters/i)).toBeVisible();
  });
});
