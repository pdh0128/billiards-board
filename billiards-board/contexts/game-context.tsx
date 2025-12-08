'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Player {
  id: string;
  name: string;
  color: string;
  startPosition: { x: number; y: number; z: number };
}

interface GameContextType {
  players: Player[];
  currentPlayer: Player | null;
  isGameStarted: boolean;
  startGame: (players: Player[]) => void;
  setCurrentPlayer: (player: Player) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayerState] = useState<Player | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);

  const startGame = (gamePlayers: Player[]) => {
    setPlayers(gamePlayers);
    setCurrentPlayerState(gamePlayers[0]);
    setIsGameStarted(true);
  };

  const setCurrentPlayer = (player: Player) => {
    setCurrentPlayerState(player);
  };

  return (
    <GameContext.Provider
      value={{
        players,
        currentPlayer,
        isGameStarted,
        startGame,
        setCurrentPlayer,
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
