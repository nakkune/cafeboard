-- ============================================
-- CafeBoard 데이터베이스 테이블 및 컬럼 주석
-- ============================================

-- 1. users (사용자) 테이블
COMMENT ON TABLE users IS '사용자 정보를 저장하는 테이블';
COMMENT ON COLUMN users.id IS '사용자 고유 ID (자동 증가)';
COMMENT ON COLUMN users.email IS '사용자 이메일 주소 (로그인 ID)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt로 해싱된 비밀번호';
COMMENT ON COLUMN users.nickname IS '사용자 닉네임 (화면 표시명)';
COMMENT ON COLUMN users.name IS '사용자 실명';
COMMENT ON COLUMN users.phone IS '전화번호';
COMMENT ON COLUMN users.gender IS '성별';
COMMENT ON COLUMN users.profile_image IS '프로필 이미지 URL';
COMMENT ON COLUMN users.bio IS '사용자 자기소개';
COMMENT ON COLUMN users.role IS '사용자 상위 권한 (member/moderator/admin)';
COMMENT ON COLUMN users.member_status IS '가입 승인 상태 (pending/approved/rejected)';
COMMENT ON COLUMN users.member_level IS '회원 등급 (regular/general/nonmember)';
COMMENT ON COLUMN users.approved_at IS '가입 승인 일시';
COMMENT ON COLUMN users.approved_by IS '승인 처리한 관리자 ID';
COMMENT ON COLUMN users.rejection_reason IS '가입 거절 사유';
COMMENT ON COLUMN users.is_active IS '계정 활성화 상태 (true/false)';
COMMENT ON COLUMN users.last_login_at IS '마지막 로그인 시간';
COMMENT ON COLUMN users.created_at IS '계정 생성일';
COMMENT ON COLUMN users.updated_at IS '계정 정보 수정일';

-- 2. categories (카테고리/게시판) 테이블
COMMENT ON TABLE categories IS '게시판 카테고리 정보';
COMMENT ON COLUMN categories.id IS '카테고리 고유 ID';
COMMENT ON COLUMN categories.name IS '카테고리 이름';
COMMENT ON COLUMN categories.description IS '카테고리 설명';
COMMENT ON COLUMN categories.sort_order IS '정렬 순서 (낮을수록 먼저 표시)';
COMMENT ON COLUMN categories.is_active IS '카테고리 활성화 상태';
COMMENT ON COLUMN categories.read_permission IS '읽기 권한 (all/member)';
COMMENT ON COLUMN categories.write_permission IS '쓰기 권한 (member/admin)';
COMMENT ON COLUMN categories.created_at IS '카테고리 생성일';
COMMENT ON COLUMN categories.updated_at IS '카테고리 수정일';

-- 3. posts (게시글) 테이블
COMMENT ON TABLE posts IS '게시글 정보를 저장하는 테이블';
COMMENT ON COLUMN posts.id IS '게시글 고유 ID';
COMMENT ON COLUMN posts.title IS '게시글 제목';
COMMENT ON COLUMN posts.content IS '게시글 내용 (HTML)';
COMMENT ON COLUMN posts.author_id IS '작성자 ID (users.id 참조)';
COMMENT ON COLUMN posts.category_id IS '카테고리 ID (categories.id 참조)';
COMMENT ON COLUMN posts.is_notice IS '공지사항 여부 (true면 상단 고정)';
COMMENT ON COLUMN posts.is_secret IS '비밀글 여부';
COMMENT ON COLUMN posts.view_count IS '조회수';
COMMENT ON COLUMN posts.like_count IS '추천수';
COMMENT ON COLUMN posts.comment_count IS '댓글 수';
COMMENT ON COLUMN posts.status IS '게시글 상태 (published/draft/hidden)';
COMMENT ON COLUMN posts.created_at IS '게시글 작성일';
COMMENT ON COLUMN posts.updated_at IS '게시글 수정일';

-- 4. post_images (게시글 이미지) 테이블
COMMENT ON TABLE post_images IS '게시글에 첨부된 이미지 정보';
COMMENT ON COLUMN post_images.id IS '이미지 고유 ID';
COMMENT ON COLUMN post_images.post_id IS '게시글 ID (posts.id 참조)';
COMMENT ON COLUMN post_images.image_url IS '이미지 파일 URL';
COMMENT ON COLUMN post_images.file_name IS '원본 파일명';
COMMENT ON COLUMN post_images.file_size IS '파일 크기 (바이트)';
COMMENT ON COLUMN post_images.created_at IS '업로드일';

