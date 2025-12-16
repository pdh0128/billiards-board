'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html, OrbitControls } from '@react-three/drei';
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
          <meshStandardMaterial color={color} metalness={0.18} roughness={0.35} />
        </mesh>
        <Html center className="select-none">
          <button
            type="button"
            onClick={handleSelect}
            className="w-40 text-center text-xs text-slate-100 cursor-pointer bg-slate-900/50 border border-slate-800/80 rounded-lg px-2 py-1.5 shadow hover:border-emerald-500/60 transition-colors"
          >
            <p className="font-semibold line-clamp-1">{post.title}</p>
            <p className="text-slate-400 line-clamp-2 mt-1">{post.content}</p>
            <p className="text-[10px] text-emerald-300 mt-1">
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

const PALETTE = ['#0f172a', '#0b2242', '#0f2f4f', '#103262', '#0f3a5f', '#0c4b5c', '#0f553f', '#0f3a2e'];

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
          color: PALETTE[idx % PALETTE.length],
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
    <div className="h-[420px] rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-inner overflow-hidden">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 10], fov: 38, near: 0.1, far: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.4} />
        <directionalLight
          castShadow
          position={[4, 8, 6]}
          intensity={1.2}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0003}
        />
        <pointLight position={[-6, 4, -6]} intensity={0.35} color="#38bdf8" />
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
