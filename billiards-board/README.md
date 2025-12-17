# Vote Board

> **배포 URL**: [gc.comdoapp.net](https://gc.comdoapp.net)
> **테스트 계정**: 제공 예정 (자유 가입 후 사용)

## 📌 프로젝트 소개

커서 기반 무한 스크롤, 1인 1표 투표, Path Model 계층형 댓글을 제공하는 풀스택 Next.js 게시판입니다. 3D·소켓 의존성을 제거하고 게시판 본연의 흐름에 집중하도록 리빌드했습니다.

- **개발 기간**: 2024.12.01 ~ 2024.12.18
- **개발 인원**: 1인 (개인 프로젝트)

---

## 🔍 개선 사항

### 기존 코드의 문제점

| 문제점 | 개선 방법 |
|--------|----------|
| 전체 목록 일괄 로드로 최초 진입이 느리고 불필요한 응답 크기 증가 | 커서 기반 페이지네이션(`cursor`, `nextCursor`, `hasMore`)으로 점진 로드 |
| 중첩 댓글 삭제 시 고아 노드와 정렬 깨짐 | Path 기반 depth 저장 + 자식 포함 소프트 삭제 후 고아 정리 루프 도입 |
| 좋아요/싫어요 중복 투표 발생 | `postId_userId` 유니크 키와 업서트로 1인 1표 강제 |

### 개선 결과

**개선 1: 커서 기반 무한 스크롤**

- **개선 전**: 첫 페이지에서 전체 게시글을 받아와 화면 렌더와 네트워크 지연이 컸음
- **개선 후**: `limit` 단위로 필요한 데이터만 로드해 초기 렌더가 짧아지고 스크롤 체감 속도 향상

**개선 2: Path Model 댓글 재귀 정리**

- **개선 전**: 부모 댓글 삭제 후 자식이 남아 순서가 꼬이거나 UI에 노출되지 않는 경우 발생
- **개선 후**: path-prefix 기반 소프트 삭제와 고아 정리 반복으로 트리 무결성 유지, 삭제 후에도 depth/정렬 일관성 확보

**개선 3: 투표 무결성**

- **개선 전**: 좋아요/싫어요를 번갈아 누르면 기록이 중복되고 집계가 왜곡됨
- **개선 후**: 업서트 + 집계 그룹바이로 최신 선택만 반영, 실시간 합산값 반환

---

## ✨ 주요 기능

### 1. 사용자 인증
- 회원가입 / 로그인 / 로그아웃
- PBKDF2 해시 기반 자격 증명 + JWT(24h) 쿠키 발급

### 2. 게시글 관리
- 게시글 CRUD
- 커서 기반 무한 스크롤 목록과 좋아요·싫어요 1인 1표 투표

### 3. 댓글 기능
- 댓글 CRUD
- Path Model 기반 계층형 댓글 및 재귀적 삭제/고아 정리

---

## 🛠️ 기술 스택

### Backend
- Next.js 16 App Router (API Routes)
- Prisma 5 + SQLite (기본) / 타 RDB 호환
- 커스텀 JWT 인증 + PBKDF2 패스워드 해시

### Frontend
- Next.js 16 (React 19)
- Tailwind CSS 4
- TypeScript 5

### Deployment
- Frontend/Backend: Vercel (커스텀 도메인 `gc.comdoapp.net`)
- Database: SQLite(개발) / Prisma로 Postgres 등 전환 가능

---

## 📂 프로젝트 구조
```
billiards-board/
├── app/
│   ├── api/
│   │   ├── posts/               # 게시글 CRUD, 투표
│   │   ├── comments/            # 댓글 CRUD + 계층형 삭제
│   │   └── auth/                # 회원가입/로그인(JWT)
│   ├── page.tsx                 # 목록 진입점 (무한 스크롤)
│   ├── posts/[id]/page.tsx      # 게시글 상세 + 댓글/투표
│   └── posts/new/page.tsx       # 글 작성
├── lib/prisma.ts                # Prisma 클라이언트
├── utils/path.ts                # Path Model 유틸 (depth/path 생성)
└── prisma/schema.prisma         # 스키마 및 인덱스 정의
```

---

## 🔗 API 명세

### 인증

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | 회원가입 |
| POST | `/api/auth/login` | 로그인 |

### 게시글

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts?cursor={id}&limit={limit}` | 게시글 목록 조회(커서 페이징) |
| GET | `/api/posts/{id}` | 게시글 상세 조회 |
| POST | `/api/posts` | 게시글 작성 |
| PATCH | `/api/posts/{id}` | 게시글 수정 |
| DELETE | `/api/posts/{id}` | 게시글 삭제 |
| POST | `/api/posts/{id}/vote` | 좋아요/싫어요 투표(1인 1표) |

### 댓글

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments?postId={postId}&cursor={path}&limit={size}` | 댓글 목록 조회(커서) |
| POST | `/api/comments` | 댓글 작성(루트/대댓글) |
| DELETE | `/api/comments/{id}` | 댓글 삭제(자식 포함) |

---

## 💻 로컬 실행 방법

### 1. 레포지토리 클론
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### 2. 환경 변수 설정
`./.env.local` 예시
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

### 3. 의존성 설치 및 개발 서버 실행
```bash
npm install
npm run db:generate   # prisma client 생성
npm run dev           # http://localhost:3000
```

---

## 🎥 시연 영상

[YouTube 링크](https://youtu.be/gXIj_97NKJ4)

---

## 📚 참고 자료

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
