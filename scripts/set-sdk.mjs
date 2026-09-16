//
// Rewrites the `dxos` named catalog in pnpm-workspace.yaml so every @dxos/* dependency
// moves in lockstep, and moves the external deps the SDK also resolves to the versions the new
// pin declares. Used by the SDK upgrade-train workflows.
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

// `effect`, `@automerge/automerge`, `react` and `react-dom` are resolved by the SDK as well as by
// the plugins, so the default catalog has to match what the pinned build declares, or pnpm installs
// a second copy and the typecheck fails on nominally branded types. Read the published manifests
// rather than dxos main's catalog: the pin, not main, is what gets installed.
const shared = ['effect', '@automerge/automerge', 'react', 'react-dom'];

const tarballUrl = (name) => {
  if (mode === 'pkg-pr-new') {
    return `https://pkg.pr.new/dxos/dxos/${name}@${version}`;
  }
  const result = JSON.parse(
    execFileSync('npm', ['view', `${name}@${version}`, 'dist.tarball', '--json'], { encoding: 'utf8' }),
  );
  return Array.isArray(result) ? result.at(-1) : result;
};

const readManifest = async (name) => {
  const response = await fetch(tarballUrl(name));
  if (!response.ok) {
    throw new Error(`fetching ${name}@${version}: ${response.status} ${response.statusText}`);
  }
  const tarball = Buffer.from(await response.arrayBuffer());
  return JSON.parse(execFileSync('tar', ['-xzO', 'package/package.json'], { input: tarball, encoding: 'utf8' }));
};

const declared = new Map();
for (const manifest of await Promise.all(names.map(readManifest))) {
  for (const deps of [manifest.dependencies, manifest.peerDependencies]) {
    for (const dep of shared) {
      const range = deps?.[dep];
      if (range === undefined) {
        continue;
      }
      if (declared.has(dep) && declared.get(dep).range !== range) {
        console.error(
          `${dep}: ${declared.get(dep).from} declares ${declared.get(dep).range} but ${manifest.name} declares ${range}`,
        );
        process.exit(1);
      }
      declared.set(dep, { range, from: manifest.name });
    }
  }
}

const catalogStart = lines.findIndex((line) => /^catalog:\s*$/.test(line));
if (catalogStart !== -1) {
  for (let index = catalogStart + 1; index < lines.length && !/^\S/.test(lines[index]); index++) {
    const match = lines[index].match(/^(\s*)('?)([^':\s]+)\2:\s*'(.*)'\s*$/);
    const next = match && declared.get(match[3]);
    if (next && next.range !== match[4]) {
      const [, indent, quote, dep, previous] = match;
      lines[index] = `${indent}${quote}${dep}${quote}: '${next.range}'`;
      console.log(`Updated catalog ${dep}: ${previous} → ${next.range} (declared by ${next.from})`);
    }
  }
}

writeFileSync(path, lines.join('\n'));

// The release workflow labels its commit and PR with the version, which it does not know when the
// input was omitted and the default resolved it.
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}

console.log(`Updated ${names.length} @dxos/* catalog entries → ${mode} ${version}`);
