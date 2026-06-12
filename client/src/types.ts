export type Resource = 'wood' | 'stone' | 'food' | 'gold';

export type CardType = 'territory' | 'sabotage' | 'boost' | 'abundance' | 'steal';

export type PhaseEventType =
  | 'drought'
  | 'gold_rush'
  | 'lumber_boom'
  | 'stone_age'
  | 'feast'
  | 'sabotage_wave'
  | 'land_grab'
  | 'resource_drain';

export type TurnStep = 'draw' | 'take_resource' | 'action' | 'end';

export type ResourceCost = Partial<Record<Resource, number>>;

export interface Cell {
  id: string;
  row: number;
  col: number;
  owner: string | null;
  cost: ResourceCost;
  value: number;
  terrain: 'plains' | 'forest' | 'mountain' | 'river' | 'coast';
  boosted: boolean;
}

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
  cost: ResourceCost;
  effect?: Record<string, unknown>;
}

export interface ObjectiveCard {
  id: string;
  name: string;
  description: string;
  condition: string;
  points: number;
  achievedBy: string | null;
}

export interface PhaseEvent {
  type: PhaseEventType;
  name: string;
  description: string;
  effect: Record<string, unknown>;
  activatedAt: number;
}

export interface Player {
  id: string;
  name: string;
  resources: Record<Resource, number>;
  hand: Card[];
  territories: string[];
  score: number;
  connected: boolean;
  isHost: boolean;
}

export interface GameState {
  phase: number;
  round: number;
  turnIndex: number;
  turnStep: TurnStep;
  players: Player[];
  board: Cell[][];
  resourcePool: (Resource | null)[];
  deck: number;
  objectives: ObjectiveCard[];
  currentPhaseEvent: PhaseEvent | null;
  winner: string | null;
  takenResourcesThisTurn: number;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  players: { id: string; name: string; isHost: boolean }[];
  gameStarted: boolean;
  maxPlayers: number;
}
