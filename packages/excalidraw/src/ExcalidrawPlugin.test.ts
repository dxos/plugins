//
// Copyright 2026 DXOS.org
//

import { describe, test } from 'vitest';

import { Obj } from '@dxos/echo';

import { meta } from './meta';
import { Excalidraw } from './types';

// The nightly SDK bump auto-merges on a green CI, so these cover SDK-coupled surfaces that an SDK
// change can break while still typechecking: plugin metadata derived from dx.config, and ECHO object
// construction (which is what a duplicated `effect` or `@automerge/automerge` instance breaks).
//
// A module-activation test — the `createTestApp` pattern every plugin has in the dxos monorepo — is
// not here yet: importing the plugin implementation pulls in @dxos/react-ui and @dxos/ai, which do
// not load under vitest outside that monorepo without porting its vite test configuration.
describe('ExcalidrawPlugin', () => {
  test('meta derives from dx.config', ({ expect }) => {
    expect(meta.profile.key).toBe('org.dxos.plugin.excalidraw');
    expect(meta.profile.name).toBe('Excalidraw');
    expect(meta.profile.icon).toMatchObject({ key: 'ph--compass-tool--regular' });
  });

  test('make constructs an Excalidraw referencing a Canvas', ({ expect }) => {
    const object = Excalidraw.make({ name: 'test' });

    expect(Excalidraw.isExcalidraw(object)).toBe(true);
    expect(object.name).toBe('test');

    const canvas = object.canvas.target;
    expect(Obj.instanceOf(Excalidraw.Canvas, canvas)).toBe(true);
    expect(canvas?.schema).toBe(Excalidraw.EXCALIDRAW_SCHEMA);
  });

  test('the type guard is typename-aware, not structural', ({ expect }) => {
    // plugin-sketch's Sketch shares this shape; a structural check would claim it at the surface filter.
    expect(Excalidraw.isExcalidraw({ name: 'test', canvas: undefined })).toBe(false);
  });
});
