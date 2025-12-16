'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Comment } from '@prisma/client';
import { CommentWithUser, PostWithMeta, VoteSummary } from '@/types';
import { getAuthToken } from '@/utils/client-auth';
import { animate, stagger } from 'animejs';
import PostDetail3DScene from '@/components/post-detail-3d-scene';

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
  const [showCommentForm, setShowCommentForm] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!state.post) return;
    animate('.detail-card', {
      opacity: [0, 1],
      translateY: [-8, 0],
      easing: 'easeOutQuad',
      duration: 550,
    });
    animate('.comment-item', {
      opacity: [0, 1],
      translateY: [12, 0],
      easing: 'easeOutQuad',
      duration: 450,
      delay: stagger(30),
    });
  }, [state.post, state.comments]);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0b1630] to-black text-white flex items-center justify-center">
        불러오는 중...
      </div>
    );
  }

  if (state.error || !state.post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0b1630] to-black text-white flex flex-col items-center justify-center gap-4">
        <p className="text-lg">문제가 발생했습니다: {state.error ?? '글을 찾을 수 없습니다'}</p>
        <Link href="/" className="text-emerald-400 underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const { post } = state;
  const focusComment = (path?: string) => {
    setParentPath(path);
    setShowCommentForm(true);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#030712] via-[#0b1630] to-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.08),transparent_30%),radial-gradient(circle_at_60%_80%,rgba(236,72,153,0.06),transparent_30%)] blur-3xl" />
        <div className="relative flex items-center justify-between">
          <Link href="/" className="text-emerald-400 underline">
            ← 목록으로
          </Link>
          <p className="text-xs text-slate-400">우주 카드 뷰 · 댓글 체인</p>
        </div>

        <section className="relative bg-slate-900/80 border border-emerald-900/40 rounded-3xl p-6 shadow-[0_30px_120px_-60px_rgba(34,197,94,0.5)] overflow-hidden detail-card space-y-4">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-emerald-500/5 via-transparent to-sky-500/5" />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-sm font-semibold">
                {post.user?.username?.slice(0, 2)?.toUpperCase() ?? '익'}
              </div>
              <div>
                <p className="text-sm text-emerald-200">작성자 · {post.user?.username ?? '익명'}</p>
                <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            </div>

            <div className="relative space-y-3">
              {!showCommentForm && (
                <button
                  type="button"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold shadow"
                  onClick={() => focusComment(undefined)}
                >
                  댓글 작성
                </button>
              )}
              {showCommentForm && (
                <form ref={formRef} onSubmit={handleCommentSubmit} className="space-y-3">
                  {parentPath && (
                    <div className="flex items-center justify-between text-xs text-emerald-200">
                      <span>대댓글 작성 중 (parent path: {parentPath})</span>
                      <button
                        type="button"
                        className="underline"
                        onClick={() => {
                          setParentPath(undefined);
                          setShowCommentForm(false);
                        }}
                      >
                        취소
                      </button>
                    </div>
                  )}
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="댓글을 입력하세요"
                    className="w-full min-h-[120px] rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold shadow"
                      disabled={!commentContent.trim()}
                    >
                      등록
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold shadow"
                      onClick={() => {
                        setShowCommentForm(false);
                        setParentPath(undefined);
                      }}
                    >
                      닫기
                    </button>
                  </div>
                </form>
              )}
            </div>

            <PostDetail3DScene
              post={post}
              comments={tree}
              onReply={(path) => focusComment(path)}
              onDelete={handleDeleteComment}
              onVote={(value) => handleVote(value)}
              onRequestComment={() => focusComment(undefined)}
            />

            <div className="relative bg-slate-900/50 border border-slate-800 rounded-2xl p-4">
              <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