-- 5. comments (댓글) 테이블
COMMENT ON TABLE comments IS '게시글 댓글 정보';
COMMENT ON COLUMN comments.id IS '댓글 고유 ID';
COMMENT ON COLUMN comments.post_id IS '게시글 ID (posts.id 참조)';
COMMENT ON COLUMN comments.author_id IS '작성자 ID (users.id 참조)';
COMMENT ON COLUMN comments.parent_id IS '부모 댓글 ID (대댓글인 경우)';
COMMENT ON COLUMN comments.content IS '댓글 내용';
COMMENT ON COLUMN comments.like_count IS '댓글 추천수';
COMMENT ON COLUMN comments.is_deleted IS '삭제 여부 (true면 삭제됨)';
COMMENT ON COLUMN comments.created_at IS '댓글 작성일';
COMMENT ON COLUMN comments.updated_at IS '댓글 수정일';

-- 6. likes (좋아요/추천) 테이블
COMMENT ON TABLE likes IS '게시글 및 댓글 추천 정보';
COMMENT ON COLUMN likes.id IS '좋아요 고유 ID';
COMMENT ON COLUMN likes.user_id IS '사용자 ID (users.id 참조)';
COMMENT ON COLUMN likes.target_type IS '대상 타입 (post/comment)';
COMMENT ON COLUMN likes.target_id IS '대상 ID (posts.id 또는 comments.id)';
COMMENT ON COLUMN likes.created_at IS '좋아요 생성일';

-- 7. scraps (스크랩) 테이블
COMMENT ON TABLE scraps IS '사용자의 게시글 스크랩 정보';
COMMENT ON COLUMN scraps.id IS '스크랩 고유 ID';
COMMENT ON COLUMN scraps.user_id IS '사용자 ID (users.id 참조)';
COMMENT ON COLUMN scraps.post_id IS '게시글 ID (posts.id 참조)';
COMMENT ON COLUMN scraps.created_at IS '스크랩 생성일';

-- 8. reports (신고) 테이블
COMMENT ON TABLE reports IS '게시글/댓글 신고 정보';
COMMENT ON COLUMN reports.id IS '신고 고유 ID';
COMMENT ON COLUMN reports.reporter_id IS '신고자 ID (users.id 참조)';
COMMENT ON COLUMN reports.target_type IS '신고 대상 타입 (post/comment)';
COMMENT ON COLUMN reports.target_id IS '신고 대상 ID';
COMMENT ON COLUMN reports.reason IS '신고 사유';
COMMENT ON COLUMN reports.status IS '신고 처리 상태 (pending/resolved/rejected)';
COMMENT ON COLUMN reports.created_at IS '신고일';
COMMENT ON COLUMN reports.resolved_at IS '처리 완료일';

-- 9. notifications (알림) 테이블
COMMENT ON TABLE notifications IS '사용자 알림 정보';
COMMENT ON COLUMN notifications.id IS '알림 고유 ID';
COMMENT ON COLUMN notifications.user_id IS '알림 수신자 ID (users.id 참조)';
COMMENT ON COLUMN notifications.type IS '알림 타입 (comment/like/scrap/etc)';
COMMENT ON COLUMN notifications.title IS '알림 제목';
COMMENT ON COLUMN notifications.content IS '알림 내용';
COMMENT ON COLUMN notifications.related_id IS '관련된 게시글/댓글 ID';
COMMENT ON COLUMN notifications.is_read IS '읽음 여부 (true/false)';
COMMENT ON COLUMN notifications.created_at IS '알림 생성일';

-- 10. sessions (세션) 테이블
COMMENT ON TABLE sessions IS '사용자 로그인 세션 정보';
COMMENT ON COLUMN sessions.id IS '세션 고유 ID';
COMMENT ON COLUMN sessions.user_id IS '사용자 ID (users.id 참조)';
COMMENT ON COLUMN sessions.refresh_token IS 'JWT 리프레시 토큰';
COMMENT ON COLUMN sessions.expires_at IS '세션 만료일';
COMMENT ON COLUMN sessions.created_at IS '세션 생성일';

