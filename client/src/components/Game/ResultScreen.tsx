import { Player } from '../../types';

const PLAYER_COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400',
  'bg-yellow-400', 'bg-pink-400', 'bg-cyan-400', 'bg-orange-400',
];

const MEDAL = ['🥇', '🥈', '🥉'];

interface ResultScreenProps {
  players: Player[];
  myPlayerId: string | null;
  territoryCounts: Record<string, number>;
  onPlayAgain: () => void;
}

export function ResultScreen({ players, myPlayerId, territoryCounts, onPlayAgain }: ResultScreenProps) {
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (territoryCounts[b.id] ?? 0) - (territoryCounts[a.id] ?? 0);
  });

  const winner = sorted[0];
  const isIWon = winner?.id === myPlayerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{isIWon ? '🎉' : '🏆'}</div>
          <h1 className="text-3xl font-bold text-amber-900 mb-1">ゲーム終了！</h1>
          {winner && (
            <p className="text-amber-600 mt-1 text-base">
              {isIWon ? 'あなたの勝利！' : (
                <>
                  <span className="font-bold">{winner.name}</span> の勝利！
                </>
              )}
            </p>
          )}
        </div>

        <div className="space-y-2 mb-6">
          {sorted.map((player, rank) => {
            const originalIndex = players.findIndex((p) => p.id === player.id);
            const isMe = player.id === myPlayerId;
            const terrCount = territoryCounts[player.id] ?? 0;

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
                    rank === 0 ? 'text-amber-900 font-bold' : 'text-gray-700'
                  }`}
                >
                  {player.name}
                  {isMe && <span className="ml-1 text-xs text-amber-500">(あなた)</span>}
                </span>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-amber-800">{player.score}点</div>
                  <div className="text-xs text-gray-400">🏴 {terrCount}領土</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-xl transition-colors text-lg"
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}
