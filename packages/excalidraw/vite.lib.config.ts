//
// Copyright 2026 DXOS.org
//

import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// The npm library build, distinct from the registry bundle in vite.config.ts. The registry wants one
// self-contained artifact with every dependency inlined; npm wants the opposite — thin modules with
// dependencies externalised, so a consumer resolves a single copy of React, Effect and the SDK.
// A bundled library would hand consumers duplicate instances, which Effect and Automerge surface as
// `Property '[TypeId]' is missing` rather than as a version conflict.

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Entry names mirror the source layout rather than the subpath, because `exports['./plugin']` and
// `imports['#plugin']` name different sources and would otherwise collide on one output.
const entryName = (source: string) => source.replace(/^\.\/src\//, '').replace(/\.tsx?$/, '');

const entry = Object.fromEntries(
  [...Object.values<any>(pkg.exports), ...Object.values<any>(pkg.imports)].map(({ source }) => [
    entryName(source),
    source,
  ]),
);

const externals = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})];

export default defineConfig({
  // `source` routes `#xxx` imports to src/*.ts; without it they resolve to the dist paths this
  // build is producing.
  resolve: {
    conditions: ['source', 'module', 'browser', 'development', 'production', 'import'],
  },
  plugins: [react()],
  build: {
    outDir: 'dist/lib',
    emptyOutDir: true,
    lib: { entry, formats: ['es'] },
    rollupOptions: {
      external: (id) => externals.some((dep) => id === dep || id.startsWith(`${dep}/`)),
    },
  },
});