-- 11. pages (문서/페이지) 테이블
COMMENT ON TABLE pages IS '노션 스타일의 통합 문서/페이지 정보';
COMMENT ON COLUMN pages.id IS '페이지 고유 ID';
COMMENT ON COLUMN pages.title IS '페이지 제목';
COMMENT ON COLUMN pages.icon IS '페이지 아이콘 (이모지 등)';
COMMENT ON COLUMN pages.cover_image IS '페이지 커버 이미지 URL';
COMMENT ON COLUMN pages.content IS '페이지 본문 데이터 (JSON)';
COMMENT ON COLUMN pages.parent_id IS '부모 페이지 ID (계층 구조 관리)';
COMMENT ON COLUMN pages.author_id IS '작성자 ID';
COMMENT ON COLUMN pages.is_public IS '공개 여부';
COMMENT ON COLUMN pages.is_archived IS '보관 처리 여부';
COMMENT ON COLUMN pages.position IS '표시 순서 정렬값';
COMMENT ON COLUMN pages.created_at IS '생성일시';
COMMENT ON COLUMN pages.updated_at IS '수정일시';

-- 12. blocks (페이지 블록) 테이블
COMMENT ON TABLE blocks IS '페이지 내의 개별 콘텐츠 블록';
COMMENT ON COLUMN blocks.id IS '블록 고유 ID';
COMMENT ON COLUMN blocks.page_id IS '소속된 페이지 ID';
COMMENT ON COLUMN blocks.parent_id IS '부모 블록 ID (중첩 블록 관리)';
COMMENT ON COLUMN blocks.type IS '블록 타입 (text/heading/image/etc)';
COMMENT ON COLUMN blocks.content IS '블록 주요 내용 (텍스트 등)';
COMMENT ON COLUMN blocks.properties IS '블록 스타일 및 부가 속성 (JSON)';
COMMENT ON COLUMN blocks.position IS '페이지 내 정렬 위치';
COMMENT ON COLUMN blocks.created_at IS '생성일시';
COMMENT ON COLUMN blocks.updated_at IS '수정일시';

-- 13. post_files (게시글 첨부 파일) 테이블
COMMENT ON TABLE post_files IS '게시글에 첨부된 일반 파일 정보';
COMMENT ON COLUMN post_files.id IS '파일 고유 ID';
COMMENT ON COLUMN post_files.post_id IS '소속 게시글 ID';
COMMENT ON COLUMN post_files.file_url IS '파일 다운로드 URL';
COMMENT ON COLUMN post_files.file_name IS '저장된 파일명';
COMMENT ON COLUMN post_files.original_name IS '원본 파일명';
COMMENT ON COLUMN post_files.file_size IS '파일 크기 (바이트)';
COMMENT ON COLUMN post_files.mime_type IS '파일 MIME 타입';
COMMENT ON COLUMN post_files.created_at IS '업로드 일시';

-- 14. events (캘린더 일정) 테이블
COMMENT ON TABLE events IS '커뮤니티/워크스페이스 일정 정보';
COMMENT ON COLUMN events.id IS '일정 고유 ID';
COMMENT ON COLUMN events.title IS '일정 제목';
COMMENT ON COLUMN events.description IS '일정 상세 설명';
COMMENT ON COLUMN events.start_date IS '시작 일시';
COMMENT ON COLUMN events.end_date IS '종료 일시';
COMMENT ON COLUMN events.all_day IS '하루 종일 여부';
COMMENT ON COLUMN events.color IS '캘린더 표시 색상';
COMMENT ON COLUMN events.author_id IS '작성자 ID';
COMMENT ON COLUMN events.created_at IS '작성일시';
COMMENT ON COLUMN events.updated_at IS '수정일시';

