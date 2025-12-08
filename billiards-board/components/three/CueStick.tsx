'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector2, Vector3, Raycaster, Mesh } from 'three';
import * as THREE from 'three';

interface CueStickProps {
  onBallHit: (ballId: string, force: Vector3) => void;
}

export function CueStick({ onBallHit }: CueStickProps) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const cueDirectionRef = useRef(new Vector3());
  const pointer = useRef(new Vector2());
  const [selectedBall, setSelectedBall] = useState<Mesh | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const chargeStartRef = useRef(0);

  const cueRef = useRef<Mesh>(null);
  const maxCharge = 2000; // 최대 차징 시간 (ms)

  useFrame((state) => {
    if (!cueRef.current || !selectedBall) return;

    // 큐대를 선택된 공 뒤에 위치시키기
    const ballPos = selectedBall.position.clone();
    const cameraPos = camera.position.clone();

    // 카메라에서 공으로의 방향 (XZ 평면에 투영)
    const direction = new Vector3().subVectors(ballPos, cameraPos);
    direction.y = 0;
    if (direction.lengthSq() === 0) {
      direction.set(0, 0, 1);
    } else {
      direction.normalize();
    }

    // 큐대 위치 (공 뒤쪽)
    const distance = isCharging
      ? 3 + Math.min((Date.now() - chargeStartRef.current) / maxCharge, 1) * 2
      : 3;

    const cuePos = new Vector3()
      .copy(ballPos)
      .sub(direction.clone().multiplyScalar(distance));

    cueRef.current.position.copy(cuePos);

    // 큐대를 공을 향하도록 회전
    cueRef.current.lookAt(ballPos);

    cueDirectionRef.current.copy(direction);
  });

  const pickBall = (clientX: number, clientY: number) => {
    const { width, height, left, top } = gl.domElement.getBoundingClientRect();
    pointer.current.set(
      ((clientX - left) / width) * 2 - 1,
      -((clientY - top) / height) * 2 + 1
    );

    raycaster.current.setFromCamera(pointer.current, camera);
    const balls = scene.children.filter((obj) => obj.name === 'ball');
    const intersects = raycaster.current.intersectObjects(balls, true);
    return intersects[0]?.object as Mesh | undefined;
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const hit = pickBall(event.clientX, event.clientY);
      if (!hit) return;
      setSelectedBall(hit);
      setIsCharging(true);
      chargeStartRef.current = Date.now();
    };

    const handlePointerUp = () => {
      if (!isCharging || !selectedBall) return;

      const chargeTime = Math.min(Date.now() - chargeStartRef.current, maxCharge);
      const forceMagnitude = (chargeTime / maxCharge) * 20; // 최대 힘 20
      const force = cueDirectionRef.current.clone().multiplyScalar(forceMagnitude);
      const ballId = (selectedBall.userData as any).ballId;

      if (ballId) {
        onBallHit(ballId, force);
      }

      setIsCharging(false);
      setSelectedBall(null);
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera, gl.domElement, scene, isCharging, selectedBall, onBallHit]);

  return (
    <>
      {/* 큐대 */}
      {selectedBall && (
        <mesh ref={cueRef}>
          <cylinderGeometry args={[0.1, 0.15, 5, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
      )}

    </>
  );
}
