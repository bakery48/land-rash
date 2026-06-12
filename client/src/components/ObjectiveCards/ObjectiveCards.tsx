import { ObjectiveCard } from '../../types';

interface ObjectiveCardsProps {
  objectives: ObjectiveCard[];
  players: { id: string; name: string }[];
}

export function ObjectiveCards({ objectives, players }: ObjectiveCardsProps) {
  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return '';
    return players.find((p) => p.id === playerId)?.name ?? '不明';
  };

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🎯</span>
        <h3 className="font-bold text-amber-900 text-sm">目標カード</h3>
      </div>

      <div className="space-y-2">
        {objectives.map((obj) => (
          <div
            key={obj.id}
            className={[
              'rounded-lg border p-3 transition-all',
              obj.achievedBy
                ? 'bg-green-50 border-green-300 opacity-80'
                : 'bg-amber-50 border-amber-200',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 text-xs leading-snug">
                  {obj.description}
                </p>
                {obj.achievedBy && (
                  <p className="text-[10px] text-green-700 font-semibold mt-1 flex items-center gap-1">
                    <span>✅</span>
                    <span>{getPlayerName(obj.achievedBy)} が達成！</span>
                  </p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <span
                  className={[
                    'inline-block text-xs font-bold px-2 py-1 rounded-full',
                    obj.achievedBy
                      ? 'bg-green-200 text-green-800'
                      : 'bg-amber-200 text-amber-800',
                  ].join(' ')}
                >
                  {obj.points}点
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
