# 회원가입 승인 시스템 설계문서

## 1. 개요

- 일반 사용자가 회원가입 시 즉시 로그인 불가
- 관리자가 회원 상태를 승인해야 로그인 가능
- 상태: **대기중(pending)** → **승인됨(approved)/거절됨(rejected)**

---

## 2. 데이터베이스 변경

### 2.1 MemberStatus Enum 추가

```prisma
enum MemberStatus {
  pending   // 대기중 (회원가입 후 기본값)
  approved  // 승인됨
  rejected  // 거절됨
}
```

### 2.2 User 모델 필드 추가

```prisma
model User {
  // ... 기존 필드
  memberStatus    MemberStatus @default(pending) @map("member_status")
  approvedAt     DateTime?    @map("approved_at")
  approvedBy     Int?         @map("approved_by")
  rejectionReason String?     @map("rejection_reason") @db.Text

  // 승인 관계
  approver       User?        @relation("ApprovalHistory", fields: [approvedBy], references: [id])
  approvedUsers  User[]       @relation("ApprovalHistory")

  @@map("users")
}
```

---

## 3. API 설계

### 3.1 회원가입

- **Endpoint:** `POST /api/auth/register`
- **변경:** memberStatus = 'pending'로 저장, 승인 대기 메시지 반환

### 3.2 로그인

- **Endpoint:** `POST /api/auth/login`
- **변경:** memberStatus 상태 체크

| 상태 코드 | 조건 | 메시지 |
|-----------|------|--------|
| 401 | user 존재하지 않음 | "Invalid credentials" |
| 401 | 비밀번호 불일치 | "Invalid credentials" |
| 403 | memberStatus = 'pending' | "계정이 승인 대기 중입니다. 관리자의 승인을 기다려주세요." |
| 403 | memberStatus = 'rejected' | "가입 신청이 거절되었습니다. 관리자에게 문의하세요." |
| 401 | isActive = false | "Account is deactivated" |

### 3.3 회원 목록 조회 (관리자)

- **Endpoint:** `GET /api/admin/members`
- **Query:** status, page, limit, search

### 3.4 회원 승인/거절 (관리자)

- **Endpoint:** `POST /api/admin/members/:id/approve`
- **Body:** { status, rejectionReason? }

---

## 4. 프론트엔드 변경

- 로그인 페이지: 승인 대기/거절 에러 메시지
- 관리자 페이지: 회원 관리 메뉴 (목록, 검색, 승인/거절)

---

## 5. 구현 순서

1. Prisma 스키마 수정 및 마이그레이션
2. Auth 컨트롤러 수정
3. 관리자 API 구현
4. 프론트엔드 변경