-- 15. videos (동영상) 테이블
COMMENT ON TABLE videos IS '게시판 내 동영상 콘텐츠 정보';
COMMENT ON COLUMN videos.id IS '동영상 고유 ID';
COMMENT ON COLUMN videos.title IS '동영상 제목';
COMMENT ON COLUMN videos.description IS '동영상 설명';
COMMENT ON COLUMN videos."videoType" IS '동영상 타입 (local/external)';
COMMENT ON COLUMN videos.video_url IS '동영상 재생/스트리밍 URL';
COMMENT ON COLUMN videos.thumbnail_url IS '동영상 미리보기 이미지 URL';
COMMENT ON COLUMN videos.duration IS '재생 시간 (초)';
COMMENT ON COLUMN videos.category_id IS '소속 카테고리 ID';
COMMENT ON COLUMN videos.author_id IS '업로더 ID';
COMMENT ON COLUMN videos.view_count IS '조회수';
COMMENT ON COLUMN videos.status IS '상태 (published/hidden/draft)';
COMMENT ON COLUMN videos.created_at IS '등록일시';
COMMENT ON COLUMN videos.updated_at IS '수정일시';

-- 16. workspaces (워크스페이스/팀) 테이블
COMMENT ON TABLE workspaces IS '협업을 위한 워크스페이스(팀) 정보';
COMMENT ON COLUMN workspaces.id IS '워크스페이스 고유 ID';
COMMENT ON COLUMN workspaces.name IS '워크스페이스 이름';
COMMENT ON COLUMN workspaces.description IS '워크스페이스 설명';
COMMENT ON COLUMN workspaces.icon IS '워크스페이스 아이콘 URL';
COMMENT ON COLUMN workspaces.is_public IS '공개 여부 (누구나 가입 요청 가능 여부)';
COMMENT ON COLUMN workspaces.owner_id IS '워크스페이스 소유자 ID';
COMMENT ON COLUMN workspaces.created_at IS '생성일시';
COMMENT ON COLUMN workspaces.updated_at IS '수정일시';

-- 17. workspace_members (워크스페이스 멤버) 테이블
COMMENT ON TABLE workspace_members IS '워크스페이스에 소속된 멤버 정보';
COMMENT ON COLUMN workspace_members.id IS '멤버 레코드 고유 ID';
COMMENT ON COLUMN workspace_members.workspace_id IS '워크스페이스 ID';
COMMENT ON COLUMN workspace_members.user_id IS '사용자 ID';
COMMENT ON COLUMN workspace_members.role IS '멤버 역할 (owner/admin/member/guest)';
COMMENT ON COLUMN workspace_members.joined_at IS '워크스페이스 가입 일시';

-- 18. channels (채팅 채널) 테이블
COMMENT ON TABLE channels IS '워크스페이스 내의 채팅방/채널 정보';
COMMENT ON COLUMN channels.id IS '채널 고유 ID';
COMMENT ON COLUMN channels.workspace_id IS '소속된 워크스페이스 ID';
COMMENT ON COLUMN channels.name IS '채널 이름';
COMMENT ON COLUMN channels.description IS '채널 설명';
COMMENT ON COLUMN channels.type IS '채널 타입 (public/private/dm)';
COMMENT ON COLUMN channels.topic IS '채널 주제(토픽)';
COMMENT ON COLUMN channels.is_archived IS '보관 처리 여부';
COMMENT ON COLUMN channels.created_at IS '채널 생성일';
COMMENT ON COLUMN channels.updated_at IS '채널 수정일';

-- 19. messages (채팅 메시지) 테이블
COMMENT ON TABLE messages IS '채팅 채널 및 개별 대화에서 주고받은 메시지';
COMMENT ON COLUMN messages.id IS '메시지 고유 ID';
COMMENT ON COLUMN messages.channel_id IS '소속 채널 ID (채널 메시지인 경우)';
COMMENT ON COLUMN messages.conversation_id IS '소속 대화 ID (개별 대화/DM인 경우)';
COMMENT ON COLUMN messages.author_id IS '메시지 작성자 ID';
COMMENT ON COLUMN messages.parent_id IS '답장인 경우 부모 메시지 ID (스레드)';
COMMENT ON COLUMN messages.content IS '메시지 본문 내용';
COMMENT ON COLUMN messages.type IS '메시지 종류 (text/file/image/video/system)';
COMMENT ON COLUMN messages.is_edited IS '수정 여부';
COMMENT ON COLUMN messages.is_deleted IS '삭제 여부';
COMMENT ON COLUMN messages.created_at IS '메시지 전송 일시';
COMMENT ON COLUMN messages.updated_at IS '메시지 수정 일시';

