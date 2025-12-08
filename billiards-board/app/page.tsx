import { Scene } from '@/components/three/Scene';
import { ArticleForm } from '@/components/article/article-form';

export default function Home() {
  return (
    <main className="w-full h-screen bg-black relative">
      <Scene />
      <ArticleForm />
    </main>
  );
}
