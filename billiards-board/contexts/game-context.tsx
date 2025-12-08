'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Player {
  id: string;
  nickname: string;
  color: string;
  joinedAt: number;
}

interface GameContextType {
  players: Player[];
  currentPlayer: Player | null;
  myPlayer: Player | null;
  isMyTurn: boolean;
  joinGame: (nickname: string) => void;
  nextTurn: () => void;
  getPlayerStartPosition: (playerId: string) => { x: number; y: number; z: number };
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
];

// 당구대 크기 (4배 확대)
const TABLE_WIDTH = 80;
const TABLE_DEPTH = 48;

// 플레이어 수에 따른 시작 위치 계산
function calculateStartPosition(playerIndex: number, totalPlayers: number): { x: number; y: number; z: number } {
  if (totalPlayers === 1) {
    return { x: 0, y: 0, z: TABLE_DEPTH / 2 - 2 };
  } else if (totalPlayers === 2) {
    return playerIndex === 0
      ? { x: 0, y: 0, z: -TABLE_DEPTH / 2 + 2 }
      : { x: 0, y: 0, z: TABLE_DEPTH / 2 - 2 };
  } else {
    // 3명 이상: 원형 배치
    const radius = Math.min(TABLE_WIDTH, TABLE_DEPTH) / 3;
    const angle = (playerIndex / totalPlayers) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius,
    };
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayer, setMyPlayer] = useState<Player | null>(null);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  const joinGame = (nickname: string) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      nickname,
      color: COLORS[players.length % COLORS.length],
      joinedAt: Date.now(),
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setMyPlayer(newPlayer);
  };

  const nextTurn = () => {
    if (players.length === 0) return;
    setCurrentTurnIndex((prev) => (prev + 1) % players.length);
  };

  const getPlayerStartPosition = (playerId: string) => {
    const playerIndex = players.findIndex((p) => p.id === playerId);
    if (playerIndex === -1) {
      return { x: 0, y: 0, z: 0 };
    }
    return calculateStartPosition(playerIndex, players.length);
  };

  const currentPlayer = players[currentTurnIndex] || null;
  const isMyTurn = myPlayer !== null && currentPlayer?.id === myPlayer.id;

  return (
    <GameContext.Provider
      value={{
        players,
        currentPlayer,
        myPlayer,
        isMyTurn,
        joinGame,
        nextTurn,
        getPlayerStartPosition,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
