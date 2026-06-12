import { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import { Board } from '../Board/Board';
import { ResourcePool } from '../ResourcePool/ResourcePool';
import { Hand } from '../Hand/Hand';
import { ObjectiveCards } from '../ObjectiveCards/ObjectiveCards';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { PhaseEventModal } from './PhaseEventModal';
import { Resource } from '../../types';

const RESOURCE_ICONS: Record<Resource, string> = {
  wood: '🪵', stone: '🪨', food: '🌾', gold: '💰',
};

export function GameBoard() {
  const {
    gameState,
    myPlayerId,
    selectedCard,
    selectedCell,
    toasts,
    setSelectedCard,
    setSelectedCell,
  } = useGameStore();

  const { drawCard, takeResource, performAction, isMyTurn } = useSocket();
  const [showPhaseEvent, setShowPhaseEvent] = useState(true);
  const [lastPhaseEventType, setLastPhaseEventType] = useState<string | null>(null);

  if (!gameState) return null;

  const myTurn = isMyTurn(gameState);
  const activePlayer = gameState.players[gameState.turnIndex];
  const me = gameState.players.find((p) => p.id === myPlayerId);

  // Show phase event modal when event changes
  if (
    gameState.currentPhaseEvent &&
    gameState.currentPhaseEvent.type !== lastPhaseEventType
  ) {
    setLastPhaseEventType(gameState.currentPhaseEvent.type);
    setShowPhaseEvent(true);
  }

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (!myTurn || gameState.turnStep !== 'action') return;
      setSelectedCell(selectedCell === cellId ? null : cellId);
    },
    [myTurn, gameState.turnStep, selectedCell, setSelectedCell]
  );

  const handleAcquire = () => {
    if (!selectedCell) return;
    const [rowStr, colStr] = selectedCell.split('-');
    performAction('acquire', { row: parseInt(rowStr), col: parseInt(colStr) });
    setSelectedCell(null);
  };

  const handlePlayCard = () => {
    if (!selectedCard) return;
    performAction('card', { cardId: selectedCard.id });
    setSelectedCard(null);
  };

  const handlePass = () => {
    performAction('pass');
    setSelectedCard(null);
    setSelectedCell(null);
  };

  const myResources = me?.resources ?? {};
  const totalResources = Object.values(myResources).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2 w-64">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              'bg-gray-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Phase Event Modal */}
      {showPhaseEvent && gameState.currentPhaseEvent && (
        <PhaseEventModal
          event={gameState.currentPhaseEvent}
          onClose={() => setShowPhaseEvent(false)}
        />
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-amber-200 shadow-sm px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-amber-900">🏝️ ランドラッシュ</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              フェーズ {gameState.phase}/5
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              ラウンド {gameState.round}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {myTurn && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold animate-pulse">
                あなたのターン
              </span>
            )}
            {!myTurn && activePlayer && (
              <span className="text-xs text-gray-500">
                {activePlayer.name} のターン
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Board + Objectives */}
        <div className="lg:col-span-2 space-y-3">
          <Board
            board={gameState.board}
            players={gameState.players}
            myPlayerId={myPlayerId}
            isMyTurn={myTurn}
            turnStep={gameState.turnStep}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
          />
          <ObjectiveCards
            objectives={gameState.objectives}
            players={gameState.players.map((p) => ({ id: p.id, name: p.name }))}
          />
        </div>

        {/* Right: Controls */}
        <div className="space-y-3">
          {/* My resources */}
          {me && (
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-amber-900 text-sm">自分のリソース</h3>
                <span className="text-xs text-amber-500">{totalResources}枚</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(myResources) as [Resource, number][]).map(([res, count]) =>
                  count > 0 ? (
                    <span
                      key={res}
                      className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded-full"
                    >
                      {RESOURCE_ICONS[res]} ×{count}
                    </span>
                  ) : null
                )}
                {totalResources === 0 && (
                  <span className="text-xs text-gray-400">リソースなし</span>
                )}
              </div>
            </div>
          )}

          {/* Resource pool */}
          <ResourcePool
            pool={gameState.resourcePool}
            isMyTurn={myTurn}
            turnStep={gameState.turnStep}
            onTakeResource={takeResource}
          />

          {/* Hand */}
          <Hand
            hand={me?.hand ?? []}
            selectedCard={selectedCard}
            isMyTurn={myTurn}
            turnStep={gameState.turnStep}
            onSelectCard={setSelectedCard}
          />

          {/* Action buttons */}
          {myTurn && (
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-2">
              <h3 className="font-bold text-amber-900 text-sm mb-3">アクション</h3>

              {gameState.turnStep === 'draw' && (
                <button
                  onClick={drawCard}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors text-sm"
                >
                  📤 カードを引く
                </button>
              )}

              {gameState.turnStep === 'action' && (
                <>
                  <button
                    onClick={handleAcquire}
                    disabled={!selectedCell}
                    className="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    🏴 領土を獲得
                    {selectedCell && <span className="ml-1 text-xs opacity-75">({selectedCell})</span>}
                  </button>

                  <button
                    onClick={handlePlayCard}
                    disabled={!selectedCard}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    🃏 カードを使う
                    {selectedCard && <span className="ml-1 text-xs opacity-75">({selectedCard.name})</span>}
                  </button>

                  <button
                    onClick={handlePass}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-lg transition-colors text-sm"
                  >
                    ⏭️ パス
                  </button>
                </>
              )}
            </div>
          )}

          {/* Scoreboard */}
          <ScoreBoard
            players={gameState.players}
            currentPlayerIndex={gameState.turnIndex}
            myPlayerId={myPlayerId}
            phase={gameState.phase}
            round={gameState.round}
            maxRounds={3}
          />
        </div>
      </div>
    </div>
  );
}
