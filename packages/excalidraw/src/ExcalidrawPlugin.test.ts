//
// Copyright 2026 DXOS.org
//

import { describe, test } from 'vitest';

import { ActivationEvents } from '@dxos/app-framework';
import { createTestApp } from '@dxos/app-framework/testing';
import { AppActivationEvents } from '@dxos/app-toolkit';
import { Obj } from '@dxos/echo';

import { ExcalidrawPlugin } from '#plugin';

import { meta } from './meta';
import { Excalidraw } from './types';

const moduleId = (name: string) => `${meta.profile.key}.module.${name}`;

// The nightly SDK bump auto-merges on a green CI, so these cover the surfaces an SDK change can break
// while still typechecking: module activation, plugin metadata derived from dx.config, and ECHO
// object construction (what a duplicated `effect` or `@automerge/automerge` instance breaks).
describe('ExcalidrawPlugin', () => {
  test('modules activate on the expected events', { timeout: 60_000 }, async ({ expect }) => {
    await using harness = await createTestApp({ plugins: [ExcalidrawPlugin()] });

    // Surfaces are active after a normal startup.
    expect(harness.manager.getActive()).toContain(moduleId('ReactSurface'));

    // The schema and create-object modules wait on SetupSchema, which ClientPlugin fires in a real app.
    await harness.fire(AppActivationEvents.SetupSchema);
    expect(harness.manager.getActive()).toEqual(expect.arrayContaining([moduleId('CreateObject'), moduleId('schema')]));

    // Operation handlers are not loaded on startup — SetupProcessManager fires lazily when an operation is invoked.
    await harness.fire(ActivationEvents.SetupProcessManager);
    expect(harness.manager.getActive()).toContain(moduleId('OperationHandler'));
  });

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
