//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const here = (path: string) => resolve(fileURLToPath(new URL('.', import.meta.url)), path);

// `#xxx` subpath imports are aliased explicitly rather than via a global `source` resolve condition:
// package.json#imports points them at dist paths that only exist after a build, but applying `source`
// globally also redirects third-party packages to TypeScript sources their published tarballs do not ship.
const pluginImports = {
  '#capabilities': here('src/capabilities/index.ts'),
  '#components': here('src/components/index.ts'),
  '#containers': here('src/containers/index.ts'),
  '#meta': here('src/meta.ts'),
  '#operations': here('src/operations/index.ts'),
  '#plugin': here('src/TicTacToePlugin.tsx'),
  '#translations': here('src/translations.ts'),
  '#types': here('src/types/index.ts'),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: pluginImports },
  // @dxos/* packages ship `.pcss` alongside their JS; externalized, node tries to load those directly
  // and fails on the extension, so @dxos packages go through vite's transform instead.
  ssr: { noExternal: [/@dxos\//] },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
