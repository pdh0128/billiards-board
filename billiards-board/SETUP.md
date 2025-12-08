# 🚀 빠른 시작 가이드

## 1단계: 데이터베이스 설정

### Option A: 로컬 PostgreSQL 사용

```bash
# PostgreSQL 설치 (Mac)
brew install postgresql@16
brew services start postgresql@16

# 데이터베이스 생성
createdb billiards_board
```

### Option B: 클라우드 PostgreSQL 사용

**PlanetScale** (추천)
1. https://planetscale.com 가입
2. 새 데이터베이스 생성
3. Connection String 복사

**Supabase**
1. https://supabase.com 가입
2. 새 프로젝트 생성
3. Settings > Database > Connection String 복사

## 2단계: 환경 변수 설정

[.env.local](.env.local) 파일의 `DATABASE_URL`을 실제 데이터베이스 연결 문자열로 수정:

```env
# 로컬 PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/billiards_board?schema=public"

# 또는 PlanetScale
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/billiards_board?sslaccept=strict"

# 또는 Supabase
DATABASE_URL="postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres"
```

## 3단계: Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
npm run db:generate

# 데이터베이스 마이그레이션 (개발 환경)
npm run db:migrate

# 또는 마이그레이션 없이 스키마 푸시 (PlanetScale 사용 시)
npm run db:push
```

## 4단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 5단계: Prisma Studio로 데이터 확인 (선택)

```bash
npm run db:studio
```

브라우저에서 [http://localhost:5555](http://localhost:5555) 접속

## 🎯 다음 단계

초기 설정이 완료되었습니다! 이제 Week 1의 남은 작업을 진행하세요:

### Week 1 체크리스트

- [x] Next.js 프로젝트 초기화
- [x] 패키지 설치
- [x] 디렉토리 구조 생성
- [x] Prisma 스키마 설계
- [x] 환경 변수 설정
- [x] TypeScript 타입 정의
- [x] 기본 Three.js 씬 구성
- [ ] **Prisma 마이그레이션 실행** ⬅️ 지금 여기!
- [ ] 익명 인증 구현 (Auth.js UUID)
- [ ] 글 작성 API 구현 (/api/article POST)
- [ ] 글 → 공 생성 연동

### 다음 구현할 기능

1. **익명 인증 시스템**
   - NextAuth.js 설정
   - UUID 기반 익명 사용자 생성
   - 세션 관리

2. **글 작성 API**
   - POST /api/article 엔드포인트
   - 3D 공간 내 랜덤 위치 생성
   - DB 저장 및 WebSocket 브로드캐스트

3. **Three.js 공 렌더링**
   - Article 데이터를 Ball 컴포넌트로 변환
   - 초기 씬 로딩
   - 클릭 이벤트 처리

## 📝 유용한 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버
npm start

# Lint
npm run lint

# Prisma 명령어
npm run db:generate    # Prisma Client 생성
npm run db:migrate     # 마이그레이션 생성 및 적용
npm run db:push        # 스키마를 DB에 직접 푸시
npm run db:studio      # Prisma Studio 실행
```

## 🔍 트러블슈팅

### 1. Prisma 마이그레이션 실패

```bash
# 마이그레이션 초기화
rm -rf prisma/migrations
npm run db:migrate

# 또는 강제 푸시
npm run db:push -- --force-reset
```

### 2. Three.js 렌더링 안 됨

- 브라우저 콘솔 확인
- WebGL 지원 여부 확인: https://get.webgl.org/
- GPU 드라이버 업데이트

### 3. Socket.IO 연결 실패

- 3001 포트가 사용 가능한지 확인
- 방화벽 설정 확인
- .env.local의 SOCKET_PORT 확인

### 4. TypeScript 에러

```bash
# node_modules와 .next 삭제 후 재설치
rm -rf node_modules .next
npm install
```

## 📚 참고 문서

- 프로젝트 개요: [README.md](README.md)
- 상세 개발 계획: [claude.md](claude.md)
- Prisma 스키마: [prisma/schema.prisma](prisma/schema.prisma)

---

**Happy Coding! 🎱**
