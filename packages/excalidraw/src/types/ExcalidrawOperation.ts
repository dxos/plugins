//
// Copyright 2025 DXOS.org
//

// @import-as-namespace

import * as Schema from 'effect/Schema';

import { Operation } from '@dxos/compute';
import { DXN, Ref } from '@dxos/echo';

import { meta } from '#meta';

import * as Excalidraw from './Excalidraw';

const EXCALIDRAW_OPERATION = `${meta.profile.key}.operation`;

// Annotated so declaration emit names the field through `Ref.RefSchema` — the inferred form expands
// to `Entity.OfKind`, which tsc outside the dxos workspace can only name via the pnpm store path (TS2883).
const objectRef: Ref.RefSchema<Excalidraw.Excalidraw> = Ref.Ref(Excalidraw.Excalidraw);

export const Create = Operation.make({
  meta: { key: DXN.make(`${EXCALIDRAW_OPERATION}.create`), name: 'Create Excalidraw' },
  input: Schema.Struct({
    name: Schema.optional(Schema.String),
    schema: Schema.optional(Schema.String),
    content: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Any })),
  }),
  output: Schema.Struct({
    object: objectRef,
  }),
});
