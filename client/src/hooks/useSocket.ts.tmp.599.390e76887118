import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { GameState, Room } from '../types';

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });
  }
  return socketInstance;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    setGameState,
    setRoom,
    setMyPlayer,
    setPhase,
    addToast,
    myPlayerId,
  } = useGameStore();

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      addToast('サーバーに接続しました', 'success');
    });

    socket.on('disconnect', () => {
      addToast('サーバーから切断されました', 'error');
    });

    // Server sends: { roomId, room, playerId }
    socket.on('room:created', (data: { room: Room; playerId: string; roomId: string }) => {
      setRoom(data.room);
      // Store the player name from the room player list
      const playerInfo = data.room.players.find((p) => p.id === data.playerId);
      setMyPlayer(data.playerId, playerInfo?.name ?? '');
      setPhase('room');
    });

    // Server sends: { room, playerId }
    socket.on('room:joined', (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
      const playerInfo = data.room.players.find((p) => p.id === data.playerId);
      setMyPlayer(data.playerId, playerInfo?.name ?? '');
      setPhase('room');
    });

    socket.on('room:updated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    // Server sends: { state } on game:started
    socket.on('game:started', (data: { state: GameState }) => {
      setGameState(data.state);
      setPhase('game');
      addToast('ゲームが始まりました！', 'success');
    });

    // Server sends: { state } on state:update
    socket.on('state:update', (data: { state: GameState }) => {
      setGameState(data.state);
      if (data.state.winner) {
        setPhase('result');
      }
    });

    socket.on('game:over', (data: { winner: string | null }) => {
      if (data.winner) {
        addToast(`ゲーム終了！勝者: ${data.winner}`, 'success');
      }
      setPhase('result');
    });

    socket.on('game:reconnected', (data: { state: GameState; playerId: string }) => {
      setGameState(data.state);
      setPhase('game');
      addToast('ゲームに再接続しました', 'success');
    });

    socket.on('error', (data: { message: string }) => {
      addToast(data.message || 'エラーが発生しました', 'error');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:updated');
      socket.off('game:started');
      socket.off('state:update');
      socket.off('game:over');
      socket.off('game:reconnected');
      socket.off('error');
    };
  }, [setGameState, setRoom, setMyPlayer, setPhase, addToast]);

  // Server expects: { name }
  const createRoom = useCallback((playerName: string) => {
    socketRef.current?.emit('room:create', { name: playerName });
  }, []);

  // Server expects: { roomId, name }
  const joinRoom = useCallback((name: string, roomId: string) => {
    socketRef.current?.emit('room:join', { roomId, name });
  }, []);

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave');
  }, []);

  const startGame = useCallback(() => {
    socketRef.current?.emit('game:start');
  }, []);

  const drawCard = useCallback(() => {
    socketRef.current?.emit('turn:draw');
  }, []);

  // Server expects: { cardId } or { skip: true }
  const takeResource = useCallback((cardId: string) => {
    socketRef.current?.emit('turn:take_resource', { cardId });
  }, []);

  const skipTakeResource = useCallback(() => {
    socketRef.current?.emit('turn:take_resource', { skip: true });
  }, []);

  const performAction = useCallback(
    (
      type: 'acquire' | 'card' | 'objective' | 'pass',
      params?: Record<string, unknown>
    ) => {
      socketRef.current?.emit('turn:action', { type, ...params });
    },
    []
  );

  const isMyTurn = useCallback(
    (gameState: GameState | null): boolean => {
      if (!gameState || !myPlayerId) return false;
      return gameState.activePlayerId === myPlayerId;
    },
    [myPlayerId]
  );

  return {
    socket: socketRef.current,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    drawCard,
    takeResource,
    skipTakeResource,
    performAction,
    isMyTurn,
  };
}
