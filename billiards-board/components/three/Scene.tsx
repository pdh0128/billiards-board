'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BallManager } from './BallManager';

export function Scene() {
  // 당구대 크기 (4배 확대)
  const TABLE_WIDTH = 80;
  const TABLE_DEPTH = 48;
  const TABLE_HEIGHT = 1;

  return (
    <div className="w-full h-screen absolute inset-0">
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
        <BallManager table={{ width: TABLE_WIDTH, depth: TABLE_DEPTH, height: TABLE_HEIGHT }} />
      </Canvas>
    </div>
  );
}
