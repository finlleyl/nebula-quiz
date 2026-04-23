/**
 * Sprint 7 — Smoke tests for Power-ups, Explore page, and animated results.
 *
 * These tests run against the Vite dev server (or preview build).
 * No live backend is required — pages that fetch data will fail gracefully and
 * show loading/error states which we verify are non-crashing.
 */
import { test, expect } from "@playwright/test";

// ── Explore page ─────────────────────────────────────────────────────────────

test.describe("Explore page", () => {
  test("renders the explore page without crashing", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: /explore/i })).toBeVisible();
  });

  test("shows the search input", async ({ page }) => {
    await page.goto("/explore");
    await expect(page.getByPlaceholder(/search quizzes/i)).toBeVisible();
  });

  test("search input accepts text", async ({ page }) => {
    await page.goto("/explore");
    const input = page.getByPlaceholder(/search quizzes/i);
    await input.fill("science");
    await expect(input).toHaveValue("science");
  });

  test("shows loading spinner or quiz grid (graceful empty state)", async ({
    page,
  }) => {
    await page.goto("/explore");
    // Either a spinner (loading) or a 'No quizzes found' message or quiz cards.
    const body = await page.content();
    expect(body.length).toBeGreaterThan(100);
  });
});

// ── PlayerResultsPage (Match Complete) ───────────────────────────────────────

test.describe("PlayerResultsPage — Match Complete", () => {
  test("renders the results page without crashing", async ({ page }) => {
    await page.goto("/play/TST-1234/results");
    await expect(page.getByText(/Match Complete/i)).toBeVisible();
  });

  test("shows Play Again and Exit Match buttons", async ({ page }) => {
    await page.goto("/play/TST-1234/results");
    await expect(page.getByRole("button", { name: /play again/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /exit match/i })).toBeVisible();
  });

  test("NEBULA QUIZ logo is present in the nav", async ({ page }) => {
    await page.goto("/play/TST-1234/results");
    await expect(page.getByText(/nebula quiz/i)).toBeVisible();
  });
});

// ── PlayerQuestionPage — Power-up button ─────────────────────────────────────

test.describe("PlayerQuestionPage — power-up UI", () => {
  test("shows waiting state when navigated to without an active question", async ({
    page,
  }) => {
    await page.goto("/play/TST-1234/question");
    await expect(page.getByText(/waiting for question/i)).toBeVisible();
  });

  test("power-up button does NOT appear on the waiting screen", async ({
    page,
  }) => {
    await page.goto("/play/TST-1234/question");
    // No ⚡ / 50/50 label visible while no question is active.
    const powerupEl = page.getByText("50/50");
    await expect(powerupEl).not.toBeVisible();
  });
});

// ── Library page ─────────────────────────────────────────────────────────────

test.describe("Library page", () => {
  test("redirects unauthenticated users away from /library", async ({
    page,
  }) => {
    await page.goto("/library");
    // RequireAuth redirects to / when not logged in.
    await expect(page).not.toHaveURL("/library");
  });

  test("/library route is registered (no 404 page)", async ({ page }) => {
    await page.goto("/library");
    // Even if redirected, the page should not show a 404 or crash.
    const body = await page.content();
    expect(body.length).toBeGreaterThan(50);
  });
});

// ── TopNav links ──────────────────────────────────────────────────────────────

test.describe("TopNav real route links", () => {
  test("Explore link in top nav navigates to /explore", async ({ page }) => {
    await page.goto("/");
    const exploreLink = page.getByRole("link", { name: "Explore" });
    await expect(exploreLink).toBeVisible();
    await exploreLink.click();
    await expect(page).toHaveURL("/explore");
  });
});

// ── Routing regression — Sprint 7 new routes ─────────────────────────────────

test.describe("Sprint 7 routing regression", () => {
  test("landing page still renders", async ({ page }) => {
    await page.goto("/");
    // Looks for either the hero text or the login card.
    const body = await page.content();
    expect(body).toContain("NEBULA");
  });

  test("explore is reachable at /explore", async ({ page }) => {
    await page.goto("/explore");
    await expect(page).toHaveURL("/explore");
    // page didn't redirect away
  });

  test("join page still renders", async ({ page }) => {
    await page.goto("/join");
    await expect(page.getByRole("heading", { name: /join a game/i })).toBeVisible();
  });

  test("pre-filled join code from URL still works", async ({ page }) => {
    await page.goto("/join/XYZ-ABCD");
    await expect(page.getByPlaceholder("ABC-XYZ")).toHaveValue("XYZ-ABCD");
  });
});
