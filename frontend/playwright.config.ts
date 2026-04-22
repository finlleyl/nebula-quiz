import { defineConfig, devices } from "@playwright/test";

const CHROMIUM_EXEC =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: CHROMIUM_EXEC },
      },
    },
  ],
});
