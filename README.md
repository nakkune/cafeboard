# Community Board Platform (CafeBoard)

Naver 카페 스타일의 커뮤니티 게시판 플랫폼

## 프로젝트 구조

```
cafeboard/
├── backend/          # Express + TypeScript + Prisma 백엔드
├── frontend/         # React + Vite + TypeScript 프론트엔드
└── PRD.md           # 프로젝트 요구사항 문서
```

## 기술 스택

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT 인증
- bcryptjs (비밀번호 해싱)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Zustand (상태 관리)
- Lucide React (아이콘)

## 시작하기

### 사전 요구사항
- Node.js 18+
- PostgreSQL 15+

### 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 DATABASE_URL을 설정하세요

# 데이터베이스 마이그레이션
npx prisma migrate dev
npx prisma generate

# 개발 서버 실행
npm run dev
```

### 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 접속
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## 주요 기능

### Phase 1 - Foundation (완료)
- [x] 프로젝트 셋업
- [x] 데이터베이스 스키마 구현
- [x] Prisma 설정

### Phase 2 - Core (완료)
- [x] 인증 시스템 (회원가입, 로그인, JWT)
- [x] 게시글 CRUD
- [x] 기본 UI 구현

### Phase 3 - Interaction (진행 예정)
- [ ] 댓글/대댓글 시스템
- [ ] 추천/스크랩 기능
- [ ] 검색 기능
- [ ] 실시간 알림

### Phase 4 - Polish (진행 예정)
- [ ] 관리자 페이지
- [ ] 반응형 디자인 완료
- [ ] 성능 최적화

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/refresh` - 토큰 갱신

### 게시글
- `GET /api/posts` - 게시글 목록
- `GET /api/posts/:id` - 게시글 상세
- `POST /api/posts` - 게시글 작성 (인증 필요)
- `PUT /api/posts/:id` - 게시글 수정 (인증 필요)
- `DELETE /api/posts/:id` - 게시글 삭제 (인증 필요)

## 라이선스

MIT
