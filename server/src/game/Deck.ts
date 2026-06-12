import { Card, ObjectiveCard, Resource } from '../types';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawCard(deck: Card[]): [Card | null, Card[]] {
  if (deck.length === 0) return [null, deck];
  const [top, ...rest] = deck;
  return [top, rest];
}

export function buildResourceDeck(): Card[] {
  const cards: Card[] = [];

  const resourceCounts: [Resource, number][] = [
    ['wood', 12],
    ['stone', 10],
    ['food', 8],
    ['gold', 6],
  ];

  for (const [resource, count] of resourceCounts) {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: nanoid(8),
        type: 'resource',
        resource,
      });
    }
  }

  return shuffle(cards);
}

export function buildHandDeck(): Card[] {
  const cards: Card[] = [];

  // 5 territory, 4 sabotage, 6 boost, 6 abundance, 5 steal
  const handCounts: [Card['type'], number][] = [
    ['territory', 5],
    ['sabotage', 4],
    ['boost', 6],
    ['abundance', 6],
    ['steal', 5],
  ];

  for (const [type, count] of handCounts) {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: nanoid(8),
        type,
      });
    }
  }

  return shuffle(cards);
}

export function buildObjectives(): ObjectiveCard[] {
  const objectives: ObjectiveCard[] = [
    {
      id: nanoid(8),
      description: '木材3枚+石材2枚を同時に使う',
      points: 4,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'resource_combo',
        params: { wood: 3, stone: 2 },
      },
    },
    {
      id: nanoid(8),
      description: '自分の領土を縦または横に3連続並べる',
      points: 3,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'consecutive',
        params: { length: 3 },
      },
    },
    {
      id: nanoid(8),
      description: 'フェーズ内に2マス以上獲得する',
      points: 2,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'multi_acquire',
        params: { count: 2 },
      },
    },
    {
      id: nanoid(8),
      description: '石材4枚を同時に使う',
      points: 4,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'resource_combo',
        params: { stone: 4 },
      },
    },
    {
      id: nanoid(8),
      description: 'フェーズ内に3マス以上獲得する',
      points: 3,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'multi_acquire',
        params: { count: 3 },
      },
    },
    {
      id: nanoid(8),
      description: '金貨2枚を同時に使う',
      points: 3,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'resource_combo',
        params: { gold: 2 },
      },
    },
    {
      id: nanoid(8),
      description: '自分の領土を縦または横に4連続並べる',
      points: 4,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'consecutive',
        params: { length: 4 },
      },
    },
    {
      id: nanoid(8),
      description: '食料2枚を使う',
      points: 2,
      achieved: false,
      achievedBy: null,
      condition: {
        type: 'resource_combo',
        params: { food: 2 },
      },
    },
  ];

  return shuffle(objectives);
}
