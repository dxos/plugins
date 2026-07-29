//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { composerPlugin } from '@dxos/app-framework/vite-plugin';

export default defineConfig({
  // The registry bundle lives in out/; dist/ is reserved for the npm library build, which is the
  // only thing `files` ships.
  build: { outDir: 'out' },
  // Prepend `source` so `#xxx` imports route to `src/*.ts` — the dist paths
  // in `package.json#imports` only kick in if this plugin is republished as
  // a library.
  resolve: {
    conditions: ['source', 'module', 'browser', 'development', 'production', 'import'],
  },
  plugins: [...composerPlugin({ entry: 'src/TicTacToePlugin.tsx' }), react()],
});
