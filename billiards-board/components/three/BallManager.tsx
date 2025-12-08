'use client';

import { useEffect, useState } from 'react';
import { Ball as BallComponent } from './Ball';
import { Ball } from '@/types';
import { useSocket } from '@/hooks/useSocket';

export function BallManager() {
  const [balls, setBalls] = useState<Ball[]>([]);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // 초기 상태 요청
    socket.emit('requestSync');

    // 상태 동기화
    socket.on('syncState', (data: { articles: any[]; comments: any[] }) => {
      const newBalls: Ball[] = [
        ...data.articles.map((article) => ({
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
        })),
        ...data.comments.map((comment) => ({
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
        })),
      ];

      setBalls(newBalls.filter((b) => !b.isDeleted));
    });

    // 새 글 생성
    socket.on('createArticle', (article: any) => {
      const newBall: Ball = {
        id: article.id,
        type: 'article',
        content: article.content,
        position: {
          x: article.positionX,
          y: article.positionY,
          z: article.positionZ,
        },
        radius: article.radius,
        userId: article.userId,
        createdAt: new Date(article.createdAt),
        isDeleted: false,
      };
      setBalls((prev) => [...prev, newBall]);
    });

    // 새 댓글 생성
    socket.on('createComment', (comment: any) => {
      const newBall: Ball = {
        id: comment.id,
        type: 'comment',
        content: comment.content,
        position: {
          x: comment.positionX,
          y: comment.positionY,
          z: comment.positionZ,
        },
        radius: comment.radius,
        userId: comment.userId,
        createdAt: new Date(comment.createdAt),
        isDeleted: false,
        articleId: comment.articleId,
        path: comment.path,
        depth: comment.depth,
      };
      setBalls((prev) => [...prev, newBall]);
    });

    // 삭제 이벤트
    socket.on('deleteArticle', (data: { id: string }) => {
      setBalls((prev) => prev.filter((b) => b.id !== data.id));
    });

    socket.on('deleteComment', (data: { id: string }) => {
      setBalls((prev) => prev.filter((b) => b.id !== data.id));
    });

    return () => {
      socket.off('syncState');
      socket.off('createArticle');
      socket.off('createComment');
      socket.off('deleteArticle');
      socket.off('deleteComment');
    };
  }, [socket]);

  return (
    <>
      {balls.map((ball) => (
        <BallComponent key={ball.id} ball={ball} />
      ))}
    </>
  );
}
