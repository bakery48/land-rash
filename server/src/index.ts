import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager';
import { GameEngine } from './game/GameEngine';
import { GameState } from './types';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

// Map socketId → { roomId, playerId }
const socketMap = new Map<string, { roomId: string; playerId: string }>();

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Helper: emit error to a socket
function emitError(socket: Socket, message: string): void {
  socket.emit('error', { message });
}

// Helper: broadcast updated state to all in room
function broadcastState(roomId: string, state: GameState): void {
  io.to(roomId).emit('state:update', { state });
}

// Helper: get or create playerId for a socket
function getPlayerId(socket: Socket): string {
  // Use stored playerId or socket.id as fallback
  const existing = socketMap.get(socket.id);
  if (existing) return existing.playerId;
  return socket.id;
}

io.on('connection', (socket: Socket) => {
  console.log(`[connect] socket=${socket.id}`);

  // ----- room:create -----
  socket.on('room:create', (data: { name?: string }) => {
    try {
      const name = data?.name?.trim();
      if (!name) return emitError(socket, 'Player name is required');

      const playerId = nanoid(10);
      const room = roomManager.createRoom(playerId, name);

      // Join the socket.io room
      socket.join(room.id);
      socketMap.set(socket.id, { roomId: room.id, playerId });

      socket.emit('room:created', { roomId: room.id, room, playerId });
      console.log(`[room:create] room=${room.id} host=${playerId} name=${name}`);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- room:join -----
  socket.on('room:join', (data: { roomId?: string; name?: string }) => {
    try {
      const roomId = data?.roomId?.trim().toUpperCase();
      const name = data?.name?.trim();

      if (!roomId) return emitError(socket, 'Room ID is required');
      if (!name) return emitError(socket, 'Player name is required');

      const playerId = nanoid(10);
      const room = roomManager.joinRoom(roomId, playerId, name);

      if (!room) {
        return emitError(socket, 'Room not found, full, or game already started');
      }

      socket.join(roomId);
      socketMap.set(socket.id, { roomId, playerId });

      // Tell joiner their player id and room state
      socket.emit('room:joined', { room, playerId });

      // Tell everyone in the room about the update
      io.to(roomId).emit('room:updated', { room });

      console.log(`[room:join] room=${roomId} player=${playerId} name=${name}`);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- room:leave -----
  socket.on('room:leave', () => {
    try {
      const entry = socketMap.get(socket.id);
      if (!entry) return;

      const { roomId, playerId } = entry;
      socketMap.delete(socket.id);
      socket.leave(roomId);

      const updatedRoom = roomManager.leaveRoom(roomId, playerId);
      if (updatedRoom) {
        io.to(roomId).emit('room:updated', { room: updatedRoom });
      }

      console.log(`[room:leave] room=${roomId} player=${playerId}`);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- game:start -----
  socket.on('game:start', () => {
    try {
      const entry = socketMap.get(socket.id);
      if (!entry) return emitError(socket, 'Not in a room');

      const { roomId, playerId } = entry;
      const room = roomManager.getRoom(roomId);

      if (!room) return emitError(socket, 'Room not found');
      if (room.hostId !== playerId) return emitError(socket, 'Only the host can start the game');
      if (room.players.length < 3) return emitError(socket, 'Need at least 3 players to start');
      if (room.players.length > 8) return emitError(socket, 'Too many players (max 8)');

      const state = roomManager.startGame(roomId);
      if (!state) return emitError(socket, 'Failed to start game');

      io.to(roomId).emit('game:started', { state });
      console.log(`[game:start] room=${roomId} players=${room.players.length}`);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- turn:draw -----
  socket.on('turn:draw', () => {
    try {
      const entry = socketMap.get(socket.id);
      if (!entry) return emitError(socket, 'Not in a room');

      const { roomId, playerId } = entry;
      const room = roomManager.getRoom(roomId);
      if (!room?.gameState) return emitError(socket, 'Game not started');

      const engine = new GameEngine(room.gameState);
      const newState = engine.drawCard(playerId);
      roomManager.updateGameState(roomId, newState);
      broadcastState(roomId, newState);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- turn:take_resource -----
  socket.on('turn:take_resource', (data: { cardId?: string; skip?: boolean }) => {
    try {
      const entry = socketMap.get(socket.id);
      if (!entry) return emitError(socket, 'Not in a room');

      const { roomId, playerId } = entry;
      const room = roomManager.getRoom(roomId);
      if (!room?.gameState) return emitError(socket, 'Game not started');

      const engine = new GameEngine(room.gameState);
      let newState: GameState;

      if (data?.skip) {
        newState = engine.skipToAction(playerId);
      } else {
        if (!data?.cardId) return emitError(socket, 'cardId is required');
        newState = engine.takeResource(playerId, data.cardId);
      }

      roomManager.updateGameState(roomId, newState);
      broadcastState(roomId, newState);
    } catch (err) {
      emitError(socket, (err as Error).message);
    }
  });

  // ----- turn:action -----
  socket.on(
    'turn:action',
    (data: {
      type: 'acquire' | 'card' | 'objective' | 'pass';
      // acquire
      row?: number;
      col?: number;
      // card
      cardId?: string;
      targetPlayerId?: string;
      targetRow?: number;
      targetCol?: number;
      // objective
      objectiveId?: string;
      usedResources?: string[];
    }) => {
      try {
        const entry = socketMap.get(socket.id);
        if (!entry) return emitError(socket, 'Not in a room');

        const { roomId, playerId } = entry;
        const room = roomManager.getRoom(roomId);
        if (!room?.gameState) return emitError(socket, 'Game not started');

        const engine = new GameEngine(room.gameState);
        let newState: GameState;

        switch (data?.type) {
          case 'acquire': {
            if (data.row === undefined || data.col === undefined) {
              return emitError(socket, 'row and col are required for acquire action');
            }
            newState = engine.acquireTerritory(playerId, data.row, data.col);
            break;
          }

          case 'card': {
            if (!data.cardId) return emitError(socket, 'cardId is required for card action');
            newState = engine.playCard(
              playerId,
              data.cardId,
              data.targetPlayerId,
              data.targetRow,
              data.targetCol
            );
            break;
          }

          case 'objective': {
            if (!data.objectiveId) {
              return emitError(socket, 'objectiveId is required for objective action');
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newState = engine.achieveObjective(
              playerId,
              data.objectiveId,
              data.usedResources as any
            );
            break;
          }

          case 'pass': {
            newState = engine.pass(playerId);
            break;
          }

          default:
            return emitError(socket, 'Unknown action type');
        }

        roomManager.updateGameState(roomId, newState);
        broadcastState(roomId, newState);

        // If game is over, also emit game:over
        if (newState.gameOver) {
          io.to(roomId).emit('game:over', {
            winner: newState.winner,
            players: newState.players,
          });
        }
      } catch (err) {
        emitError(socket, (err as Error).message);
      }
    }
  );

  // ----- disconnect -----
  socket.on('disconnect', () => {
    try {
      const entry = socketMap.get(socket.id);
      if (!entry) return;

      const { roomId, playerId } = entry;
      socketMap.delete(socket.id);

      const room = roomManager.getRoom(roomId);
      if (!room) return;

      if (room.status === 'playing' && room.gameState) {
        // Mark player as disconnected in game state
        const newState = roomManager.markPlayerDisconnected(roomId, playerId);
        if (newState) {
          broadcastState(roomId, newState);

          // Auto-skip disconnected player's turns
          // If it's the disconnected player's turn, advance the turn
          if (newState.activePlayerId === playerId && !newState.gameOver) {
            autoSkipDisconnectedPlayer(roomId, playerId);
          }
        }
      } else if (room.status === 'waiting') {
        const updatedRoom = roomManager.leaveRoom(roomId, playerId);
        if (updatedRoom) {
          io.to(roomId).emit('room:updated', { room: updatedRoom });
        }
      }

      console.log(`[disconnect] socket=${socket.id} room=${roomId} player=${playerId}`);
    } catch (err) {
      console.error('[disconnect error]', err);
    }
  });

  // ----- game:reconnect -----
  // Allow a player to rejoin a room after disconnect
  socket.on(
    'game:reconnect',
    (data: { roomId?: string; playerId?: string }) => {
      try {
        const roomId = data?.roomId?.trim().toUpperCase();
        const playerId = data?.playerId?.trim();

        if (!roomId || !playerId) return emitError(socket, 'roomId and playerId are required');

        const room = roomManager.getRoom(roomId);
        if (!room) return emitError(socket, 'Room not found');

        // Verify player is in room
        const playerInRoom = room.players.some((p) => p.id === playerId);
        if (!playerInRoom) return emitError(socket, 'Player not in room');

        socket.join(roomId);
        socketMap.set(socket.id, { roomId, playerId });

        if (room.gameState) {
          const newState = roomManager.markPlayerConnected(roomId, playerId);
          if (newState) {
            socket.emit('game:reconnected', { state: newState, playerId });
            broadcastState(roomId, newState);
          }
        } else {
          socket.emit('room:joined', { room, playerId });
        }

        console.log(`[game:reconnect] room=${roomId} player=${playerId}`);
      } catch (err) {
        emitError(socket, (err as Error).message);
      }
    }
  );
});

// Auto-skip disconnected player's turn
function autoSkipDisconnectedPlayer(roomId: string, playerId: string): void {
  // Small delay to allow state to settle
  setTimeout(() => {
    const room = roomManager.getRoom(roomId);
    if (!room?.gameState) return;
    if (room.gameState.gameOver) return;

    // Check if still this player's turn and they're disconnected
    const state = room.gameState;
    const player = state.players.find((p) => p.id === playerId);
    if (!player || player.connected) return;
    if (state.activePlayerId !== playerId) return;

    try {
      const engine = new GameEngine(state);

      // Try to advance through the turn steps automatically
      let currentState = state;

      if (currentState.step === 'draw') {
        currentState = engine.drawCard(playerId);
      }

      // Re-create engine with updated state if needed
      const engine2 = new GameEngine(currentState);
      if (currentState.step === 'take_resource') {
        currentState = engine2.pass(playerId);
      } else if (currentState.step === 'action') {
        const engine3 = new GameEngine(currentState);
        currentState = engine3.pass(playerId);
      }

      roomManager.updateGameState(roomId, currentState);
      broadcastState(roomId, currentState);

      // Check if next player is also disconnected
      const nextPlayer = currentState.players.find(
        (p) => p.id === currentState.activePlayerId
      );
      if (nextPlayer && !nextPlayer.connected && !currentState.gameOver) {
        autoSkipDisconnectedPlayer(roomId, currentState.activePlayerId);
      }
    } catch (err) {
      console.error('[autoSkip error]', err);
    }
  }, 1000);
}

httpServer.listen(PORT, () => {
  console.log(`Land Rush server listening on port ${PORT}`);
});

export { app, httpServer, io };
