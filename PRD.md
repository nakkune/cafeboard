# PRD: Naver 카페 스타일 게시판 플랫폼

## 1. 제품 개요

| 항목 | 내용 |
|------|------|
| **제품명** | Community Board Platform |
| **버전** | 1.0.0 MVP |
| **타겟** | 커뮤니티 기반 콘텐츠 플랫폼 |
| **데이터베이스** | PostgreSQL 15+ |
| **개발 기간** | 10주 |

---

## 2. 사용자 정의

### 2.1 타겟 사용자
- **일반 회원**: 콘텐츠 열론 및 작성
- **운영진**: 게시판 관리 및 회원 관리
- **관리자**: 시스템 전체 관리

### 2.2 사용자 여정
```
방문자 → 회원가입 → 게시글 열론 → 댓글 작성 → 게시글 작성 → 팔로우/구독
```

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1 인증 시스템 (FR-AUTH)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| AUTH-001 | 이메일 기반 회원가입 | P0 |
| AUTH-002 | JWT 기반 로그인/로그아웃 | P0 |
| AUTH-003 | 비밀번호 찾기 (이메일 인증) | P1 |
| AUTH-004 | 소셜 로그인 (Google, Naver, Kakao) | P1 |
| AUTH-005 | 프로필 관리 (닉네임, 이미지, 소개) | P1 |

### 3.2 게시판 시스템 (FR-BOARD)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| BOARD-001 | 카테고리별 게시판 구성 | P0 |
| BOARD-002 | 게시글 CRUD (작성/조회/수정/삭제) | P0 |
| BOARD-003 | WYSIWYG 에디터 지원 | P0 |
| BOARD-004 | 이미지/파일 첨부 (최대 10MB) | P0 |
| BOARD-005 | 게시글 검색 (제목, 내용, 작성자, 태그) | P0 |
| BOARD-006 | 페이지네이션 (10/20/50개 선택) | P0 |
| BOARD-007 | 정렬 (최신순, 조회순, 추천순) | P1 |
| BOARD-008 | 게시글 임시저장 | P1 |
| BOARD-009 | 공지사항 상단 고정 | P1 |
| BOARD-010 | 비밀글 설정 | P2 |

### 3.3 댓글/상호작용 (FR-INTERACT)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| INTER-001 | 댓글 CRUD | P0 |
| INTER-002 | 대댓글 (계층형 댓글, 최대 3 depth) | P0 |
| INTER-003 | 게시글 추천/비추천 | P1 |
| INTER-004 | 댓글 추천 | P1 |
| INTER-005 | 게시글 스크랩 | P1 |
| INTER-006 | 신고 기능 (게시글/댓글) | P2 |
| INTER-007 | 실시간 알림 | P2 |

### 3.4 관리 기능 (FR-ADMIN)

| ID | 요구사항 | 우선순위 |
|----|---------|---------|
| ADMIN-001 | 카테고리/게시판 생성 및 관리 | P1 |
| ADMIN-002 | 회원 권한 관리 | P1 |
| ADMIN-003 | 게시글/댓글 관리 (숨김/삭제) | P1 |
| ADMIN-004 | 신고 내역 관리 | P2 |
| ADMIN-005 | 통계 대시보드 | P2 |

---

## 4. 기술 요구사항 (Technical Requirements)

### 4.1 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite |
| State Management | Zustand 또는 Redux Toolkit |
| UI Library | Tailwind CSS + Headless UI |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15+ |
| File Storage | AWS S3 또는 Cloudinary |
| Real-time | Socket.io |
| Search | PostgreSQL Full-text Search |

### 4.2 데이터베이스 스키마 (PostgreSQL)

```sql
-- Users 테이블
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    profile_image VARCHAR(500),
    bio TEXT,
    role VARCHAR(20) DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories 테이블 (게시판 카테고리)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    read_permission VARCHAR(20) DEFAULT 'all',
    write_permission VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts 테이블
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    is_notice BOOLEAN DEFAULT false,
    is_secret BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'published',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post_Images 테이블
CREATE TABLE post_images (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments 테이블 (계층형 댓글)
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes 테이블 (게시글/댓글 좋아요)
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, target_type, target_id)
);

-- Scraps 테이블
CREATE TABLE scraps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- Reports 테이블 (신고)
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    target_type VARCHAR(20) NOT NULL,
    target_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Notifications 테이블
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions 테이블 (Refresh Token)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_posts_category ON posts(category_id);
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
```

---

## 5. API 명세

### 5.1 인증 API

```
POST   /api/auth/register        - 회원가입
POST   /api/auth/login           - 로그인
POST   /api/auth/logout          - 로그아웃
POST   /api/auth/refresh         - 토큰 갱신
POST   /api/auth/forgot-password - 비밀번호 찾기
PUT    /api/auth/reset-password  - 비밀번호 재설정
```

### 5.2 사용자 API

```
GET    /api/users/me             - 내 정보 조회
PUT    /api/users/me             - 내 정보 수정
PUT    /api/users/me/password    - 비밀번호 변경
PUT    /api/users/me/image       - 프로필 이미지 업로드
GET    /api/users/:id/posts      - 특정 유저 게시글
GET    /api/users/me/scraps      - 내 스크랩 목록
```

### 5.3 게시판 API

