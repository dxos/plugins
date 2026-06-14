//
// Copyright 2023 DXOS.org
//
// Ported from `@dxos/plugin-sketch/src/util/util.ts`, kept tldraw-free so this
// plugin has no transitive dependency on the sketch plugin.
//

import { next as A } from '@automerge/automerge';

import { isNonNullable } from '@dxos/util';

/** Strings longer than this threshold are stored as Automerge `RawString`s for performance. */
const STRING_CRDT_LIMIT = 300_000;

/** Encode a model value into an Automerge-friendly record. */
export const encode = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(encode);
  }
  if (value instanceof A.RawString) {
    throw new Error('encode called on automerge data.');
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, inner]) => {
          const encoded = encode(inner);
          if (encoded === undefined) {
            return undefined;
          }
          return [key, inner];
        })
        .filter(isNonNullable),
    );
  }
  if (typeof value === 'string' && value.length > STRING_CRDT_LIMIT) {
    return new A.RawString(value);
  }
  return value;
};

/** Decode an Automerge record back into a model value. */
export const decode = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map(decode);
  }
  if (value instanceof A.RawString) {
    return value.toString();
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, decode(inner)]));
  }
  return value;
};

/** Returns the path relative to `base`, or undefined if it's outside. */
export const rebasePath = (path: A.Prop[], base: readonly (string | number)[]): A.Prop[] | undefined => {
  if (path.length < base.length) {
    return undefined;
  }
  for (let i = 0; i < base.length; ++i) {
    if (path[i] !== base[i]) {
      return undefined;
    }
  }
  return path.slice(base.length);
};

/** Follow a path through an object, optionally creating missing intermediate objects. */
export const getDeep = (obj: any, path: readonly (string | number)[], init = false) => {
  let value = obj;
  for (const key of path) {
    if (init) {
      value[key] ??= {};
    }
    value = value?.[key];
  }
  return value;
};
