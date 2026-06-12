export type Resource = 'wood' | 'stone' | 'food' | 'gold';

export type CardType = 'territory' | 'sabotage' | 'boost' | 'abundance' | 'steal' | 'resource';

export type PhaseEventType = 'harvest' | 'contest' | 'storm' | 'trade' | 'peace';

export type TurnStep = 'draw' | 'take_resource' | 'action' | 'end';

export type ResourceCost = Partial<Record<Resource, number>>;

export interface Cell {
  id: string;
  row: number;
  col: number;
  owner: string | null;
  cost: ResourceCost;
}

export interface Card {
  id: string;
  type: CardType;
  resource?: Resource;
  name?: string;
  description?: string;
  targetCell?: string;
  effect?: Record<string, unknown>;
}

export interface ObjectiveCondition {
  type: 'resource_combo' | 'consecutive' | 'multi_acquire';
  params: Record<string, unknown>;
}

export interface ObjectiveCard {
  id: string;
  description: string;
  points: number;
  achieved: boolean;
  achievedBy: string | null;
  condition: ObjectiveCondition;
}

export interface PhaseEvent {
  type: PhaseEventType;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  resources: Resource[];
  score: number;
  connected: boolean;
  boostNextTurn: boolean;
  territoriesThisPhase: number;
  isHost?: boolean;
}

export interface GameState {
  roomId: string;
  phase: number;
  round: number;
  activePlayerId: string;
  step: TurnStep;
  players: Player[];
  board: Cell[][];
  resourcePool: Card[];
  resourceDeck: Card[];
  handDeck: Card[];
  playerOrder: string[];
  objectives: ObjectiveCard[];
  phaseEvents: PhaseEvent[];
  currentPhaseEvent: PhaseEvent | null;
  peaceActive: boolean;
  contestActive: boolean;
  winner: string | null;
  gameOver: boolean;
}

export interface Room {
  id: string;
  hostId: string;
  players: { id: string; name: string }[];
  gameState: GameState | null;
  status: 'waiting' | 'playing' | 'finished';
  maxPlayers?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'info' | 'success';
}
