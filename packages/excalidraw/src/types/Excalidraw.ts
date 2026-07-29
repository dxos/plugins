//
// Copyright 2026 DXOS.org
//
// Own data schema for the Excalidraw plugin. Sharing the `Sketch` schema from
// `@dxos/plugin-sketch` would transitively pull in the tldraw runtime and produce a
// "multiple tldraw versions installed" warning when a bundle links both plugins.
//

// @import-as-namespace

import * as Schema from 'effect/Schema';

import { Annotation, DXN, Obj, Ref, Type } from '@dxos/echo';
import type {} from '@dxos/echo/Entity';
import { FormInputAnnotation, HiddenAnnotation } from '@dxos/echo/internal';
import { CollectionItemAnnotation } from '@dxos/schema';

/** Schema identifier embedded in the persisted canvas payload. */
export const EXCALIDRAW_SCHEMA = 'excalidraw.com/2';

/**
 * Persisted Excalidraw canvas. `content` is an opaque map of ElementId → ExcalidrawElement
 * managed by {@link ExcalidrawStoreAdapter}; we treat it as JSON-compatible data so the
 * ECHO/Automerge layer can CRDT-merge incremental changes without knowing the shape.
 */
export class Canvas extends Type.makeObject<Canvas>(DXN.make('org.dxos.type.excalidraw.canvas', '0.1.0'))(
  Schema.Struct({
    /** Versioning tag so the adapter can detect payloads it doesn't understand. */
    schema: Schema.String.pipe(Schema.optional),
    content: Schema.Record({ key: Schema.String, value: Schema.Any }),
  }).pipe(HiddenAnnotation.set(true)),
) {}

/** The user-facing Excalidraw object — a named handle around a canvas. */
export class Excalidraw extends Type.makeObject<Excalidraw>(DXN.make('org.dxos.type.excalidraw', '0.1.0'))(
  Schema.Struct({
    name: Schema.String.pipe(Schema.optional),
    canvas: Ref.Ref(Canvas).pipe(FormInputAnnotation.set(false)),
  }).pipe(
    Annotation.IconAnnotation.set({ icon: 'ph--compass-tool--regular', hue: 'indigo' }),
    // Without this a new sketch is filed under the database section's `types/<slug>` subtree rather
    // than into a collection, where it cannot be organised alongside the user's other documents.
    CollectionItemAnnotation.set(true),
  ),
) {}

export type MakeOptions = Omit<Obj.MakeProps<typeof Excalidraw>, 'canvas'> & {
  canvas?: Partial<Obj.MakeProps<typeof Canvas>>;
};

/** Construct a new Excalidraw + Canvas pair, linked by Ref. */
export const make = ({ canvas: canvasProps, ...props }: MakeOptions = {}) => {
  const { schema = EXCALIDRAW_SCHEMA, content = {} } = canvasProps ?? {};
  const canvas = Obj.make(Canvas, { schema, content });
  return Obj.make(Excalidraw, { ...props, canvas: Ref.make(canvas) });
};

/**
 * Runtime type guard. Uses `Obj.instanceOf` so the check is typename-aware —
 * plugin-sketch's `Sketch` shares the structural shape (`name` + `canvas` ref)
 * and a shape-only check would false-positive there, causing both plugins to
 * claim the same object at the surface filter.
 */
export const isExcalidraw = (object: unknown): object is Excalidraw => Obj.instanceOf(Excalidraw, object);
