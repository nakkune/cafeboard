# 슬랙 스타일 메시징 시스템 설계문서

## 1. 개요

### 1.1 시스템 목표
- 실시간 메시징 가능한 채팅 플랫폼
- 채널/DM/그룹 채팅 지원
- 파일/이미지/동영상 공유
- 이모지 및 반응 기능
- 읽음 표시 및 검색 기능

### 1.2 주요 기능
- **팀(Team)** 기반 채널 시스템
- 1:1 다이렉트 메시지 (DM)
- 그룹 메시지
- 스레드 댓글
- 실시간 메시징 (WebSocket)
- 파일 업로드/공유
- 메시지 검색
- 알림 시스템

---

## 2. 데이터베이스 스키마

> **Note**: 이 시스템은 기존 Page/Block 시스템과 구분하기 위해 `Team` 이름을 사용합니다.

### 2.1 팀 (Team)
```prisma
model Team {
  id          Int       @id @default(autoincrement())
  name        String    @db.VarChar(100)
  description String?  @db.Text
  icon        String?   @db.VarChar(500)
  ownerId     Int       @map("owner_id")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  owner       User      @relation(fields: [ownerId], references: [id])
  channels   Channel[]
  members    TeamMember[]

  @@map("teams")
}
```

### 2.2 팀 맴버
```prisma
model TeamMember {
  id            Int       @id @default(autoincrement())
  teamId        Int       @map("team_id")
  userId        Int       @map("user_id")
  role          MemberRole @default(member)
  joinedAt      DateTime  @default(now()) @map("joined_at")

  team          Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@map("team_members")
}

enum MemberRole {
  owner
  admin
  member
  guest
}
```

### 2.3 채널 (Channel)
```prisma
model Channel {
  id          Int         @id @default(autoincrement())
  workspaceId Int         @map("workspace_id")
  name        String      @db.VarChar(100)
  description String?    @db.Text
  type        ChannelType @default(public)
  topic       String?    @db.VarChar(500)
  isArchived  Boolean    @default(false) @map("is_archived")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  workspace   Team  @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  messages    Message[]
  members     ChannelMember[]

  @@unique([workspaceId, name])
  @@map("channels")
}

enum ChannelType {
  public
  private
  dm
}
```

### 2.4 채널 맴버
```prisma
model ChannelMember {
  id          Int       @id @default(autoincrement())
  channelId   Int       @map("channel_id")
  userId      Int       @map("user_id")
  role        ChannelMemberRole @default(member)
  joinedAt    DateTime  @default(now()) @map("joined_at")
  lastReadAt  DateTime? @map("last_read_at")

  channel     Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
  @@map("channel_members")
}

enum ChannelMemberRole {
  owner
  admin
  member
}
```

### 2.5 메시지 (Message)
```prisma
model Message {
  id          Int        @id @default(autoincrement())
  channelId   Int        @map("channel_id")
  authorId    Int        @map("author_id")
  parentId    Int?       @map("parent_id")
  content     String     @db.Text
  type        MessageType @default(text)
  isEdited    Boolean    @default(false) @map("is_edited")
  isDeleted   Boolean    @default(false) @map("is_deleted")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  channel     Channel    @relation(fields: [channelId], references: [id], onDelete: Cascade)
  author      User       @relation(fields: [authorId], references: [id])
  parent      Message?   @relation("ThreadMessages", fields: [parentId], references: [id])
  replies     Message[]  @relation("ThreadMessages")
  reactions   Reaction[]
  attachments Attachment[]
  readReceipts MessageRead[]

  @@index([channelId, createdAt])
  @@map("messages")
}

enum MessageType {
  text
  file
  image
  video
  system
}
```

### 2.6 반응 (Reaction)
```prisma
model Reaction {
  id        Int       @id @default(autoincrement())
  messageId Int       @map("message_id")
  userId    Int       @map("user_id")
  emoji     String    @db.VarChar(50)
  createdAt DateTime  @default(now()) @map("created_at")

  message   Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId, emoji])
  @@map("reactions")
}
```

### 2.7 첨부파일 (Attachment)
```prisma
model Attachment {
  id          Int       @id @default(autoincrement())
  messageId   Int       @map("message_id")
  filename    String    @db.VarChar(255)
  originalName String   @map("original_name") @db.VarChar(255)
  mimeType    String    @map("mime_type") @db.VarChar(100)
  size        Int
  url         String    @db.VarChar(500)
  createdAt   DateTime  @default(now()) @map("created_at")

  message     Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@map("attachments")
}
```

