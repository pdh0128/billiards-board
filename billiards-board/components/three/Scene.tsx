'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BallManager } from './BallManager';
import { useEffect, useState } from 'react';
import { ToolSelector } from '../game/tool-selector';
import { Ball } from '@/types';

export function Scene() {
  // 당구대 크기 (4배 확대)
  const TABLE_WIDTH = 80;
  const TABLE_DEPTH = 48;
  const TABLE_HEIGHT = 1;
  const [toolMode, setToolMode] = useState<'cue' | 'hand'>('cue');
  const [selectedThread, setSelectedThread] = useState<{
    article: Ball;
    comments: Ball[];
    focusId: string;
  } | null>(null);

  useEffect(() => {
    if (toolMode !== 'hand') {
      setSelectedThread(null);
    }
  }, [toolMode]);

  return (
    <div className="w-full h-screen absolute inset-0">
      <ToolSelector mode={toolMode} onChange={setToolMode} />

      {selectedThread && toolMode === 'hand' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%]">
          <div className="bg-gray-950/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md p-5">
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

      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 30, 60]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={20}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.2}
        />

        {/* 조명 */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[40, 60, 20]} intensity={1.2} castShadow />
        <pointLight position={[0, 40, 0]} intensity={0.8} />
        <pointLight position={[-40, 20, -40]} intensity={0.3} color="#4a90e2" />

        {/* 당구대 테이블 */}
        <mesh position={[0, -TABLE_HEIGHT / 2, 0]} receiveShadow>
          <boxGeometry args={[TABLE_WIDTH, TABLE_HEIGHT, TABLE_DEPTH]} />
          <meshStandardMaterial color="#0d5c1f" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* 당구대 테두리 - 긴 쪽 */}
        <mesh position={[0, 1.2, -TABLE_DEPTH / 2 - 0.5]}>
          <boxGeometry args={[TABLE_WIDTH + 2, 2.4, 2]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 1.2, TABLE_DEPTH / 2 + 0.5]}>
          <boxGeometry args={[TABLE_WIDTH + 2, 2.4, 2]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 당구대 테두리 - 짧은 쪽 */}
        <mesh position={[-TABLE_WIDTH / 2 - 0.5, 1.2, 0]}>
          <boxGeometry args={[2, 2.4, TABLE_DEPTH]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[TABLE_WIDTH / 2 + 0.5, 1.2, 0]}>
          <boxGeometry args={[2, 2.4, TABLE_DEPTH]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 당구대 포켓 (6개) */}
        {/* 상단 좌우 */}
        <mesh position={[-TABLE_WIDTH / 2 + 2, 0, -TABLE_DEPTH / 2 + 2]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[TABLE_WIDTH / 2 - 2, 0, -TABLE_DEPTH / 2 + 2]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 중앙 좌우 */}
        <mesh position={[-TABLE_WIDTH / 2 + 2, 0, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[TABLE_WIDTH / 2 - 2, 0, 0]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 하단 좌우 */}
        <mesh position={[-TABLE_WIDTH / 2 + 2, 0, TABLE_DEPTH / 2 - 2]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[TABLE_WIDTH / 2 - 2, 0, TABLE_DEPTH / 2 - 2]}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 공 관리자 */}
        <BallManager
          table={{ width: TABLE_WIDTH, depth: TABLE_DEPTH, height: TABLE_HEIGHT }}
          toolMode={toolMode}
          onReadThread={(data) => setSelectedThread(data)}
        />
      </Canvas>
    </div>
  );
}
