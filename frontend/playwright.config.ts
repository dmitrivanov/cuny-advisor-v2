import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "python3 tests/support/institution_server.py",
      url: "http://127.0.0.1:3101/api/v1/institutions",
      reuseExistingServer: false,
    },
    {
      command: "npm run start -- --port 3100",
      env: { API_BASE_URL: "http://127.0.0.1:3101" },
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
