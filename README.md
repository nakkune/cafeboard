# 🚀 CafeBoard: Premium Community Suite

**CafeBoard**는 현대적이고 세련된 UI/UX를 지향하는 올인원 커뮤니티 플랫폼입니다. 게시판을 넘어 실시간 채팅, 워크스페이스(문서 관리), 동영상 허브, 사진첩 등의 다양한 기능을 하나의 생태계로 통합한 엔터프라이즈급 오픈 소스 솔루션입니다.

---

## ✨ 주요 기능 (Key Features)

현재 CafeBoard는 다음과 같은 프리미엄 기능들을 완벽하게 제공합니다:

### 📱 커뮤니티 & 게시판
- **카테고리 기반 게시판**: 공지사항, 자유게시판, Q&A 등 맞춤형 카테고리 관리
- **프리미엄 UI**: Glassmorphism 및 현대적인 디자인 시스템 적용
- **다국어 지원**: i18next 기반의 한국어/영어 전환 시스템

### 📸 미디어 허브
- **사진첩 (Gallery)**: 고화질 이미지 공유 및 전용 갤러리 뷰 인터페이스
- **동영상 허브 (Video Hub)**: 서버 저장 미디어 및 YouTube 외부 링크 통합 지원
- **실시간 소통**: 사진과 영상에 대한 댓글 및 좋아요 반응 시스템

### 💬 실시간 협업 (Communication)
- **실시간 채팅**: Socket.io 기반의 공개/비공개 채널 소통
- **Direct Message (DM)**: 사용자 간 1:1 비밀 메시지 기능
- **알림 시스템**: 새로운 게시글 및 메시지에 대한 실시간 알림

### 📝 생산성 도구 (Productivity)
- **워크스페이스 (Taskspace)**: Notion 스타일의 블록 기반 문서 편집 및 관리
- **캘린더 (Calendar)**: 개인 및 팀 일정을 관리할 수 있는 인터랙티브 캘린더

### 🛠 관리자 도구 (Management)
- **관리자 대시보드**: 사용자 승인/거절, 권한 관리, 시스템 설정 통합 제어
- **점검 모드 (Maintenance)**: 사이트 전체 또는 특정 섹션 점검 모드 전환 기능

---

## 🏗 프로젝트 구조 (Monorepo)

```text
cafeboard/
├── backend/          # Node.js + Express + Prisma + Socket.io
├── frontend/         # React + Vite + Zustand + Tailwind CSS
├── .github/          # CI/CD (GitHub Actions) 설정
├── k8s/              # Kubernetes 배포 매니페스트 (PostgreSQL 등)
├── docker-compose.yml # 컨테이너 오케스트레이션 설정
└── PRD.md            # 상세 제품 요구사항 문서
```

---

## 🛠 기술 스택 (Tech Stack)

### Backend
- **Core**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Dockerized)
- **ORM**: Prisma (Type-safe Database Access)
- **Authentication**: JWT (JSON Web Token), bcryptjs
- **Real-time**: Socket.io

### Frontend
- **Framework**: React 18, Vite
- **Styling**: Tailwind CSS, Lucide Icons, Framer Motion
- **State**: Zustand
- **I18n**: react-i18next

### Infrastructure & DevOps
- **Container**: Docker, Docker Compose
- **Orchestration**: Kubernetes (Ready)
- **CI/CD**: GitHub Actions (Safe Mode 포함)

---

## 🚀 빠른 시작 (Quick Start)

### 1. Docker Compose를 통한 원클릭 실행 (추천)
```bash
# 전체 서비스(DB, Backend, Frontend)를 컨테이너로 실행
docker-compose up -d
```

### 2. 로컬 수동 실행

#### 백엔드 (Backend)
```bash
cd backend
npm install
cp .env.example .env # DATABASE_URL 설정 필요
npx prisma migrate dev
npm run dev
```

#### 프론트엔드 (Frontend)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 보안 및 기여 (Security & Contribution)

- 이 프로젝트는 강력한 `.gitignore` 설정을 통해 민감한 정보 유출을 차단합니다.
- **CI/CD**: `.github/workflows/ci.yml`을 통해 코드 품질(Lint, Typecheck)을 자동으로 검증합니다 (현재 수동/비차단 모드).
- 모든 코드 기여는 시니어 개발자의 관점에서 작성된 스타일 가이드를 준수합니다.

---

## 📜 라이선스

이 프로젝트는 MIT 라이선스에 따라 자유롭게 사용할 수 있습니다.

