//
// Copyright 2023 DXOS.org
//
// Ported from `@dxos/plugin-sketch/src/util/base-adapter.ts`. The base class there
// is fine — it's the tldraw-specific concrete implementation in plugin-sketch
// that prevents us from reusing the module directly. Owning the base class here
// severs the dependency entirely.
//

import { next as A } from '@automerge/automerge';

import { Context } from '@dxos/context';
import { type DocAccessor } from '@dxos/echo-client';
import { invariant } from '@dxos/invariant';
import { log } from '@dxos/log';
import { isNonNullable } from '@dxos/util';

import { decode, encode, getDeep, rebasePath } from './automerge-encoding';

export type BaseElement = { id: string };

/** A batch of mutations produced by a single synchronisation pass. */
export type Batch<Element extends BaseElement> = {
  added?: Element[];
  updated?: Element[];
  deleted?: Element['id'][];
};

/** Incremental mutation buffer used by subclasses to collect local changes between saves. */
export class Modified<Element extends BaseElement> {
  readonly added = new Map<Element['id'], Element>();
  readonly updated = new Map<Element['id'], Element>();
  readonly deleted = new Set<Element['id']>();

  batch(): Batch<Element> {
    return {
      added: Array.from(this.added.values()),
      updated: Array.from(this.updated.values()),
      deleted: Array.from(this.deleted.values()),
    };
  }

  clear(): void {
    this.added.clear();
    this.updated.clear();
    this.deleted.clear();
  }
}

/**
 * Generic adapter that maps model elements onto a map of Automerge records within a document.
 * Subclasses own the model; the adapter handles bidirectional sync between the model and Automerge.
 */
export abstract class AbstractAutomergeStoreAdapter<Element extends BaseElement> {
  #ctx?: Context;
  #accessor?: DocAccessor<any>;
  #lastHeads?: A.Heads;

  constructor(private readonly _readonly = false) {}

  get isOpen() {
    return !!this.#accessor;
  }

  get readonly() {
    return this._readonly;
  }

  async open(accessor: DocAccessor<any>): Promise<void> {
    invariant(accessor.path.length);
    if (this.isOpen) {
      await this.close();
    }

    log('opening...', { path: accessor.path });

    this.#ctx = new Context();
    this.#accessor = accessor;
    this.onOpen(this.#ctx);

    {
      const map: Record<string, Element> = getDeep(accessor.handle.doc(), accessor.path) ?? {};
      const records = Object.values(map);
      if (records.length === 0) {
        // Empty doc: seed it with the current model.
        accessor.handle.change((doc) => {
          const target: Record<string, Element> = getDeep(doc, accessor.path, true);
          for (const record of this.getElements()) {
            target[record.id] = encode(record);
          }
        });
      } else {
        // Non-empty doc: overwrite the model with its contents.
        this.onUpdate({
          updated: records.map((record) => decode(record)),
        });
      }
    }

    {
      const updateModel = () => {
        const doc = accessor.handle.doc()!;
        const map: Record<string, Element> = getDeep(doc, accessor.path);
        const updated = new Set<Element['id']>();
        const deleted = new Set<Element['id']>();
        const currentHeads = A.getHeads(doc);
        const diff = A.equals(this.#lastHeads, currentHeads) ? [] : A.diff(doc, this.#lastHeads ?? [], currentHeads);
        diff.forEach((patch) => {
          const relativePath = rebasePath(patch.path, accessor.path);
          if (!relativePath) {
            return;
          }
          if (relativePath.length === 0) {
            for (const id of Object.keys(map)) {
              updated.add(id as Element['id']);
            }
            return;
          }
          switch (patch.action) {
            case 'del': {
              if (relativePath.length === 1) {
                deleted.add(relativePath[0] as Element['id']);
                break;
              }
            }
            // eslint-disable-next-line no-fallthrough
            case 'put':
            case 'insert':
            case 'inc':
            case 'splice': {
              updated.add(relativePath[0] as Element['id']);
              break;
            }
            default:
              log.warn('did not process patch', { patch, path: accessor.path });
          }
        });

        if (updated.size || deleted.size) {
          this.onUpdate({
            updated: Array.from(updated)
              .map((id) => decode(map[id]))
              .filter(isNonNullable),
            deleted: Array.from(deleted),
          });
        }

        this.#lastHeads = currentHeads;
      };

      accessor.handle.addListener('change', updateModel);
      this.#ctx.onDispose(() => accessor.handle.removeListener('change', updateModel));
    }

    log('open');
  }

  async close(): Promise<void> {
    if (!this.isOpen) {
      return;
    }
    log('closing...');
    this.onClose();
    await this.#ctx!.dispose();
    this.#ctx = undefined;
    this.#accessor = undefined;
    log('closed');
  }

  protected updateDatabase(batch: Batch<Element>): void {
    invariant(this.isOpen);
    if (this.readonly) {
      log.warn('Attempting to update read-only store.');
      return;
    }
    const accessor = this.#accessor!;
    accessor.handle.change((doc) => {
      const map: Record<string, Element> = getDeep(doc, accessor.path, true);
      this.#removeDeleted(batch, batch.added)?.forEach((element) => (map[element.id] = encode(element)));
      this.#removeDeleted(batch, batch.updated)?.forEach((element) => (map[element.id] = encode(element)));
      batch.deleted?.forEach((id) => delete map[id]);
    });
  }

  #removeDeleted(batch: Batch<Element>, elements?: Element[]): Element[] | undefined {
    return batch.deleted ? elements?.filter((element) => !batch.deleted!.includes(element.id)) : elements;
  }

  abstract getElements(): readonly Element[];

  protected abstract onUpdate(batch: Batch<Element>): void;

  protected onOpen(_ctx: Context): void {}
  protected onClose(): void {}
}
