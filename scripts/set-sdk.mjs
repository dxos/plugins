//
// Rewrites the `dxos` named catalog in pnpm-workspace.yaml so every @dxos/* dependency
// moves in lockstep. Used by the SDK upgrade-train workflows.
//
//   node scripts/set-sdk.mjs pkg-pr-new <commit-sha>   # track an unreleased DXOS main build
//   node scripts/set-sdk.mjs npm <version-or-range>    # pin to a published npm SDK release
//
// Assumes a single `dxos:` catalog (the last block in the file). Line-based on purpose — no
// YAML dependency, and it preserves comments/formatting.
//

import { readFileSync, writeFileSync } from 'node:fs';

const [, , mode, target] = process.argv;
if (!['pkg-pr-new', 'npm'].includes(mode) || !target) {
  console.error('usage: set-sdk.mjs <pkg-pr-new|npm> <sha|version>');
  process.exit(1);
}

const path = 'pnpm-workspace.yaml';
const lines = readFileSync(path, 'utf8').split('\n');

let inDxos = false;
let count = 0;
const out = lines.map((line) => {
  if (/^\s*dxos:\s*$/.test(line)) {
    inDxos = true;
    return line;
  }
  // A non-empty line indented two spaces or less ends the catalog block.
  if (inDxos && line.trim().length > 0 && /^ {0,2}\S/.test(line)) {
    inDxos = false;
  }
  if (inDxos) {
    const match = line.match(/^(\s*)'(@dxos\/[^']+)':\s*'.*'\s*$/);
    if (match) {
      const [, indent, name] = match;
      const value = mode === 'npm' ? target : `https://pkg.pr.new/dxos/dxos/${name}@${target}`;
      count += 1;
      return `${indent}'${name}': '${value}'`;
    }
  }
  return line;
});

if (count === 0) {
  console.error('no @dxos/* entries found under the dxos catalog');
  process.exit(1);
}

writeFileSync(path, out.join('\n'));
console.log(`Updated ${count} @dxos/* catalog entries → ${mode} ${target}`);
