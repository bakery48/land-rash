import { Cell, Resource, ResourceCost } from '../types';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

const RESOURCE_TYPES: Resource[] = ['wood', 'stone', 'food', 'gold'];

function randomResource(): Resource {
  return RESOURCE_TYPES[Math.floor(Math.random() * (RESOURCE_TYPES.length - 1))]; // exclude gold for random cost
}

function buildCellCost(row: number, col: number, size: number): ResourceCost {
  const maxIdx = size - 1;
  const isCorner =
    (row === 0 || row === maxIdx) && (col === 0 || col === maxIdx);
  const isEdge =
    !isCorner && (row === 0 || row === maxIdx || col === 0 || col === maxIdx);
  // isCenter = !isCorner && !isEdge

  const cost: ResourceCost = {};

  if (isCorner) {
    // cheapest: 1 resource of one type
    const r = randomResource();
    cost[r] = 1;
  } else if (isEdge) {
    // medium: 1-2 resources of one or two types
    const r1 = randomResource();
    cost[r1] = (cost[r1] ?? 0) + 1;
    if (Math.random() < 0.5) {
      const r2 = randomResource();
      cost[r2] = (cost[r2] ?? 0) + 1;
    }
  } else {
    // center: 2 resources, possibly two types
    const r1 = randomResource();
    cost[r1] = (cost[r1] ?? 0) + 1;
    const r2 = randomResource();
    cost[r2] = (cost[r2] ?? 0) + 1;
  }

  return cost;
}

export function createBoard(playerCount: number): Cell[][] {
  let size: number;
  if (playerCount <= 3) {
    size = 4;
  } else if (playerCount <= 5) {
    size = 5;
  } else {
    size = 6;
  }

  const board: Cell[][] = [];
  for (let row = 0; row < size; row++) {
    const rowArr: Cell[] = [];
    for (let col = 0; col < size; col++) {
      rowArr.push({
        id: nanoid(8),
        row,
        col,
        owner: null,
        cost: buildCellCost(row, col, size),
      });
    }
    board.push(rowArr);
  }
  return board;
}

export function getAdjacentCells(
  board: Cell[][],
  row: number,
  col: number
): Cell[] {
  const adjacent: Cell[] = [];
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of deltas) {
    const r = row + dr;
    const c = col + dc;
    if (r >= 0 && r < board.length && c >= 0 && c < board[0].length) {
      adjacent.push(board[r][c]);
    }
  }
  return adjacent;
}

export function canAcquire(cell: Cell, resources: Resource[]): boolean {
  return consumeResources(resources, cell.cost) !== null;
}

export function consumeResources(
  resources: Resource[],
  cost: ResourceCost
): Resource[] | null {
  const pool = [...resources];

  // First pass: consume non-gold resources exactly
  for (const [resource, amount] of Object.entries(cost) as [Resource, number][]) {
    if (resource === 'gold') continue; // handled as wild below
    let needed = amount;
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      if (pool[i] === resource) {
        pool.splice(i, 1);
        needed--;
      }
    }
    if (needed > 0) {
      // Try to cover remainder with gold (wild)
      for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
        if (pool[i] === 'gold') {
          pool.splice(i, 1);
          needed--;
        }
      }
    }
    if (needed > 0) return null;
  }

  // Second pass: consume gold cost directly
  const goldCost = cost['gold'] ?? 0;
  if (goldCost > 0) {
    let needed = goldCost;
    for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
      if (pool[i] === 'gold') {
        pool.splice(i, 1);
        needed--;
      }
    }
    if (needed > 0) return null;
  }

  return pool;
}

export function calcBoardScore(board: Cell[][], playerId: string): number {
  let score = 0;
  const size = board.length;

  // 1pt per territory
  for (const row of board) {
    for (const cell of row) {
      if (cell.owner === playerId) score++;
    }
  }

  // Consecutive bonuses: check rows and columns
  // +2 for 3 consecutive, +4 for 4+
  // We scan for maximal runs
  const bonusForRun = (length: number): number => {
    if (length >= 4) return 4;
    if (length >= 3) return 2;
    return 0;
  };

  // Check rows
  for (let r = 0; r < size; r++) {
    let run = 0;
    for (let c = 0; c < size; c++) {
      if (board[r][c].owner === playerId) {
        run++;
      } else {
        score += bonusForRun(run);
        run = 0;
      }
    }
    score += bonusForRun(run);
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let run = 0;
    for (let r = 0; r < size; r++) {
      if (board[r][c].owner === playerId) {
        run++;
      } else {
        score += bonusForRun(run);
        run = 0;
      }
    }
    score += bonusForRun(run);
  }

  return score;
}

export function getMaxConsecutive(board: Cell[][], playerId: string): number {
  const size = board.length;
  let max = 0;

  // Check rows
  for (let r = 0; r < size; r++) {
    let run = 0;
    for (let c = 0; c < size; c++) {
      if (board[r][c].owner === playerId) {
        run++;
        if (run > max) max = run;
      } else {
        run = 0;
      }
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let run = 0;
    for (let r = 0; r < size; r++) {
      if (board[r][c].owner === playerId) {
        run++;
        if (run > max) max = run;
      } else {
        run = 0;
      }
    }
  }

  return max;
}
