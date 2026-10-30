import { defineConfig, devices } from '@playwright/test';

// Сайт проверяется так, как его открывает человек: out/index.html по file:// в установленном
// Chrome, без сервера. Перед запуском нужна сборка — `npm run test:e2e` делает её сама.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  // четыре Chrome, стартующих разом, то и дело виснут на запуске: таймаут ещё до кода сайта
  workers: 2,
  reporter: 'list',
  use: { channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], channel: 'chrome', viewport: { width: 390, height: 844 } },
    },
  ],
});
