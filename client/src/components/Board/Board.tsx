import { Cell as CellType, Player } from '../../types';
import { Cell } from './Cell';

interface BoardProps {
  board: CellType[][];
  players: Player[];
  myPlayerId: string | null;
  isMyTurn: boolean;
  turnStep: string;
  selectedCell: string | null;
  onCellClick: (cellId: string) => void;
}

export function Board({
  board,
  players,
  myPlayerId,
  isMyTurn,
  turnStep,
  selectedCell,
  onCellClick,
}: BoardProps) {
  const isActionStep = isMyTurn && turnStep === 'action';

  // Build player id → index map for colors
  const playerIndexMap: Record<string, number> = {};
  players.forEach((p, i) => {
    playerIndexMap[p.id] = i;
  });

  if (!board || board.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm flex items-center justify-center min-h-[200px]">
        <p className="text-amber-400 text-sm">ボードを読み込み中...</p>
      </div>
    );
  }

  const cols = board[0]?.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-amber-900 text-sm">🗺️ 領土マップ</h3>
        <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">
          {board.length} × {cols}
        </span>
      </div>
      {/* ゾーン凡例 */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {[
          { bg: 'bg-lime-50 border-lime-300', label: '🪵 木材' },
          { bg: 'bg-slate-100 border-slate-300', label: '🪨 石材' },
          { bg: 'bg-green-50 border-green-300', label: '🌾 食料' },
          { bg: 'bg-orange-50 border-orange-300', label: '🪵+🪨 混合' },
          { bg: 'bg-yellow-50 border-yellow-300', label: '💰 高級' },
        ].map(({ bg, label }) => (
          <span key={label} className={`text-[10px] px-1.5 py-0.5 rounded border ${bg} text-gray-600`}>
            {label}
          </span>
        ))}
      </div>

      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {board.flatMap((row) =>
          row.map((cell) => {
            const ownerIndex =
              cell.owner !== null && cell.owner !== undefined
                ? (playerIndexMap[cell.owner] ?? null)
                : null;

            return (
              <Cell
                key={cell.id}
                cell={cell}
                ownerIndex={ownerIndex}
                isSelected={selectedCell === cell.id}
                isClickable={isActionStep}
                onClick={onCellClick}
              />
            );
          })
        )}
      </div>

      {isActionStep && (
        <p className="text-xs text-amber-600 text-center mt-2 font-medium">
          {selectedCell ? 'セルが選択されています' : 'セルをクリックして領土を選択'}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1">
            <div
              className={`w-3 h-3 rounded-sm ${
                [
                  'bg-red-400',
                  'bg-blue-400',
                  'bg-green-400',
                  'bg-purple-400',
                  'bg-yellow-400',
                  'bg-pink-400',
                  'bg-cyan-400',
                  'bg-orange-400',
                ][i % 8]
              }`}
            />
            <span className="text-[10px] text-gray-600 truncate max-w-[60px]">
              {p.id === myPlayerId ? `${p.name}*` : p.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
