#!/usr/bin/env node

//
// Fails when a publishable plugin would break `changeset publish` — because npm has never seen it,
// or because its `repository.url` cannot back a provenance statement.
//
// `changeset publish` publishes every non-private package, and npm rejects a first-ever publish that
// has no trusted publisher configured — which fails the release for every other plugin in the same
// run. Keeping an unpublished plugin `private: true` until its first publish keeps that blast radius
// at zero.
//
// npm exposes no API for whether trusted publishing (OIDC) is configured — that setting lives only in
// npmjs.com's UI — so "has been published" stands in for it: a plugin's first publish and its trusted
// publisher are set up together (see AGENTS.md).
//

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

const NPM_REGISTRY = 'https://registry.npmjs.org';
const RETRIES = 2;

// pnpm owns which directories are packages (the `packages` glob in pnpm-workspace.yaml) and reports
// the `private` flag, so neither has to be re-derived here — and the workspace root, being private,
// drops out with everything else not meant for npm.
const workspace = JSON.parse(
  execFileSync('pnpm', ['list', '--recursive', '--depth=-1', '--json'], { encoding: 'utf8' }),
);

const publishable = workspace
  .filter((project) => project.name && !project.private)
  .map((project) => ({
    name: project.name,
    file: `${relative(process.cwd(), project.path)}/package.json`,
    repository: JSON.parse(readFileSync(`${project.path}/package.json`, 'utf8')).repository,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

// npm verifies a provenance statement against the published `repository.url`, so a package without
// one is rejected at publish time (E422) after the signature has already been logged — and the
// release is over by then. `git+…`/`.git` are the conventional spelling; npm compares the bare URL.
const normalize = (url) =>
  typeof url === 'string'
    ? url
        .replace(/^git\+/, '')
        .replace(/\.git$/, '')
        .replace(/\/$/, '')
    : '';

// Set for every GitHub Actions run; locally there is nothing to compare against, so presence alone
// is checked.
const expected = process.env.GITHUB_REPOSITORY ? `https://github.com/${process.env.GITHUB_REPOSITORY}` : undefined;

const misdeclared = publishable.filter(({ repository }) => {
  const url = normalize(repository?.url);
  return url === '' || (expected !== undefined && url !== expected);
});

if (misdeclared.length > 0) {
  console.error('ERROR: these plugins are publishable but cannot produce a valid provenance statement.');
  console.error(`Set \`repository.url\` in each package.json to ${expected ?? 'this repository'}`);
  console.error('(the `git+https://….git` form is fine — npm normalises it). See RELEASING.md.');
  console.error('');
  for (const { name, file, repository } of misdeclared) {
    console.error(`  ${name} (${file}) — repository.url is ${JSON.stringify(repository?.url ?? null)}`);
  }
  process.exit(1);
}

const isPublished = async (name) => {
  const url = `${NPM_REGISTRY}/${encodeURIComponent(name)}`;
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { Accept: 'application/vnd.npm.install-v1+json' } });
    if (response.status === 404) {
      return false;
    }
    if (response.ok) {
      return true;
    }
    // A registry blip must not read as "unpublished" and fail the build spuriously.
    if (attempt >= RETRIES) {
      throw new Error(`unexpected status ${response.status} fetching ${url}`);
    }
  }
};

let results;
try {
  results = await Promise.all(
    publishable.map(async (entry) => ({ ...entry, published: await isPublished(entry.name) })),
  );
} catch (error) {
  console.error(`ERROR: failed to query the npm registry: ${error.message}`);
  process.exit(1);
}

const unpublished = results.filter((entry) => !entry.published);
if (unpublished.length > 0) {
  console.error('ERROR: these plugins are publishable but have never been published to npm.');
  console.error('Set `"private": true` until the first publish, then configure npm trusted publishing');
  console.error('(OIDC) for the package and drop the flag. See AGENTS.md.');
  console.error('');
  for (const { name, file } of unpublished) {
    console.error(`  ${name} (${file})`);
  }
  process.exit(1);
}

console.log(`OK: all ${publishable.length} publishable plugins are published to npm.`);