### 2.8 읽음 표시 (MessageRead)
```prisma
model MessageRead {
  id        Int       @id @default(autoincrement())
  messageId Int       @map("message_id")
  userId    Int       @map("user_id")
  readAt    DateTime  @default(now()) @map("read_at")

  message   Message   @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([messageId, userId])
  @@map("message_reads")
}
```

### 2.9 다이렉트 메시지Conversation
```prisma
model Conversation {
  id          Int       @id @default(autoincrement())
  type        ConversationType @default(dm)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  participants ConversationParticipant[]
  messages    Message[]

  @@map("conversations")
}

enum ConversationType {
  dm
  group
}

model ConversationParticipant {
  id              Int       @id @default(autoincrement())
  conversationId Int       @map("conversation_id")
  userId          Int       @map("user_id")
  role            ChannelMemberRole @default(member)
  lastReadAt      DateTime? @map("last_read_at")
  joinedAt        DateTime  @default(now()) @map("joined_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@map("conversation_participants")
}
```

### 2.10 사용자Presence (온라인 상태)
```prisma
model UserPresence {
  id          Int       @id @default(autoincrement())
  userId      Int       @unique @map("user_id")
  status      PresenceStatus @default(offline)
  lastActiveAt DateTime  @default(now()) @map("last_active_at")

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_presences")
}

enum PresenceStatus {
  online
  away
  busy
  offline
}
```

---

## 3. API 설계

> **Note**: 기존 Pages 워크스페이스 시스템과 구분하기 위해 `/api/teams`를 사용합니다.

### 3.1 팀 (Team) API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/teams | 팀 목록 |
| POST | /api/teams | 팀 생성 |
| GET | /api/teams/:id | 팀 조회 |
| PUT | /api/teams/:id | 팀 수정 |
| DELETE | /api/teams/:id | 팀 삭제 |
| GET | /api/teams/:id/members | 맴버 목록 |
| POST | /api/teams/:id/members | 맴버 초대 |
| DELETE | /api/teams/:id/members/:userId | 맴버 제거 |

### 3.2 채널 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/teams/:teamId/channels | 채널 목록 |
| POST | /api/teams/:teamId/channels | 채널 생성 |
| GET | /api/channels/:id | 채널 조회 |
| PUT | /api/channels/:id | 채널 수정 |
| DELETE | /api/channels/:id | 채널 삭제 |
| GET | /api/channels/:id/members | 채널 맴버 목록 |
| POST | /api/channels/:id/members | 맴버 추가 |
| DELETE | /api/channels/:id/members/:userId | 맴버 제거 |

### 3.3 메시지 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/channels/:channelId/messages | 메시지 목록 (Pagination) |
| POST | /api/channels/:channelId/messages | 메시지 전송 |
| PUT | /api/messages/:id | 메시지 수정 |
| DELETE | /api/messages/:id | 메시지 삭제 (Soft Delete) |
| GET | /api/messages/:id/thread | 스레드 메시지 조회 |
| POST | /api/messages/:id/reactions | 반응 추가/제거 |
| POST | /api/channels/:channelId/read | 읽음 표시 |

### 3.4 Conversation (DM) API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/conversations | 대화 목록 |
| POST | /api/conversations | DM/그룹 채팅 생성 |
| GET | /api/conversations/:id | 대화 조회 |
| GET | /api/conversations/:id/messages | 메시지 목록 |
| POST | /api/conversations/:id/messages | 메시지 전송 |

### 3.5 검색 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/search/messages | 메시지 검색 |
| GET | /api/search/channels | 채널 검색 |
| GET | /api/search/users | 사용자 검색 |
| GET | /api/search/teams | 팀 검색 |

### 3.6 Presence (온라인 상태) API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/teams/:teamId/presence | 팀 온라인 상태 |
| PUT | /api/presence | 상태 변경 |
| POST | /api/presence/online | 온라인 설정 |
| POST | /api/presence/offline | 오프라인 설정 |

### 3.7 알림 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | /api/notifications | 알림 목록 |
| GET | /api/notifications/unread-count | 미읽기 개수 |
| PUT | /api/notifications/:id/read | 읽음 표시 |
| PUT | /api/notifications/read-all | 전체 읽음 |
| DELETE | /api/notifications/:id | 알림 삭제 |

