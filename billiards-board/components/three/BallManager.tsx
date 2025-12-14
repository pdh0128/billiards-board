'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ball as BallType } from '@/types';
import { useArticles } from '@/hooks/useArticles';
import { useSocket } from '@/hooks/useSocket';
import { Ball } from './Ball';
import { authHeaders, getAuthToken, getUserIdFromToken } from '@/utils/client-auth';
import { useGame } from '@/contexts/game-context';
import { useAuth } from '@/contexts/useAuth';

interface TableSize {
  width: number;
  depth: number;
  height: number;
}

type ToolMode = 'cue' | 'hand';

interface Props {
  table: TableSize;
  toolMode: ToolMode;
  onReadThread: (data: { article: BallType; comments: BallType[]; focusId: string }) => void;
}

interface PhysicsBody {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  radius: number;
  ball: BallType;
  lastHitBy?: string;
}

interface AimState {
  ballId: string;
  origin: { x: number; y: number };
  pointer: { x: number; y: number };
}

interface RenderBall {
  ball: BallType;
  position: { x: number; y: number };
  radius: number;
  isNew: boolean;
}

interface ArticlePayload {
  id: string;
  content: string;
  positionX: number;
  positionY: number;
  positionZ: number;
  radius: number;
  userId: string;
  createdAt: string;
}

interface CommentPayload extends ArticlePayload {
  articleId: string;
  path: string;
  depth: number;
}

interface PositionUpdate {
  id: string;
  type: 'article' | 'comment';
  position: { x: number; y: number; z: number };
}

