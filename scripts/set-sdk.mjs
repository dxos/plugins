//
// Rewrites the `dxos` named catalog in pnpm-workspace.yaml so every @dxos/* dependency
// moves in lockstep. Used by the SDK upgrade-train workflows.
//
//   node scripts/set-sdk.mjs pkg-pr-new <commit-sha>   # track an unreleased DXOS main build
//   node scripts/set-sdk.mjs npm [version-or-range]    # pin to a published npm SDK release
//
// Omitting the npm version pins to the latest release. Assumes a single `dxos:` catalog.
// Line-based on purpose — no YAML dependency, and it preserves comments/formatting.
//

import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const [, , mode, target] = process.argv;
if (!['pkg-pr-new', 'npm'].includes(mode) || (mode === 'pkg-pr-new' && !target)) {
  console.error('usage: set-sdk.mjs pkg-pr-new <sha> | npm [version] (defaults to the latest release)');
  process.exit(1);
}

const path = 'pnpm-workspace.yaml';
const lines = readFileSync(path, 'utf8').split('\n');

const start = lines.findIndex((line) => /^\s*dxos:\s*$/.test(line));
if (start === -1) {
  console.error(`no \`dxos:\` catalog in ${path}`);
  process.exit(1);
}

// A non-empty line indented two spaces or less ends the catalog block.
const offset = lines.slice(start + 1).findIndex((line) => line.trim().length > 0 && /^ {0,2}\S/.test(line));
const end = offset === -1 ? lines.length : start + 1 + offset;

const entry = /^(\s*)'(@dxos\/[^']+)':\s*'.*'\s*$/;
const names = lines
  .slice(start + 1, end)
  .map((line) => line.match(entry)?.[2])
  .filter((name) => name !== undefined);

if (names.length === 0) {
  console.error('no @dxos/* entries found under the dxos catalog');
  process.exit(1);
}

// The SDK publishes as one unit, so any member's `latest` dist-tag is the release to pin to —
// reading it from the catalog keeps the default correct as the package set changes.
const version = target || `^${execFileSync('npm', ['view', names[0], 'version'], { encoding: 'utf8' }).trim()}`;

for (let index = start + 1; index < end; index++) {
  const match = lines[index].match(entry);
  if (match) {
    const [, indent, name] = match;
    const value = mode === 'npm' ? version : `https://pkg.pr.new/dxos/dxos/${name}@${version}`;
    lines[index] = `${indent}'${name}': '${value}'`;
  }
}

writeFileSync(path, lines.join('\n'));

// The release workflow labels its commit and PR with the version, which it does not know when the
// input was omitted and the default resolved it.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

console.log(`Updated ${names.length} @dxos/* catalog entries → ${mode} ${version}`);