-- 20. user_presences (사용자 상태) 테이블
COMMENT ON TABLE user_presences IS '사용자의 실시간 접속 상태 정보';
COMMENT ON COLUMN user_presences.id IS '상태 레코드 ID';
COMMENT ON COLUMN user_presences.user_id IS '사용자 ID';
COMMENT ON COLUMN user_presences.status IS '접속 상태 (online/away/busy/offline)';
COMMENT ON COLUMN user_presences.last_active_at IS '마지막 활동 시간';

-- 21. workspace_join_requests (워크스페이스 가입 요청) 테이블
COMMENT ON TABLE workspace_join_requests IS '비공개 워크스페이스 가입 신청 정보';
COMMENT ON COLUMN workspace_join_requests.id IS '요청 고유 ID';
COMMENT ON COLUMN workspace_join_requests.workspace_id IS '대상 워크스페이스 ID';
COMMENT ON COLUMN workspace_join_requests.user_id IS '신청자 ID';
COMMENT ON COLUMN workspace_join_requests.status IS '상태 (pending/approved/rejected)';
COMMENT ON COLUMN workspace_join_requests.created_at IS '신청 일시';
COMMENT ON COLUMN workspace_join_requests.processed_at IS '승인/거절 처리 일시';

-- 22. channel_members (채널 멤버) 테이블
COMMENT ON TABLE channel_members IS '채팅 채널의 참여 멤버 정보';
COMMENT ON COLUMN channel_members.id IS '레코드 고유 ID';
COMMENT ON COLUMN channel_members.channel_id IS '채널 ID';
COMMENT ON COLUMN channel_members.user_id IS '사용자 ID';
COMMENT ON COLUMN channel_members.role IS '채널 내 역할 (owner/admin/member)';
COMMENT ON COLUMN channel_members.joined_at IS '채널 참여 일시';
COMMENT ON COLUMN channel_members.last_read_at IS '마지막 메시지 읽은 시간';

-- 23. reactions (메시지 반응) 테이블
COMMENT ON TABLE reactions IS '채팅 메시지에 대한 이모지 반응 정보';
COMMENT ON COLUMN reactions.id IS '반응 고유 ID';
COMMENT ON COLUMN reactions.message_id IS '대상 메시지 ID';
COMMENT ON COLUMN reactions.user_id IS '반응을 남긴 사용자 ID';
COMMENT ON COLUMN reactions.emoji IS '반응 이모지 코드';
COMMENT ON COLUMN reactions.created_at IS '반응 일시';

-- 24. attachments (채팅 첨부파일) 테이블
COMMENT ON TABLE attachments IS '채팅 중 공유된 파일/이미지 정보';
COMMENT ON COLUMN attachments.id IS '첨부파일 고유 ID';
COMMENT ON COLUMN attachments.message_id IS '연결된 메시지 ID';
COMMENT ON COLUMN attachments.uploader_id IS '업로더 ID';
COMMENT ON COLUMN attachments.filename IS '저장된 파일명';
COMMENT ON COLUMN attachments.original_name IS '원본 파일명';
COMMENT ON COLUMN attachments.mime_type IS '파일 MIME 타입';
COMMENT ON COLUMN attachments.size IS '파일 크기 (바이트)';
COMMENT ON COLUMN attachments.url IS '파일 접근 URL';
COMMENT ON COLUMN attachments.created_at IS '업로드 일시';

-- 25. message_reads (메시지 읽음 확인) 테이블
COMMENT ON TABLE message_reads IS '메시지별 개별 읽음 확인 정보';
COMMENT ON COLUMN message_reads.id IS '레코드 ID';
COMMENT ON COLUMN message_reads.message_id IS '메시지 ID';
COMMENT ON COLUMN message_reads.user_id IS '읽은 사용자 ID';
COMMENT ON COLUMN message_reads.read_at IS '읽은 시간';

