//
// Copyright 2024 DXOS.org
//

import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { defineConfig } from 'vitest/config';

// `source` mirrors vite.config.ts so `#xxx` subpath imports resolve to src/* rather than the dist
// paths in package.json#imports, which only exist after a build.
const conditions = ['source', 'module', 'development', 'production', 'import'];

const TIKTOKEN_STUB = new URL('./vitest/tiktoken-stub.mjs', import.meta.url).pathname;

export default defineConfig({
  plugins: [react(), wasm()],
  resolve: {
    conditions: [...conditions, 'browser'],
    alias: { 'tiktoken/lite': TIKTOKEN_STUB },
  },
  ssr: {
    // Tests run in node, so `node` must win over `browser` — @dxos/async extends node stream classes
    // that the browser shims leave undefined.
    resolve: { conditions: ['node', ...conditions] },
    // The `source` condition points @dxos/* at TypeScript inside node_modules, which node cannot
    // strip types from; they have to go through vite's transform rather than being externalized.
    noExternal: [/@dxos\//, /@excalidraw\//],
  },
  test: {
    // Everything resolves from source, so externalizing anything hands node an untransformed module
    // (TypeScript, CSS) and fails with an unlocatable syntax error.
    server: { deps: { inline: true } },
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
