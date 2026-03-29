import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  reporter: [['list'], ['json', { outputFile: 'e2e/results.json' }]],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 30_000,
    reuseExistingServer: true,
  },
})
