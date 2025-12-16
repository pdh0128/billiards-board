'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, OrbitControls, Stars } from '@react-three/drei';
import { Mesh, Vector3 } from 'three';
import { useRouter } from 'next/navigation';
import { PostWithMeta } from '@/types';

type CardProps = {
  post: PostWithMeta;
  position: [number, number, number];
  color: string;
  onSelect: (id: string) => void;
};

function PostCard3D({ post, position, color, onSelect }: CardProps) {
  const meshRef = useRef<Mesh>(null);
  const scaleTarget = useRef(new Vector3(1, 1, 1));
  const [hovered, setHovered] = useState(false);
  const handleSelect = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.stopPropagation();
      onSelect(post.id);
    },
    [onSelect, post.id]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    scaleTarget.current.setScalar(hovered ? 1.12 : 1);
    meshRef.current.scale.lerp(scaleTarget.current, 6 * delta);
    meshRef.current.rotation.y += delta * 0.18;
  });

  return (
    <Float floatIntensity={0.4} speed={2.2}>
      <group position={position}>
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onClick={handleSelect}
        >
          <boxGeometry args={[1.6, 1, 0.12]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.25} emissive={color} emissiveIntensity={0.12} />
        </mesh>
        <Html center className="select-none">
          <button
            type="button"
            onClick={handleSelect}
            className="w-40 text-center text-xs text-slate-100 cursor-pointer bg-slate-900/70 border border-slate-700/70 rounded-lg px-2 py-1.5 shadow hover:border-emerald-400/80 transition-colors backdrop-blur"
          >
            <p className="font-semibold line-clamp-1">{post.title}</p>
            <p className="text-slate-300 line-clamp-2 mt-1">{post.content}</p>
            <p className="text-[10px] text-emerald-200 mt-1">
              ▲ {post.votes?.up ?? 0} / ▼ {post.votes?.down ?? 0}
            </p>
          </button>
        </Html>
      </group>
    </Float>
  );
}

type GalleryProps = {
  posts: PostWithMeta[];
};

const BRIGHT_PALETTE = ['#60a5fa', '#38bdf8', '#22d3ee', '#a855f7', '#22c55e', '#f59e0b', '#f97316', '#f43f5e'];

export default function Post3DGallery({ posts }: GalleryProps) {
  const router = useRouter();
  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/posts/${id}`);
    },
    [router]
  );
  const visiblePosts = posts.slice(0, 12);
  const nodes = useMemo(
    () =>
      visiblePosts.map((post, idx) => {
        const angle = (idx / Math.max(visiblePosts.length, 1)) * Math.PI * 2;
        const radius = 4;
        const heightStep = ((idx % 4) - 1.5) * 0.6;
        return {
          post,
          position: [Math.cos(angle) * radius, heightStep, Math.sin(angle) * radius] as [number, number, number],
          color: BRIGHT_PALETTE[idx % BRIGHT_PALETTE.length],
        };
      }),
    [visiblePosts]
  );

  if (visiblePosts.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        게시글을 불러오면 3D 카드가 나타납니다.
      </div>
    );
  }

  return (
    <div className="h-[420px] rounded-2xl border border-slate-800 bg-gradient-to-br from-[#050816] via-[#0b1630] to-black shadow-inner overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 10], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#050816']} />
        <Stars radius={60} depth={30} count={2000} factor={4} saturation={0.5} fade speed={1} />
        <ambientLight intensity={0.45} />
        <directionalLight
          castShadow
          position={[4, 8, 6]}
          intensity={1.35}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0003}
        />
        <pointLight position={[-6, 4, -6]} intensity={0.4} color="#38bdf8" />
        <pointLight position={[6, -2, -2]} intensity={0.3} color="#f472b6" />
        <group position={[0, -1.4, 0]}>
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[30, 30]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>

        {nodes.map((node) => (
          <PostCard3D
            key={node.post.id}
            post={node.post}
            position={node.position}
            color={node.color}
            onSelect={handleSelect}
          />
        ))}

        <OrbitControls enablePan={false} minPolarAngle={0.8} maxPolarAngle={1.3} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}
