# 🎱 Billiards Board - 단계별 구현 계획

## 📅 전체 로드맵

### ✅ 완료된 작업
- [x] Next.js 프로젝트 초기화
- [x] 패키지 설치 (Three.js, Prisma, Auth.js, Socket.IO, anime.js)
- [x] 디렉토리 구조 생성
- [x] Prisma 스키마 설계 (Path Model)
- [x] SQLite 데이터베이스 생성
- [x] 기본 Three.js 씬 구성
- [x] 환경 변수 설정

---

## 📍 현재 진행: WEEK 1 - Core Setup + 기본 글 생성 흐름

### Phase 1: 익명 인증 시스템 (30분)
**목표**: UUID 기반 익명 사용자 생성 및 세션 관리

#### 1.1 NextAuth.js 설정
- [ ] `/app/api/auth/[...nextauth]/route.ts` 생성
- [ ] Credentials Provider로 익명 UUID 발급
- [ ] Session callback에서 userId 포함

#### 1.2 인증 미들웨어
- [ ] `lib/auth.ts` - 인증 헬퍼 함수
- [ ] `middleware.ts` - 자동 사용자 생성

#### 1.3 테스트
- [ ] 브라우저에서 자동 로그인 확인
- [ ] UUID 세션 유지 확인

**파일:**
- `app/api/auth/[...nextauth]/route.ts`
- `lib/auth.ts`
- `middleware.ts`

---

### Phase 2: 글 작성 API (45분)
**목표**: 글 생성 API 및 랜덤 위치 할당

#### 2.1 API Route 생성
- [ ] `/app/api/article/route.ts` (POST)
- [ ] Request validation (content)
- [ ] 랜덤 3D 위치 생성 로직
- [ ] DB 저장 (Prisma)

#### 2.2 위치 생성 알고리즘
- [ ] `utils/position.ts` 생성
- [ ] 공간 내 랜덤 분포 (sphere volume)
- [ ] 충돌 방지 로직 (기본)

#### 2.3 테스트
- [ ] Postman/Thunder Client로 API 테스트
- [ ] DB에 데이터 저장 확인

**파일:**
- `app/api/article/route.ts`
- `utils/position.ts`

---

### Phase 3: 글 작성 UI (1시간)
**목표**: 사용자가 글을 작성할 수 있는 UI

#### 3.1 글 작성 폼 컴포넌트
- [ ] `components/ui/article-form.tsx`
- [ ] Textarea + Submit 버튼
- [ ] shadcn/ui Dialog 사용

#### 3.2 상태 관리
- [ ] React Hook Form (선택)
- [ ] 제출 시 API 호출
- [ ] Optimistic UI 업데이트

#### 3.3 UI 배치
- [ ] 화면 우측 하단 FAB (Floating Action Button)
- [ ] 클릭 시 Dialog 오픈

**파일:**
- `components/ui/article-form.tsx`
- `components/ui/dialog.tsx` (shadcn/ui)

---

### Phase 4: 공 생성 및 애니메이션 (1.5시간)
**목표**: 글 데이터를 Three.js 공으로 렌더링 + anime.js 애니메이션

#### 4.1 Ball 컴포넌트 업데이트
- [ ] 공 생성 시 fade-in 애니메이션
- [ ] anime.js로 scale 0 → 1
- [ ] 탄성 효과 (elastic easing)

#### 4.2 BallManager 업데이트
- [ ] API에서 Article 목록 fetch
- [ ] Ball 컴포넌트 배열 렌더링
- [ ] 새 글 추가 시 애니메이션

#### 4.3 인터랙션
- [ ] 마우스 호버 시 확대
- [ ] 클릭 시 content 표시 (Toast)

**파일:**
- `components/three/Ball.tsx` (업데이트)
- `components/three/BallManager.tsx` (업데이트)
- `hooks/useArticles.ts` (새 생성)

---

### Phase 5: WebSocket 서버 구현 (1시간)
**목표**: Socket.IO 서버 설정 및 실시간 동기화

#### 5.1 Socket.IO 서버 설정
- [ ] `server.js` 생성 (별도 서버) 또는
- [ ] Next.js API Routes에 통합
- [ ] CORS 설정

#### 5.2 이벤트 핸들러
- [ ] `createArticle` - 새 글 브로드캐스트
- [ ] `syncState` - 초기 상태 전송
- [ ] 연결/연결 해제 로그

#### 5.3 클라이언트 통합
- [ ] `useSocket.ts` 업데이트
- [ ] BallManager에서 이벤트 수신
- [ ] 실시간 공 추가

**파일:**
- `server.js` (또는 API Route)
- `lib/socket-server.ts` (업데이트)
- `hooks/useSocket.ts` (업데이트)

---

### Phase 6: 통합 테스트 (30분)
**목표**: Week 1 기능 통합 및 버그 수정

#### 6.1 시나리오 테스트
- [ ] 글 작성 → 공 생성 → 애니메이션 확인
- [ ] 여러 탭에서 실시간 동기화 확인
- [ ] 새로고침 시 기존 공 유지 확인

#### 6.2 버그 수정
- [ ] 애니메이션 중복 실행 방지
- [ ] 공 위치 겹침 방지
- [ ] WebSocket 재연결 처리

---

## 🔜 WEEK 2 - 댓글 구조 + 충돌 시스템 (다음 주)

### Phase 7: 충돌 감지 시스템
- [ ] BoundingSphere 충돌 감지
- [ ] 충돌 시 댓글 생성 UI
- [ ] Path Model 댓글 저장

### Phase 8: 계층형 공 배치
- [ ] 부모 공 주변 orbit 배치
- [ ] depth별 색상 변화
- [ ] 애니메이션 적용

---

## 🔜 WEEK 3 - 삭제 시스템 + 큐대 구현

### Phase 9: Raycaster 큐대
- [ ] 클릭 감지
- [ ] 큐대 시각화
- [ ] 삭제 애니메이션

### Phase 10: 재귀 삭제
- [ ] Soft/Hard Delete 로직
- [ ] 자식 댓글 cascade
- [ ] WebSocket 삭제 이벤트

---

## 🔜 WEEK 4 - UX 정리 + 배포

### Phase 11: 무한 스크롤
- [ ] 커서 기반 페이지네이션
- [ ] 스크롤 시 추가 로딩

### Phase 12: 최종 UX
- [ ] 사용자 가이드
- [ ] 성능 최적화
- [ ] Vercel 배포

---

## 📝 오늘 완료 목표 (Week 1 전체)

- [x] 프로젝트 초기 설정
- [ ] 익명 인증 (30분)
- [ ] 글 작성 API (45분)
- [ ] 글 작성 UI (1시간)
- [ ] 공 생성 + 애니메이션 (1.5시간)
- [ ] WebSocket 서버 (1시간)
- [ ] 통합 테스트 (30분)

**예상 소요 시간**: 5.5시간

---

## 🎯 다음 작업

**지금 시작**: Phase 1 - 익명 인증 시스템 구현
