'use client';

import { useState } from 'react';
import { BallManager } from './BallManager';
import { ToolSelector } from '../game/tool-selector';
import { Ball } from '@/types';

export function Scene() {
  const TABLE_WIDTH = 80;
  const TABLE_DEPTH = 48;
  const TABLE_HEIGHT = 1;
  const [toolMode, setToolMode] = useState<'cue' | 'hand'>('cue');
  const [selectedThread, setSelectedThread] = useState<{
    article: Ball;
    comments: Ball[];
    focusId: string;
  } | null>(null);

  const handleToolChange = (mode: 'cue' | 'hand') => {
    setToolMode(mode);
    if (mode !== 'hand') {
      setSelectedThread(null);
    }
  };

  return (
    <div className="w-full h-screen absolute inset-0 bg-gradient-to-br from-slate-950 via-emerald-950/60 to-slate-900">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(251,191,36,0.12),transparent_30%)]" />

      <div className="absolute top-4 left-4 z-50 space-y-2 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 text-slate-950 font-black grid place-items-center shadow-lg">
            🎱
          </div>
          <div>
            <div className="text-lg font-semibold text-white">Billiards Board</div>
            <div className="text-sm text-slate-300">글은 파란 공, 최상위 댓글은 초록 공으로 떠다니는 소셜 보드</div>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs text-slate-100 pointer-events-auto">
          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-semibold">큐</span>
          드래그로 힘 조절 → 포켓에 빠지면 댓글로 복사됩니다
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-semibold">손</span>
          공 클릭으로 글·댓글 내용 읽기
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-50 text-xs text-slate-200 space-y-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-cyan-400" />
          <span>새 글</span>
          <span className="h-3 w-3 rounded-full bg-emerald-400 ml-3" />
          <span>최상위 댓글 (대댓글 수에 따라 커집니다)</span>
        </div>
        <div className="text-slate-400">게시판은 2D 평면으로 단순화되어 누구나 바로 플레이 가능</div>
      </div>

      <ToolSelector mode={toolMode} onChange={handleToolChange} />

      {selectedThread && toolMode === 'hand' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%]">
          <div className="bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-gray-400">
                글 + 댓글 미리보기
              </div>
              <button
                className="text-gray-400 hover:text-white text-sm"
                onClick={() => setSelectedThread(null)}
              >
                닫기
              </button>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl bg-gray-900/90 border border-gray-800 px-4 py-3 text-white shadow-inner">
                <div className="text-[11px] text-gray-400 mb-1">최상위 글</div>
                <div className="leading-relaxed whitespace-pre-wrap break-words text-sm">
                  {selectedThread.article.content}
                </div>
              </div>
              {selectedThread.comments.length > 0 ? (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedThread.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-lg px-4 py-3 border text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        c.id === selectedThread.focusId
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-50'
                          : 'bg-gray-900/70 border-gray-800 text-gray-100'
                      }`}
                      style={{ marginLeft: Math.min((c.depth ?? 0) * 14, 80) }}
                    >
                      <div className="text-[11px] text-gray-400 mb-1">
                        댓글 depth {c.depth ?? 1}
                      </div>
                      {c.content}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">댓글이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <BallManager
        table={{ width: TABLE_WIDTH, depth: TABLE_DEPTH, height: TABLE_HEIGHT }}
        toolMode={toolMode}
        onReadThread={(data) => setSelectedThread(data)}
      />
    </div>
  );
}
