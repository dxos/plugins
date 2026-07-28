//
// Writes a single changeset that bumps every plugin (patch) — used by the SDK npm-release
// workflow so all plugins release together against a new SDK version.
//
//   node scripts/changeset-all.mjs "Rebuild against DXOS SDK ^0.9.0."
//

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const message = process.argv[2] ?? 'Rebuild against the latest DXOS SDK.';

const names = readdirSync('packages', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => JSON.parse(readFileSync(`packages/${entry.name}/package.json`, 'utf8')).name);

if (names.length === 0) {
  console.error('no plugins found under packages/*');
  process.exit(1);
}

const frontmatter = names.map((name) => `"${name}": patch`).join('\n');
writeFileSync('.changeset/sdk-release.md', `---\n${frontmatter}\n---\n\n${message}\n`);
console.log(`Wrote .changeset/sdk-release.md bumping ${names.length} plugin(s).`);
