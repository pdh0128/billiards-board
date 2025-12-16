# 🗳️ Vote Board

커서 기반 무한 스크롤, 투표(좋아요/싫어요), Path Model 계층형 댓글을 제공하는 게시판입니다. 기존 3D/Socket 기능을 제거해 가벼운 게시판 형태로 재구성했습니다.

## ✨ 주요 특징

- **무한 스크롤**: 커서 기반 페이징으로 목록을 점진적으로 로드
- **투표 게시판**: 좋아요/싫어요 1인 1표, 중복 투표 방지
- **Path Model 댓글**: 무한 깊이 계층형 댓글, path 정렬 유지
- **재귀 삭제**: 자식 없는 삭제 댓글은 물리 삭제, 고아 부모도 연쇄 정리

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- sqlite(기본) 또는 원하는 DB

### 설치

```bash
npm install
npm run dev
```

`.env.local` 예시

```env
DATABASE_URL="file:./dev.db" # 필요 시 다른 DB URL로 교체
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

## 🛠️ 기술 스택

- Next.js 16 (App Router), React 19
- Tailwind CSS 4, TypeScript 5
- Prisma ORM (Vote/Comment Path Model)
- NextAuth.js v5 (JWT 기반)

## 📁 프로젝트 구조

```
billiards-board/
├── app/
│   ├── api/
│   │   ├── posts/            # 게시글 CRUD, 투표
│   │   ├── comments/         # 댓글 CRUD (Path Model)
│   │   └── auth/             # 인증
│   ├── posts/[id]/page.tsx   # 게시글 상세 + 댓글/투표
│   └── posts/new/page.tsx    # 글 작성
├── lib/prisma.ts
├── utils/path.ts             # Path Model 유틸
├── types/index.ts
└── prisma/schema.prisma
```

## 🗺️ 로드맵

- [x] 3D 보드 → 투표 게시판 전환
- [x] 커서 기반 무한 스크롤
- [x] Path Model 댓글 + 재귀 삭제
- [ ] 검색/태그/필터 추가

## 📄 라이선스

MIT License
