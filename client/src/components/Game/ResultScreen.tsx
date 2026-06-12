import { Player } from '../../types';

const PLAYER_COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400',
  'bg-yellow-400', 'bg-pink-400', 'bg-cyan-400', 'bg-orange-400',
];

const MEDAL = ['🥇', '🥈', '🥉'];

interface ResultScreenProps {
  players: Player[];
  myPlayerId: string | null;
  onPlayAgain: () => void;
}

export function ResultScreen({ players, myPlayerId, onPlayAgain }: ResultScreenProps) {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.territories.length - a.territories.length;
  });

  const winner = sorted[0];
  const isIWon = winner?.id === myPlayerId;

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{isIWon ? '🎉' : '🏝️'}</div>
          <h1 className="text-2xl font-bold text-amber-900">
            {isIWon ? 'あなたの勝利！' : 'ゲーム終了'}
          </h1>
          {!isIWon && winner && (
            <p className="text-amber-600 mt-1 text-sm">
              <span className="font-bold">{winner.name}</span> の勝利！
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          {sorted.map((player, rank) => {
            const originalIndex = players.findIndex((p) => p.id === player.id);
            const isMe = player.id === myPlayerId;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                  rank === 0
                    ? 'bg-amber-100 border-2 border-amber-300'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-xl w-8 text-center flex-shrink-0">
                  {MEDAL[rank] ?? `${rank + 1}`}
                </span>
                <div
                  className={`w-3 h-3 rounded-full flex-shrink-0 ${PLAYER_COLORS[originalIndex % 8]}`}
                />
                <span
                  className={`flex-1 text-sm font-medium ${
                    rank === 0 ? 'text-amber-900' : 'text-gray-700'
                  }`}
                >
                  {player.name}
                  {isMe && <span className="ml-1 text-xs text-amber-500">(あなた)</span>}
                </span>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-800">{player.score}pt</div>
                  <div className="text-xs text-gray-400">🏴{player.territories.length}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}
