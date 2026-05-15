import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";

const envTestPath = path.resolve(__dirname, ".env.test");
if (fs.existsSync(envTestPath)) {
  loadEnv({ path: envTestPath });
}

const defaultPort = 3000;
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${defaultPort}`;

const parsedPort = Number(new URL(baseURL).port);
const port = Number.isFinite(parsedPort) && parsedPort > 0
  ? parsedPort
  : defaultPort;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
