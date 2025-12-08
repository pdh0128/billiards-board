'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { BallManager } from './BallManager';

export function Scene() {
  return (
    <div className="w-full h-screen">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* 그리드 헬퍼 */}
        <gridHelper args={[20, 20]} />

        {/* 공 관리자 */}
        <BallManager />
      </Canvas>
    </div>
  );
}
