import { Position3D } from '@/types';

/**
 * 구형 공간 내 랜덤 위치 생성
 * @param radius 공간의 반지름
 * @returns 3D 위치 객체
 */
export function generateRandomPosition(radius: number = 10): Position3D {
  // 구형 공간 내 균일한 분포를 위한 알고리즘
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return { x, y, z };
}

/**
 * 두 위치 간의 거리 계산
 * @param pos1 첫 번째 위치
 * @param pos2 두 번째 위치
 * @returns 거리
 */
export function calculateDistance(pos1: Position3D, pos2: Position3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 충돌 체크 (두 공이 겹치는지)
 * @param pos1 첫 번째 공 위치
 * @param radius1 첫 번째 공 반지름
 * @param pos2 두 번째 공 위치
 * @param radius2 두 번째 공 반지름
 * @returns 충돌 여부
 */
export function checkCollision(
  pos1: Position3D,
  radius1: number,
  pos2: Position3D,
  radius2: number
): boolean {
  const distance = calculateDistance(pos1, pos2);
  return distance < radius1 + radius2;
}

/**
 * 기존 공들과 겹치지 않는 위치 생성
 * @param existingPositions 기존 공들의 위치 배열
 * @param newRadius 새 공의 반지름
 * @param spaceRadius 공간 반지름
 * @param maxAttempts 최대 시도 횟수
 * @returns 충돌하지 않는 위치 (실패 시 그냥 랜덤 위치)
 */
export function generateNonCollidingPosition(
  existingPositions: Array<{ position: Position3D; radius: number }>,
  newRadius: number = 1.0,
  spaceRadius: number = 10,
  maxAttempts: number = 50
): Position3D {
  for (let i = 0; i < maxAttempts; i++) {
    const position = generateRandomPosition(spaceRadius);

    const hasCollision = existingPositions.some((existing) =>
      checkCollision(position, newRadius, existing.position, existing.radius)
    );

    if (!hasCollision) {
      return position;
    }
  }

  // 최대 시도 횟수 초과 시 그냥 랜덤 위치 반환
  return generateRandomPosition(spaceRadius);
}

/**
 * 부모 공 주변의 orbit 위치 생성 (댓글용)
 * @param parentPosition 부모 공 위치
 * @param parentRadius 부모 공 반지름
 * @param childRadius 자식 공 반지름
 * @param orbitDistance 궤도 거리
 * @param index 자식 인덱스 (같은 레벨의 몇 번째 자식인지)
 * @returns 자식 공 위치
 */
export function generateOrbitPosition(
  parentPosition: Position3D,
  parentRadius: number,
  childRadius: number,
  orbitDistance: number = 2.0,
  index: number = 0
): Position3D {
  // 골든 앵글을 사용한 균일 분포
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = goldenAngle * index;
  const phi = Math.acos(1 - 2 * (index + 0.5) / 10); // 최대 10개 정도로 가정

  const distance = parentRadius + childRadius + orbitDistance;

  const x = parentPosition.x + distance * Math.sin(phi) * Math.cos(theta);
  const y = parentPosition.y + distance * Math.sin(phi) * Math.sin(theta);
  const z = parentPosition.z + distance * Math.cos(phi);

  return { x, y, z };
}
