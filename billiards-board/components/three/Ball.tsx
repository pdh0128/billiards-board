'use client';

import { useMemo } from 'react';
import { Ball as BallType } from '@/types';

interface TableSize {
  width: number;
  depth: number;
  height: number;
}

interface BallProps {
  ball: BallType;
  position: { x: number; y: number };
  radius: number;
  table: TableSize;
  boardSize: { width: number; height: number };
  isNew: boolean;
  toolMode: 'cue' | 'hand';
  onAimStart: (ball: BallType, clientX: number, clientY: number) => void;
  onReadBall: (ball: BallType) => void;
  isAiming?: boolean;
}

export function Ball({
  ball,
  position,
  radius,
  table,
  boardSize,
  isNew,
  toolMode,
  onAimStart,
  onReadBall,
  isAiming = false,
}: BallProps) {
  const pixelsPerUnit = useMemo(() => {
    if (!boardSize.width || !boardSize.height) return 0;
    return Math.min(boardSize.width / table.width, boardSize.height / table.depth);
  }, [boardSize.height, boardSize.width, table.depth, table.width]);

  const screen = useMemo(() => {
    if (boardSize.width === 0 || boardSize.height === 0) {
      return { x: 0, y: 0 };
    }
    return {
      x: ((position.x + table.width / 2) / table.width) * boardSize.width,
      y: ((position.y + table.depth / 2) / table.depth) * boardSize.height,
    };
  }, [boardSize.height, boardSize.width, position.x, position.y, table.depth, table.width]);

  const size = Math.max(radius * 2 * pixelsPerUnit, 10);

  const color = useMemo(() => {
    if (ball.type === 'article') return '#38bdf8';
    const depth = ball.depth ?? 0;
    const colors = ['#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];
    return colors[depth % colors.length];
  }, [ball.depth, ball.type]);

  const shadow = ball.type === 'article' ? '0 0 0 2px rgba(56,189,248,0.25)' : '0 0 0 2px rgba(148,163,184,0.2)';
  const label = `글 · ${ball.content.slice(0, 18)}${ball.content.length > 18 ? '…' : ''}`;
  const scale = isAiming ? 1.08 : 1;

  return (
    <div
      className="absolute rounded-full flex items-center justify-center select-none cursor-pointer transition-transform duration-150"
      style={{
        width: size,
        height: size,
        transform: `translate(${screen.x - size / 2}px, ${screen.y - size / 2}px) scale(${scale})`,
        background: color,
        boxShadow: `${shadow}, 0 10px 25px rgba(0,0,0,0.35)`,
        border: '2px solid rgba(255,255,255,0.18)',
      }}
      title={ball.content}
      onPointerDown={(e) => {
        e.stopPropagation();
        onAimStart(ball, e.clientX, e.clientY);
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (toolMode === 'hand') {
          onReadBall(ball);
        }
      }}
    >
      <span className="text-[11px] font-semibold text-slate-950 drop-shadow-sm px-3 text-center leading-tight">
        {label}
      </span>
      {isNew && (
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
