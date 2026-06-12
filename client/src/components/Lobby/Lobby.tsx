import { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';

export function Lobby() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [nameError, setNameError] = useState('');
  const { createRoom, joinRoom } = useSocket();

  const validateName = (): boolean => {
    if (!playerName.trim()) {
      setNameError('プレイヤー名を入力してください');
      return false;
    }
    if (playerName.trim().length > 12) {
      setNameError('プレイヤー名は12文字以内にしてください');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = () => {
    if (!validateName()) return;
    createRoom(playerName.trim());
  };

  const handleJoin = () => {
    if (!validateName()) return;
    if (roomCode.length !== 6) {
      return;
    }
    joinRoom(playerName.trim(), roomCode.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🏝️</div>
          <h1 className="text-4xl font-bold text-amber-900 mb-1">ランドラッシュ</h1>
          <p className="text-amber-700 text-sm">Land Rush — 領土争奪カードゲーム</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200">
          {/* Player Name Input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-amber-800 mb-1">
              プレイヤー名
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setNameError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (showJoinForm) handleJoin();
                  else handleCreate();
                }
              }}
              placeholder="名前を入力..."
              maxLength={12}
              className="w-full border-2 border-amber-200 rounded-lg px-4 py-2.5 text-amber-900 placeholder-amber-300 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">{nameError}</p>
            )}
          </div>

          {!showJoinForm ? (
            <div className="space-y-3">
              <button
                onClick={handleCreate}
                className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
              >
                🏠 ルームを作成
              </button>
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full bg-orange-100 hover:bg-orange-200 active:bg-orange-300 text-orange-800 font-bold py-3 rounded-xl transition-colors border border-orange-200"
              >
                🚪 ルームに参加
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-amber-800 mb-1">
                  ルームコード
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) =>
                    setRoomCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="XXXXXX"
                  maxLength={6}
                  className="w-full border-2 border-amber-200 rounded-lg px-4 py-2.5 text-amber-900 placeholder-amber-300 focus:outline-none focus:border-amber-500 transition-colors text-center text-xl font-mono tracking-widest uppercase"
                />
                <p className="text-amber-500 text-xs mt-1 text-center">
                  6文字のコードを入力してください
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleJoin}
                  disabled={roomCode.length !== 6}
                  className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors shadow-sm"
                >
                  参加する
                </button>
                <button
                  onClick={() => {
                    setShowJoinForm(false);
                    setRoomCode('');
                  }}
                  className="w-full text-amber-600 hover:text-amber-800 text-sm py-1 transition-colors"
                >
                  ← 戻る
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-amber-500 text-xs mt-6">
          3〜8人でプレイ / 領土を制覇して勝利を目指せ！
        </p>
      </div>
    </div>
  );
}
