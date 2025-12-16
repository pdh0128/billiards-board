# 🎱 Billiards Board

Three.js 기반 3D 인터랙티브 게시판 - 공으로 글을 쓰고, 충돌로 댓글을 남기고, 큐대로 삭제하세요. (실시간 WebSocket 동기화는 제거되어 폴링/새로고침 기반으로 동작합니다.)

![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)
![Three.js](https://img.shields.io/badge/Three.js-Latest-green.svg)

## ✨ 주요 특징

- **📝 글 = 공 생성**: 익명으로 글을 작성하면 3D 공간에 공이 생성됩니다
- **💬 충돌 = 댓글**: 공끼리 충돌시켜 댓글을 작성합니다
- **🎯 큐대 타격 = 삭제**: Raycaster로 공을 클릭하여 삭제합니다
- **🌳 무한 댓글 깊이**: Path Model 기반으로 depth 제한 없는 트리 구조를 지원합니다
- **🗑️ 재귀 삭제**: 공을 삭제하면 자식 댓글도 함께 제거됩니다

## 🚀 시작하기

### 필수 요구사항

- Node.js 20 이상
- PostgreSQL 데이터베이스
- npm / yarn / pnpm

### 설치

1. 저장소 클론

```bash
git clone https://github.com/yourusername/billiards-board.git
cd billiards-board
```

2. 패키지 설치

```bash
npm install
```

3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

4. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. 개발 서버 실행

```bash
npm run dev
```

6. 브라우저에서 확인

[http://localhost:3000](http://localhost:3000)

## 🛠️ 기술 스택

### Frontend
- **Next.js 16** - React 프레임워크 (App Router)
- **React 19** - UI 라이브러리
- **Three.js** - 3D 그래픽 라이브러리
- **@react-three/fiber** - React용 Three.js 렌더러
- **@react-three/drei** - Three.js 헬퍼 컴포넌트
- **Tailwind CSS 4** - 유틸리티 CSS 프레임워크
- **TypeScript 5** - 타입 안전성

### Backend
- **Prisma ORM** - 데이터베이스 ORM
- **PostgreSQL** - 관계형 데이터베이스
- **NextAuth.js v5** - 인증 (익명 UUID 기반)

## 📁 프로젝트 구조

```
billiards-board/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── article/      # 글 CRUD
│   │   ├── comment/      # 댓글 CRUD
│   │   └── auth/         # 인증
│   └── page.tsx          # 메인 페이지
├── components/
│   ├── three/            # Three.js 컴포넌트
│   │   ├── Scene.tsx    # 3D 씬
│   │   ├── Ball.tsx     # 개별 공
│   │   └── BallManager.tsx
│   └── ui/              # UI 컴포넌트
├── lib/
│   └── prisma.ts        # Prisma 클라이언트
├── utils/
│   ├── path.ts          # Path Model 유틸
│   └── delete.ts        # 재귀 삭제 로직
├── types/
│   └── index.ts         # TypeScript 타입
└── prisma/
    └── schema.prisma    # DB 스키마
```

## 📖 핵심 개념

### Path Model

댓글의 계층 구조를 문자열 경로로 표현하는 방식:

```
001                # 1번째 최상위 댓글
001.001           # 1번째 댓글의 1번째 대댓글
001.002           # 1번째 댓글의 2번째 대댓글
001.002.001       # 1-2 댓글의 1번째 답글
```

**장점:**
- ✅ depth 제한 없음
- ✅ 문자열 정렬로 트리 자동 구성
- ✅ 단일 쿼리로 전체 트리 조회 가능

### 2단계 삭제 시스템

1. **Soft Delete**: `isDeleted = true` 마킹
2. **Hard Delete**: Orphan Check 후 실제 DB 삭제

이를 통해 트리 구조를 안전하게 유지하면서 재귀적으로 삭제합니다.

## 🗺️ 로드맵

- [x] Week 1: 프로젝트 초기 설정
- [ ] Week 2: 댓글 구조 + 충돌 시스템
- [ ] Week 3: 삭제 시스템 + 큐대 구현
- [ ] Week 4: UX 정리 + 배포

자세한 개발 계획은 [claude.md](claude.md)를 참조하세요.

## 🤝 기여하기

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 📞 문의

프로젝트 이슈: [GitHub Issues](https://github.com/yourusername/billiards-board/issues)

## 🙏 감사의 말

- [Three.js](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://authjs.dev/)

---

**Made with ❤️ and Three.js**