export function BallManager({ table, toolMode, onReadThread }: Props) {
  const { balls, addBall, removeBall, updateBall } = useArticles();
  const socket = useSocket();
  const { myPlayer, syncPlayers } = useGame();
  const myUserId = getUserIdFromToken();
  const boardRef = useRef<HTMLDivElement>(null);
  const bodiesRef = useRef<Map<string, PhysicsBody>>(new Map());
  const ballsRef = useRef<BallType[]>([]);
  const pendingSavesRef = useRef<
    Map<string, { id: string; type: 'article' | 'comment'; position: { x: number; y: number } }>
  >(new Map());
  const lastPersistedRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const animationRef = useRef<number>();
  const [frame, setFrame] = useState(0);
  const [aimState, setAimState] = useState<AimState | null>(null);
  const [newBallIds, setNewBallIds] = useState<Set<string>>(new Set());
  const [renderBalls, setRenderBalls] = useState<RenderBall[]>([]);
  const [aimedBallId, setAimedBallId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [pendingTurnSave, setPendingTurnSave] = useState(false);
  const [strikeProgress, setStrikeProgress] = useState(0);
  const strikeRafRef = useRef<number>();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [boardSize, setBoardSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    ballsRef.current = balls;
  }, [balls]);

  const pockets = useMemo(
    () => [
      { x: -table.width / 2 + 2, y: -table.depth / 2 + 2 },
      { x: table.width / 2 - 2, y: -table.depth / 2 + 2 },
      { x: -table.width / 2 + 2, y: 0 },
      { x: table.width / 2 - 2, y: 0 },
      { x: -table.width / 2 + 2, y: table.depth / 2 - 2 },
      { x: table.width / 2 - 2, y: table.depth / 2 - 2 },
    ],
    [table.depth, table.width]
  );
  const pocketRadius = 1.8;

  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('[socket] connected', socket.id);
      socket.emit('requestPlayers');
    });

    socket.on('createArticle', (article: ArticlePayload) => {
      const newBall: BallType = {
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
      setNewBallIds((prev) => new Set(prev).add(article.id));
      setTimeout(() => {
        setNewBallIds((prev) => {
          const updated = new Set(prev);
          updated.delete(article.id);
          return updated;
        });
      }, 3000);
    });

    socket.on('createComment', (comment: CommentPayload) => {
      const newBall: BallType = {
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
      setNewBallIds((prev) => new Set(prev).add(comment.id));
      setTimeout(() => {
        setNewBallIds((prev) => {
          const updated = new Set(prev);
          updated.delete(comment.id);
          return updated;
        });
      }, 3000);
    });

    socket.on('deleteArticle', (data: { id: string }) => {
      removeBall(data.id);
    });

    socket.on('deleteComment', (data: { id: string }) => {
      removeBall(data.id);
    });

    socket.on('syncPlayers', (players: any[]) => {
      console.log('[socket] syncPlayers', players);
      syncPlayers(players);
    });

    socket.on('updatePosition', (updates: PositionUpdate[]) => {
      updates.forEach((u) => {
        if (u.type !== 'article') return;
        updateBall(u.id, (prev) => ({
          ...prev,
          position: { x: u.position.x, y: u.position.y, z: u.position.z },
        }));
        const body = bodiesRef.current.get(u.id);
        if (body) {
          body.position.x = u.position.x;
          body.position.y = u.position.z;
          body.velocity.x = 0;
          body.velocity.y = 0;
        }
      });
      setRenderBalls(
        Array.from(bodiesRef.current.values()).map((body) => ({
          ball: body.ball,
          position: { ...body.position },
          radius: body.radius,
          isNew: newBallIds.has(body.ball.id),
        }))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('createArticle');
      socket.off('createComment');
      socket.off('deleteArticle');
      socket.off('deleteComment');
      socket.off('updatePosition');
      socket.off('syncPlayers');
    };
  }, [socket, addBall, removeBall, updateBall, syncPlayers]);

  useEffect(() => {
    if (!socket || !myPlayer) return;
    const joinPayload = { ...myPlayer, socketId: socket.id };
    socket.emit('join', joinPayload);
    socket.emit('requestPlayers');
  }, [socket, myPlayer]);

  // 주기적으로 플레이어 목록 요청 (네트워크/연결 문제 대비)
  useEffect(() => {
    if (!socket) return;
    const interval = setInterval(() => {
      socket.emit('requestPlayers');
    }, 5000);
    return () => clearInterval(interval);
  }, [socket]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const rect = entries[0].contentRect;
      setBoardSize({ width: rect.width, height: rect.height });
    });
    if (boardRef.current) {
      observer.observe(boardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const commentCountByArticle = useMemo(() => {
    const map = new Map<string, number>();
    balls.forEach((b) => {
      if (b.type === 'comment' && b.articleId && !b.isDeleted) {
        map.set(b.articleId, (map.get(b.articleId) ?? 0) + 1);
      }
    });
    return map;
  }, [balls]);

  const computeRadius = useCallback(
    (ball: BallType) => {
      if (ball.type === 'article') {
        const count = commentCountByArticle.get(ball.id) ?? 0;
        return ball.radius + count * 0.2;
      }
      return ball.radius;
    },
    [commentCountByArticle]
  );

  useEffect(() => {
    const bodies = bodiesRef.current;
    const ballIds = new Set(balls.map((b) => b.id));

    balls.forEach((ball) => {
      if (ball.type === 'comment') {
        return; // 댓글은 보드에 공으로 렌더하지 않음
      }
      const radius = computeRadius(ball);
      const existing = bodies.get(ball.id);
      if (existing) {
        existing.ball = ball;
        existing.radius = radius;
        existing.position = { x: ball.position.x, y: ball.position.z };
      } else {
        bodies.set(ball.id, {
          position: { x: ball.position.x, y: ball.position.z },
          velocity: { x: 0, y: 0 },
          radius,
          ball,
        });
      }
    });

    Array.from(bodies.keys()).forEach((id) => {
      if (!ballIds.has(id)) {
        bodies.delete(id);
      }
    });
  }, [balls, computeRadius]);

  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const xNorm = (clientX - rect.left) / rect.width - 0.5;
      const yNorm = (clientY - rect.top) / rect.height - 0.5;
      return {
        x: xNorm * table.width,
        y: yNorm * table.depth,
      };
    },
    [table.depth, table.width]
  );

  const worldToScreen = useCallback(
    (pos: { x: number; y: number }) => {
      if (boardSize.width === 0 || boardSize.height === 0) {
        return { x: 0, y: 0 };
      }
      return {
        x: ((pos.x + table.width / 2) / table.width) * boardSize.width,
        y: ((pos.y + table.depth / 2) / table.depth) * boardSize.height,
      };
    },
    [boardSize.height, boardSize.width, table.depth, table.width]
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      if (pendingSavesRef.current.size === 0) return;
      const updates = Array.from(pendingSavesRef.current.values()).map((u) => ({
        id: u.id,
        type: u.type,
        position: { x: u.position.x, y: 0, z: u.position.y },
      }));
      pendingSavesRef.current.clear();

      try {
        await fetch('/api/ball/position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ updates }),
        });
      } catch (error) {
        console.error('Failed to persist ball positions', error);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  // 주기적으로 모든 글 위치를 서버에 저장 (세션 재입장 시 위치 유지)
  useEffect(() => {
    const interval = setInterval(async () => {
      const bodies = Array.from(bodiesRef.current.values()).filter((b) => b.ball.type === 'article');
      if (bodies.length === 0) return;
      const updates = bodies.map((b) => ({
        id: b.ball.id,
        type: 'article' as const,
        position: { x: b.position.x, y: 0, z: b.position.y },
      }));
      try {
        await fetch('/api/ball/position', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ updates }),
        });
      } catch (error) {
        console.error('Failed to persist ball positions (periodic)', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getSubtreeComments = useCallback(
    (root: BallType) => {
      if (root.type === 'article') {
        return ballsRef.current
          .filter((b) => b.type === 'comment' && b.articleId === root.id)
          .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''));
      }
      if (!root.path) return [];
      return ballsRef.current
        .filter(
          (b) =>
            b.type === 'comment' &&
            b.articleId === root.articleId &&
            b.path &&
            root.path &&
            b.path.startsWith(root.path)
        )
        .sort((a, b) => (a.path ?? '').localeCompare(b.path ?? ''));
    },
    []
  );

  const persistComment = useCallback(async (comment: BallType, parentPath?: string, hitterUserId?: string) => {
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
        } as BallType;
      }
    } catch (error) {
      console.error('Failed to persist comment', error);
    }
    return comment;
  }, []);

  const handleReadBall = useCallback(
    (ball: BallType) => {
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

  const spawnCommentFromPocket = useCallback(
    async (pocketed: PhysicsBody) => {
      const hitterId = pocketed.lastHitBy;
      if (!hitterId) return;
      const hitter = bodiesRef.current.get(hitterId);
      if (!hitter) return;

      const parent = hitter.ball;
      const targetArticleId = parent.type === 'article' ? parent.id : parent.articleId ?? parent.id;
      // 댓글 전체를 흡수: 기존 댓글들을 타겟 글의 댓글로 복사
      const subtree = getSubtreeComments(pocketed.ball);
      const pathMap = new Map<string, string>();

      for (const comment of subtree) {
        const oldParentPath = comment.path
          ? comment.path.split('.').slice(0, -1).join('.')
          : undefined;
        const parentPath = oldParentPath ? pathMap.get(oldParentPath) : undefined;

        const clone: BallType = {
          ...comment,
          id: `${comment.id}-moved-${Date.now()}`,
          articleId: targetArticleId,
          path: undefined,
          createdAt: new Date(),
        };

        const saved = await persistComment(clone, parentPath, hitter.ball.userId);
        if (comment.path) {
          pathMap.set(comment.path, saved.path ?? '');
        }
        addBall(saved);
        setNewBallIds((prev) => {
          const updated = new Set(prev);
          updated.add(saved.id);
          return updated;
        });
      }

      const removeIds =
        pocketed.ball.type === 'article'
          ? subtree.map((c) => c.id)
          : subtree.map((c) => c.id).concat(pocketed.ball.id);

      removeIds.forEach((id) => {
        bodiesRef.current.delete(id);
        removeBall(id);
      });
    },
    [addBall, getSubtreeComments, persistComment, removeBall]
  );

  const stepPhysics = useCallback(
    (delta: number) => {
      const bodies = Array.from(bodiesRef.current.values());

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];
          const dx = a.position.x - b.position.x;
          const dy = a.position.y - b.position.y;
          const dist = Math.hypot(dx, dy);
          const minDist = a.radius + b.radius;

          if (dist > 0 && dist < minDist) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist;

            a.position.x += (nx * overlap) / 2;
            a.position.y += (ny * overlap) / 2;
            b.position.x -= (nx * overlap) / 2;
            b.position.y -= (ny * overlap) / 2;

            const relVx = a.velocity.x - b.velocity.x;
            const relVy = a.velocity.y - b.velocity.y;
            const speed = relVx * nx + relVy * ny;
            if (speed < 0) {
              const impulse = (2 * speed) / 2;
              a.velocity.x -= nx * impulse;
              a.velocity.y -= ny * impulse;
              b.velocity.x += nx * impulse;
              b.velocity.y += ny * impulse;
            }

            a.lastHitBy = b.ball.id;
            b.lastHitBy = a.ball.id;
          }
        }
      }

      bodies.forEach((body) => {
        body.position.x += body.velocity.x * delta;
        body.position.y += body.velocity.y * delta;
        body.velocity.x *= 0.985;
        body.velocity.y *= 0.985;

        const clampCoord = (coord: 'x' | 'y', limit: number) => {
          if (body.position[coord] > limit) {
            body.position[coord] = limit;
            body.velocity[coord] *= -0.7;
          } else if (body.position[coord] < -limit) {
            body.position[coord] = -limit;
            body.velocity[coord] *= -0.7;
          }
        };

        clampCoord('x', table.width / 2 - body.radius);
        clampCoord('y', table.depth / 2 - body.radius);

        const inPocket = pockets.some((pocket) => {
          const dx = pocket.x - body.position.x;
          const dy = pocket.y - body.position.y;
          return Math.hypot(dx, dy) < pocketRadius;
        });

        if (inPocket) {
          spawnCommentFromPocket(body);
          bodiesRef.current.delete(body.ball.id);
          removeBall(body.ball.id);
          return;
        }

        const speedSq = body.velocity.x * body.velocity.x + body.velocity.y * body.velocity.y;
        const last = lastPersistedRef.current.get(body.ball.id);
        if (speedSq < 0.0025) {
          if (!last || Math.hypot(body.position.x - last.x, body.position.y - last.y) > 0.05) {
            pendingSavesRef.current.set(body.ball.id, {
              id: body.ball.id,
              type: body.ball.type,
              position: { x: body.position.x, y: body.position.y },
            });
            lastPersistedRef.current.set(body.ball.id, {
              x: body.position.x,
              y: body.position.y,
            });
          }
        }

        body.ball.position = {
          x: body.position.x,
          y: 0,
          z: body.position.y,
        };

        const radius = computeRadius(body.ball);
        body.radius = radius;
      });
    },
    [computeRadius, pockets, pocketRadius, removeBall, spawnCommentFromPocket, table.depth, table.width]
  );

  useEffect(() => {
    if (!isLocked) return;
    const timer = setInterval(() => {
      const bodies = Array.from(bodiesRef.current.values());
      const moving = bodies.some(
        (b) =>
          b.ball.type === 'article' &&
          b.velocity.x * b.velocity.x + b.velocity.y * b.velocity.y > 0.0005
      );
      if (!moving) {
        setIsLocked(false);
        setPendingTurnSave(true);
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [isLocked]);

  // 턴 종료 시 위치 일괄 저장
  useEffect(() => {
    if (!pendingTurnSave) return;
    const bodies = Array.from(bodiesRef.current.values()).filter((b) => b.ball.type === 'article');
    if (bodies.length === 0) {
      setPendingTurnSave(false);
      return;
    }
    const updates = bodies.map((b) => ({
      id: b.ball.id,
      type: 'article' as const,
      position: { x: b.position.x, y: 0, z: b.position.y },
    }));
    fetch('/api/ball/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ updates }),
    })
      .catch((err) => console.error('Failed to persist positions (turn end)', err))
      .finally(() => setPendingTurnSave(false));
  }, [pendingTurnSave]);

  useEffect(() => {
    let last = performance.now();

    const loop = (time: number) => {
      const delta = Math.max((time - last) / 1000, 0);
      last = time;
      stepPhysics(delta);
      setFrame((f) => f + 1);
      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [stepPhysics]);

  useEffect(() => {
    return () => {
      if (strikeRafRef.current) cancelAnimationFrame(strikeRafRef.current);
    };
  }, []);

  const handleAimStart = useCallback(
    (ball: BallType, clientX: number, clientY: number) => {
      if (toolMode !== 'cue' || ball.type !== 'article' || isLocked) return;
      if (myUserId && ball.userId && ball.userId !== myUserId) return;
      const pointer = clientToWorld(clientX, clientY);
      const body = bodiesRef.current.get(ball.id);
      if (!pointer || !body) return;
      setAimState({
        ballId: ball.id,
        origin: { ...body.position },
        pointer,
      });
      setAimedBallId(ball.id);
    },
    [clientToWorld, toolMode, isLocked, myUserId]
  );

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!aimState) return;
      const pointer = clientToWorld(event.clientX, event.clientY);
      if (pointer) {
        setAimState((prev) => (prev ? { ...prev, pointer } : prev));
      }
    };

    const handleUp = (event: PointerEvent) => {
      if (!aimState) return;
      const body = bodiesRef.current.get(aimState.ballId);
      if (!body) {
        setAimState(null);
        setAimedBallId(null);
        return;
      }

      const pointer = clientToWorld(event.clientX, event.clientY) ?? aimState.pointer;
      const dragX = body.position.x - pointer.x;
      const dragY = body.position.y - pointer.y;
      const dist = Math.hypot(dragX, dragY);
      if (dist > 0.05) {
        const maxPull = 18;
        const clamped = Math.min(dist, maxPull);
        const strength = (clamped / maxPull) * 16; // 더 많이 당길수록 강하게
        const nx = dragX / dist;
        const ny = dragY / dist;
        // 드래그한 반대 방향(공 -> 드래그 시작점)으로 힘을 가해 앞으로 나가게 함
        body.velocity.x += nx * strength;
        body.velocity.y += ny * strength;
        setIsLocked(true);
        // 큐 밀림 애니메이션 및 소리
        const start = performance.now();
        const duration = 140;
        if (strikeRafRef.current) cancelAnimationFrame(strikeRafRef.current);
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setStrikeProgress(progress);
          if (progress < 1) {
            strikeRafRef.current = requestAnimationFrame(tick);
          } else {
            setStrikeProgress(0);
          }
        };
        strikeRafRef.current = requestAnimationFrame(tick);
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext();
          }
          const ctx = audioCtxRef.current;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = 420;
          gain.gain.setValueAtTime(0.14, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
          osc.connect(gain).connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.12);
        } catch (err) {
          console.warn('Audio init failed', err);
        }
      }
      setAimState(null);
      setAimedBallId(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [aimState, clientToWorld]);

  useEffect(() => {
    setRenderBalls(
      Array.from(bodiesRef.current.values()).map((body) => ({
        ball: body.ball,
        position: { ...body.position },
        radius: body.radius,
        isNew: newBallIds.has(body.ball.id),
      }))
    );
  }, [frame, newBallIds]);

  const aimLine = aimState
    ? (() => {
        const start = worldToScreen(aimState.origin);
        const end = worldToScreen(aimState.pointer);
        return { start, end };
      })()
    : null;

  const unit =
    boardSize.width && boardSize.height
      ? Math.min(boardSize.width / (table.width || 1), boardSize.height / (table.depth || 1))
      : 0;

  const pullInfo = aimState
    ? (() => {
        const dx = aimState.pointer.x - aimState.origin.x;
        const dy = aimState.pointer.y - aimState.origin.y;
        const dist = Math.hypot(dx, dy);
        const pct = Math.min(Math.round((Math.min(dist, 18) / 18) * 100), 100);
        return { pct, dist };
      })()
    : null;

  const cueVisual = aimLine
    ? (() => {
        if (!aimState) return null;
        const dirX = aimState.origin.x - aimState.pointer.x;
        const dirY = aimState.origin.y - aimState.pointer.y;
        const len = Math.hypot(dirX, dirY);
        if (len < 1) return null;
        const nx = dirX / len; // pointer -> ball 방향 (공이 나아갈 방향)
        const ny = dirY / len;
        const body = bodiesRef.current.get(aimState.ballId);
        const ballRadiusPx = body ? body.radius * unit : 12;
        const cueLength = 220;
        const pullScale = Math.min(len, 18);
        const offsetBase = ballRadiusPx + 24 + pullScale * 4; // 더 멀리 당길수록 큐를 더 뒤로 이동
        const forwardTravel = pullScale * 6;
        const eased = 1 - Math.pow(1 - strikeProgress, 2); // 빠르게 치고 천천히 멈춤
        const animatedOffset = offsetBase - forwardTravel * eased;
        const centerX = aimLine.start.x - nx * (animatedOffset + cueLength / 2);
        const centerY = aimLine.start.y - ny * (animatedOffset + cueLength / 2);
        const angleDeg = (Math.atan2(ny, nx) * 180) / Math.PI;
        return { x: centerX, y: centerY, angle: angleDeg, length: cueLength };
      })()
    : null;

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div
        ref={boardRef}
        className="relative w-full max-w-6xl aspect-[5/3] bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 rounded-3xl border-4 border-amber-900 shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-4 border-2 border-amber-800 rounded-2xl pointer-events-none" />
        {pockets.map((pocket, idx) => {
          const pos = worldToScreen(pocket);
          const unit = Math.min(
            boardSize.width / (table.width || 1),
            boardSize.height / (table.depth || 1)
          );
          const radiusPx = pocketRadius * 2 * unit;
          return (
            <div
              key={idx}
              className="absolute bg-black/80 shadow-inner rounded-full"
              style={{
                width: radiusPx,
                height: radiusPx,
                transform: `translate(${pos.x - radiusPx / 2}px, ${pos.y - radiusPx / 2}px)`,
              }}
            />
          );
        })}

        {aimLine && (
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            <defs>
              <linearGradient id="aim" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <line
              x1={aimLine.start.x}
              y1={aimLine.start.y}
              x2={aimLine.end.x}
              y2={aimLine.end.y}
              stroke="url(#aim)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray="8 8"
            />
          </svg>
        )}

        {cueVisual && (
          <div
            className="absolute origin-center pointer-events-none"
            style={{
              width: cueVisual.length,
              height: 14,
              left: cueVisual.x - cueVisual.length / 2,
              top: cueVisual.y - 7,
              transform: `rotate(${cueVisual.angle}deg)`,
            }}
          >
            <div className="w-full h-full rounded-full shadow-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-amber-800 via-amber-500 to-amber-200" />
            </div>
            <div className="absolute right-0 top-0 h-full w-4 bg-cyan-200 rounded-r-full shadow-inner" />
            {pullInfo && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[11px] font-semibold text-amber-200 bg-black/60 px-2 py-1 rounded-lg border border-white/10">
                Power {pullInfo.pct}%
              </div>
            )}
          </div>
        )}

        {renderBalls.map((renderBall) => (
          <Ball
            key={renderBall.ball.id}
            ball={renderBall.ball}
            position={renderBall.position}
            radius={renderBall.radius}
            table={table}
            boardSize={boardSize}
            isNew={renderBall.isNew}
            toolMode={toolMode}
            onAimStart={handleAimStart}
            onReadBall={handleReadBall}
            isAiming={aimedBallId === renderBall.ball.id}
          />
        ))}

        {renderBalls.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-slate-200/80 space-y-2 bg-black/40 rounded-2xl px-6 py-4 border border-white/10 backdrop-blur">
              <div className="text-sm font-semibold">아직 공이 없습니다</div>
              <div className="text-xs text-slate-300">
                + 버튼으로 첫 글을 만들어 큐로 굴려보세요. 포켓에 빠지면 댓글로 복사됩니다.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
