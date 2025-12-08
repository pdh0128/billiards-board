'use client';

import { useRef, useState, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { animate } from 'animejs';
import { Ball as BallType } from '@/types';

interface BallProps {
  ball: BallType;
  radius: number;
  isNew?: boolean;
  registerController: (
    id: string,
    body: {
      applyImpulse: (force: Vector3) => void;
      position: Vector3;
      velocity: Vector3;
      radius: number;
      meshRef: React.RefObject<Mesh>;
      ball: BallType;
    }
  ) => () => void;
  toolMode: 'cue' | 'hand';
  onReadBall: (ball: BallType) => void;
}

export function Ball({
  ball,
  radius,
  isNew = false,
  registerController,
  toolMode,
  onReadBall,
}: BallProps) {
  const meshRef = useRef<Mesh>(null);
  const velocityRef = useRef(new Vector3(0, 0, 0));
  const positionRef = useRef(
    new Vector3(ball.position.x, ball.position.y, ball.position.z)
  );
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    positionRef.current.set(ball.position.x, ball.position.y, ball.position.z);
    velocityRef.current.set(0, 0, 0);

    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
      meshRef.current.name = ball.type === 'article' ? 'ball' : '';
      meshRef.current.userData.ballId = ball.id;
      meshRef.current.scale.setScalar(radius / ball.radius);
      meshRef.current.visible = ball.type === 'article';
    }
  }, [ball.id, ball.position.x, ball.position.y, ball.position.z, radius, ball.radius, ball.type]);

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

  useFrame(() => {
    if (!meshRef.current) return;

    // 호버 효과
    if (!isNew) {
      const targetScale = hovered ? 1.2 : 1.0;
      meshRef.current.scale.lerp(
        { x: targetScale, y: targetScale, z: targetScale } as any,
        0.1
      );
    }
  });

  useEffect(() => {
    const applyImpulse = (force: Vector3) => {
      velocityRef.current.add(force.clone());
    };

    const unregister = registerController(ball.id, {
      applyImpulse,
      position: positionRef.current,
      velocity: velocityRef.current,
      radius,
      meshRef,
      ball,
    });
    return () => unregister();
  }, [ball, registerController, radius]);

  return (
    <mesh
      ref={meshRef}
      position={[ball.position.x, ball.position.y, ball.position.z]}
      onPointerOver={() => ball.type === 'article' && setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={() => {
        if (toolMode === 'hand' && ball.type === 'article') {
          onReadBall(ball);
        }
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
