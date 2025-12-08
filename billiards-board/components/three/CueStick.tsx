'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Vector2, Vector3, Raycaster, Mesh, Plane } from 'three';
import * as THREE from 'three';

interface CueStickProps {
  onBallHit: (ballId: string, force: Vector3) => void;
}

type CuePhase = 'idle' | 'position' | 'aim' | 'power';

export function CueStick({ onBallHit }: CueStickProps) {
  const { camera, scene, gl } = useThree();
  const raycaster = useRef(new Raycaster());
  const cueDirectionRef = useRef(new Vector3());
  const pointer = useRef(new Vector2());
  const [selectedBall, setSelectedBall] = useState<Mesh | null>(null);
  const [phase, setPhase] = useState<CuePhase>('idle');
  const [isCharging, setIsCharging] = useState(false);
  const chargeStartRef = useRef(0);
  const cueDistanceRef = useRef(4);
  const hitPlane = useRef(new Plane(new Vector3(0, 1, 0), 0));

  const cueRef = useRef<Mesh>(null);
  const maxCharge = 2000; // 최대 차징 시간 (ms)
  const [power, setPower] = useState(0);

  useFrame((state) => {
    if (!cueRef.current || !selectedBall) return;

    // 큐대를 선택된 공 뒤에 위치시키기
    const ballPos = selectedBall.position.clone();
    const cameraPos = camera.position.clone();

    // 카메라에서 공으로의 방향 (XZ 평면에 투영)
    const direction =
      cueDirectionRef.current.lengthSq() > 0
        ? cueDirectionRef.current.clone()
        : new Vector3().subVectors(ballPos, cameraPos).setY(0).normalize();

    // 큐대 위치 (공 뒤쪽)
    const distance = cueDistanceRef.current + (isCharging ? 0.5 : 0);

    const cuePos = new Vector3()
      .copy(ballPos)
      .sub(direction.clone().multiplyScalar(distance));

    cueRef.current.position.copy(cuePos);

    // 큐대를 공을 향하도록 회전
    cueRef.current.lookAt(ballPos);

    cueDirectionRef.current.copy(direction);

    // 파워 게이지 업데이트
    if (isCharging) {
      const pct = Math.min((Date.now() - chargeStartRef.current) / maxCharge, 1);
      const scaled = Math.round(1 + pct * 99);
      if (scaled !== power) {
        setPower(scaled);
      }
    } else if (power !== 0) {
      setPower(0);
    }
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

  const pickOnTable = (clientX: number, clientY: number, y: number) => {
    const { width, height, left, top } = gl.domElement.getBoundingClientRect();
    pointer.current.set(
      ((clientX - left) / width) * 2 - 1,
      -((clientY - top) / height) * 2 + 1
    );

    raycaster.current.setFromCamera(pointer.current, camera);
    hitPlane.current.constant = -y;
    const target = new Vector3();
    if (raycaster.current.ray.intersectPlane(hitPlane.current, target)) {
      return target;
    }
    return null;
  };

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const hit = pickBall(event.clientX, event.clientY);
      if (!hit) return;
      setSelectedBall(hit);
      setPhase('position');
      cueDirectionRef.current.set(0, 0, 0);
      setIsCharging(false);
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (phase === 'idle' || !selectedBall) return;
      event.preventDefault();
      const surfaceY = selectedBall.position.y;
      const point = pickOnTable(event.clientX, event.clientY, surfaceY);
      if (!point) return;
      const dir = new Vector3().subVectors(selectedBall.position, point).setY(0);
      if (dir.lengthSq() === 0) return;
      cueDirectionRef.current.copy(dir.normalize());
      cueDistanceRef.current = THREE.MathUtils.clamp(
        selectedBall.position.distanceTo(point),
        2,
        10
      );
      setPhase('aim');
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (phase !== 'aim' || !selectedBall) return;
      const surfaceY = selectedBall.position.y;
      const point = pickOnTable(event.clientX, event.clientY, surfaceY);
      if (!point) return;
      const dir = new Vector3().subVectors(selectedBall.position, point).setY(0);
      if (dir.lengthSq() === 0) return;
      cueDirectionRef.current.copy(dir.normalize());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && phase === 'aim' && selectedBall && !isCharging) {
        setIsCharging(true);
        setPhase('power');
        chargeStartRef.current = Date.now();
      }
      if (event.code === 'Escape') {
        setSelectedBall(null);
        setPhase('idle');
        setIsCharging(false);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space' && isCharging && selectedBall) {
        const chargeTime = Math.min(Date.now() - chargeStartRef.current, maxCharge);
        const forceMagnitude = (chargeTime / maxCharge) * 20; // 최대 힘 20
        const force = cueDirectionRef.current.clone().multiplyScalar(forceMagnitude);
        const ballId = (selectedBall.userData as any).ballId;

        if (ballId) {
          onBallHit(ballId, force);
        }

        setIsCharging(false);
        setPhase('aim');
      }
    };

    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [camera, gl.domElement, scene, isCharging, phase, selectedBall, onBallHit]);

  return (
    <>
      {/* 큐대 */}
      {selectedBall && (
        <group ref={cueRef}>
          {/* Rotate cylinder so its axis lies horizontally (along Z) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.15, 5, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* 파워 게이지 (Space로 충전 중일 때만 표시) */}
      {selectedBall && isCharging && (
        <Html center style={{ pointerEvents: 'none' }}>
          <div
            style={{
              marginTop: '-48px',
              padding: '6px 10px',
              background: 'rgba(0, 0, 0, 0.65)',
              borderRadius: '8px',
              minWidth: '140px',
              color: '#f7f7f7',
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ marginBottom: '6px' }}>
              Power: <strong>{power}</strong> / 100
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${power}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, #34d399 0%, #f59e0b 50%, #ef4444 100%)',
                  transition: 'width 80ms linear',
                }}
              />
            </div>
            <div style={{ marginTop: '4px', opacity: 0.85 }}>
              Hold Space to charge
            </div>
          </div>
        </Html>
      )}

    </>
  );
}
