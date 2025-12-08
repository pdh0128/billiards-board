# Billiards Board - 3D Interactive Board System

## 프로젝트 개요

Three.js 기반 3D 인터랙티브 게시판으로, 글을 공(구)으로 표현하고 충돌을 통해 댓글을 생성하며, 큐대로 타격하여 삭제하는 독특한 UX를 제공합니다.

### 핵심 컨셉
- **글 = 공 생성**: 익명으로 글 작성 시 3D 공간에 공이 생성됨
- **공 충돌 = 댓글 생성**: 공끼리 충돌 시 댓글이 생성되어 새로운 공으로 표현됨
- **큐대 타격 = 삭제**: Raycaster로 공을 클릭하여 재귀적 삭제 수행
- **WebSocket 실시간 동기화**: 모든 사용자가 동일한 3D 공간 상태를 공유

## 기술 스택

### 프론트엔드
- **Next.js 16** (App Router)
- **React 19**
- **Three.js** + **@react-three/fiber** + **@react-three/drei**
- **Tailwind CSS 4** + **shadcn/ui**
- **TypeScript 5**

### 백엔드
- **Prisma ORM** (PostgreSQL)
- **NextAuth.js v5** (Auth.js) - 익명 UUID 기반 인증
- **Socket.IO** - 실시간 동기화

### 인프라
- **Vercel** (배포)
- **PlanetScale / Supabase** (PostgreSQL DB)

## 프로젝트 구조

```
billiards-board/
├── app/
│   ├── api/
│   │   ├── article/          # 글 CRUD API
│   │   ├── comment/          # 댓글 CRUD API
│   │   └── auth/            # NextAuth.js 인증
│   ├── layout.tsx
│   ├── page.tsx             # 메인 페이지 (3D Scene)
│   └── globals.css
├── components/
│   ├── three/               # Three.js 컴포넌트
│   │   ├── Scene.tsx       # 메인 3D 씬
│   │   ├── Ball.tsx        # 개별 공 컴포넌트
│   │   └── BallManager.tsx # 공 상태 관리
│   └── ui/                  # shadcn/ui 컴포넌트
├── lib/
│   ├── prisma.ts           # Prisma 클라이언트
│   └── socket-server.ts    # Socket.IO 서버 설정
├── hooks/
│   └── useSocket.ts        # Socket.IO 클라이언트 훅
├── utils/
│   ├── path.ts             # Path Model 유틸리티
│   └── delete.ts           # 재귀 삭제 로직
├── types/
│   └── index.ts            # TypeScript 타입 정의
├── prisma/
│   └── schema.prisma       # DB 스키마
└── .env.local              # 환경 변수
```

## 데이터베이스 스키마

### Path Model 기반 댓글 구조

Path Model은 댓글의 계층 구조를 문자열 경로로 표현하는 방식입니다:

```
001                    # 1번째 최상위 댓글
001.001               # 1번째 댓글의 1번째 대댓글
001.002               # 1번째 댓글의 2번째 대댓글
001.002.001           # 1번째 댓글의 2번째 대댓글의 1번째 답글
002                    # 2번째 최상위 댓글
```

**장점:**
- depth 제한 없음
- 문자열 정렬로 트리 구조 자동 구성
- 부모-자식 관계를 parentId 없이 표현

### 주요 모델

#### User
```prisma
- id: String (cuid)
- uuid: String (unique, UUID 기반 익명 식별자)
- createdAt, updatedAt
```

#### Article (글 = 공)
```prisma
- id, content, userId
- positionX, positionY, positionZ (Three.js 위치)
- radius (공 반지름)
- isDeleted, deletedAt (Soft Delete)
```

#### Comment (댓글 = 충돌 공)
```prisma
- id, content, userId, articleId
- path (Path Model 경로)
- depth (계층 깊이)
- positionX, positionY, positionZ
- radius
- isDeleted, deletedAt
```

## 핵심 기능 구현

### 1. Path Model 유틸리티 ([utils/path.ts](utils/path.ts))

```typescript
// 새 댓글 path 생성
generatePath(parentPath, siblingCount)
// 예: generatePath("001", 2) => "001.003"

// 트리 구조 빌드
buildCommentTree(comments) => PathNode[]

// 자식 댓글 찾기
findChildComments(path, comments)
```

### 2. 재귀 삭제 시스템 ([utils/delete.ts](utils/delete.ts))

**2단계 삭제 프로세스:**

1. **Soft Delete**: `isDeleted = true` 마킹
   - Article: 모든 댓글도 함께 soft delete
   - Comment: 자식 댓글도 재귀적으로 soft delete

2. **Hard Delete**: Orphan Check 후 실제 DB 삭제
   - 자식이 모두 soft deleted 상태일 때만 hard delete 수행
   - 부모가 이미 soft deleted면 재귀적으로 확인하여 제거

### 3. WebSocket 실시간 동기화 ([lib/socket-server.ts](lib/socket-server.ts))

