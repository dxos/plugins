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

export const Create = Operation.make({
  meta: { key: DXN.make(`${EXCALIDRAW_OPERATION}.create`), name: 'Create Excalidraw' },
  input: Schema.Struct({
    name: Schema.optional(Schema.String),
    schema: Schema.optional(Schema.String),
    content: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Any })),
  }),
  output: Schema.Struct({
    object: Ref.Ref(Excalidraw.Excalidraw),
  }),
});
