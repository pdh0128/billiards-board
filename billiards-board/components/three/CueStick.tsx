'use client';

import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Raycaster, Mesh } from 'three';
import * as THREE from 'three';

interface CueStickProps {
  onBallHit: (ballId: string, force: Vector3) => void;
}

export function CueStick({ onBallHit }: CueStickProps) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const [selectedBall, setSelectedBall] = useState<Mesh | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeStart, setChargeStart] = useState(0);
  const [cuePosition, setCuePosition] = useState(new Vector3());
  const [cueDirection, setCueDirection] = useState(new Vector3());

  const cueRef = useRef<Mesh>(null);
  const maxCharge = 2000; // 최대 차징 시간 (ms)

  useFrame((state) => {
    if (!cueRef.current || !selectedBall) return;

    // 큐대를 선택된 공 뒤에 위치시키기
    const ballPos = selectedBall.position.clone();
    const cameraPos = camera.position.clone();

    // 카메라에서 공으로의 방향
    const direction = new Vector3().subVectors(ballPos, cameraPos).normalize();

    // 큐대 위치 (공 뒤쪽)
    const distance = isCharging
      ? 3 + Math.min((Date.now() - chargeStart) / maxCharge, 1) * 2
      : 3;

    const cuePos = new Vector3()
      .copy(ballPos)
      .sub(direction.clone().multiplyScalar(distance));

    cueRef.current.position.copy(cuePos);

    // 큐대를 공을 향하도록 회전
    cueRef.current.lookAt(ballPos);

    setCueDirection(direction);
  });

  const handlePointerDown = (event: any) => {
    event.stopPropagation();

    // Raycaster로 클릭한 공 찾기
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.current.setFromCamera(mouse, camera);

    // 'ball'이라는 name을 가진 mesh만 검사
    const balls = scene.children.filter((obj) => obj.name === 'ball');
    const intersects = raycaster.current.intersectObjects(balls);

    if (intersects.length > 0) {
      const ball = intersects[0].object as Mesh;
      setSelectedBall(ball);
      setIsCharging(true);
      setChargeStart(Date.now());
    }
  };

  const handlePointerUp = () => {
    if (!isCharging || !selectedBall) return;

    const chargeTime = Math.min(Date.now() - chargeStart, maxCharge);
    const forceMagnitude = (chargeTime / maxCharge) * 20; // 최대 힘 20

    // 공에게 힘 적용 (실제로는 공의 userData에 ballId가 있어야 함)
    const force = cueDirection.clone().multiplyScalar(forceMagnitude);
    const ballId = (selectedBall.userData as any).ballId;

    if (ballId) {
      onBallHit(ballId, force);
    }

    setIsCharging(false);
    setSelectedBall(null);
  };

  return (
    <>
      {/* 큐대 */}
      {selectedBall && (
        <mesh ref={cueRef}>
          <cylinderGeometry args={[0.1, 0.15, 5, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.6} />
        </mesh>
      )}

      {/* 마우스 이벤트 캡처용 투명 평면 */}
      <mesh
        position={[0, 0, 0]}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </>
  );
}
