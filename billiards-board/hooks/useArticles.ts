'use client';

import { useState, useEffect, useCallback } from 'react';
import { Ball } from '@/types';

export function useArticles() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      const articleRes = await fetch('/api/article');
      const articleData = await articleRes.json();

      if (!articleData.success) {
        throw new Error(articleData.error || 'Failed to fetch articles');
      }

      // Article을 Ball 타입으로 변환
      const articles: Ball[] = articleData.data.articles.map((article: any) => ({
        id: article.id,
        type: 'article' as const,
        content: article.content,
        position: {
          x: article.positionX,
          y: article.positionY,
          z: article.positionZ,
        },
        radius: article.radius,
        commentsCount: article._count?.comments ?? 0,
        userId: article.userId,
        createdAt: new Date(article.createdAt),
        isDeleted: article.isDeleted,
      }));

      // 댓글 불러오기
      const commentRes = await fetch('/api/comment');
      const commentData = await commentRes.json();
      if (!commentData.success) {
        throw new Error(commentData.error || 'Failed to fetch comments');
      }

      const comments: Ball[] = commentData.data.comments.map((comment: any) => ({
        id: comment.id,
        type: 'comment' as const,
        content: comment.content,
        position: {
          x: comment.positionX,
          y: comment.positionY,
          z: comment.positionZ,
        },
        radius: comment.radius,
        userId: comment.userId,
        createdAt: new Date(comment.createdAt),
        isDeleted: comment.isDeleted,
        articleId: comment.articleId,
        path: comment.path,
        depth: comment.depth,
      }));

      setBalls([...articles, ...comments]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
      console.error('Failed to fetch articles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로딩
  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // 새 공 추가 (WebSocket이나 폼 제출 후)
  const addBall = useCallback((ball: Ball) => {
    setBalls((prev) => [...prev, { commentsCount: 0, ...ball }]);
  }, []);

  // 공 제거
  const removeBall = useCallback((id: string) => {
    setBalls((prev) => prev.filter((ball) => ball.id !== id));
  }, []);

  // 새로고침
  const refresh = useCallback(() => {
    fetchArticles();
  }, [fetchArticles]);

  const updateBall = useCallback((id: string, updater: (ball: Ball) => Ball) => {
    setBalls((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  }, []);

  return {
    balls,
    isLoading,
    error,
    addBall,
    removeBall,
    refresh,
    updateBall,
  };
}
