import { GameState, Player, Card, ObjectiveCard, PhaseEvent, Resource, TurnStep } from '../types';
import { buildResourceDeck, buildHandDeck, buildObjectives, drawCard, shuffle } from './Deck';
import { createBoard, getAdjacentCells, canAcquire, consumeResources, calcBoardScore, getMaxConsecutive } from './Board';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

const PHASE_EVENT_TYPES: PhaseEvent[] = [
  { type: 'harvest', description: '豊作: 全プレイヤーがリソースを1枚獲得' },
  { type: 'contest', description: '争奪戦: 次フェーズ第1ラウンドはリソースを3枚まで取れる' },
  { type: 'storm', description: '嵐: リソースプールをリセット、補充なし' },
  { type: 'trade', description: '交換: 手札を左隣のプレイヤーに渡す' },
  { type: 'peace', description: '平和協定: 次フェーズはサボタージュ/強奪禁止' },
];

const ROUNDS_PER_PHASE = 3;
const TOTAL_PHASES = 5;
const HAND_LIMIT = 4;
const POOL_SIZE = 5;

export class GameEngine {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  getState(): GameState {
    return this.state;
  }

  static initGame(
    roomId: string,
    players: { id: string; name: string }[],
    _hostId: string
  ): GameState {
    const playerOrder = shuffle(players.map((p) => p.id));

    let resourceDeck = buildResourceDeck();
    let handDeck = buildHandDeck();
    const allObjectives = buildObjectives();
    // reveal 3 objectives at start
    const objectives = allObjectives.slice(0, 3);

    // Initialize players
    const gamePlayers: Player[] = players.map((p) => ({
      id: p.id,
      name: p.name,
      hand: [],
      resources: [],
      score: 0,
      connected: true,
      boostNextTurn: false,
      territoriesThisPhase: 0,
    }));

    // Deal initial hand cards (up to 4 each)
    for (const player of gamePlayers) {
      for (let i = 0; i < HAND_LIMIT; i++) {
        const [card, newDeck] = drawCard(handDeck);
        if (card) {
          player.hand.push(card);
          handDeck = newDeck;
        }
      }
    }

    // Build resource pool (5 face-up cards)
    const resourcePool: Card[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const [card, newDeck] = drawCard(resourceDeck);
      if (card) {
        resourcePool.push(card);
        resourceDeck = newDeck;
      }
    }

    const board = createBoard(players.length);

    const state: GameState = {
      roomId,
      phase: 1,
      round: 1,
      activePlayerId: playerOrder[0],
      board,
      resourcePool,
      resourceDeck,
      handDeck,
      players: gamePlayers,
      playerOrder,
      objectives,
      phaseEvents: [],
      currentPhaseEvent: null,
      step: 'draw',
      peaceActive: false,
      contestActive: false,
      winner: null,
      gameOver: false,
    };

    return state;
  }

  private getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  private updatePlayer(player: Player): void {
    this.state = {
      ...this.state,
      players: this.state.players.map((p) => (p.id === player.id ? player : p)),
    };
  }

  private assertActivePlayer(playerId: string): void {
    if (this.state.activePlayerId !== playerId) {
      throw new Error('Not your turn');
    }
  }

  private assertStep(step: TurnStep): void {
    if (this.state.step !== step) {
      throw new Error(`Invalid action: expected step "${step}", got "${this.state.step}"`);
    }
  }

  drawCard(playerId: string): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('draw');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    let handDeck = this.state.handDeck;
    let newHand = [...player.hand];

    // Draw 1 card if under hand limit
    if (newHand.length < HAND_LIMIT) {
      const [card, newDeck] = drawCard(handDeck);
      if (card) {
        newHand = [...newHand, card];
        handDeck = newDeck;
      }
    }

    this.updatePlayer({ ...player, hand: newHand });
    this.state = { ...this.state, handDeck, step: 'take_resource' };

