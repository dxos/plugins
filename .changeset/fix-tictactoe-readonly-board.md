---
'@dxos/plugin-tictactoe': patch
---

Fix "Cannot assign to read only property 'board'" when playing a move — the board now writes through the live object rather than the frozen snapshot the surface provides.
