'use client';

import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { Ball as BallType } from '@/types';

interface BallProps {
  ball: BallType;
}

export function Ball({ ball }: BallProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 공 색상 (depth에 따라 변경)
  const getColor = () => {
    if (ball.type === 'article') return '#3b82f6'; // blue

    const depth = ball.depth ?? 0;
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[depth % colors.length];
  };

  // 호버 효과
  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.scale.setScalar(1.1);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1.0);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[ball.position.x, ball.position.y, ball.position.z]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        console.log('Clicked ball:', ball);
        // TODO: 공 클릭 이벤트 처리
      }}
    >
      <sphereGeometry args={[ball.radius, 32, 32]} />
      <meshStandardMaterial
        color={getColor()}
        emissive={hovered ? getColor() : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  );
}
