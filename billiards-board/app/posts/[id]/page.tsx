'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Comment } from '@prisma/client';
import { CommentWithUser, PostWithMeta, VoteSummary } from '@/types';
import { getAuthToken } from '@/utils/client-auth';

type DetailState = {
  post: PostWithMeta | null;
  comments: Comment[];
  loading: boolean;
  error: string | null;
};

export default function PostDetail() {
  const params = useParams<{ id: string }>();
  const postId = params?.id ?? '';
  const [state, setState] = useState<DetailState>({
    post: null,
    comments: [],
    loading: true,
    error: null,
  });
  const [commentContent, setCommentContent] = useState('');
  const [parentPath, setParentPath] = useState<string | undefined>(undefined);
  const [voting, setVoting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!postId) {
      setState({
        post: null,
        comments: [],
        loading: false,
        error: '잘못된 경로입니다',
      });
      return;
    }

    setState({
      post: null,
      comments: [],
      loading: true,
      error: null,
    });

    try {
      const res = await fetch(`/api/posts/${postId}`, { cache: 'no-store' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '글을 불러오지 못했습니다');
      setState({
        post: json.data.post,
        comments: json.data.comments,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        post: null,
        comments: [],
        loading: false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다',
      });
    }
  }, [postId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleVote = async (value: 'UP' | 'DOWN') => {
    if (voting) return;
    setVoting(true);
    try {
      const token = getAuthToken();
      if (!postId) throw new Error('잘못된 경로입니다');
      const res = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ value }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '투표에 실패했습니다');
      setState((prev) =>
        prev.post
          ? {
              ...prev,
              post: { ...prev.post, votes: json.data.votes as VoteSummary },
            }
          : prev
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '투표에 실패했습니다');
    } finally {
      setVoting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    try {
      const token = getAuthToken();
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: commentContent.trim(),
          postId,
          parentPath,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '댓글 작성 실패');
      setCommentContent('');
      setParentPath(undefined);
      fetchDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 작성 실패');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || '댓글 삭제 실패');
      fetchDetail();
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 삭제 실패');
    }
  };

  const tree = useMemo(() => {
    const sorted = [...state.comments].sort((a, b) => a.path.localeCompare(b.path));
    return sorted as CommentWithUser[];
  }, [state.comments]);

  if (state.loading) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">불러오는 중...</div>;
  }

  if (state.error || !state.post) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-lg">문제가 발생했습니다: {state.error ?? '글을 찾을 수 없습니다'}</p>
        <Link href="/" className="text-emerald-400 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { post } = state;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <Link href="/" className="text-emerald-400 underline">
          ← 목록으로
        </Link>

        <article className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <div className="text-sm text-slate-400 mt-2 flex gap-3">
            <span>작성자: {post.user?.username ?? '익명'}</span>
            <span>{new Date(post.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-slate-200 mt-6 whitespace-pre-wrap leading-relaxed">{post.content}</p>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => handleVote('UP')}
              disabled={voting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-semibold disabled:opacity-50"
            >
              개추 {post.votes?.up ?? 0}
            </button>
            <button
              onClick={() => handleVote('DOWN')}
              disabled={voting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 font-semibold disabled:opacity-50"
            >
              비추 {post.votes?.down ?? 0}
            </button>
          </div>
        </article>

        <section>
          <h2 className="text-xl font-semibold mb-4">댓글</h2>
          <form onSubmit={handleCommentSubmit} className="space-y-3 mb-6">
            {parentPath && (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>대댓글 작성 중 (parent path: {parentPath})</span>
                <button type="button" className="text-emerald-400 underline" onClick={() => setParentPath(undefined)}>
                  취소
                </button>
              </div>
            )}
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="댓글을 입력하세요"
              className="w-full min-h-[120px] rounded-xl bg-slate-900 border border-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold"
              disabled={!commentContent.trim()}
            >
              등록
            </button>
          </form>

          <div className="space-y-3">
            {tree.length === 0 && <p className="text-slate-500 text-sm">첫 댓글을 남겨보세요.</p>}
            {tree.map((comment) => (
              <div
                key={comment.id}
                className="bg-slate-900/60 border border-slate-800 rounded-xl p-3"
                style={{ marginLeft: Math.min(comment.depth * 16, 120) }}
              >
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>{comment.user?.username ?? '익명'}</span>
                  {!comment.isDeleted && (
                    <div className="flex gap-2">
                      <button
                        className="text-emerald-400"
                        type="button"
                        onClick={() => setParentPath(comment.path)}
                      >
                        대댓글
                      </button>
                      <button
                        className="text-rose-400"
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-slate-100">
                  {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