**이벤트 종류:**
- `requestSync`: 클라이언트가 초기 상태 요청
- `syncState`: 서버가 전체 상태 전송
- `createArticle`: 새 글 생성 브로드캐스트
- `createComment`: 새 댓글 생성 브로드캐스트
- `deleteArticle`: 글 삭제 브로드캐스트
- `deleteComment`: 댓글 삭제 브로드캐스트

### 4. Three.js 씬 구성 ([components/three/](components/three/))

**Scene.tsx**: 메인 3D 환경
- OrbitControls: 카메라 조작
- Lighting: Ambient + Directional + Point
- GridHelper: 공간 참조용 그리드

**BallManager.tsx**: 공 상태 관리
- WebSocket 이벤트 수신
- Ball 컴포넌트 배열 렌더링

**Ball.tsx**: 개별 공 렌더링
- depth에 따른 색상 변경
- 호버 효과 (scale 증가)
- 클릭 이벤트 처리

## 개발 로드맵

### WEEK 1: Core Setup + 기본 글 생성 흐름
- [x] Next.js 프로젝트 초기화
- [x] 패키지 설치 (Three.js, Prisma, Auth.js, Socket.IO)
- [x] 디렉토리 구조 생성
- [x] Prisma 스키마 설계
- [x] 환경 변수 설정
- [x] TypeScript 타입 정의
- [x] 기본 Three.js 씬 구성
- [ ] Prisma 마이그레이션 실행
- [ ] 익명 인증 구현 (Auth.js UUID)
- [ ] 글 작성 API 구현 (/api/article POST)
- [ ] 글 → 공 생성 연동

### WEEK 2: 댓글 구조 + 충돌 시스템
- [ ] 충돌 감지 로직 (BoundingSphere)
- [ ] 댓글 생성 API (/api/comment POST)
- [ ] Path Model 기반 댓글 저장
- [ ] 계층형 공 배치 알고리즘
- [ ] WebSocket 이벤트 구현
- [ ] 실시간 동기화 테스트

### WEEK 3: 삭제 시스템 + 큐대 구현
- [ ] Raycaster 기반 큐대 컨트롤러
- [ ] 삭제 API (/api/article/[id] DELETE)
- [ ] Soft/Hard Delete 로직 구현
- [ ] 재귀 삭제 처리
- [ ] Fade-out 애니메이션
- [ ] WebSocket 삭제 이벤트

### WEEK 4: UX 정리 + 배포
- [ ] 커서 기반 무한 스크롤
- [ ] 글/댓글 수정 권한 체크
- [ ] 공 클릭 시 content preview UI
- [ ] 사용자 가이드 UI
- [ ] Vercel 배포
- [ ] README 작성
- [ ] 시연 영상 제작

## 환경 설정

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
SOCKET_PORT=3001
```

### 2. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. Socket.IO 서버 (별도 실행 필요 시)

현재는 Next.js API Routes와 통합 예정이지만, 필요 시 별도 서버 구성:

```bash
node server.js  # Socket.IO 서버 (포트 3001)
```

## 주요 기능 사용 방법 (예정)

### 글 작성
1. UI에서 "Create Post" 버튼 클릭
2. 내용 입력 후 제출
3. 3D 공간에 새로운 공이 생성됨

### 댓글 작성
1. 공을 다른 공과 충돌시킴 (드래그 앤 드롭)
2. 충돌 감지 시 댓글 입력 모달 표시
3. 내용 입력 후 제출
4. 부모 공 주변에 새로운 공이 생성됨

### 삭제
1. 큐대 모드 활성화
2. 삭제할 공 클릭 (Raycaster)
3. Soft Delete 후 fade-out 애니메이션
4. 자식 댓글도 재귀적으로 삭제됨

## 트러블슈팅

### Three.js 성능 최적화
- 공 개수 제한 (예: 최대 100개)
- InstancedMesh 사용 검토
- LOD (Level of Detail) 적용

### Path Model 성능
- path 컬럼에 인덱스 추가 (이미 스키마에 포함)
- 깊은 트리 쿼리 시 limit 사용

### WebSocket 연결 관리
- 재연결 로직 구현
- 하트비트 체크
- 연결 풀 관리

## 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License

## 참고 자료

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5 (Auth.js)](https://authjs.dev/)
- [Socket.IO](https://socket.io/docs/v4/)
- [Path Model Pattern](https://www.postgresql.org/docs/current/ltree.html)

## 개발 노트

### Path Model vs Adjacency List
- **Adjacency List** (parentId): 간단하지만 깊은 트리 조회 시 재귀 쿼리 필요
- **Path Model**: 문자열 기반으로 단일 쿼리로 전체 트리 조회 가능, 정렬 자동 보장

### Soft Delete의 필요성
- 즉시 삭제 시 트리 구조 깨짐
- Orphan check를 통해 안전하게 제거
- 복구 기능 구현 가능성

### WebSocket vs Polling
- WebSocket: 실시간성 우수, 서버 부하 낮음
- Polling: 구현 간단, 서버 부하 높음
- → **WebSocket 선택**: 3D 공간 동기화에는 실시간성 필수

---

**Last Updated**: 2024-12-08
**Version**: 0.1.0 (Initial Setup)