```
GET    /api/categories           - 카테고리 목록
GET    /api/categories/:id       - 카테고리 상세 + 게시글
POST   /api/categories           - 카테고리 생성 (관리자)

GET    /api/posts                - 게시글 목록 (검색, 필터링)
POST   /api/posts                - 게시글 작성
GET    /api/posts/:id            - 게시글 상세
PUT    /api/posts/:id            - 게시글 수정
DELETE /api/posts/:id            - 게시글 삭제
POST   /api/posts/:id/like       - 추천/비추천
POST   /api/posts/:id/scrap      - 스크랩
```

### 5.4 댓글 API

```
GET    /api/posts/:id/comments   - 댓글 목록
POST   /api/comments             - 댓글 작성
PUT    /api/comments/:id         - 댓글 수정
DELETE /api/comments/:id         - 댓글 삭제
POST   /api/comments/:id/like    - 댓글 추천
```

### 5.5 관리자 API

```
GET    /api/admin/users          - 회원 목록
PUT    /api/admin/users/:id/role - 권한 변경
GET    /api/admin/reports        - 신고 목록
PUT    /api/admin/reports/:id    - 신고 처리
GET    /api/admin/stats          - 통계 데이터
```

---

## 6. UI/UX 요구사항

### 6.1 화면 목록

| 화면 | 설명 |
|------|------|
| **로그인/회원가입** | 소셜 로그인 포함, 폼 유효성 검사 |
| **메인 페이지** | 카테고리 목록, 인기 게시글, 최신 게시글 |
| **게시판 목록** | 게시글 리스트, 검색바, 필터, 페이지네이션 |
| **게시글 상세** | 본문, 작성자 정보, 댓글, 추천 버튼 |
| **게시글 작성/수정** | WYSIWYG 에디터, 이미지 업로드, 카테고리 선택 |
| **마이페이지** | 내 게시글, 댓글, 스크랩, 프로필 수정 |
| **알림 페이지** | 실시간 알림 목록 |
| **관리자 페이지** | 대시보드, 회원관리, 게시글 관리, 신고관리 |

### 6.2 반응형 브레이크포인트

- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### 6.3 성능 요구사항

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **API 응답 시간**: < 200ms (p95)

---

## 7. 비기능 요구사항 (Non-Functional Requirements)

### 7.1 보안

- [ ] HTTPS 강제
- [ ] JWT 토큰 HttpOnly Cookie 저장
- [ ] XSS 방지 (DOMPurify)
- [ ] CSRF 토큰
- [ ] SQL Injection 방지 (Prisma Parameterized Query)
- [ ] 파일 업로드 검증 (MIME 타입, 크기 제한)
- [ ] Rate Limiting (API: 100req/min, 로그인: 5req/min)

### 7.2 확장성

- [ ] 수평적 스케일링 지원 (Stateless 서버)
- [ ] 이미지 CDN 활용
- [ ] DB Connection Pooling
- [ ] 캐싱 전략 (Redis 고려)

### 7.3 가용성

- [ ] Uptime: 99.5%+
- [ ] 자동 백업 (일일 1회)
- [ ] 롤백 전략 수립

---

## 8. 성공 지표 (KPI)

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| **DAU (일일 활성 사용자)** | 1,000명 | 로그인 로그 분석 |
| **게시글 작성률** | 30% | 가입자 대비 작성자 비율 |
| **댓글 참여율** | 20% | 게시글 대비 댓글 비율 |
| **페이지 로드 시간** | < 2초 | Lighthouse 점수 90+ |
| **API 에러율** | < 1% | 로그 모니터링 |

---

## 9. 개발 로드맵

### Phase 1: Foundation (Week 1-2)

- [ ] 프로젝트 셋업 (React + Express + PostgreSQL + Prisma)
- [ ] 데이터베이스 스키마 구현
- [ ] CI/CD 파이프라인 구축
- [ ] 기본 인프라 설정

### Phase 2: Core (Week 3-5)

- [ ] 인증 시스템 완료
- [ ] 게시글 CRUD
- [ ] 파일 업로드
- [ ] 기본 UI 구현

### Phase 3: Interaction (Week 6-7)

- [ ] 댓글/대댓글 시스템
- [ ] 추천/스크랩 기능
- [ ] 검색 기능
- [ ] 실시간 알림 (Socket.io)

### Phase 4: Polish (Week 8-9)

- [ ] 관리자 페이지
- [ ] 반응형 디자인 완료
- [ ] 성능 최적화
- [ ] 보안 강화

### Phase 5: Launch (Week 10)

- [ ] 최종 테스트
- [ ] 버그 수정
- [ ] 배포
- [ ] 모니터링 설정

---

## 10. 리스크 및 대응

| 리스크 | 가능성 | 영향도 | 대응책 |
|--------|--------|--------|--------|
| **파일 저장 용량 부족** | 중간 | 높음 | S3 사용, 용량 모니터링 |
| **동시 접속자 증가** | 낮음 | 높음 | 로드밸런서, 오토스케일링 |
| **보안 취약점 발견** | 낮음 | 높음 | 정기 보안 패치, 취약점 스캔 |
| **DB 성능 저하** | 중간 | 중간 | 인덱스 최적화, 쿼리 튜닝 |

---

## 11. 승인

| 역할 | 이름 | 서명 | 날짜 |
|------|------|------|------|
| 프로덕트 매니저 | | | |
| 기술 리드 | | | |
| 개발자 | | | |

---

**문서 버전**: 1.0  
**최종 수정일**: 2026-02-12  
**다음 검토일**: 개발 4주차
