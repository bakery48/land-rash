import { useState, useCallback, useMemo } from 'react';
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
  wood: '🪵',
  stone: '🪨',
  food: '🌾',
  gold: '💰',
};

const RESOURCE_NAMES: Record<Resource, string> = {
  wood: '木材',
  stone: '石材',
  food: '食料',
  gold: '金貨',
};

const TURN_STEP_LABELS: Record<string, string> = {
  draw: 'カードを引く',
  take_resource: 'リソース取得',
  action: 'アクション',
  end: 'ターン終了',
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
    removeToast,
  } = useGameStore();

  const { drawCard, takeResource, skipTakeResource, performAction, isMyTurn } = useSocket();
  const [showPhaseEvent, setShowPhaseEvent] = useState(true);
  const [lastPhaseEventType, setLastPhaseEventType] = useState<string | null>(null);

  // Compute territory counts from board
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

  if (!gameState) return null;

  const myTurn = isMyTurn(gameState);
  const activePlayer = gameState.players.find((p) => p.id === gameState.activePlayerId);
  const me = gameState.players.find((p) => p.id === myPlayerId);

  // Show phase event modal when event type changes
  if (
    gameState.currentPhaseEvent &&
    gameState.currentPhaseEvent.type !== lastPhaseEventType
  ) {
    setLastPhaseEventType(gameState.currentPhaseEvent.type);
    setShowPhaseEvent(true);
  }

  const handleCellClick = useCallback(
    (cellId: string) => {
      if (!myTurn || gameState.step !== 'action') return;
      setSelectedCell(selectedCell === cellId ? null : cellId);
    },
    [myTurn, gameState.step, selectedCell, setSelectedCell]
  );

  const handleAcquire = () => {
    if (!selectedCell) return;
    // Cell id format from server Board.ts
    const cell = gameState.board.flat().find((c) => c.id === selectedCell);
    if (!cell) return;
    performAction('acquire', { row: cell.row, col: cell.col });
    setSelectedCell(null);
  };

  const handlePlayCard = () => {
    if (!selectedCard) return;
    // For steal/sabotage cards, targetRow/targetCol from selected cell
    const cell = selectedCell ? gameState.board.flat().find((c) => c.id === selectedCell) : undefined;
    performAction('card', {
      cardId: selectedCard.id,
      ...(cell ? { targetRow: cell.row, targetCol: cell.col } : {}),
    });
    setSelectedCard(null);
    setSelectedCell(null);
  };

  const handleAchieveObjective = (objectiveId: string) => {
    // Pass currently held resources as usedResources
    const usedResources = me?.resources ?? [];
    performAction('objective', { objectiveId, usedResources });
  };

  const handlePass = () => {
    performAction('pass');
    setSelectedCard(null);
    setSelectedCell(null);
  };

  // Build resource count summary from Resource[] array
  const myResourceArray = me?.resources ?? [];
  const myResourceCounts: Record<Resource, number> = {
    wood: 0, stone: 0, food: 0, gold: 0,
  };
  for (const r of myResourceArray) {
    myResourceCounts[r] = (myResourceCounts[r] ?? 0) + 1;
  }
  const totalResources = myResourceArray.length;

  const cardTypeName = selectedCard
    ? (selectedCard.type === 'resource' && selectedCard.resource
        ? RESOURCE_NAMES[selectedCard.resource]
        : selectedCard.type)
    : '';

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2 w-72 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={[
              'px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white pointer-events-auto cursor-pointer transition-all',
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-amber-500' :
              'bg-gray-700',
            ].join(' ')}
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
      <div className="bg-white border-b border-amber-200 shadow-sm px-4 py-2 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-amber-900">🏝️ ランドラッシュ</span>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              フェーズ {gameState.phase}/5
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              ラウンド {gameState.round}
            </span>
            {gameState.contestActive && (
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                ⚔️ 争奪戦中
              </span>
            )}
            {gameState.peaceActive && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                🕊️ 平和協定
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
              {TURN_STEP_LABELS[gameState.step] ?? gameState.step}
            </span>
            {myTurn ? (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold animate-pulse">
                あなたのターン
              </span>
            ) : (
              activePlayer && (
                <span className="text-xs text-gray-500">
                  {activePlayer.name} のターン
                </span>
              )
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
            turnStep={gameState.step}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
          />
          <ObjectiveCards
            objectives={gameState.objectives}
            players={gameState.players.map((p) => ({ id: p.id, name: p.name }))}
          />
          {/* Objective achieve buttons (action step) */}
          {myTurn && gameState.step === 'action' && (
            <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
              <p className="text-xs font-bold text-amber-800 mb-2">🎯 目標を達成</p>
              <div className="flex flex-wrap gap-2">
                {gameState.objectives
                  .filter((o) => !o.achievedBy)
                  .map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => handleAchieveObjective(obj.id)}
                      className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded-lg transition-colors border border-amber-200"
                    >
                      {obj.description} ({obj.points}点)
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="space-y-3">
          {/* My resources */}
          {me && (
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-amber-900 text-sm">自分のリソース</h3>
                <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
                  {totalResources}枚
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(myResourceCounts) as [Resource, number][]).map(([res, count]) =>
                  count > 0 ? (
                    <span
                      key={res}
                      className="flex items-center gap-1 text-xs bg-amber-50 border border-amber-200 px-2 py-1 rounded-full"
                    >
                      {RESOURCE_ICONS[res]} {count}
                    </span>
                  ) : null
                )}
                {totalResources === 0 && (
                  <span className="text-xs text-gray-400">リソースなし</span>
                )}
              </div>
              {me.boostNextTurn && (
                <p className="text-xs text-yellow-600 font-semibold mt-2">
                  ⚡ 次ターン強化中
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          {myTurn && (
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-2">
              <h3 className="font-bold text-amber-900 text-sm mb-2">アクション</h3>

              {gameState.step === 'draw' && (
                <button
                  onClick={drawCard}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-lg transition-colors text-sm"
                >
                  📤 カードを引く
                </button>
              )}

              {gameState.step === 'take_resource' && (
                <p className="text-xs text-amber-600 text-center font-medium py-1">
                  ↑ リソースプールからカードを選んでください
                </p>
              )}

              {gameState.step === 'action' && (
                <>
                  <button
                    onClick={handleAcquire}
                    disabled={!selectedCell}
                    className="w-full py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    🏴 領土を獲得
                    {!selectedCell && (
                      <span className="ml-1 text-xs opacity-70 font-normal">
                        (マップでセルを選択)
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handlePlayCard}
                    disabled={!selectedCard}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-sm"
                  >
                    🃏 カードを使う
                    {selectedCard && (
                      <span className="ml-1 text-xs opacity-80 font-normal">
                        ({cardTypeName})
                      </span>
                    )}
                  </button>

                  <button
                    onClick={handlePass}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 font-bold rounded-lg transition-colors text-sm border border-gray-200"
                  >
                    ⏭️ パス
                  </button>
                </>
              )}
            </div>
          )}

          {/* Resource pool */}
          <ResourcePool
            pool={gameState.resourcePool}
            isMyTurn={myTurn}
            turnStep={gameState.step}
            onTakeResource={takeResource}
            onSkip={skipTakeResource}
          />

          {/* Hand */}
          <Hand
            hand={me?.hand ?? []}
            selectedCard={selectedCard}
            isMyTurn={myTurn}
            turnStep={gameState.step}
            onSelectCard={setSelectedCard}
          />

          {/* Scoreboard */}
          <ScoreBoard
            players={gameState.players}
            activePlayerId={gameState.activePlayerId}
            myPlayerId={myPlayerId}
            phase={gameState.phase}
            round={gameState.round}
            territoryCounts={territoryCounts}
          />
        </div>
      </div>
    </div>
  );
}
