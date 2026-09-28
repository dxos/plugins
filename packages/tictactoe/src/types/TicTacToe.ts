//
// Copyright 2026 DXOS.org
//

import * as Schema from 'effect/Schema';

import { Annotation, DXN, Obj, Type } from '@dxos/echo';
import { FormInputAnnotation } from '@dxos/echo/Annotation';

const LEVELS = ['easy', 'medium', 'hard'] as const;

export const Level = Schema.Literals(LEVELS);
export type Level = Schema.Schema.Type<typeof Level>;

/** Narrows unvalidated input (create-game form values) to a difficulty level. */
export const isLevel = (value: unknown): value is Level => LEVELS.some((level) => level === value);

export const GameStatus = Schema.Literals(['playing', 'x-wins', 'o-wins', 'draw']);
export type GameStatus = Schema.Schema.Type<typeof GameStatus>;

/**
 * Tic-Tac-Toe variant state. Referenced by the base `Game` object via `Game.variant`.
 */
export class State extends Type.makeObject<State>(DXN.make('org.dxos.type.tictactoe.state', '0.1.0'))(
  Schema.Struct({
    board: Schema.String.annotate({
      description: 'Flat string of length size*size; - = empty, X or O = placed.',
    }),
    moves: Schema.optional(
      Schema.String.annotate({
        description: 'Semicolon-separated move log, e.g. "X:1,1;O:0,2;X:2,0".',
      }),
    ),
    size: Schema.Number.annotate({
      description: 'Board dimension (3, 4, or 5).',
    }),
    winCondition: Schema.Number.annotate({
      description: 'Consecutive marks needed to win.',
    }),
    level: Level.annotate({
      description: 'AI difficulty level.',
    }).pipe(FormInputAnnotation.set(false), Schema.optional),
  }).pipe(Annotation.IconAnnotation.set({ icon: 'ph--hash-straight--regular', hue: 'cyan' })),
) {}

/**
 * Build a fresh Tic-Tac-Toe variant state with an empty board.
 *
 * @param size Board dimension (3..5). Defaults to 3. Must be an integer in [3, 5].
 * @param winCondition Consecutive marks needed to win (1..size). Defaults to `size`.
 * @param level Optional AI difficulty; omit for human-vs-human.
 * @throws RangeError if `size` or `winCondition` is out of range.
 */
export const make = ({
  size = 3,
  winCondition,
  level,
}: {
  size?: number;
  winCondition?: number;
  level?: Level;
} = {}): State => {
  if (!Number.isInteger(size) || size < 3 || size > 5) {
    throw new RangeError(`Invalid size: ${size}. Must be an integer in [3, 5].`);
  }
  const effectiveWinCondition = winCondition ?? size;
  if (!Number.isInteger(effectiveWinCondition) || effectiveWinCondition < 1 || effectiveWinCondition > size) {
    throw new RangeError(`Invalid winCondition: ${effectiveWinCondition}. Must be an integer in [1, ${size}].`);
  }

  const board = '-'.repeat(size * size);

  return Obj.make(State, {
    board,
    moves: '',
    size,
    winCondition: effectiveWinCondition,
    level,
  });
};