    return this.state;
  }

  takeResource(playerId: string, cardId: string): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('take_resource');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    // Find the card in the pool
    const cardIndex = this.state.resourcePool.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not found in resource pool');

    const card = this.state.resourcePool[cardIndex];
    if (card.type !== 'resource' || !card.resource) {
      throw new Error('Not a resource card');
    }

    // Determine max resources player can take this step
    const maxTake = this.state.contestActive ? 3 : 2;

    // Count how many resources player has taken this turn
    // We track this via a temporary counter on state — use resources length delta
    // Actually we need to track resources taken this turn separately.
    // We'll use a convention: track via state.step counter embedded in state
    // Simple approach: just count and store taken count in player or state.
    // Since GameState doesn't have a turnResourcesTaken field, we track by checking:
    // The player starts with some resources. We need to know how many taken so far this turn.
    // We'll store it in state via a workaround: add a transient field.
    // Best: just check if player has taken <maxTake resources on this step.
    // We'll add a field to state via casting.
    const stateAny = this.state as GameState & { _turnResourcesTaken?: number };
    const taken = stateAny._turnResourcesTaken ?? 0;

    if (taken >= maxTake) {
      throw new Error(`Already took ${maxTake} resources this turn`);
    }

    // Remove card from pool and add to player resources
    const newPool = this.state.resourcePool.filter((_, i) => i !== cardIndex);
    const newResources = [...player.resources, card.resource];

    // Replenish pool from deck
    let resourceDeck = this.state.resourceDeck;
    let finalPool = [...newPool];

    const [refillCard, newDeck] = drawCard(resourceDeck);
    if (refillCard) {
      finalPool = [...finalPool, refillCard];
      resourceDeck = newDeck;
    }

    const boostExtra = player.boostNextTurn ? 1 : 0;
    const effectiveMax = maxTake + boostExtra;
    const newTaken = taken + 1;

    let updatedPlayer = { ...player, resources: newResources };

    // Advance step if done taking (reached max or player chooses — but here we track count)
    let nextStep: TurnStep = 'take_resource';
    if (newTaken >= effectiveMax) {
      nextStep = 'action';
      updatedPlayer = { ...updatedPlayer, boostNextTurn: false };
    }

    this.updatePlayer(updatedPlayer);
    const nextState: GameState & { _turnResourcesTaken?: number } = {
      ...this.state,
      resourcePool: finalPool,
      resourceDeck,
      step: nextStep,
    };
    if (nextStep === 'take_resource') {
      nextState._turnResourcesTaken = newTaken;
    } else {
      delete nextState._turnResourcesTaken;
    }
    this.state = nextState;

    return this.state;
  }

  // Skip remaining resource takes and go to action
  skipToAction(playerId: string): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('take_resource');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    const updatedPlayer = { ...player, boostNextTurn: false };
    this.updatePlayer(updatedPlayer);

    const nextState = { ...this.state, step: 'action' as TurnStep };
    const s = nextState as GameState & { _turnResourcesTaken?: number };
    delete s._turnResourcesTaken;
    this.state = nextState;

    return this.state;
  }

  acquireTerritory(playerId: string, row: number, col: number): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('action');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    if (row < 0 || row >= this.state.board.length || col < 0 || col >= this.state.board[0].length) {
      throw new Error('Cell out of bounds');
    }

    const cell = this.state.board[row][col];

    if (cell.owner !== null) {
      throw new Error('Cell already owned');
    }

    // Check if player can acquire (has enough resources)
    if (!canAcquire(cell, player.resources)) {
      throw new Error('Insufficient resources');
    }

    // Consume resources
    const newResources = consumeResources(player.resources, cell.cost);
    if (newResources === null) throw new Error('Insufficient resources');

    // Update board
    const newBoard = this.state.board.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? { ...c, owner: playerId } : c))
    );

    const updatedPlayer: Player = {
      ...player,
      resources: newResources,
      territoriesThisPhase: player.territoriesThisPhase + 1,
    };
    this.state = { ...this.state, board: newBoard };
    this.updatePlayer(updatedPlayer);

    // Check objective conditions after acquiring
    this.state = this.checkAndAutoAchieveObjectives(this.state, playerId);

    // Advance turn
    this.state = this.advanceTurn();

    return this.state;
  }

  playCard(
    playerId: string,
    cardId: string,
    targetPlayerId?: string,
    targetRow?: number,
    targetCol?: number
  ): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('action');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) throw new Error('Card not in hand');

    const card = player.hand[cardIndex];
    const newHand = player.hand.filter((_, i) => i !== cardIndex);

    switch (card.type) {
      case 'territory': {
        // Territory card: acquire a territory for free (no resource cost)
        if (targetRow === undefined || targetCol === undefined) {
          throw new Error('territory card requires targetRow and targetCol');
        }
        if (
          targetRow < 0 ||
          targetRow >= this.state.board.length ||
          targetCol < 0 ||
          targetCol >= this.state.board[0].length
        ) {
          throw new Error('Cell out of bounds');
        }
        const cell = this.state.board[targetRow][targetCol];
        if (cell.owner !== null) throw new Error('Cell already owned');

        const newBoard = this.state.board.map((r, ri) =>
          r.map((c, ci) =>
            ri === targetRow && ci === targetCol ? { ...c, owner: playerId } : c
          )
        );

        const updatedPlayer: Player = {
          ...player,
          hand: newHand,
          territoriesThisPhase: player.territoriesThisPhase + 1,
        };
        this.state = { ...this.state, board: newBoard };
        this.updatePlayer(updatedPlayer);
        this.state = this.checkAndAutoAchieveObjectives(this.state, playerId);
        break;
      }

      case 'sabotage': {
        // Sabotage: discard one random resource from target opponent
        if (this.state.peaceActive) throw new Error('Sabotage is disabled during peace');
        if (!targetPlayerId) throw new Error('sabotage card requires targetPlayerId');

        const target = this.getPlayer(targetPlayerId);
        if (!target) throw new Error('Target player not found');
        if (targetPlayerId === playerId) throw new Error('Cannot sabotage yourself');
        if (target.resources.length === 0) throw new Error('Target has no resources');

        const randIdx = Math.floor(Math.random() * target.resources.length);
        const newTargetResources = target.resources.filter((_, i) => i !== randIdx);
        const updatedTarget = { ...target, resources: newTargetResources };
        const updatedPlayer: Player = { ...player, hand: newHand };

        this.state = {
          ...this.state,
          players: this.state.players.map((p) => {
            if (p.id === playerId) return updatedPlayer;
            if (p.id === targetPlayerId) return updatedTarget;
            return p;
          }),
        };
        break;
      }

      case 'boost': {
        // Boost: +1 resource on next turn
        const updatedPlayer: Player = { ...player, hand: newHand, boostNextTurn: true };
        this.updatePlayer(updatedPlayer);
        break;
      }

      case 'abundance': {
        // Abundance: draw 1 resource card immediately
        let resourceDeck = this.state.resourceDeck;
        let newResources = [...player.resources];

        const [resourceCard, newDeck] = drawCard(resourceDeck);
        if (resourceCard && resourceCard.resource) {
          newResources = [...newResources, resourceCard.resource];
          resourceDeck = newDeck;
        }

        const updatedPlayer: Player = { ...player, hand: newHand, resources: newResources };
        this.updatePlayer(updatedPlayer);
        this.state = { ...this.state, resourceDeck };
        break;
      }

      case 'steal': {
        // Steal: take an adjacent opponent territory
        if (this.state.peaceActive) throw new Error('Steal is disabled during peace');
        if (targetRow === undefined || targetCol === undefined) {
          throw new Error('steal card requires targetRow and targetCol');
        }

        const cell = this.state.board[targetRow][targetCol];
        if (!cell.owner || cell.owner === playerId) {
          throw new Error('Target cell must be owned by an opponent');
        }

        // Check adjacency: does player own a cell adjacent to target?
        const adjacents = getAdjacentCells(this.state.board, targetRow, targetCol);
        const playerOwnsAdjacent = adjacents.some((c) => c.owner === playerId);
        if (!playerOwnsAdjacent) {
          throw new Error('Must own a cell adjacent to target to steal');
        }

        const newBoard = this.state.board.map((r, ri) =>
          r.map((c, ci) =>
            ri === targetRow && ci === targetCol ? { ...c, owner: playerId } : c
          )
        );

        const updatedPlayer: Player = {
          ...player,
          hand: newHand,
          territoriesThisPhase: player.territoriesThisPhase + 1,
        };
        this.state = { ...this.state, board: newBoard };
        this.updatePlayer(updatedPlayer);
        this.state = this.checkAndAutoAchieveObjectives(this.state, playerId);
        break;
      }

      default:
        throw new Error(`Unknown card type: ${card.type}`);
    }

    this.state = this.advanceTurn();
    return this.state;
  }

  achieveObjective(
    playerId: string,
    objectiveId: string,
    usedResources?: Resource[]
  ): GameState {
    this.assertActivePlayer(playerId);
    this.assertStep('action');

    const player = this.getPlayer(playerId);
    if (!player) throw new Error('Player not found');

    const objective = this.state.objectives.find((o) => o.id === objectiveId);
    if (!objective) throw new Error('Objective not found');
    if (objective.achieved) throw new Error('Objective already achieved');

    // Validate condition
    const valid = this.validateObjectiveCondition(
      this.state,
      playerId,
      objective,
      usedResources
    );
    if (!valid) throw new Error('Objective condition not met');

    // Consume resources if needed (resource_combo)
    if (objective.condition.type === 'resource_combo' && usedResources) {
      const cost = objective.condition.params as Record<Resource, number>;
      const newResources = consumeResources(player.resources, cost);
      if (newResources === null) throw new Error('Insufficient resources for objective');
      const updatedPlayer = { ...player, resources: newResources, score: player.score + objective.points };
      this.updatePlayer(updatedPlayer);
    } else {
      const updatedPlayer = { ...player, score: player.score + objective.points };
      this.updatePlayer(updatedPlayer);
    }

    // Mark objective achieved
    const newObjectives = this.state.objectives.map((o) =>
      o.id === objectiveId ? { ...o, achieved: true, achievedBy: playerId } : o
    );

    this.state = { ...this.state, objectives: newObjectives };
    this.state = this.advanceTurn();
    return this.state;
  }

  pass(playerId: string): GameState {
    this.assertActivePlayer(playerId);
    // Can pass from take_resource or action step
    if (this.state.step !== 'take_resource' && this.state.step !== 'action') {
      throw new Error('Cannot pass at this step');
    }

    this.state = this.advanceTurn();
    return this.state;
  }

  advanceTurn(): GameState {
    const state = this.state;

    // Clean up transient step counter
    const s = state as GameState & { _turnResourcesTaken?: number };
    delete s._turnResourcesTaken;

    const nextPlayerId = this.getNextPlayerId(state);
    const currentPlayerIdx = state.playerOrder.indexOf(state.activePlayerId);
    const isLastPlayerInRound =
      currentPlayerIdx === state.playerOrder.length - 1;

    let newState = { ...state, step: 'draw' as TurnStep, activePlayerId: nextPlayerId };

    if (isLastPlayerInRound) {
      // End of round
      const newRound = state.round + 1;

      if (newRound > ROUNDS_PER_PHASE) {
        // End of phase
        newState = this.endPhase({ ...newState, round: ROUNDS_PER_PHASE });
      } else {
        newState = { ...newState, round: newRound };
      }
    }

    this.state = newState;
    return this.state;
  }

  private endPhase(state: GameState): GameState {
    // Calculate phase bonus (+1pt to player with most resources)
    let phased = this.calcPhaseBonus(state);

    // Trigger phase event
    const eventIdx = Math.floor(Math.random() * PHASE_EVENT_TYPES.length);
    const phaseEvent = PHASE_EVENT_TYPES[eventIdx];
    phased = {
      ...phased,
      currentPhaseEvent: phaseEvent,
      phaseEvents: [...phased.phaseEvents, phaseEvent],
    };
    phased = this.applyPhaseEvent(phased);

    const newPhase = state.phase + 1;

    if (newPhase > TOTAL_PHASES) {
      // Game over
      phased = this.calcFinalScores(phased);
      // Determine winner
      const sortedPlayers = [...phased.players].sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Tiebreak: territory count
        const aTerr = phased.board.flat().filter((c) => c.owner === a.id).length;
        const bTerr = phased.board.flat().filter((c) => c.owner === b.id).length;
        return bTerr - aTerr;
      });
      const winner = sortedPlayers[0]?.id ?? null;
      return { ...phased, gameOver: true, winner, phase: newPhase, round: 1 };
    }

    // Reset phase-specific tracking
    const resetPlayers = phased.players.map((p) => ({
      ...p,
      territoriesThisPhase: 0,
    }));

    return {
      ...phased,
      phase: newPhase,
      round: 1,
      players: resetPlayers,
      peaceActive: phased.currentPhaseEvent?.type === 'peace',
      contestActive: phased.currentPhaseEvent?.type === 'contest',
    };
  }

  private applyPhaseEvent(state: GameState): GameState {
    const event = state.currentPhaseEvent;
    if (!event) return state;

    switch (event.type) {
      case 'harvest': {
        // All players gain 1 resource from deck
        let resourceDeck = state.resourceDeck;
        const newPlayers = state.players.map((p) => {
          const [card, newDeck] = drawCard(resourceDeck);
          resourceDeck = newDeck;
          if (card && card.resource) {
            return { ...p, resources: [...p.resources, card.resource] };
          }
          return p;
        });
        return { ...state, players: newPlayers, resourceDeck };
      }

      case 'storm': {
        // Reset pool, no refill
        return { ...state, resourcePool: [] };
      }

      case 'trade': {
        // Pass hand left (each player passes their hand to the left neighbor)
        const order = state.playerOrder;
        const playerMap = new Map(state.players.map((p) => [p.id, p]));
        const newPlayers = state.players.map((p) => {
          const idx = order.indexOf(p.id);
          const leftIdx = (idx - 1 + order.length) % order.length;
          const leftPlayerId = order[leftIdx];
          const leftPlayer = playerMap.get(leftPlayerId);
          return { ...p, hand: leftPlayer ? [...leftPlayer.hand] : p.hand };
        });
        return { ...state, players: newPlayers };
      }

      case 'contest':
      case 'peace':
        // These are applied at next phase start (handled in endPhase)
        return state;

      default:
        return state;
    }
  }

  private calcPhaseBonus(state: GameState): GameState {
    if (state.players.length === 0) return state;

    let maxResources = -1;
    for (const p of state.players) {
      if (p.resources.length > maxResources) {
        maxResources = p.resources.length;
      }
    }

    const winners = state.players.filter((p) => p.resources.length === maxResources);
    // Only award bonus if there's a single winner
    if (winners.length === 1) {
      const winner = winners[0];
      const newPlayers = state.players.map((p) =>
        p.id === winner.id ? { ...p, score: p.score + 1 } : p
      );
      return { ...state, players: newPlayers };
    }

    return state;
  }

  private getNextPlayerId(state: GameState): string {
    const idx = state.playerOrder.indexOf(state.activePlayerId);
    const nextIdx = (idx + 1) % state.playerOrder.length;
    return state.playerOrder[nextIdx];
  }

  checkObjectiveConditions(state: GameState, playerId: string): string[] {
    const achievable: string[] = [];
    for (const obj of state.objectives) {
      if (obj.achieved) continue;
      if (this.validateObjectiveCondition(state, playerId, obj)) {
        achievable.push(obj.id);
      }
    }
    return achievable;
  }

  private validateObjectiveCondition(
    state: GameState,
    playerId: string,
    objective: ObjectiveCard,
    usedResources?: Resource[]
  ): boolean {
    const player = state.players.find((p) => p.id === playerId);
    if (!player) return false;

    const condition = objective.condition;

    switch (condition.type) {
      case 'resource_combo': {
        const required = condition.params as Partial<Record<Resource, number>>;
        // Check if player has enough resources
        const playerResources = [...player.resources];
        for (const [res, amount] of Object.entries(required) as [Resource, number][]) {
          let needed = amount;
          // Count matching resources
          for (let i = playerResources.length - 1; i >= 0 && needed > 0; i--) {
            if (playerResources[i] === res) {
              playerResources.splice(i, 1);
              needed--;
            }
          }
          // Use gold as wild
          for (let i = playerResources.length - 1; i >= 0 && needed > 0; i--) {
            if (playerResources[i] === 'gold') {
              playerResources.splice(i, 1);
              needed--;
            }
          }
          if (needed > 0) return false;
        }
        return true;
      }

      case 'consecutive': {
        const length = condition.params['length'] as number;
        return getMaxConsecutive(state.board, playerId) >= length;
      }

      case 'multi_acquire': {
        const count = condition.params['count'] as number;
        return player.territoriesThisPhase >= count;
      }

      default:
        return false;
    }

    void usedResources; // suppress unused warning
  }

  calcFinalScores(state?: GameState): GameState {
    const s = state ?? this.state;

    const updatedPlayers = s.players.map((p) => {
      const boardScore = calcBoardScore(s.board, p.id);
      // boardScore already includes territory count + consecutive bonuses
      // objective scores are already added when achieved
      // reset score to board score + objective points
      const objectiveScore = s.objectives
        .filter((o) => o.achievedBy === p.id)
        .reduce((sum, o) => sum + o.points, 0);
      return { ...p, score: boardScore + objectiveScore };
    });

    if (state) {
      return { ...state, players: updatedPlayers };
    }

    this.state = { ...s, players: updatedPlayers };
    return this.state;
  }

  // Auto-check and mark objectives that are passively achievable (consecutive, multi_acquire)
  // resource_combo objectives require explicit player action
  private checkAndAutoAchieveObjectives(state: GameState, playerId: string): GameState {
    let updatedState = state;

    for (const obj of state.objectives) {
      if (obj.achieved) continue;
      if (obj.condition.type === 'resource_combo') continue; // requires explicit claim

      const valid = this.validateObjectiveCondition(updatedState, playerId, obj);
      if (valid) {
        const player = updatedState.players.find((p) => p.id === playerId);
        if (!player) continue;

        const newObjectives = updatedState.objectives.map((o) =>
          o.id === obj.id ? { ...o, achieved: true, achievedBy: playerId } : o
        );

        const updatedPlayer = { ...player, score: player.score + obj.points };
        updatedState = {
          ...updatedState,
          objectives: newObjectives,
          players: updatedState.players.map((p) =>
            p.id === playerId ? updatedPlayer : p
          ),
        };
      }
    }

    return updatedState;
  }
}
