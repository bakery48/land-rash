import { Card, CardType } from '../../types';

const TYPE_ICONS: Record<CardType, string> = {
  territory: '🏴',
  sabotage: '⚔️',
  boost: '⚡',
  abundance: '🌿',
  steal: '🗡️',
};

const TYPE_NAMES: Record<CardType, string> = {
  territory: '領土',
  sabotage: '妨害',
  boost: '強化',
  abundance: '豊穣',
  steal: '強奪',
};

const TYPE_COLORS: Record<CardType, string> = {
  territory: 'bg-green-50 border-green-300 text-green-900',
  sabotage: 'bg-red-50 border-red-300 text-red-900',
  boost: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  abundance: 'bg-blue-50 border-blue-300 text-blue-900',
  steal: 'bg-orange-50 border-orange-300 text-orange-900',
};

const TYPE_BADGE_COLORS: Record<CardType, string> = {
  territory: 'bg-green-100 text-green-700',
  sabotage: 'bg-red-100 text-red-700',
  boost: 'bg-yellow-100 text-yellow-700',
  abundance: 'bg-blue-100 text-blue-700',
  steal: 'bg-orange-100 text-orange-700',
};

const TYPE_SELECTED_RING: Record<CardType, string> = {
  territory: 'ring-green-400',
  sabotage: 'ring-red-400',
  boost: 'ring-yellow-400',
  abundance: 'ring-blue-400',
  steal: 'ring-orange-400',
};

interface CardDisplayProps {
  card: Card;
  isSelected: boolean;
  isClickable: boolean;
  onClick: (card: Card) => void;
}

export function CardDisplay({ card, isSelected, isClickable, onClick }: CardDisplayProps) {
  return (
    <button
      onClick={() => isClickable && onClick(card)}
      disabled={!isClickable}
      className={[
        'relative w-full flex flex-col rounded-xl border-2 p-3 gap-1.5 text-left transition-all duration-150',
        TYPE_COLORS[card.type],
        isSelected
          ? `ring-2 ring-offset-1 ${TYPE_SELECTED_RING[card.type]} scale-105 shadow-lg`
          : '',
        isClickable
          ? 'hover:scale-105 hover:shadow-md cursor-pointer'
          : 'cursor-default opacity-80',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Type badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{TYPE_ICONS[card.type]}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_BADGE_COLORS[card.type]}`}
        >
          {TYPE_NAMES[card.type]}
        </span>
      </div>

      {/* Card name */}
      <p className="font-bold text-sm leading-tight">{card.name}</p>

      {/* Description */}
      <p className="text-[11px] opacity-75 leading-snug line-clamp-3">{card.description}</p>

      {/* Cost if any */}
      {card.cost && Object.keys(card.cost).length > 0 && (
        <div className="flex gap-1 flex-wrap mt-0.5">
          {card.cost.wood ? (
            <span className="text-[10px] bg-lime-100 text-lime-700 px-1 rounded">
              🪵×{card.cost.wood}
            </span>
          ) : null}
          {card.cost.stone ? (
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1 rounded">
              🪨×{card.cost.stone}
            </span>
          ) : null}
          {card.cost.food ? (
            <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">
              🌾×{card.cost.food}
            </span>
          ) : null}
          {card.cost.gold ? (
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">
              💰×{card.cost.gold}
            </span>
          ) : null}
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          ✓
        </div>
      )}
    </button>
  );
}
