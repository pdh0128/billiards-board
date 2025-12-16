'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, Stars, OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';
import { CommentWithUser, PostWithMeta } from '@/types';

type Props = {
  post: PostWithMeta;
  comments: CommentWithUser[];
  onReply: (path: string) => void;
  onDelete: (id: string) => void;
  onVote: (value: 'UP' | 'DOWN') => void;
  onRequestComment: (parentPath?: string) => void;
};

type Node = {
  id: string;
  path: string;
  depth: number;
  position: [number, number, number];
  parentPosition: [number, number, number];
  comment: CommentWithUser;
};

const ACCENTS = ['#22d3ee', '#60a5fa', '#a855f7', '#22c55e', '#f59e0b', '#f97316', '#f43f5e'];

function PostMesh({
  post,
  accent,
  position,
  onSelect,
}: {
  post: PostWithMeta;
  accent: string;
  position: [number, number, number];
  onSelect: (position: [number, number, number]) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.24;
    meshRef.current.rotation.x = Math.sin(Date.now() * 0.0006) * 0.06;
  });

  return (
    <Float floatIntensity={0.4} rotationIntensity={0.5} speed={1.6}>
      <mesh
        ref={meshRef}
        position={position}
        castShadow
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(position);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(position);
        }}
      >
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color={accent} metalness={0.35} roughness={0.25} emissive={accent} emissiveIntensity={0.12} />
        <Html center transform occlude>
          <div
            className="w-48 bg-slate-950/85 border border-white/10 rounded-2xl px-3 py-2.5 shadow backdrop-blur text-slate-100 space-y-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(position);
            }}
          >
            <p className="text-[11px] text-emerald-200">본문 카드</p>
            <h1 className="text-lg font-semibold leading-snug line-clamp-2">{post.title}</h1>
            <p className="text-slate-200 text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">{post.content}</p>
            <p className="text-[11px] text-emerald-200">
              ▲ {post.votes?.up ?? 0} / ▼ {post.votes?.down ?? 0} · 댓글 {post._count?.comments ?? 0}
            </p>
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

function CommentMesh({ node, accent, onSelect }: { node: Node; accent: string; onSelect: (node: Node) => void }) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.18;
  });

  const { comment } = node;

  return (
    <Float floatIntensity={0.35} speed={1.4}>
      <mesh
        ref={meshRef}
        position={node.position}
        castShadow
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <boxGeometry args={[0.9, 0.6, 0.07]} />
        <meshStandardMaterial color={accent} metalness={0.3} roughness={0.3} emissive={accent} emissiveIntensity={0.1} />
        <Html center transform occlude>
          <div
            className="w-40 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 shadow backdrop-blur text-[11px] text-slate-100 space-y-2 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node);
            }}
          >
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>depth {comment.depth}</span>
              <span>{comment.user?.username ?? '익명'}</span>
            </div>
            <p className="leading-snug whitespace-pre-wrap line-clamp-2">
              {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
            </p>
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

export default function PostDetail3DScene({ post, comments, onReply, onDelete, onVote, onRequestComment }: Props) {
  const [selection, setSelection] = useState<
    | { type: 'post'; position: [number, number, number] }
    | { type: 'comment'; node: Node }
    | null
  >(null);
  const nodes = useMemo<Node[]>(() => {
    if (!comments.length) return [];
    const sorted = [...comments].sort((a, b) => a.path.localeCompare(b.path));
    const positions = new Map<string, [number, number, number]>();
    const postPos: [number, number, number] = [-4, 0.05, 0];
    const result: Node[] = [];

    sorted.forEach((comment, idx) => {
      const depth = comment.depth ?? comment.path.split('.').length - 1;
      const x = 2 + depth * 8;
      const y = -(idx % 10) * 1.8 + (depth % 2 === 0 ? 0.4 : -0.4);
      const z = Math.sin(idx * 0.25 + depth) * 1.8;
      const parentPath = comment.path.includes('.') ? comment.path.split('.').slice(0, -1).join('.') : '';
      const parentPosition = parentPath ? positions.get(parentPath) ?? postPos : postPos;
      const pos: [number, number, number] = [x, y, z];
      positions.set(comment.path, pos);
      result.push({
        id: comment.id,
        path: comment.path,
        depth,
        position: pos,
        parentPosition,
        comment,
      });
    });

    return result;
  }, [comments]);

  return (
    <div className="h-[380px] rounded-3xl border border-slate-800 bg-gradient-to-br from-[#050816] via-[#0b1630] to-black shadow-inner overflow-hidden">
      <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 3.2, 14], fov: 42 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050816']} />
        <Stars radius={70} depth={40} count={2000} factor={4} saturation={0.5} fade speed={0.8} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 4]} intensity={1.3} color="#60a5fa" />
        <pointLight position={[-4, 3, -4]} intensity={0.45} color="#22d3ee" />
        <pointLight position={[4, -1, 2]} intensity={0.35} color="#f472b6" />

        <group position={[0, -1.2, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[80, 80]} />
            <shadowMaterial opacity={0.25} />
          </mesh>
        </group>

        <PostMesh
          post={post}
          accent="#22d3ee"
          position={[-4, 0.05, 0]}
          onSelect={(pos) => setSelection({ type: 'post', position: pos })}
        />

        {nodes.map((node, idx) => {
          const accent = ACCENTS[idx % ACCENTS.length];
          return (
            <group key={node.id}>
              <Line points={[node.parentPosition, node.position]} color={accent} lineWidth={2} dashed dashSize={0.3} gapSize={0.15} />
              <CommentMesh node={node} accent={accent} onSelect={(n) => setSelection({ type: 'comment', node: n })} />
            </group>
          );
        })}

        <OrbitControls enablePan={false} minDistance={6} maxDistance={24} enableDamping dampingFactor={0.08} />

        {selection?.type === 'post' && (
          <Html position={[selection.position[0], selection.position[1] + 2.2, selection.position[2]]} center>
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 shadow backdrop-blur space-y-2">
              <p className="text-emerald-200 text-[11px]">본문 액션</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote('UP');
                    setSelection(null);
                  }}
                >
                  개추
                </button>
                <button
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onVote('DOWN');
                    setSelection(null);
                  }}
                >
                  비추
                </button>
                <button
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestComment(undefined);
                    setSelection(null);
                  }}
                >
                  댓글 작성
                </button>
              </div>
            </div>
          </Html>
        )}

        {selection?.type === 'comment' && (
          <Html position={[selection.node.position[0], selection.node.position[1] + 1.8, selection.node.position[2]]} center>
            <div className="bg-slate-950/90 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-slate-100 shadow backdrop-blur space-y-2">
              <p className="text-emerald-200 text-[11px]">댓글 액션</p>
              <div className="flex gap-2 flex-wrap">
                {!selection.node.comment.isDeleted && (
                  <button
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReply(selection.node.comment.path);
                      setSelection(null);
                    }}
                  >
                    대댓글
                  </button>
                )}
                {!selection.node.comment.isDeleted && (
                  <button
                    className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(selection.node.comment.id);
                      setSelection(null);
                    }}
                  >
                    삭제
                  </button>
                )}
                <button
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelection(null);
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  );
}
