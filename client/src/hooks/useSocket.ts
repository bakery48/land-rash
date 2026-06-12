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

    socket.on('room:created', (data: { room: Room; playerId: string; playerName: string }) => {
      setRoom(data.room);
      setMyPlayer(data.playerId, data.playerName);
      setPhase('room');
    });

    socket.on('room:joined', (data: { room: Room; playerId: string; playerName: string }) => {
      setRoom(data.room);
      setMyPlayer(data.playerId, data.playerName);
      setPhase('room');
    });

    socket.on('room:updated', (data: { room: Room }) => {
      setRoom(data.room);
    });

    socket.on('room:left', () => {
      setRoom(null);
      setGameState(null);
      setPhase('lobby');
    });

    socket.on('game:started', (data: { gameState: GameState }) => {
      setGameState(data.gameState);
      setPhase('game');
      addToast('ゲームが始まりました！', 'success');
    });

    socket.on('state:update', (data: { gameState: GameState }) => {
      setGameState(data.gameState);
      if (data.gameState.winner) {
        setPhase('result');
      }
    });

    socket.on('phase:event', (data: { event: { name: string; description: string } }) => {
      addToast(`フェーズイベント: ${data.event.name}`, 'warning');
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
      socket.off('room:left');
      socket.off('game:started');
      socket.off('state:update');
      socket.off('phase:event');
      socket.off('error');
    };
  }, [setGameState, setRoom, setMyPlayer, setPhase, addToast]);

  const createRoom = useCallback((playerName: string) => {
    socketRef.current?.emit('room:create', { playerName });
  }, []);

  const joinRoom = useCallback((code: string, playerName: string) => {
    socketRef.current?.emit('room:join', { code, playerName });
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

  const takeResource = useCallback((index: number) => {
    socketRef.current?.emit('turn:take_resource', { index });
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
      const activePlayer = gameState.players[gameState.turnIndex];
      return activePlayer?.id === myPlayerId;
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
    performAction,
    isMyTurn,
  };
}
