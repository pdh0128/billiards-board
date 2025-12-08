# Supabase 연결 문제 해결

## 현재 상황
Transaction Mode Pooler로 연결 시도 중이나 응답이 없음

## 해결 방법

### 1. Supabase 프로젝트 상태 확인
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 상태가 **"Paused"** 인지 확인
4. Paused 상태라면:
   - **"Restore"** 또는 **"Resume"** 버튼 클릭
   - 2-3분 대기 (프로젝트 활성화 시간)
   - Active 상태 확인 후 다시 시도

### 2. DB Push 재시도
```bash
npm run db:push
```

### 3. 대안: 로컬 SQLite 사용
개발 중에는 SQLite를 사용하는 것이 더 빠를 수 있습니다.

**prisma/schema.prisma 수정:**
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

**.env 수정:**
```env
DATABASE_URL="file:./prisma/dev.db"
```

그 후:
```bash
npm run db:push
npm run dev
```

배포 시에만 Supabase (PostgreSQL)를 사용하도록 설정

### 4. Direct Connection 재시도
Pooler가 느리다면 Direct Connection을 시도:

**.env 수정:**
```env
DATABASE_URL="postgresql://postgres:ilovecat0410%21@db.fkbqzlozuzidfheigqlf.supabase.co:5432/postgres?sslmode=require"
```

```bash
npm run db:push
```

## 권장 순서
1. Supabase 프로젝트 Active 상태 확인
2. Transaction Pooler로 재시도
3. Direct Connection 시도
4. 개발 중에는 SQLite 사용, 배포 시 PostgreSQL

---

현재 설정:
- Provider: PostgreSQL
- Mode: Transaction Pooler
- Host: aws-1-ap-south-1.pooler.supabase.com
- Port: 6543
