# DM (다이렉트 메시지) 사용 가이드

## 개요

DM 메뉴는 팀원들과 1:1 또는 그룹 채팅을 위한 기능입니다.

---

## 접속 방법

1. 메인 페이지 또는 채팅 페이지에서 우측 상단의 **메시지 아이콘** (💬)을 클릭
2. `/dm` 경로로 이동

---

## 기능 설명

### 1. 대화 목록 (좌측 패널)

- 현재 사용자가 참여 중인 모든 DM 대화 목록이 표시됨
- 각 대화에는 다음 정보가 표시됨:
  - 참여자 프로필 이미지/이니셜
  - 참여자 닉네임
  - 마지막 메시지 내용 (최근 메시지 1개)
  - 읽지 않은 메시지 수 (배지)
- 대화를 클릭하면 해당 대화가 우측 패널에 표시됨

### 2. 메시지 보내기

- 하단의 입력창에 메시지를 입력
- Enter 키 또는 전송 버튼을 클릭하여 전송
- 메시지는 즉시 화면에 표시됨

### 3. 그룹 DM 생성

> ⚠️ 현재 UI에서 직접 그룹 DM을 생성하는 버튼은 없습니다.
> 그룹 DM은 채널에서 여러 사용자를 선택하여 시작할 때 자동으로 생성됩니다.

---

## 백엔드 API

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| GET | `/api/conversations` | 전체 대화 목록 조회 |
| GET | `/api/conversations/:id/messages` | 특정 대화의 메시지 조회 |
| POST | `/api/conversations/:id/messages` | 메시지 전송 |
| POST | `/api/conversations` | 새 DM/그룹 대화 생성 |

---

## 데이터 구조

### Conversation
```typescript
{
  id: number;
  type: 'dm' | 'group';
  participants: {
    id: number;
    nickname: string;
    profileImage: string | null;
  }[];
  lastMessage?: {
    content: string;
    createdAt: string;
  };
  unreadCount?: number;
}
```

### Message
```typescript
{
  id: number;
  content: string;
  conversationId: number;
  author: {
    id: number;
    nickname: string;
    profileImage: string | null;
  };
  createdAt: string;
}
```

---

## 참고사항

- DM은 채널과 별개로 관리되는 Conversation 테이블을 사용
- 1:1 DM은 `type: 'dm'`, 그룹 채팅은 `type: 'group'`
- 현재 WebSocket 연동
- 파일 업로드, 메시지 편집/삭제, 읽음 표시 등의 기능은 추후 확장 가능
