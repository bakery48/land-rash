import { Player, Resource } from '../../types';

const PLAYER_COLORS: Record<number, string> = {
  0: 'bg-red-400', 1: 'bg-blue-400', 2: 'bg-green-400', 3: 'bg-purple-400',
  4: 'bg-yellow-400', 5: 'bg-pink-400', 6: 'bg-cyan-400', 7: 'bg-orange-400',
};

const RESOURCE_ICONS: Record<Resource, string> = {
  wood: '🪵', stone: '🪨', food: '🌾', gold: '💰',
};

const RESOURCE_ORDER: Resource[] = ['wood', 'stone', 'food', 'gold'];

function countResources(resources: Resource[]): Partial<Record<Resource, number>> {
  const counts: Partial<Record<Resource, number>> = {};
  for (const r of resources) counts[r] = (counts[r] ?? 0) + 1;
  return counts;
}

interface ScoreBoardProps {
  players: Player[];
  activePlayerId: string;
  myPlayerId: string | null;
  phase: number;
  round: number;
  territoryCounts: Record<string, number>;
}

export function ScoreBoard({ players, activePlayerId, myPlayerId, phase, round, territoryCounts }: ScoreBoardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-amber-900 text-sm flex items-center gap-1">
          🏆 スコア
        </h3>
        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          フェーズ {phase} / ラウンド {round}
        </span>
      </div>

      <div className="space-y-2">
        {sorted.map((player, rank) => {
          const originalIndex = players.findIndex((p) => p.id === player.id);
          const isCurrentTurn = player.id === activePlayerId;
          const isMe = player.id === myPlayerId;
          const terrCount = territoryCounts[player.id] ?? 0;
          const resCounts = countResources(player.resources);
          const totalRes = player.resources.length;

          return (
            <div
              key={player.id}
              className={[
                'rounded-lg px-3 py-2 border transition-all',
                isCurrentTurn ? 'bg-amber-100 border-amber-300 shadow-sm' : 'bg-gray-50 border-transparent',
                !player.connected ? 'opacity-50' : '',
              ].join(' ')}
            >
              {/* 上段: 順位・カラー・名前・領土・得点 */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 w-4 flex-shrink-0">{rank + 1}</span>
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${PLAYER_COLORS[originalIndex % 8]}`} />
                <span className={[
                  'flex-1 text-xs font-medium truncate',
                  isCurrentTurn ? 'text-amber-900' : 'text-gray-700',
                  !player.connected ? 'line-through text-gray-400' : '',
                ].join(' ')}>
                  {player.name}
                  {isMe && <span className="ml-1 text-[9px] text-amber-500 font-bold">(あなた)</span>}
                  {isCurrentTurn && <span className="ml-1 text-[9px] text-amber-600 font-bold animate-pulse">▶</span>}
                  {!player.connected && <span className="ml-1 text-[9px] text-gray-400">(切断)</span>}
                </span>
                <span className="text-[10px] text-gray-500 flex-shrink-0">🏴{terrCount}</span>
                <span className={['text-xs font-bold flex-shrink-0', isCurrentTurn ? 'text-amber-700' : 'text-gray-600'].join(' ')}>
                  {player.score}pt
                </span>
              </div>

              {/* 下段: リソース */}
              <div className="flex flex-wrap gap-1 mt-1.5 ml-9">
                {totalRes === 0 ? (
                  <span className="text-[10px] text-gray-300">リソースなし</span>
                ) : (
                  RESOURCE_ORDER.map((r) =>
                    resCounts[r] ? (
                      <span key={r} className="inline-flex items-center gap-0.5 text-[11px] bg-white border border-amber-200 px-1.5 py-0.5 rounded-full shadow-sm">
                        {RESOURCE_ICONS[r]}
                        <span className="font-bold text-amber-800">×{resCounts[r]}</span>
                      </span>
                    ) : null
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
