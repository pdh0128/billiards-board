'use client';

import { useGame } from '@/contexts/game-context';

export function TurnIndicator() {
  const { players, currentPlayer, myPlayer, isMyTurn } = useGame();

  if (players.length === 0 || !currentPlayer) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-xl px-6 py-3 border-2"
           style={{ borderColor: currentPlayer.color }}>
        <div className="flex items-center gap-4">
          {/* 현재 턴 플레이어 */}
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: currentPlayer.color }}
            />
            <span className="text-white font-semibold">
              {currentPlayer.nickname}
            </span>
            <span className="text-gray-400 text-sm">의 턴</span>
          </div>

          {/* 내 턴 표시 */}
          {isMyTurn && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              내 차례!
            </div>
          )}
        </div>
      </div>

      {/* 플레이어 목록 */}
      <div className="mt-2 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-lg px-4 py-2">
        <div className="flex items-center gap-3">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-all ${
                player.id === currentPlayer.id
                  ? 'bg-gray-700'
                  : 'bg-gray-800/50'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className={`text-sm ${
                player.id === myPlayer?.id
                  ? 'text-yellow-400 font-semibold'
                  : 'text-gray-300'
              }`}>
                {player.nickname}
                {player.id === myPlayer?.id && ' (나)'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
