'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Play } from 'lucide-react';

interface Player {
  id: string;
  name: string;
  color: string;
  startPosition: { x: number; y: number; z: number };
}

interface LobbyProps {
  onStart: (players: Player[]) => void;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
];

// 당구대 크기: 20 x 12
const TABLE_WIDTH = 20;
const TABLE_DEPTH = 12;

// 시작 위치 계산 (참여자 수에 따라 당구대 가장자리에 균등 배치)
function calculateStartPositions(playerCount: number): { x: number; y: number; z: number }[] {
  const positions: { x: number; y: number; z: number }[] = [];

  if (playerCount === 1) {
    // 1명: 중앙 하단
    positions.push({ x: 0, y: 0, z: TABLE_DEPTH / 2 - 2 });
  } else if (playerCount === 2) {
    // 2명: 상하단 중앙
    positions.push({ x: 0, y: 0, z: -TABLE_DEPTH / 2 + 2 });
    positions.push({ x: 0, y: 0, z: TABLE_DEPTH / 2 - 2 });
  } else if (playerCount === 3) {
    // 3명: 삼각형 배치
    positions.push({ x: 0, y: 0, z: -TABLE_DEPTH / 2 + 2 });
    positions.push({ x: -TABLE_WIDTH / 4, y: 0, z: TABLE_DEPTH / 2 - 2 });
    positions.push({ x: TABLE_WIDTH / 4, y: 0, z: TABLE_DEPTH / 2 - 2 });
  } else if (playerCount === 4) {
    // 4명: 사각형 배치
    positions.push({ x: -TABLE_WIDTH / 3, y: 0, z: -TABLE_DEPTH / 3 });
    positions.push({ x: TABLE_WIDTH / 3, y: 0, z: -TABLE_DEPTH / 3 });
    positions.push({ x: -TABLE_WIDTH / 3, y: 0, z: TABLE_DEPTH / 3 });
    positions.push({ x: TABLE_WIDTH / 3, y: 0, z: TABLE_DEPTH / 3 });
  } else {
    // 5명 이상: 원형 배치
    const radius = Math.min(TABLE_WIDTH, TABLE_DEPTH) / 3;
    for (let i = 0; i < playerCount; i++) {
      const angle = (i / playerCount) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      });
    }
  }

  return positions;
}

export function Lobby({ onStart }: LobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    if (players.length >= 6) {
      alert('최대 6명까지 참여할 수 있습니다.');
      return;
    }

    const positions = calculateStartPositions(players.length + 1);
    const newPlayers = players.map((player, index) => ({
      ...player,
      startPosition: positions[index],
    }));

    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPlayerName.trim(),
      color: COLORS[players.length % COLORS.length],
      startPosition: positions[positions.length - 1],
    };

    setPlayers([...newPlayers, newPlayer]);
    setNewPlayerName('');
  };

  const removePlayer = (id: string) => {
    const newPlayers = players.filter((p) => p.id !== id);
    const positions = calculateStartPositions(newPlayers.length);
    const updatedPlayers = newPlayers.map((player, index) => ({
      ...player,
      startPosition: positions[index],
    }));
    setPlayers(updatedPlayers);
  };

  const handleStart = () => {
    if (players.length === 0) {
      alert('최소 1명 이상의 플레이어가 필요합니다.');
      return;
    }
    onStart(players);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 max-w-2xl w-full mx-4">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          🎱 Billiards Board
        </h1>
        <p className="text-gray-400 text-center mb-8">
          참여자를 추가하고 게임을 시작하세요
        </p>

        {/* 참여자 추가 입력 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="플레이어 이름 입력..."
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={20}
          />
          <Button
            onClick={addPlayer}
            className="bg-blue-500 hover:bg-blue-600 px-6"
            disabled={!newPlayerName.trim() || players.length >= 6}
          >
            <Plus className="h-5 w-5 mr-2" />
            추가
          </Button>
        </div>

        {/* 참여자 목록 */}
        <div className="mb-6 max-h-64 overflow-y-auto">
          {players.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              참여자를 추가해주세요
            </div>
          ) : (
            <div className="space-y-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <div>
                      <div className="text-white font-semibold">{player.name}</div>
                      <div className="text-gray-400 text-sm">
                        시작 위치: ({player.startPosition.x.toFixed(1)}, {player.startPosition.z.toFixed(1)})
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => removePlayer(player.id)}
                    variant="outline"
                    size="icon"
                    className="bg-gray-600 hover:bg-red-600 border-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 시작 버튼 */}
        <Button
          onClick={handleStart}
          disabled={players.length === 0}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-4 text-lg font-semibold"
        >
          <Play className="h-6 w-6 mr-2" />
          게임 시작 ({players.length}명)
        </Button>

        <p className="text-gray-500 text-sm text-center mt-4">
          💡 최대 6명까지 참여 가능합니다
        </p>
      </div>
    </div>
  );
}
