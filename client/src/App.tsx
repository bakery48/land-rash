import { useMemo } from 'react';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby/Lobby';
import { RoomWaiting } from './components/Lobby/RoomWaiting';
import { GameBoard } from './components/Game/GameBoard';
import { ResultScreen } from './components/Game/ResultScreen';

export default function App() {
  const { phase, gameState, myPlayerId, room, setPhase, setRoom, setGameState } = useGameStore();
  const { leaveRoom } = useSocket();

  // Compute territory counts from board cells
  const territoryCounts = useMemo(() => {
    if (!gameState) return {};
    const counts: Record<string, number> = {};
    for (const row of gameState.board) {
      for (const cell of row) {
        if (cell.owner) {
          counts[cell.owner] = (counts[cell.owner] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [gameState]);

  const handlePlayAgain = () => {
    leaveRoom();
    setRoom(null);
    setGameState(null);
    setPhase('lobby');
  };

  return (
    <>
      {phase === 'lobby' && <Lobby />}
      {phase === 'room' && room && <RoomWaiting />}
      {phase === 'game' && gameState && <GameBoard />}
      {phase === 'result' && gameState && (
        <ResultScreen
          players={gameState.players}
          myPlayerId={myPlayerId}
          territoryCounts={territoryCounts}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
