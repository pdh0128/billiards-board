'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BallManager } from './BallManager';

export function Scene() {
  return (
    <div className="w-full h-screen absolute inset-0">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 8, 15]} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.2}
        />

        {/* 조명 */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 5]} intensity={1.2} castShadow />
        <pointLight position={[0, 10, 0]} intensity={0.8} />
        <pointLight position={[-10, 5, -10]} intensity={0.3} color="#4a90e2" />

        {/* 당구대 테이블 */}
        <mesh position={[0, -0.5, 0]} receiveShadow>
          <boxGeometry args={[20, 1, 12]} />
          <meshStandardMaterial color="#0d5c1f" roughness={0.4} metalness={0.1} />
        </mesh>

        {/* 당구대 테두리 - 긴 쪽 */}
        <mesh position={[0, 0.3, -6.5]}>
          <boxGeometry args={[20.5, 0.6, 1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.3, 6.5]}>
          <boxGeometry args={[20.5, 0.6, 1]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 당구대 테두리 - 짧은 쪽 */}
        <mesh position={[-10.5, 0.3, 0]}>
          <boxGeometry args={[1, 0.6, 12]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>
        <mesh position={[10.5, 0.3, 0]}>
          <boxGeometry args={[1, 0.6, 12]} />
          <meshStandardMaterial color="#3d2817" roughness={0.6} metalness={0.3} />
        </mesh>

        {/* 당구대 포켓 (6개) */}
        {/* 상단 좌우 */}
        <mesh position={[-9.5, 0, -5.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[9.5, 0, -5.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 중앙 좌우 */}
        <mesh position={[-9.5, 0, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[9.5, 0, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 하단 좌우 */}
        <mesh position={[-9.5, 0, 5.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        <mesh position={[9.5, 0, 5.5]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>

        {/* 공 관리자 */}
        <BallManager />
      </Canvas>
    </div>
  );
}