### 3.8 파일 업로드 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/chat/upload | 채팅 파일 업로드 |

---

## 4. WebSocket 이벤트

### 4.1 클라이언트 → 서버

| 이벤트 |_payload| 설명 |
|--------|---------|------|
| join_channel | { channelId } | 채널 참여 |
| leave_channel | { channelId } | 채널 나가기 |
| send_message | { channelId, content, type } | 메시지 전송 |
| typing_start | { channelId } | 입력 중 시작 |
| typing_stop | { channelId } | 입력 중 종료 |
| read_message | { channelId, messageId } | 메시지 읽음 |

### 4.2 서버 → 클라이언트

| 이벤트 |_payload| 설명 |
|--------|---------|------|
| message_new | { message } | 새 메시지 |
| message_update | { message } | 메시지 수정 |
| message_delete | { messageId } | 메시지 삭제 |
| user_typing | { channelId, userId, isTyping } | 입력 중 상태 |
| user_online | { userId } | 사용자 온라인 |
| user_offline | { userId } | 사용자 오프라인 |
| reaction_added | { messageId, reaction } | 반응 추가 |
| reaction_removed | { messageId, emoji, userId } | 반응 제거 |

---

## 5. 프론트엔드 구조

### 5.1 페이지 라우트

```
/chat                      - 채널 메시징 (Teams/Channels)
/chat/team/:teamId        - 팀 채널 목록
/dm                       - DM 목록
/dm/:conversationId      - DM 대화
```

### 5.2 컴포넌트 구조

```
src/
├── components/
│   ├── TypingIndicator.tsx    - 입력 중 표시
│   └── ...
├── hooks/
│   ├── useWebSocket.ts        - WebSocket 연결
│   ├── useMessages.ts         - 메시지 관리
│   └── usePresence.ts         - 온라인 상태 관리
├── pages/
│   ├── Chat.tsx               - 채널 메시징
│   └── DirectMessage.tsx      - DM/다이렉트 메시지
└── ...
```

### 5.3 주요 기능

- 실시간 메시징 (WebSocket)
- 채널/팀 생성 및 관리
- 스레드 메시지
- 이모지 반응
- 파일 업로드
- 검색
- 온라인 상태 표시
- 알림

---

## 6. 구현 순서

### Phase 1:基础 기능 (1-2주)
1. 데이터베이스 스키마 생성 및 마이그레이션
2. 워크스페이스 CRUD API
3. 채널 CRUD API
4. 메시지发送/조회/수정/삭제 API
5. 기본 프론트엔드 레이아웃

### Phase 2: 실시간 messaging (1주)
1. WebSocket 서버 구축 (Socket.io)
2. 실시간 메시지 전송/수신
3. 입력 중 표시
4. 온라인 상태 표시

### Phase 3: 고급 기능 (1-2주)
1. 스레드 기능
2. 반응/이모지
3. 파일 업로드
4. DM/그룹 채팅
5. 검색 기능

### Phase 4: 알림 및 UX (1주)
1. 알림 시스템
2. 읽음 표시
3. 채널/맴버 관리
4. 성능 최적화

---

## 7. 기술 스택

### Backend
- Node.js + Express
- Prisma (ORM)
- PostgreSQL
- Socket.io (WebSocket)
- Multer (파일 업로드)

### Frontend
- React + TypeScript
- React Router v6
- Socket.io Client
- Zustand (상태 관리)
- React Query
- Tailwind CSS

---

## 8. 고려사항

### 8.1 성능
- 메시지 페이징 (cursor-based)
- 이미지/동영상 리사이징
- 메시지 캐싱
- WebSocket 연결 풀링

### 8.2 보안
- 파일 업로드 검증
- 채널 접근 권한 체크
- 메시지 삭제 권한
- Rate Limiting

### 8.3 확장성
- 마이크로서비스 구조 고려
- 메시지 아카이빙
- 검색 인덱싱 (Elasticsearch)

---

## 9. 데이터 흐름도

```
[사용자 A] → [WebSocket] → [서버] → [데이터베이스]
                              ↓
                        [WebSocket]
                              ↓
[사용자 B] ← [WebSocket] ← [서버]
```

---

## 10. 환경 변수

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cafeboard

# WebSocket
WEBSOCKET_PORT=3002

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# JWT
JWT_SECRET=your-secret-key
```
