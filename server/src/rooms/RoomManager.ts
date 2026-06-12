import { Room, GameState } from '../types';
import { GameEngine } from '../game/GameEngine';

// nanoid v3 commonjs compatible
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { nanoid } = require('nanoid') as { nanoid: (size?: number) => string };

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  createRoom(hostId: string, hostName: string): Room {
    // Generate unique room code
    let roomId = generateRoomCode();
    while (this.rooms.has(roomId)) {
      roomId = generateRoomCode();
    }

    const room: Room = {
      id: roomId,
      hostId,
      players: [{ id: hostId, name: hostName }],
      gameState: null,
      status: 'waiting',
    };

    this.rooms.set(roomId, room);
    return room;
  }

  joinRoom(roomId: string, playerId: string, playerName: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.status !== 'waiting') return null;
    if (room.players.length >= 8) return null;

    // Prevent duplicate join
    if (room.players.some((p) => p.id === playerId)) {
      return room;
    }

    const updatedRoom: Room = {
      ...room,
      players: [...room.players, { id: playerId, name: playerName }],
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  leaveRoom(roomId: string, playerId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const newPlayers = room.players.filter((p) => p.id !== playerId);

    if (newPlayers.length === 0) {
      // Remove the room entirely if empty
      this.rooms.delete(roomId);
      return null;
    }

    // Transfer host if host left
    const newHostId =
      room.hostId === playerId ? newPlayers[0].id : room.hostId;

    const updatedRoom: Room = {
      ...room,
      hostId: newHostId,
      players: newPlayers,
    };

    this.rooms.set(roomId, updatedRoom);
    return updatedRoom;
  }

  getRoom(roomId: string): Room | null {
    return this.rooms.get(roomId) ?? null;
  }

  startGame(roomId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    if (room.players.length < 3 || room.players.length > 8) return null;
    if (room.status !== 'waiting') return null;

    const gameState = GameEngine.initGame(roomId, room.players, room.hostId);

    const updatedRoom: Room = {
      ...room,
      gameState,
      status: 'playing',
    };

    this.rooms.set(roomId, updatedRoom);
    return gameState;
  }

  updateGameState(roomId: string, state: GameState): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const updatedRoom: Room = { ...room, gameState: state };
    if (state.gameOver) {
      updatedRoom.status = 'finished';
    }
    this.rooms.set(roomId, updatedRoom);
  }

  // Mark player as disconnected in game state
  markPlayerDisconnected(roomId: string, playerId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return null;

    const newPlayers = room.gameState.players.map((p) =>
      p.id === playerId ? { ...p, connected: false } : p
    );

    const newState: GameState = { ...room.gameState, players: newPlayers };
    this.updateGameState(roomId, newState);
    return newState;
  }

  // Mark player as reconnected
  markPlayerConnected(roomId: string, playerId: string): GameState | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) return null;

    const newPlayers = room.gameState.players.map((p) =>
      p.id === playerId ? { ...p, connected: true } : p
    );

    const newState: GameState = { ...room.gameState, players: newPlayers };
    this.updateGameState(roomId, newState);
    return newState;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
