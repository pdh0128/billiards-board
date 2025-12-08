'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
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
  onReadThread: (data: { article: Ball; comments: Ball[]; focusId: string }) => void;
}

interface PhysicsBody {
  applyImpulse: (force: Vector3) => void;
  position: Vector3;
  velocity: Vector3;
  radius: number;
  meshRef: RefObject<Mesh>;
  ball: Ball;
  lastHitBy?: string;
}

export function BallManager({ table, toolMode, onReadThread }: Props) {
  const { balls, addBall, removeBall } = useArticles();
  const socket = useSocket();
  const [newBallIds, setNewBallIds] = useState<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const bodiesRef = useRef<Map<string, PhysicsBody>>(new Map());
  const ballsRef = useRef<Ball[]>([]);

  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  useEffect(() => {
    balls.forEach((b) => {
      const body = bodiesRef.current.get(b.id);
      if (body) {
        body.ball = b;
      }
    });
  }, [balls]);

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
        commentsCount: 0,
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
        commentsCount: 0,
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

  const commentCountByArticle = useMemo(() => {
    const map = new Map<string, number>();
    balls.forEach((b) => {
      if (b.type === 'comment' && b.articleId) {
        map.set(b.articleId, (map.get(b.articleId) ?? 0) + 1);
      }
    });
    return map;
  }, [balls]);

  const computeRadius = useCallback(
    (ball: Ball) => {
      if (ball.type === 'article') {
        const count = commentCountByArticle.get(ball.id) ?? 0;
        return ball.radius + count * 0.2;
      }
      return ball.radius;
    },
    [commentCountByArticle]
  );

  const registerController = useCallback(
    (id: string, body: PhysicsBody) => {
      bodiesRef.current.set(id, body);
      return () => bodiesRef.current.delete(id);
    },
    []
  );

  const handleBallHit = useCallback((ballId: string, force: Vector3) => {
    const body = bodiesRef.current.get(ballId);
    if (body) {
      body.applyImpulse(force);
    }
  }, []);

  const persistComment = useCallback(async (comment: Ball, parentPath?: string, hitterUserId?: string) => {
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: comment.content,
          articleId: comment.articleId,
          parentPath,
          position: comment.position,
          radius: comment.radius,
          userId: hitterUserId,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        const saved = data.data;
        return {
          ...comment,
          id: saved.id,
          path: saved.path,
          depth: saved.depth,
          createdAt: new Date(saved.createdAt),
        } as Ball;
      }
    } catch (error) {
      console.error('Failed to persist comment', error);
    }
    return comment;
  }, []);

  const handleReadBall = useCallback(
    (ball: Ball) => {
      const articleId = ball.type === 'article' ? ball.id : ball.articleId ?? ball.id;
      const article = ballsRef.current.find((b) => b.type === 'article' && b.id === articleId);
      if (!article) return;

      const comments = ballsRef.current
        .filter((b) => b.type === 'comment' && b.articleId === articleId)
        .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''));

      onReadThread({ article, comments, focusId: ball.id });
    },
    [onReadThread]
  );

  // 포켓 좌표 (Scene의 포켓과 동일)
  const pockets = [
    new Vector3(-table.width / 2 + 2, 0, -table.depth / 2 + 2),
    new Vector3(table.width / 2 - 2, 0, -table.depth / 2 + 2),
    new Vector3(-table.width / 2 + 2, 0, 0),
    new Vector3(table.width / 2 - 2, 0, 0),
    new Vector3(-table.width / 2 + 2, 0, table.depth / 2 - 2),
    new Vector3(table.width / 2 - 2, 0, table.depth / 2 - 2),
  ];

  const pocketRadius = 1.8;
  const spawnCommentFromPocket = useCallback(
    async (pocketed: PhysicsBody) => {
      const hitterId = pocketed.lastHitBy;
      if (!hitterId) return;
      const hitter = bodiesRef.current.get(hitterId);
      if (!hitter) return;

      const parent = hitter.ball;
      const newBall: Ball = {
        id: `${pocketed.ball.id}-comment-${Date.now()}`,
        type: 'comment',
        content: pocketed.ball.content,
        position: {
          x: hitter.position.x + (Math.random() - 0.5) * 4,
          y: parent.position.y,
          z: hitter.position.z + (Math.random() - 0.5) * 4,
        },
        radius: Math.max(pocketed.radius * 0.8, 0.5),
        commentsCount: 0,
        userId: parent.userId,
        createdAt: new Date(),
        isDeleted: false,
        articleId: parent.type === 'article' ? parent.id : parent.articleId ?? parent.id,
        path: undefined,
        depth: (parent.depth ?? 0) + 1,
      };

      const parentPath = parent.type === 'article' ? undefined : parent.path;
      const savedBall = await persistComment(newBall, parentPath, hitter.ball.userId);
      addBall(savedBall);
      setNewBallIds((prev) => {
        const updated = new Set(prev);
        updated.add(savedBall.id);
        return updated;
      });
    },
    [addBall, persistComment]
  );

  // 물리 시뮬레이션 루프
  useFrame((_, delta) => {
    const bodies = Array.from(bodiesRef.current.values());

    // 충돌 감지 (구-구)
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i];
        const b = bodies[j];
        const diff = new Vector3().subVectors(a.position, b.position);
        const dist = diff.length();
        const minDist = a.radius + b.radius;

        if (dist > 0 && dist < minDist) {
          const normal = diff.normalize();
          const overlap = minDist - dist;

          // 위치 보정
          a.position.addScaledVector(normal, overlap / 2);
          b.position.addScaledVector(normal, -overlap / 2);

          // 단순 탄성 충돌
          const relativeVelocity = new Vector3().subVectors(a.velocity, b.velocity);
          const speed = relativeVelocity.dot(normal);
          if (speed < 0) {
            const impulse = (2 * speed) / 2; // 동일 질량 가정
            a.velocity.sub(normal.clone().multiplyScalar(impulse));
            b.velocity.add(normal.clone().multiplyScalar(impulse));
          }

          a.lastHitBy = b.ball.id;
          b.lastHitBy = a.ball.id;
        }
      }
    }

    bodies.forEach((body) => {
      body.position.addScaledVector(body.velocity, delta);
      body.velocity.multiplyScalar(0.985);

      // 경계 충돌 (XZ)
      const clamp = (coord: 'x' | 'z', limit: number) => {
        if (body.position[coord] > limit) {
          body.position[coord] = limit;
          body.velocity[coord] *= -0.7;
        } else if (body.position[coord] < -limit) {
          body.position[coord] = -limit;
          body.velocity[coord] *= -0.7;
        }
      };

      clamp('x', table.width / 2 - body.radius);
      clamp('z', table.depth / 2 - body.radius);

      // 테이블 표면에 고정
      body.position.y = body.ball.position.y;
      body.velocity.y = 0;

      // 포켓 체크
      const inPocket = pockets.some(
        (pocket) => pocket.distanceTo(body.position) < pocketRadius
      );

      if (inPocket) {
        // 포켓에 빠진 공은 제거
        spawnCommentFromPocket(body);
        bodiesRef.current.delete(body.ball.id);
        removeBall(body.ball.id);
        return;
      }

      if (body.meshRef.current) {
        body.meshRef.current.position.copy(body.position);
        // radius를 댓글 수에 따라 조정
        const r = computeRadius(body.ball);
        body.radius = r;
        body.meshRef.current.scale.setScalar(r / body.ball.radius);
      }

      // ball 데이터의 위치도 갱신 (댓글 생성 시 활용)
      body.ball.position = {
        x: body.position.x,
        y: body.position.y,
        z: body.position.z,
      };
    });
  });

  return (
    <>
      {balls.map((ball) => {
        const radius = computeRadius(ball);
        return (
          <BallComponent
            key={ball.id}
            ball={ball}
            radius={radius}
            isNew={newBallIds.has(ball.id)}
            registerController={registerController}
            toolMode={toolMode}
            onReadBall={handleReadBall}
          />
        );
      })}
      {toolMode === 'cue' && <CueStick onBallHit={handleBallHit} />}
    </>
  );
}
