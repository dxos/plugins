//
// Copyright 2026 DXOS.org
//

import React from 'react';

import { Obj } from '@dxos/echo';
import { useObject } from '@dxos/echo-react';
import { type GameVariantSurfaceProps } from '@dxos/plugin-game/GameCapabilities';
import { Card } from '@dxos/react-ui';

import { TicTacToeBoard, getWinningCells } from '#components';
import { TicTacToe } from '#types';

export type TicTacToeCardProps = GameVariantSurfaceProps;

export const TicTacToeCard = ({ variant }: TicTacToeCardProps) => {
  const state = Obj.instanceOf(TicTacToe.State, variant) ? variant : undefined;
  const [board] = useObject(state, 'board');
  const [size] = useObject(state, 'size');
  const [winCondition] = useObject(state, 'winCondition');

  if (!state || !board || !size || !winCondition) {
    return null;
  }

  const winningCells = getWinningCells(board, size, winCondition);

  return (
    <Card.Body>
      <Card.Section classNames='aspect-square'>
        <TicTacToeBoard board={board} size={size} winningCells={winningCells} disabled />
      </Card.Section>
    </Card.Body>
  );
};

TicTacToeCard.displayName = 'TicTacToeCard';
