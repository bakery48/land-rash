import { Card, CardType } from '../../types';

const TYPE_ICONS: Record<string, string> = {
  territory: '🏴',
  sabotage: '⚔️',
  boost: '⚡',
  abundance: '🌿',
  steal: '🗡️',
  resource: '💎',
};

const TYPE_NAMES: Record<string, string> = {
  territory: '領土カード',
  sabotage: '妨害カード',
  boost: '強化カード',
  abundance: '豊穣カード',
  steal: '強奪カード',
  resource: 'リソース',
};

const TYPE_DESCRIPTIONS: Record<string, string> = {
  territory: '追加コストなしで領土を1マス獲得する',
  sabotage: '隣接する相手の領土を破壊する',
  boost: '次のターン、リソースをもう1枚多く取得できる',
  abundance: 'リソースプールを補充する',
  steal: '相手の隣接領土を自分のものにする',
  resource: 'リソースカード',
};

const TYPE_COLORS: Record<string, string> = {
  territory: 'bg-green-50 border-green-300 text-green-900',
  sabotage: 'bg-red-50 border-red-300 text-red-900',
  boost: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  abundance: 'bg-blue-50 border-blue-300 text-blue-900',
  steal: 'bg-orange-50 border-orange-300 text-orange-900',
  resource: 'bg-amber-50 border-amber-300 text-amber-900',
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  territory: 'bg-green-100 text-green-700',
  sabotage: 'bg-red-100 text-red-700',
  boost: 'bg-yellow-100 text-yellow-700',
  abundance: 'bg-blue-100 text-blue-700',
  steal: 'bg-orange-100 text-orange-700',
  resource: 'bg-amber-100 text-amber-700',
};

const TYPE_SELECTED_RING: Record<string, string> = {
  territory: 'ring-green-400',
  sabotage: 'ring-red-400',
  boost: 'ring-yellow-400',
  abundance: 'ring-blue-400',
  steal: 'ring-orange-400',
  resource: 'ring-amber-400',
};

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

function getCardDisplayInfo(card: Card): { name: string; description: string } {
  if (card.type === 'resource' && card.resource) {
    return {
      name: `${RESOURCE_ICONS[card.resource] ?? ''} ${RESOURCE_NAMES[card.resource] ?? card.resource}`,
      description: 'リソースカード（手札から消費できる）',
    };
  }
  return {
    name: card.name ?? TYPE_NAMES[card.type] ?? card.type,
    description: card.description ?? TYPE_DESCRIPTIONS[card.type] ?? '',
  };
}

interface CardDisplayProps {
  card: Card;
  isSelected: boolean;
  isClickable: boolean;
  onClick: (card: Card) => void;
}

export function CardDisplay({ card, isSelected, isClickable, onClick }: CardDisplayProps) {
  const cardType: string = card.type as CardType;
  const { name, description } = getCardDisplayInfo(card);
  const colors = TYPE_COLORS[cardType] ?? 'bg-gray-50 border-gray-300 text-gray-900';
  const badgeColors = TYPE_BADGE_COLORS[cardType] ?? 'bg-gray-100 text-gray-700';
  const ringColor = TYPE_SELECTED_RING[cardType] ?? 'ring-gray-400';
  const icon = TYPE_ICONS[cardType] ?? '🃏';

  return (
    <button
      onClick={() => isClickable && onClick(card)}
      disabled={!isClickable}
      className={[
        'relative w-full flex flex-col rounded-xl border-2 p-3 gap-1.5 text-left transition-all duration-150',
        colors,
        isSelected ? `ring-2 ring-offset-1 ${ringColor} scale-105 shadow-lg` : '',
        isClickable
          ? 'hover:scale-105 hover:shadow-md cursor-pointer'
          : 'cursor-default opacity-80',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Type badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{icon}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColors}`}>
          {TYPE_NAMES[cardType] ?? cardType}
        </span>
      </div>

      {/* Card name */}
      <p className="font-bold text-sm leading-tight">{name}</p>

      {/* Description */}
      <p className="text-[11px] opacity-75 leading-snug line-clamp-3">{description}</p>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          ✓
        </div>
      )}
    </button>
  );
}
