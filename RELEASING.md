# Releasing

This monorepo hosts the DXOS team's plugins for Composer. A release publishes each plugin to **two
channels from two build outputs**: the **npm library** (`dist/lib` + `dist/types`, dependencies
externalised) and the **AT Protocol registry** via `dx registry publish` (the self-contained `out/`
bundle → DXOS edge, records → the publisher's PDS). `out/` never ships to npm. [Changesets](https://github.com/changesets/changesets) manages versions and
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
   '@dxos/plugin-tictactoe': minor
   ---

   Add AI difficulty levels.
   ```

2. The frontmatter key is the plugin's **`package.json` `name`** (e.g. `@dxos/plugin-tictactoe`), not
   the directory. Add one `"name": bump` line per plugin the change touches.
3. Choose the bump:

   | Bump    | Use for                                                                                  |
   | ------- | ---------------------------------------------------------------------------------------- |
   | `patch` | bug fix, refactor, or dependency bump — no change to the plugin's public API or behavior |
   | `minor` | a new backward-compatible feature/capability                                             |
   | `major` | a backward-incompatible change to behavior or stored data                                |

4. The body is a one-line, user-facing summary — it lands verbatim in the plugin's `CHANGELOG.md`.

**Skip the changeset** for changes that don't affect a published plugin: repo tooling, CI, root docs,
or tests. (The coordinated SDK bump is handled separately by `scripts/changeset-all.mjs` — don't hand-write
those.) Humans who prefer a prompt can run `pnpm changeset` instead; it writes the same file.

## Releasing

Trunk-based on `main` — there is no release branch.

1. Merge the PR (with its changeset) to `main`. The **Release** workflow opens or updates a
   **"Version Packages" PR** consuming the pending changesets (bumps versions + `CHANGELOG.md`).
   Nothing publishes yet.
2. **Merge the Version Packages PR.** That is the release. The workflow publishes to npm (which tags
   each released version as `name@version`), then publishes the same versions to the registry.

**Independent versions, coupled timing.** Each plugin has its own version line (`fixed: []`), so a
change to one never bumps another. But there is a single Version Packages PR, and merging it drains
_every_ pending changeset — so a release ships whatever accumulated since the last one. To release one
plugin alone, merge the Version PR before adding another plugin's changeset.

Releases are recorded as git tags rather than a branch — `changeset publish` creates them. A plugin
that is not yet ready to publish stays `private: true`; `privatePackages.tag` is enabled so those
are still versioned and tagged.

### Retrying a half-finished release

The two channels can fail independently, and only one of them is replayable by re-running the
workflow. npm is append-only — `changeset publish` skips versions already on the registry — so once
npm has accepted a version, a plain re-run finds nothing to publish, reports nothing released, and
never reaches the registry step. That would leave the registry permanently a version behind with no
way back short of a version bump.

Dispatch **Release** with `registry_only` to republish the current versions to the registry alone,
skipping npm entirely. Use it whenever the registry half fails, or after fixing the plugin's
`dx.config.ts` / bundle. `dx registry publish` rejects an unchanged version, so if a retry reports a
duplicate the release already landed there — confirm with `dx registry records` and, if a record
genuinely needs replacing, remove it first with `dx registry unpublish --key <key>`.

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

### pkg.pr.new pins are perishable

A pkg.pr.new build is a CI artifact, not a registry release, and **they expire (roughly 1–6 months)**.
Two consequences:

- A committed pin has a shelf life. If nightly tracking stalls, `main` eventually stops installing —
  and an old commit can no longer be rebuilt at all, because its pinned artifacts are gone.
- Tracking is a bridge, not a destination. Re-pin to a published npm SDK via **SDK npm release** as
  soon as one carries what the plugins need. The release guard enforces only the tail end of this,
  by refusing to publish while the catalog holds a pkg.pr.new pin.

Pin with a **7-character** SHA. pkg.pr.new serves any prefix length, but it emits 7-character SHAs in
the `@dxos/*` cross-package dependency URLs and pnpm keys resolutions on the literal URL — a longer
pin resolves to the same build while installing a second, duplicate copy of the entire SDK.

### External deps the SDK also resolves

`effect`, `@automerge/automerge`, `react` and `react-dom` are declared by `@dxos/*` as well as by the
plugins. The default catalog must hold a version the **pinned** SDK build also resolves; anything else
installs a second copy, and since Effect and Automerge brand their types nominally, the duplicate
surfaces as `Property '[TypeId]' is missing` across every schema rather than as a version complaint.
Check what the pin requires before changing one:

```bash
node -p "require('./node_modules/@dxos/echo/package.json').peerDependencies"
```

Moving the SDK pin can therefore require moving these in step.

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

| Workflow              | Trigger                   | Does                                                                                                                         |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `check.yml`           | PR / push / queue         | format, lint, build (npm library), bundle (registry artifact + manifest), test                                               |
| `sdk-nightly.yml`     | nightly / dispatch        | open/update the SDK upgrade PR from latest pkg.pr.new                                                                        |
| `sdk-npm-release.yml` | dispatch (version)        | pin catalog to npm + release-together changeset → PR                                                                         |
| `release.yml`         | push to `main` / dispatch | Changesets version PR → npm + `dx registry publish` per released plugin (guarded); `registry_only` retries the registry half |

## Secrets / prerequisites

- **npm: a trusted publisher (OIDC), not a token.** Each plugin is configured on npmjs.com to trust
  this repository's `release.yml`, and the workflow requests an `id-token` — so there is no npm secret
  to hold or rotate. Renaming the workflow file breaks OIDC for every plugin.
  - A plugin npm has never seen cannot have a trusted publisher yet, so its first publish is manual;
    keep it `private: true` until then, or `changeset publish` fails and takes the rest of the release
    with it (the registry publish is gated on its output). `pnpm check-packages-published` enforces
    this in CI.
  - **Every publishable plugin needs `repository.url` in its `package.json`**, pointing at this
    repository. Provenance is on (`NPM_CONFIG_PROVENANCE`), and npm validates the signed statement
    against that field — a missing one is rejected with `E422 … "repository.url" is ""` _after_ the
    signature has been written to the transparency log, so the release is already lost by the time it
    surfaces. `pnpm check-packages-published` fails on this too, comparing against
    `GITHUB_REPOSITORY`.
- `ATPROTO_HANDLE` + `ATPROTO_APP_PASSWORD` — a verified publisher identity for the release workflow
  (or wire `dx account login` for the DPoP path).
- `GH_DXOS_BOT_PAT` — dxos-bot's PAT (`contents: write` + `pull-requests: write`), used by every
  workflow that opens a PR: **SDK nightly**, **SDK npm release**, and **Release** (the Version
  Packages PR). Without it a PR is owned by `github-actions[bot]`, and GitHub's recursion guard
  applies — `check.yml` either never runs at all or is parked in `action_required` awaiting a manual
  approval — so auto-merge never fires and the PR sits open. Each workflow logs a warning when the
  secret is absent.
  - In `release.yml` the token is the action's `github-token` **input**, and `GITHUB_TOKEN` must stay
    out of that step's `env`: changesets/action reads `process.env.GITHUB_TOKEN` in preference to the
    input, so setting both silently reinstates the broken identity. The checkout also sets
    `persist-credentials: false`, because the credential it would otherwise persist outranks the
    netrc the action writes and would put the Version PR's commits back on `GITHUB_TOKEN`.
- The release workflow installs the CLI from `DX_CLI_PACKAGE` (repo variable), defaulting to a
  pkg.pr.new preview because npm's `@dxos/cli@0.10.0` is broken — its binary embeds an absolute path
  to the machine that built it. Point the variable at `@dxos/cli` once a working version is on npm.
- The publisher DID must be verified by the registry's configured verifier, or published records
  won't appear in Composer (see the registry spec).
