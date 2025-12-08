'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Vector3 } from 'three';
import { Ball as BallComponent } from './Ball';
import { CueStick } from './CueStick';
import { useArticles } from '@/hooks/useArticles';
import { useSocket } from '@/hooks/useSocket';
import { Ball } from '@/types';

interface TableSize {
  width: number;
  depth: number;
  height: number;
}

type ToolMode = 'cue' | 'hand';

interface Props {
  table: TableSize;
  toolMode: ToolMode;
  onReadBall: (ball: Ball) => void;
}

export function BallManager({ table, toolMode, onReadBall }: Props) {
  const { balls, addBall, removeBall } = useArticles();
  const socket = useSocket();
  const [newBallIds, setNewBallIds] = useState<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const controllersRef = useRef<Map<string, (force: Vector3) => void>>(new Map());

  useEffect(() => {
    if (!socket) return;

    // 새 글 생성 이벤트
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

      addBall(newBall);

      // 새 공 표시
      setNewBallIds((prev) => new Set(prev).add(article.id));

      // 3초 후 새 공 표시 제거
      setTimeout(() => {
        setNewBallIds((prev) => {
          const updated = new Set(prev);
          updated.delete(article.id);
          return updated;
        });
      }, 3000);
    });

    // 새 댓글 생성 이벤트
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

      addBall(newBall);

      // 새 공 표시
      setNewBallIds((prev) => new Set(prev).add(comment.id));

      setTimeout(() => {
        setNewBallIds((prev) => {
          const updated = new Set(prev);
          updated.delete(comment.id);
          return updated;
        });
      }, 3000);
    });

    // 삭제 이벤트
    socket.on('deleteArticle', (data: { id: string }) => {
      removeBall(data.id);
    });

    socket.on('deleteComment', (data: { id: string }) => {
      removeBall(data.id);
    });

    return () => {
      socket.off('createArticle');
      socket.off('createComment');
      socket.off('deleteArticle');
      socket.off('deleteComment');
    };
  }, [socket, addBall, removeBall]);

  // 초기 로딩 시에는 애니메이션 없음
  useEffect(() => {
    if (balls.length > 0 && initialLoadRef.current) {
      initialLoadRef.current = false;
    }
  }, [balls]);

  const registerController = useCallback((id: string, applyImpulse: (force: Vector3) => void) => {
    controllersRef.current.set(id, applyImpulse);
    return () => controllersRef.current.delete(id);
  }, []);

  const handleBallHit = useCallback((ballId: string, force: Vector3) => {
    const applyImpulse = controllersRef.current.get(ballId);
    if (applyImpulse) {
      applyImpulse(force);
    }
  }, []);

  return (
    <>
      {balls.map((ball) => (
        <BallComponent
          key={ball.id}
          ball={ball}
      isNew={newBallIds.has(ball.id)}
      table={table}
      registerController={registerController}
      toolMode={toolMode}
      onReadBall={onReadBall}
    />
  ))}
      {toolMode === 'cue' && <CueStick onBallHit={handleBallHit} />}
    </>
  );
}
