//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // `#xxx` subpath imports resolve through each package's own package.json#imports via the `source`
  // condition. Aliasing them globally instead would hijack the identically-named subpaths that
  // @dxos plugins use internally, resolving their `#types` to this package's.
  resolve: { conditions: ['source', 'module', 'browser', 'development', 'production', 'import'] },
  // @dxos/* packages ship `.pcss` alongside their JS; externalized, node tries to load those directly
  // and fails on the extension, so @dxos packages go through vite's transform instead.
  ssr: { noExternal: [/@dxos\//] },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    // The 5s vitest default is too tight for `createComposerTestApp` activation tests, whose
    // cold-start exceeds it under CI load. Matches the 15s dxos/dxos uses for the same harness.
    testTimeout: 15_000,
  },
});
