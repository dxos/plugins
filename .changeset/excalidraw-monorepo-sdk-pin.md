---
'dxos-plugin-excalidraw': patch
---

Rebuild against the DXOS SDK pinned by the `dxos` catalog, deduplicating the dependency graph by matching both pkg.pr.new's 7-character commit pins and the SDK's own `effect` and `@automerge/automerge` versions. Drops three dependencies the plugin never imported (`@effect-atom/atom`, `lodash.defaultsdeep`, `react-resize-detector`).
