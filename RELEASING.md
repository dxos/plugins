# Releasing

This monorepo hosts community plugins for DXOS Composer. Plugins are **released to the AT Protocol
registry** via `dx registry publish` (bundle → DXOS edge, records → the publisher's PDS) — they are
not published to npm. [Changesets](https://github.com/changesets/changesets) manages versions and
changelogs; the DXOS SDK is pinned centrally via the `dxos` catalog in `pnpm-workspace.yaml`.

## Layout

```
packages/<name>/       # one plugin per directory: package.json, dx.yml, vite.config.ts, moon.yml, src/
pnpm-workspace.yaml    # packages glob: packages/* ; catalogs.dxos: every @dxos/* pinned in lockstep
tsconfig.base.json     # shared compiler options (each plugin extends it)
.prototools            # pinned toolchain (proto/moon/node/pnpm), matching the dxos monorepo
.moon/                 # workspace.yml, toolchains.yml, tasks.yml (shared build/typecheck/dev/preview)
.changeset/            # pending changesets
scripts/               # set-sdk.mjs, changeset-all.mjs
```

Each plugin's `@dxos/*` deps resolve from `catalog:dxos`, so the whole SDK moves as one unit.

## Adding a changeset (do this in every PR that changes a plugin)

A changeset is just a markdown file in `.changeset/`. **Create it by writing the file directly** —
this is the deterministic path for coding agents and scripts (no interactive prompt):

1. Create `.changeset/<short-kebab-summary>.md` (filename only needs to be unique + end in `.md`):

   ```markdown
   ---
   "dxos-plugin-excalidraw": minor
   ---

   Add a freehand arrow tool.
   ```

2. The frontmatter key is the plugin's **`package.json` `name`** (e.g. `dxos-plugin-excalidraw`), not
   the directory. Add one `"name": bump` line per plugin the change touches.
3. Choose the bump:

   | Bump | Use for |
   | --- | --- |
   | `patch` | bug fix, refactor, or dependency bump — no change to the plugin's public API or behavior |
   | `minor` | a new backward-compatible feature/capability |
   | `major` | a backward-incompatible change to behavior or stored data |

4. The body is a one-line, user-facing summary — it lands verbatim in the plugin's `CHANGELOG.md`.

**Skip the changeset** for changes that don't affect a published plugin: repo tooling, CI, root docs,
or tests. (The coordinated SDK bump is handled separately by `scripts/changeset-all.mjs` — don't hand-write
those.) Humans who prefer a prompt can run `pnpm changeset` instead; it writes the same file.

## Releasing

1. Merge the PR (with its changeset) to `main`, the development branch. CI builds it; **nothing
   publishes**.
2. **Cut a release:** promote `main` → the `release` branch. That triggers the **Release** workflow,
   which opens a "Version Packages" PR (consumes the changesets → bumps versions + `CHANGELOG.md`);
   merging it publishes the changed plugins to the registry.

Only the plugins with a changeset are versioned/published — releases are independent, and `main` never
publishes (releasing is always an explicit promotion to `release`).

## Keeping up with the SDK

The SDK ships as one unit; bump it via the `dxos` catalog (one place).

- **Nightly tracking (never released).** `SDK nightly` points the `dxos` catalog at the latest dxos
  `main` build on `pkg.pr.new` and opens/updates an **SDK upgrade** PR (`scripts/set-sdk.mjs pkg-pr-new <sha>`).
  Merging keeps `main` building against the latest SDK. **You cannot release from this** — the release
  guard rejects publishing while the catalog is a pkg.pr.new pin.
- **Publishing against a released SDK.** When DXOS cuts an npm SDK release, run the **SDK npm release**
  workflow with the version (e.g. `^0.9.0`). It pins the catalog to npm (`scripts/set-sdk.mjs npm`),
  adds a release-together changeset for every plugin (`scripts/changeset-all.mjs`), and opens a PR.
  Merging republishes all plugins against the new SDK.

### Migration window

Publish the new plugin versions **ahead of** the stable Composer release, then hold before promoting
the new SDK/Composer to stable. The length of that window scales with risk — longer for breaking
changes than for routine ones — so plugin authors have time to migrate. Exact windows are TBD and
will be defined precisely later.

This is safe because each release's `manifest.json` records the `@dxos/*` versions it was built
against (the `dependencies` snapshot, emitted automatically by `composerPlugin`). A **stable Composer
ignores plugin versions built for a newer SDK** — they don't surface as available upgrades — so early
publishing never breaks users on the current version; they pick up the new versions once their
Composer catches up.

## CI

| Workflow | Trigger | Does |
| --- | --- | --- |
| `ci.yml` | PR / push | `moon run :build` (typecheck + bundle + manifest) |
| `sdk-nightly.yml` | nightly / dispatch | open/update the SDK upgrade PR from latest pkg.pr.new |
| `sdk-npm-release.yml` | dispatch (version) | pin catalog to npm + release-together changeset → PR |
| `release.yml` | push to `release` | Changesets version PR → `dx registry publish` per plugin (guarded) |

## Secrets / prerequisites

- `ATPROTO_HANDLE` + `ATPROTO_APP_PASSWORD` — a verified publisher identity for the release workflow
  (or wire `dx account login` for the DPoP path).
- `@dxos/cli` must be installable (the release workflow runs `npm i -g @dxos/cli`).
- The publisher DID must be verified by the registry's configured verifier, or published records
  won't appear in Composer (see the registry spec).
