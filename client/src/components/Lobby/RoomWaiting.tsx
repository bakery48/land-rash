import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';

export function RoomWaiting() {
  const { room, myPlayerId } = useGameStore();
  const { startGame, leaveRoom } = useSocket();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const isHost = room.hostId === myPlayerId;
  const playerCount = room.players.length;
  const maxPlayers = room.maxPlayers ?? 8;
  const canStart = playerCount >= 3;
  // room.id is the 6-char room code
  const roomCode = room.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🏝️</div>
          <h1 className="text-2xl font-bold text-amber-900">ランドラッシュ</h1>
          <p className="text-amber-600 text-sm">ルーム待機中...</p>
        </div>

        {/* Room Code */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 mb-4">
          <p className="text-sm font-semibold text-amber-700 text-center mb-2">ルームコード</p>
          <button
            onClick={handleCopyCode}
            className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 rounded-xl py-4 transition-colors"
          >
            <span className="text-3xl font-mono font-bold text-amber-800 tracking-widest">
              {roomCode}
            </span>
            <p className="text-xs text-amber-500 mt-1">
              {copied ? '✅ コピーしました！' : '📋 クリックしてコピー'}
            </p>
          </button>
          <p className="text-center text-amber-500 text-xs mt-2">
            このコードを友達に教えてください
          </p>
        </div>

        {/* Player List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-amber-900">参加者</h2>
            <span className="text-sm font-semibold text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
              {playerCount}人 / {maxPlayers}人
            </span>
          </div>

          <div className="space-y-2">
            {room.players.map((player, index) => {
              const isPlayerHost = player.id === room.hostId;
              const isMe = player.id === myPlayerId;
              return (
                <div
                  key={player.id}
                  className="flex items-center gap-3 bg-amber-50 rounded-lg px-3 py-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-sm font-bold text-amber-800">
                    {index + 1}
                  </div>
                  <span className="flex-1 font-medium text-amber-900">
                    {isPlayerHost && <span className="mr-1">👑</span>}
                    {player.name}
                  </span>
                  {isPlayerHost && (
                    <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-semibold">
                      ホスト
                    </span>
                  )}
                  {isMe && !isPlayerHost && (
                    <span className="text-xs bg-green-400 text-white px-2 py-0.5 rounded-full font-semibold">
                      あなた
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Waiting slots (show at least 3 total slots) */}
          {Array.from({ length: Math.max(0, 3 - playerCount) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-3 border-2 border-dashed border-amber-100 rounded-lg px-3 py-2.5 mt-2"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm text-amber-300">
                ?
              </div>
              <span className="text-amber-300 text-sm">待機中...</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={startGame}
              disabled={!canStart}
              className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-lg"
            >
              {canStart
                ? '⚔️ ゲーム開始'
                : `⚔️ ゲーム開始（あと${3 - playerCount}人必要）`}
            </button>
          )}
          {!isHost && (
            <div className="text-center py-3 text-amber-600 font-medium">
              ホストがゲームを開始するのを待っています...
            </div>
          )}
          <button
            onClick={leaveRoom}
            className="w-full text-amber-500 hover:text-amber-700 text-sm py-2 transition-colors"
          >
            ← ロビーに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
