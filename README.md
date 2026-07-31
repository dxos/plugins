# Composer plugins

A monorepo of community plugins for [DXOS Composer](https://dxos.org/composer).

Each plugin lives under [`packages/`](./packages) with its own `package.json`, `dx.config.ts`, and Vite
build. All plugins share one DXOS SDK version via the `dxos` catalog in
[`pnpm-workspace.yaml`](./pnpm-workspace.yaml). Builds are orchestrated with
[moon](https://moonrepo.dev) (toolchain pinned in [`.prototools`](./.prototools), matching the dxos
monorepo) — `proto install` sets up node/pnpm/moon.

## Develop

```bash
proto install        # node, pnpm, moon (from .prototools)
pnpm install
moon run :build      # build every plugin (typecheck + vite build + manifest)
moon run tictactoe:dev   # dev-serve one plugin
```

Load a plugin into a bundled Composer via **Settings → Plugins → Load by URL** pointed at the dev
server's entry.

## Plugins

| Plugin | Id |
| --- | --- |
| [Tic-Tac-Toe](./packages/tictactoe) | `org.dxos.plugin.tictactoe` |

## Releasing & SDK upgrades

See [RELEASING.md](./RELEASING.md) — Changesets for versioning, `dx registry publish` for releases,
and the SDK upgrade train (nightly pkg.pr.new tracking + coordinated npm-release publishing).