-- 26. conversations (개별 대화/DM) 테이블
COMMENT ON TABLE conversations IS '채널 이외의 1:1 또는 그룹 대화 정보';
COMMENT ON COLUMN conversations.id IS '대화 고유 ID';
COMMENT ON COLUMN conversations.type IS '대화 타입 (dm/group)';
COMMENT ON COLUMN conversations.name IS '대화방 이름 (그룹 대화인 경우)';
COMMENT ON COLUMN conversations.created_at IS '생성 일시';
COMMENT ON COLUMN conversations.updated_at IS '최근 활동 일시';

-- 27. conversation_participants (대화 참여자) 테이블
COMMENT ON TABLE conversation_participants IS '개별 대화방의 참여자 정보';
COMMENT ON COLUMN conversation_participants.id IS '레코드 ID';
COMMENT ON COLUMN conversation_participants.conversation_id IS '대화 ID';
COMMENT ON COLUMN conversation_participants.user_id IS '사용자 ID';
COMMENT ON COLUMN conversation_participants.role IS '대화방 내 역할';
COMMENT ON COLUMN conversation_participants.last_read_at IS '마지막 읽은 시간';
COMMENT ON COLUMN conversation_participants.joined_at IS '참여 일시';

-- 28. system_settings (시스템 설정) 테이블
COMMENT ON TABLE system_settings IS '시스템 전역 설정을 관리하는 테이블';
COMMENT ON COLUMN system_settings.id IS '설정 고유 ID';
COMMENT ON COLUMN system_settings.key IS '설정 식별 키 (예: site_name, maintenance_mode)';
COMMENT ON COLUMN system_settings.value IS '설정 데이터 값 (텍스트 또는 JSON 포맷)';
COMMENT ON COLUMN system_settings.type IS '데이터 타입 구분 (string, boolean, json)';
COMMENT ON COLUMN system_settings.updated_at IS '최종 수정 일시';

-- 29. galleries (사진첩 게시글) 테이블
COMMENT ON TABLE galleries IS '사진첩 게시글 정보를 저장하는 테이블';
COMMENT ON COLUMN galleries.id IS '사진첩 게시글 고유 ID';
COMMENT ON COLUMN galleries.title IS '사진첩 제목';
COMMENT ON COLUMN galleries.content IS '사진첩 상세 설명 내용';
COMMENT ON COLUMN galleries.author_id IS '작성자 ID (users.id 참조)';
COMMENT ON COLUMN galleries.like_count IS '좋아요/추천 수';
COMMENT ON COLUMN galleries.view_count IS '조회수';
COMMENT ON COLUMN galleries.created_at IS '게시글 등록 일시';
COMMENT ON COLUMN galleries.updated_at IS '게시글 최종 수정 일시';

-- 30. gallery_images (사진첩 이미지) 테이블
COMMENT ON TABLE gallery_images IS '사진첩 게시글에 포함된 이미지 파일 정보';
COMMENT ON COLUMN gallery_images.id IS '이미지 고유 ID';
COMMENT ON COLUMN gallery_images.gallery_id IS '소속된 사진첩 ID (galleries.id 참조)';
COMMENT ON COLUMN gallery_images.image_url IS '이미지 저장 경로 또는 접근 URL';
COMMENT ON COLUMN gallery_images.sort_order IS '이미지 표시 순서 (낮을수록 먼저 표시)';
COMMENT ON COLUMN gallery_images.created_at IS '이미지 업로드 일시';

-- 31. gallery_comments (사진첩 댓글) 테이블
COMMENT ON TABLE gallery_comments IS '사진첩 게시글에 작성된 댓글 정보';
COMMENT ON COLUMN gallery_comments.id IS '댓글 고유 ID';
COMMENT ON COLUMN gallery_comments.gallery_id IS '대상 사진첩 ID (galleries.id 참조)';
COMMENT ON COLUMN gallery_comments.author_id IS '댓글 작성자 ID (users.id 참조)';
COMMENT ON COLUMN gallery_comments.content IS '댓글 본문 내용';
COMMENT ON COLUMN gallery_comments.created_at IS '댓글 작성 일시';
COMMENT ON COLUMN gallery_comments.updated_at IS '댓글 최종 수정 일시';

-- ============================================
-- 실행 확인
-- ============================================
-- 주석 확인 쿼리:
-- SELECT 
--     c.relname AS table_name,
--     obj_description(c.oid) AS table_comment
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE c.relkind = 'r' AND n.nspname = 'public';
