import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { Lobby } from './components/Lobby/Lobby';
import { RoomWaiting } from './components/Lobby/RoomWaiting';
import { GameBoard } from './components/Game/GameBoard';
import { ResultScreen } from './components/Game/ResultScreen';

export default function App() {
  const { phase, gameState, myPlayerId, room, setPhase, setRoom, setGameState } = useGameStore();
  const { leaveRoom } = useSocket();

  // Initialize socket listeners on mount
  useSocket();

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
          onPlayAgain={handlePlayAgain}
        />
      )}
    </>
  );
}
