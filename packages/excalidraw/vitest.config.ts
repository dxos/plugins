//
// Copyright 2024 DXOS.org
//

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // Mirrors vite.config.ts so `#xxx` subpath imports resolve to src/* rather than the
  // dist paths in package.json#imports, which only exist after a build.
  resolve: {
    conditions: ['source', 'module', 'browser', 'development', 'production', 'import'],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
