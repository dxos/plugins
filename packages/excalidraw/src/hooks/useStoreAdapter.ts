//
// Copyright 2024 DXOS.org
//

import { useEffect, useState } from 'react';

import { createDocAccessor } from '@dxos/echo-client';
import { useObject } from '@dxos/echo-react';

import { type Excalidraw } from '#types';

import { ExcalidrawStoreAdapter, type ExcalidrawStoreAdapterProps } from './adapter';

export const useStoreAdapter = (object?: Excalidraw.Excalidraw, options: ExcalidrawStoreAdapterProps = {}) => {
  const [adapter] = useState(new ExcalidrawStoreAdapter(options));
  const [_, forceUpdate] = useState({});
  // Subscribe to the Ref so the effect below re-runs when the canvas resolves.
  // The snapshot returned here is just for change detection — `createDocAccessor`
  // needs the echo-attached LiveObject, so we still go through `ref.load()` inside
  // the effect to obtain it.
  const [canvasSnapshot] = useObject(object?.canvas);

  useEffect(() => {
    if (!object || !canvasSnapshot) {
      return;
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      const canvas = await object.canvas.load();
      if (cancelled) {
        return;
      }
      const accessor = createDocAccessor(canvas, ['content']);
      await adapter.open(accessor);
      forceUpdate({});
    });

    return () => {
      cancelled = true;
      clearTimeout(t);
      void adapter.close();
    };
  }, [object, canvasSnapshot]);

  return adapter;
};
