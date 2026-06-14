//
// Copyright 2025 DXOS.org
//

import * as Effect from 'effect/Effect';

import { Operation } from '@dxos/compute';
import { Ref } from '@dxos/echo';

import { Excalidraw, ExcalidrawOperation } from '#types';

const handler: Operation.WithHandler<typeof ExcalidrawOperation.Create> = ExcalidrawOperation.Create.pipe(
  Operation.withHandler(({ name, schema = Excalidraw.EXCALIDRAW_SCHEMA, content = {} }) =>
    Effect.succeed({
      object: Ref.make(Excalidraw.make({ name, canvas: { schema, content } })),
    }),
  ),
);

export default handler;
