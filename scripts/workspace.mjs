//
// Enumerates the publishable workspace packages.
//
// pnpm owns which directories are packages (the `packages` glob in pnpm-workspace.yaml) and reports
// the `private` flag, so asking it keeps release tooling from re-deriving either — a hand-rolled
// `packages/*` scan silently goes wrong the day the glob changes. The workspace root is private, so
// it drops out with everything else not meant for npm.
//

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';

/**
 * @returns {{ name: string, version: string, dir: string, manifest: object }[]}
 */
export const publishablePackages = () => {
  const output = execFileSync('pnpm', ['list', '--recursive', '--depth=-1', '--json'], { encoding: 'utf8' });

  return JSON.parse(output)
    .filter((project) => project.name && !project.private)
    .map((project) => ({
      name: project.name,
      version: project.version,
      // Relative, because the release steps pass these to `dx registry publish --dir`.
      dir: relative(process.cwd(), project.path) || '.',
      manifest: JSON.parse(readFileSync(`${project.path}/package.json`, 'utf8')),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
};
