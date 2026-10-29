import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

// Юнит-тесты логики без React: jsdom даёт localStorage и DOM для эффектов.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
