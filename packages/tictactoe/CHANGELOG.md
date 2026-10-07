# @dxos/plugin-tictactoe

## 0.11.0

### Minor Changes

- 5ed67f1: Migrate to the current DXOS SDK: Effect 4 schema APIs, `Capability.lazyModule`/`contribute`, the `AppCapability` module makers, and the `@dxos/plugin-game` namespace subpaths.

### Patch Changes

- 16f80d9: Rebuild against DXOS SDK ^0.13.0.
- f6f407c: Move the article and card to the reorganized `@dxos/react-ui` components, and fix games against the AI, which locked the board after the first move because the AI's move was cancelled before it ran.
- 22f0cc1: Move to the namespace subpaths of `@dxos/react-ui`, `@dxos/app-toolkit` and `@dxos/plugin-testing`.

## 0.10.1

### Patch Changes

- eaaf5cb: Publish Tic-Tac-Toe from the community plugins repo, continuing the version line from the DXOS monorepo.
- 07163e6: Rebuild against DXOS SDK ^0.11.1.
