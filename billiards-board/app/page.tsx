'use client';

import { Scene } from '@/components/three/Scene';
import { ArticleForm } from '@/components/article/article-form';
import { NicknameEntry } from '@/components/lobby/nickname-entry';
import { TurnIndicator } from '@/components/game/turn-indicator';
import { useGame } from '@/contexts/game-context';

export default function Home() {
  const { myPlayer, joinGame } = useGame();

  if (!myPlayer) {
    return <NicknameEntry onEnter={joinGame} />;
  }

  return (
    <main className="w-full h-screen bg-black relative">
      <TurnIndicator />
      <Scene />
      <ArticleForm />
    </main>
  );
}
