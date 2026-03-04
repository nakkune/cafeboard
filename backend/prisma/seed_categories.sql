-- ============================================
-- CafeBoard 기본 카테고리 데이터
-- ============================================

INSERT INTO categories (name, description, sort_order, is_active, read_permission, write_permission, created_at, updated_at)
VALUES 
  ('공지사항', '커뮤니티 공지 및 안내사항', 1, true, 'all', 'admin', NOW(), NOW()),
  ('자유게시판', '자유롭게 이야기 나누는 공간', 2, true, 'all', 'member', NOW(), NOW()),
  ('질문게시판', '궁금한 점을 질문하고 답변하는 공간', 3, true, 'all', 'member', NOW(), NOW()),
  ('정보공유', '유용한 정보와 지식을 공유하는 공간', 4, true, 'all', 'member', NOW(), NOW()),
  ('홍보게시판', '프로젝트, 서비스, 이벤트 홍보 공간', 5, true, 'all', 'member', NOW(), NOW()),
  ('건의사항', '커뮤니티 개선을 위한 제안', 6, true, 'all', 'member', NOW(), NOW());

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT * FROM categories ORDER BY sort_order;
