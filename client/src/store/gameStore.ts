import { create } from 'zustand';
import { GameState, Room, Card } from '../types';

type AppPhase = 'lobby' | 'room' | 'game' | 'result';

interface GameStore {
  gameState: GameState | null;
  room: Room | null;
  myPlayerId: string | null;
  myPlayerName: string | null;
  selectedCard: Card | null;
  selectedCell: string | null;
  phase: AppPhase;
  toasts: Toast[];

  setGameState: (state: GameState | null) => void;
  setRoom: (room: Room | null) => void;
  setMyPlayer: (id: string, name: string) => void;
  setSelectedCard: (card: Card | null) => void;
  setSelectedCell: (cellId: string | null) => void;
  setPhase: (phase: AppPhase) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: null,
  room: null,
  myPlayerId: null,
  myPlayerName: null,
  selectedCard: null,
  selectedCell: null,
  phase: 'lobby',
  toasts: [],

  setGameState: (state) => set({ gameState: state }),
  setRoom: (room) => set({ room }),
  setMyPlayer: (id, name) => set({ myPlayerId: id, myPlayerName: name }),
  setSelectedCard: (card) => set({ selectedCard: card }),
  setSelectedCell: (cellId) => set({ selectedCell: cellId }),
  setPhase: (phase) => set({ phase }),

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
