'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PostWithMeta } from '@/types';

type FetchState = {
  posts: PostWithMeta[];
  cursor: string | null;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
};

export default function Home() {
const [state, setState] = useState<FetchState>({
  posts: [],
  cursor: null,
  hasMore: true,
  loading: false,
  error: null,
});
const sentinelRef = useRef<HTMLDivElement | null>(null);
const stateRef = useRef(state);

useEffect(() => {
  stateRef.current = state;
}, [state]);

  const loadMore = useCallback(async () => {
    const snapshot = stateRef.current;
    if (snapshot.loading || !snapshot.hasMore) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      params.set('limit', '10');
      if (snapshot.cursor) params.set('cursor', snapshot.cursor);
      const res = await fetch(`/api/posts?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || '글을 불러오지 못했습니다');
      }
      setState((prev) => ({
        posts: [...prev.posts, ...json.data.posts],
        cursor: json.data.nextCursor,
        hasMore: json.data.hasMore,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      }));
    }
  }, []);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">투표 게시판</h1>
            <p className="text-sm text-slate-400 mt-1">커서 기반 무한 스크롤 + Path Model 댓글</p>
          </div>
          <Link
            href="/posts/new"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow"
          >
            글쓰기
          </Link>
        </header>

        <div className="space-y-4">
          {state.posts.map((post) => (
            <article key={post.id} className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/posts/${post.id}`} className="text-xl font-semibold hover:text-emerald-400">
                    {post.title}
                  </Link>
                  <p className="text-slate-300 mt-2 line-clamp-3">{post.content}</p>
                  <div className="text-xs text-slate-500 mt-3 flex gap-4">
                    <span>작성자: {post.user?.username ?? '익명'}</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                    <span>댓글 {post._count?.comments ?? 0}개</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1 min-w-[64px]">
                  <span className="text-emerald-400 font-bold">👍 {post.votes?.up ?? 0}</span>
                  <span className="text-rose-400 font-bold">👎 {post.votes?.down ?? 0}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {state.error && <p className="text-red-400 mt-4">{state.error}</p>}

        <div ref={sentinelRef} className="h-10" />
        {state.loading && <p className="text-center text-slate-400 mt-4">불러오는 중...</p>}
        {!state.hasMore && <p className="text-center text-slate-500 mt-4">마지막 글입니다.</p>}
      </div>
    </main>
  );
}
