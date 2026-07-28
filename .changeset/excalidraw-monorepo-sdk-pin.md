---
'dxos-plugin-excalidraw': minor
---

Rebuild against the current DXOS SDK. The settings panel is now schema-driven (`Form.Root variant='settings'`), the canvas store adapter uses `@dxos/echo-doc`'s `AbstractStoreAdapter` in place of a vendored copy, and new objects are no longer created hidden — the `hidden` input was removed from `SpaceOperation.AddObject` upstream. Drops eleven dependencies the plugin no longer imports, including `@automerge/automerge`.
