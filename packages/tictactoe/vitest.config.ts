//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Plugin, defineConfig } from 'vitest/config';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

const subpathImports: Record<string, string> = {
  '#capabilities': 'src/capabilities/index.ts',
  '#components': 'src/components/index.ts',
  '#containers': 'src/containers/index.ts',
  '#meta': 'src/meta.ts',
  '#operations': 'src/operations/index.ts',
  '#plugin': 'src/TicTacToePlugin.tsx',
  '#translations': 'src/translations.ts',
  '#types': 'src/types/index.ts',
};

/**
 * Resolves this package's `#xxx` subpath imports to source.
 *
 * package.json#imports points them at `dist`, which a test run never builds, and the `source`
 * condition cannot be used to reach src instead: applied globally it also pulls every @dxos package
 * from TypeScript source, whose transitive deps the published tarballs do not install. Scoping by
 * importer keeps @dxos packages resolving their own identically-named subpaths against their own dist.
 */
const localSubpathImports = (): Plugin => ({
  name: 'local-subpath-imports',
  enforce: 'pre',
  resolveId: (source, importer) => {
    const target = subpathImports[source];
    if (!target || !importer || importer.includes('node_modules') || !importer.startsWith(packageRoot)) {
      return null;
    }

    return resolve(packageRoot, target);
  },
});

export default defineConfig({
  plugins: [localSubpathImports(), react()],
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
