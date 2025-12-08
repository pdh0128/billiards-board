'use client';

import { Scene } from '@/components/three/Scene';
import { ArticleForm } from '@/components/article/article-form';
import { Lobby } from '@/components/lobby/lobby';
import { useGame } from '@/contexts/game-context';

export default function Home() {
  const { isGameStarted, startGame } = useGame();

  if (!isGameStarted) {
    return <Lobby onStart={startGame} />;
  }

  return (
    <main className="w-full h-screen bg-black relative">
      <Scene />
      <ArticleForm />
    </main>
  );
}
