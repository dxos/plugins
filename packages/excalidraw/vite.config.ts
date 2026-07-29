//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';

import { composerPlugin } from '@dxos/app-framework/vite-plugin';

export default defineConfig({
  // The registry bundle lives in out/; dist/ is reserved for the npm library build, which is the
  // only thing `files` ships.
  build: { outDir: 'out' },
  // Prepend `source` so `#xxx` imports route to `src/*.ts` — the dist paths
  // in `package.json#imports` only kick in if this plugin is republished as
  // a library. Vite's defaults are restored because the option replaces
  // rather than appends, and deps like `@excalidraw/excalidraw` need
  // `import`/`browser` for their CSS/wasm subpaths.
  resolve: {
    conditions: ['source', 'module', 'browser', 'development', 'production', 'import'],
  },
  plugins: [...composerPlugin({ entry: 'src/ExcalidrawPlugin.tsx' }), react(), wasm()],
});
