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
      const response = await fetch('/api/article');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch articles');
      }

      // Article을 Ball 타입으로 변환
      const newBalls: Ball[] = data.data.articles.map((article: any) => ({
        id: article.id,
        type: 'article' as const,
        content: article.content,
        position: {
          x: article.positionX,
          y: article.positionY,
          z: article.positionZ,
        },
        radius: article.radius,
        userId: article.userId,
        createdAt: new Date(article.createdAt),
        isDeleted: article.isDeleted,
      }));

      setBalls(newBalls);
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
    setBalls((prev) => [...prev, ball]);
  }, []);

  // 공 제거
  const removeBall = useCallback((id: string) => {
    setBalls((prev) => prev.filter((ball) => ball.id !== id));
  }, []);

  // 새로고침
  const refresh = useCallback(() => {
    fetchArticles();
  }, [fetchArticles]);

  return {
    balls,
    isLoading,
    error,
    addBall,
    removeBall,
    refresh,
  };
}
