'use client';

import { useRef, useState, useEffect } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { animate } from 'animejs';
import { Ball as BallType } from '@/types';

interface BallProps {
  ball: BallType;
  isNew?: boolean;
}

export function Ball({ ball, isNew = false }: BallProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 공 색상 (depth에 따라 변경)
  const getColor = () => {
    if (ball.type === 'article') return '#3b82f6'; // blue

    const depth = ball.depth ?? 0;
    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return colors[depth % colors.length];
  };

  // 생성 애니메이션 (anime.js)
  useEffect(() => {
    if (isNew && meshRef.current) {
      // 초기 스케일 0
      meshRef.current.scale.setScalar(0);

      // 탄성 애니메이션으로 스케일 증가
      animate(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 800,
        ease: 'out(3)',
      });

      // 회전 애니메이션 추가
      animate(meshRef.current.rotation, {
        y: Math.PI * 2,
        duration: 1000,
        ease: 'outQuad',
      });
    }
  }, [isNew]);

  // 호버 효과
  useFrame(() => {
    if (meshRef.current && !isNew) {
      const targetScale = hovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.1
      );
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
        // TODO: 공 클릭 이벤트 처리 (content 표시)
      }}
    >
      <sphereGeometry args={[ball.radius, 32, 32]} />
      <meshStandardMaterial
        color={getColor()}
        emissive={hovered ? getColor() : '#000000'}
        emissiveIntensity={hovered ? 0.5 : 0}
        metalness={0.3}
        roughness={0.4}
      />
    </mesh>
  );
}
