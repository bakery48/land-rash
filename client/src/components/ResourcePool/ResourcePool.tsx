import { Card, Resource } from '../../types';

const RESOURCE_ICONS: Record<string, string> = {
  wood: '🪵',
  stone: '🪨',
  food: '🌾',
  gold: '💰',
};

const RESOURCE_NAMES: Record<string, string> = {
  wood: '木材',
  stone: '石材',
  food: '食料',
  gold: '金貨',
};

const RESOURCE_COLORS: Record<string, string> = {
  wood: 'bg-lime-100 border-lime-300 text-lime-800',
  stone: 'bg-gray-100 border-gray-300 text-gray-700',
  food: 'bg-green-100 border-green-300 text-green-800',
  gold: 'bg-yellow-100 border-yellow-300 text-yellow-800',
};

interface ResourcePoolProps {
  // Server sends Card[] where each card has type='resource' and resource field
  pool: Card[];
  isMyTurn: boolean;
  turnStep: string;
  onTakeResource: (cardId: string) => void;
  onSkip: () => void;
}

export function ResourcePool({ pool, isMyTurn, turnStep, onTakeResource, onSkip }: ResourcePoolProps) {
  const isClickable = isMyTurn && turnStep === 'take_resource';

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-amber-900 text-sm">リソースプール</h3>
        <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
          {pool.length} 枚
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {pool.map((card, index) => {
          const resource = card.resource as Resource | undefined;
          const clickable = isClickable && !!resource;
          const colorClass = resource ? (RESOURCE_COLORS[resource] ?? 'bg-amber-50 border-amber-200') : 'bg-gray-50 border-gray-200 opacity-40';

          return (
            <button
              key={card.id ?? index}
              onClick={() => clickable && resource && onTakeResource(card.id)}
              disabled={!clickable}
              className={[
                'relative flex flex-col items-center justify-center rounded-lg border-2 py-2 px-1 gap-1 transition-all duration-150 aspect-square',
                colorClass,
                clickable
                  ? 'hover:scale-105 hover:shadow-md cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1'
                  : 'cursor-default',
              ]
                .filter(Boolean)
                .join(' ')}
              title={resource ? RESOURCE_NAMES[resource] : '空'}
            >
              {resource ? (
                <>
                  <span className="text-xl leading-none">{RESOURCE_ICONS[resource]}</span>
                  <span className="text-[10px] font-semibold leading-none">
                    {RESOURCE_NAMES[resource]}
                  </span>
                </>
              ) : (
                <span className="text-gray-300 text-lg">—</span>
              )}
              <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-400 font-mono">
                {index + 1}
              </span>
            </button>
          );
        })}
        {/* Pad to 5 slots if fewer cards */}
        {Array.from({ length: Math.max(0, 5 - pool.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex flex-col items-center justify-center rounded-lg border-2 bg-gray-50 border-gray-200 opacity-30 aspect-square"
          >
            <span className="text-gray-300 text-lg">—</span>
          </div>
        ))}
      </div>

      {isClickable && (
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-amber-600 font-medium animate-pulse">
            リソースを1つ取得してください
          </p>
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
          >
            スキップ
          </button>
        </div>
      )}
      {isMyTurn && turnStep !== 'take_resource' && turnStep !== 'draw' && (
        <p className="text-xs text-gray-400 text-center mt-2">
          このターンはすでにリソースを取得済みです
        </p>
      )}
    </div>
  );
}
