import { Cell, Resource, ResourceCost } from '../types';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

/**
 * ゾーン制コスト設計
 *
 * 盤面を4象限に分け、位置によって主要リソースが決まる。
 *   左上 → 🪵木材ゾーン
 *   右上 → 🪨石材ゾーン
 *   左下 → 🌾食料ゾーン
 *   右下 → 混合（木材+石材、高コスト）
 *
 * コスト量は中心距離で決まる（端=安い, 中央=高い）。
 * 中央付近のマスは 💰金貨 コストが混入してより高価になる。
 */
function zoneResource(row: number, col: number, size: number): Resource {
  const mid = (size - 1) / 2;
  const top = row < mid;
  const left = col < mid;

  if (top && left) return 'wood';
  if (top && !left) return 'stone';
  if (!top && left) return 'food';
  // 右下: 木材+石材の混合ゾーン（後でコスト構築時に2種使う）
  return 'wood';
}

function buildCellCost(row: number, col: number, size: number): ResourceCost {
  const maxIdx = size - 1;
  const mid = (size - 1) / 2;

  // 中心からのチェビシェフ距離（0=中央, 大=端）
  const distFromCenter = Math.max(Math.abs(row - mid), Math.abs(col - mid));
  const maxDist = mid;
  // 端ほど安い（cost tier: 1=安, 2=中, 3=高）
  const tier = distFromCenter >= maxDist * 0.8 ? 1
    : distFromCenter >= maxDist * 0.4 ? 2
    : 3;

  const isBottomRight = row > mid && col > mid;
  const primary = zoneResource(row, col, size);
  const cost: ResourceCost = {};

  if (tier === 1) {
    // 端・コーナー: 主要リソース1枚
    cost[primary] = 1;
  } else if (tier === 2) {
    // 中間: 主要リソース2枚 or 1枚+食料1枚
    cost[primary] = 2;
    if (isBottomRight) {
      // 右下ゾーンは木材1+石材1
      cost['wood'] = 1;
      cost['stone'] = 1;
    }
  } else {
    // 中央: 高コスト。金貨が絡むか2種類
    if (isBottomRight) {
      // 右下中央: 木材2+石材1（最高コスト）
      cost['wood'] = 2;
      cost['stone'] = 1;
    } else {
      // 各ゾーン中央: 主要リソース2+金貨1
      cost[primary] = 2;
      cost['gold'] = 1;
    }
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
