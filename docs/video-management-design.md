# 동영상 관리 화면 설계문

## 1. 개요
- **화면명**: 동영상 관리 (Videos)
- **기능**: 로컬 파일 업로드 및 외부 URL 연결 지원, 로그인 사용자 전체 CRUD, 검색/필터, 카테고리 분류
- **접근 권한**: 로그인한 모든 사용자 (본인 작성 영상만 수정/삭제)

---

## 2. 데이터 모델 (Backend)

### 2.1 Video 테이블 (Prisma)
```prisma
model Video {
  id          Int      @id @default(autoincrement())
  title       String
  description String?  @db.Text
  videoType   VideoType // 'local' | 'external'
  videoUrl    String    // 로컬: 저장된 파일 경로, 외부: URL
  thumbnailUrl String?  // 썸네일 URL
  duration    Int?      // 재생 시간 (초)
  categoryId  Int?
  category    Category? @relation(fields: [categoryId], references: [id])
  authorId    Int
  author      User      @relation(fields: [authorId], references: [id])
  viewCount   Int       @default(0)
  status      VideoStatus @default('published') // 'published' | 'hidden' | 'draft'
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

enum VideoType {
  local
  external
}

enum VideoStatus {
  published
  hidden
  draft
}
```

### 2.2 API 엔드포인트
| Method | Endpoint | Description | 권한 |
|--------|----------|-------------|------|
| GET | `/api/videos` | 동영상 목록 조회 (검색/필터) | 공개 |
| GET | `/api/videos/:id` | 동영상 상세 조회 | 공개 |
| POST | `/api/videos` | 동영상 등록 (로컬/외부) | 로그인 |
| PUT | `/api/videos/:id` | 동영상 수정 | 작성자 |
| DELETE | `/api/videos/:id` | 동영상 삭제 | 작성자 |

### 2.3 쿼리 파라미터
- `page`, `limit`: 페이지네이션
- `categoryId`: 카테고리 필터
- `search`: 제목/설명 검색
- `videoType`: `local` | `external` 필터

---

## 3. 프론트엔드 구조

### 3.1 파일 구조
```
frontend/src/
├── api/
│   └── videos.ts          # Video API 호출 함수
├── pages/
│   ├── VideoList.tsx     # 동영상 목록 (갤러리/리스트 View)
│   ├── VideoDetail.tsx   # 동영상 상세/재생
│   ├── CreateVideo.tsx   # 동영상 등록
│   └── EditVideo.tsx     # 동영상 수정
├── types/
│   └── index.ts          # Video 인터페이스 추가
```

### 3.2 타입 정의
```typescript
export interface Video {
  id: number;
  title: string;
  description?: string;
  videoType: 'local' | 'external';
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  categoryId?: number;
  category?: Category;
  authorId: number;
  author?: User;
  viewCount: number;
  status: 'published' | 'hidden' | 'draft';
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 페이지 설계

#### VideoList (동영상 목록)
- **레이아웃**: 3열 그리드 (갤러리형)
- **필터**: 카테고리 드롭다운, 검색창, videoType 탭 (전체/로컬/외부)
- **카드 UI**: 썸네일, 제목, 작성자, 조회수, 날짜
- **헤더**: "동영상" 타이틀 + "업로드" 버튼 (로그인 시 표시)

#### VideoDetail (동영상 상세)
- **비디오 플레이어**: HTML5 Video (로컬) 또는 iframe (외부 URL)
- **정보**: 제목, 설명, 작성자, 조회수, 등록일
- **액션**: 수정/삭제 버튼 (본인 작성 시)

#### CreateVideo (동영상 등록)
- **입력 필드**:
  - 제목 (required)
  - 설명 (textarea)
  - 동영상 유형 선택 라디오 (로컬 / 외부 URL)
  - 파일 업로드 (로컬 선택 시) 또는 URL 입력 (외부 선택 시)
  - 카테고리 선택
  - 썸네일 URL (선택)

### 3.4 라우팅 (App.tsx)
```tsx
<Route path="/videos" element={<VideoList />} />
<Route path="/videos/new" element={<CreateVideo />} />
<Route path="/videos/:id" element={<VideoDetail />} />
<Route path="/videos/:id/edit" element={<EditVideo />} />
```

---

## 4. UI 컴포넌트

### 4.1 VideoCard (목록 카드)
```tsx
// props: video: Video
// - 썸네일 이미지 (Play 아이콘 오버레이)
// - 제목 (truncate 2줄)
// - 작성자, 조회수, 날짜
// - videoType 배지 (로컬/외부)
```

### 4.2 VideoPlayer
```tsx
// props: video: Video
// - videoType === 'local': <video src={videoUrl} controls />
// - videoType === 'external': <iframe src={videoUrl} />
```

---

## 5. 참고 사항
- 기존 `posts` 패턴과 동일한 구조로 구현
- 업로드 기능은 기존 `upload` 미들웨어 활용 (동영상 파일 형식: mp4, webm, ogg)
- 외부 URL은 YouTube, Vimeo 등 지원 (iframe Embed URL 형식)
- 카테고리는 기존 `categories` 테이블 재사용
