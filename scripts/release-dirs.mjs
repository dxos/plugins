#!/usr/bin/env node

//
// Resolves which plugin directories the registry publish should cover, into `released-dirs.txt`.
//
// Two modes, because the registry publish has to be retryable on its own:
//
//   ALL=true          every publishable plugin at its current version. `changeset publish` reports
//                     what it released only in the run that released it, so after npm has accepted a
//                     version there is no output left to drive a retry — and the registry half is
//                     exactly the half most likely to need one.
//   PUBLISHED=<json>  the `publishedPackages` output, so a normal release touches only what it just
//                     put on npm.
//

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const all = process.env.ALL === 'true';

const publishable = readdirSync('packages')
  .map((dir) => ({ dir: `packages/${dir}`, file: `packages/${dir}/package.json` }))
  .filter(({ file }) => existsSync(file))
  .flatMap((entry) => {
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(entry.file, 'utf8'));
    } catch {
      return [];
    }

    return !pkg.name || pkg.private ? [] : [{ ...entry, name: pkg.name, version: pkg.version }];
  });

let selected;
if (all) {
  selected = publishable;
} else {
  let released;
  try {
    released = new Set(JSON.parse(process.env.PUBLISHED || '[]').map((pkg) => pkg.name));
  } catch (error) {
    console.error(`ERROR: could not parse PUBLISHED: ${error.message}`);
    process.exit(1);
  }

  selected = publishable.filter(({ name }) => released.has(name));
}

selected.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('released-dirs.txt', selected.map(({ dir }) => dir).join('\n'));

if (selected.length === 0) {
  console.log('No plugins to publish to the registry.');
} else {
  console.log(`${selected.length} plugin(s) to publish to the registry:`);
  for (const { name, version, dir } of selected) {
    console.log(`  ${name}@${version} (${dir})`);
  }
}
