import { Cell as CellType, ResourceCost } from '../../types';

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

const PLAYER_BORDER_COLORS: Record<number, string> = {
  0: 'border-red-500',
  1: 'border-blue-500',
  2: 'border-green-500',
  3: 'border-purple-500',
  4: 'border-yellow-500',
  5: 'border-pink-500',
  6: 'border-cyan-500',
  7: 'border-orange-500',
};

function CostBadge({ cost }: { cost: ResourceCost }) {
  const icons: Array<{ icon: string; count: number }> = [];
  if (cost.wood) icons.push({ icon: '🪵', count: cost.wood });
  if (cost.stone) icons.push({ icon: '🪨', count: cost.stone });
  if (cost.food) icons.push({ icon: '🌾', count: cost.food });
  if (cost.gold) icons.push({ icon: '💰', count: cost.gold });

  if (icons.length === 0) return <span className="text-[10px] text-amber-400">無料</span>;

  return (
    <div className="flex flex-wrap gap-0.5 justify-center">
      {icons.map(({ icon, count }) => (
        <span key={icon} className="text-sm leading-none">
          {icon}
          {count > 1 && <sup className="text-[9px] font-bold">{count}</sup>}
        </span>
      ))}
    </div>
  );
}

interface CellProps {
  cell: CellType;
  ownerIndex: number | null;
  isSelected: boolean;
  isClickable: boolean;
  onClick: (cellId: string) => void;
}

// 未所有セルのゾーン背景色（コストの主要リソースで決定）
function zoneBg(cost: ResourceCost): string {
  if (cost.gold) return 'bg-yellow-50';       // 金貨混入 = 中央高級地帯
  if (cost.wood && cost.stone) return 'bg-orange-50'; // 右下混合
  if (cost.wood) return 'bg-lime-50';         // 木材ゾーン
  if (cost.stone) return 'bg-slate-100';      // 石材ゾーン
  if (cost.food) return 'bg-green-50';        // 食料ゾーン
  return 'bg-amber-50';
}

function zoneBorder(cost: ResourceCost): string {
  if (cost.gold) return 'border-yellow-300';
  if (cost.wood && cost.stone) return 'border-orange-300';
  if (cost.wood) return 'border-lime-300';
  if (cost.stone) return 'border-slate-300';
  if (cost.food) return 'border-green-300';
  return 'border-amber-200';
}

export function Cell({ cell, ownerIndex, isSelected, isClickable, onClick }: CellProps) {
  const ownerBg = ownerIndex !== null ? PLAYER_COLORS[ownerIndex % 8] : zoneBg(cell.cost);
  const ownerBorder =
    ownerIndex !== null ? PLAYER_BORDER_COLORS[ownerIndex % 8] : zoneBorder(cell.cost);

  return (
    <button
      onClick={() => isClickable && onClick(cell.id)}
      disabled={!isClickable}
      title={`(${cell.row},${cell.col})`}
      className={[
        'relative w-full rounded-md border-2 flex flex-col items-center justify-center gap-1 transition-all duration-150 text-center overflow-hidden min-h-[72px]',
        `${ownerBg} ${ownerBorder}`,
        isSelected ? 'ring-2 ring-offset-1 ring-amber-500 scale-105 z-10 shadow-lg' : '',
        isClickable
          ? 'hover:scale-105 hover:shadow-md cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1'
          : 'cursor-default',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Owner Flag */}
      {ownerIndex !== null && <span className="text-lg leading-none">🏴</span>}

      {/* Cost */}
      <div className="w-full px-1">
        <CostBadge cost={cell.cost} />
      </div>

      {/* Cell coordinate */}
      <span className="absolute bottom-0.5 right-1 text-[9px] text-gray-300 font-mono leading-none">
        {cell.row},{cell.col}
      </span>
    </button>
  );
}
