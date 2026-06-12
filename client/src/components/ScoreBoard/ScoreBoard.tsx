import { Player } from '../../types';

const PLAYER_COLORS: Record<number, string> = {
  0: 'bg-red-400',
  1: 'bg-blue-400',
  2: 'bg-green-400',
  3: 'bg-purple-400',
  4: 'bg-yellow-400',
  5: 'bg-pink-400',
  6: 'bg-cyan-400',
  7: 'bg-orange-400',
};

interface ScoreBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  myPlayerId: string | null;
  phase: number;
  round: number;
  maxRounds: number;
}

export function ScoreBoard({
  players,
  currentPlayerIndex,
  myPlayerId,
  phase,
  round,
  maxRounds,
}: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-1">
          <span>🏆</span> スコア
        </h3>
        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          フェーズ {phase} / ラウンド {round}/{maxRounds}
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((player, rank) => {
          const originalIndex = players.findIndex((p) => p.id === player.id);
          const isCurrentTurn = originalIndex === currentPlayerIndex;
          const isMe = player.id === myPlayerId;

          return (
            <div
              key={player.id}
              className={[
                'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                isCurrentTurn
                  ? 'bg-amber-100 border border-amber-300 shadow-sm'
                  : 'bg-gray-50 border border-transparent',
                !player.connected ? 'opacity-50' : '',
              ].join(' ')}
            >
              {/* Rank */}
              <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">
                {rank + 1}
              </span>

              {/* Color dot */}
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${PLAYER_COLORS[originalIndex % 8]}`}
              />

              {/* Name */}
              <span
                className={[
                  'flex-1 text-xs font-medium truncate',
                  isCurrentTurn ? 'text-amber-900' : 'text-gray-700',
                  !player.connected ? 'line-through text-gray-400' : '',
                ].join(' ')}
              >
                {player.name}
                {isMe && (
                  <span className="ml-1 text-[9px] text-amber-500 font-bold">(あなた)</span>
                )}
                {isCurrentTurn && (
                  <span className="ml-1 text-[9px] text-amber-600 font-bold animate-pulse">
                    ▶
                  </span>
                )}
                {!player.connected && (
                  <span className="ml-1 text-[9px] text-gray-400">(切断)</span>
                )}
              </span>

              {/* Territory count */}
              <span className="text-[10px] text-gray-500 flex-shrink-0">
                🏴{player.territories.length}
              </span>

              {/* Score */}
              <span
                className={[
                  'text-xs font-bold flex-shrink-0',
                  isCurrentTurn ? 'text-amber-700' : 'text-gray-600',
                ].join(' ')}
              >
                {player.score}pt
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
