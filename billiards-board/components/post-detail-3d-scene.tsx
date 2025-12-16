'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, Line, Stars, OrbitControls } from '@react-three/drei';
import { Mesh } from 'three';
import { CommentWithUser, PostWithMeta } from '@/types';

type Props = {
  post: PostWithMeta;
  comments: CommentWithUser[];
  onReply: (path: string) => void;
  onDelete: (id: string) => void;
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

function PostMesh({ post, accent, position }: { post: PostWithMeta; accent: string; position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.24;
    meshRef.current.rotation.x = Math.sin(Date.now() * 0.0006) * 0.06;
  });

  return (
    <Float floatIntensity={0.4} rotationIntensity={0.5} speed={1.6}>
      <mesh ref={meshRef} position={position} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.9, 0.08]} />
        <meshStandardMaterial color={accent} metalness={0.35} roughness={0.25} emissive={accent} emissiveIntensity={0.12} />
        <Html center transform occlude>
          <div className="w-48 bg-slate-950/85 border border-white/10 rounded-2xl px-3 py-2.5 shadow backdrop-blur text-slate-100 space-y-2">
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

function CommentMesh({
  node,
  accent,
  onReply,
  onDelete,
}: {
  node: Node;
  accent: string;
  onReply: (path: string) => void;
  onDelete: (id: string) => void;
}) {
  const meshRef = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.18;
  });

  const { comment } = node;

  return (
    <Float floatIntensity={0.35} speed={1.4}>
      <mesh ref={meshRef} position={node.position} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.6, 0.07]} />
        <meshStandardMaterial color={accent} metalness={0.3} roughness={0.3} emissive={accent} emissiveIntensity={0.1} />
        <Html center transform occlude>
          <div className="w-40 bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 shadow backdrop-blur text-[11px] text-slate-100 space-y-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>depth {comment.depth}</span>
              <span>{comment.user?.username ?? '익명'}</span>
            </div>
            <p className="leading-snug whitespace-pre-wrap line-clamp-2">
              {comment.isDeleted ? '삭제된 댓글입니다.' : comment.content}
            </p>
            {!comment.isDeleted && (
              <div className="flex justify-end gap-2 text-[11px]">
                <button className="text-emerald-300 hover:text-emerald-200" type="button" onClick={() => onReply(comment.path)}>
                  대댓글
                </button>
                <button className="text-rose-300 hover:text-rose-200" type="button" onClick={() => onDelete(comment.id)}>
                  삭제
                </button>
              </div>
            )}
          </div>
        </Html>
      </mesh>
    </Float>
  );
}

export default function PostDetail3DScene({ post, comments, onReply, onDelete }: Props) {
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

        <PostMesh post={post} accent="#22d3ee" position={[-4, 0.05, 0]} />

        {nodes.map((node, idx) => {
          const accent = ACCENTS[idx % ACCENTS.length];
          return (
            <group key={node.id}>
              <Line points={[node.parentPosition, node.position]} color={accent} lineWidth={2} dashed dashSize={0.3} gapSize={0.15} />
              <CommentMesh node={node} accent={accent} onReply={onReply} onDelete={onDelete} />
            </group>
          );
        })}

        <OrbitControls enablePan={false} minDistance={6} maxDistance={24} enableDamping dampingFactor={0.08} />
      </Canvas>
    </div>
  );
}
