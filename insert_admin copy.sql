-- 관리자 계정 삽입 (쿠버네티스에서 추출)
-- 기존 ID 2의 관리자가 있다면 업데이트, 없으면 삽입

INSERT INTO users (id, email, password_hash, nickname, name, phone, gender, profile_image, bio, role, is_active, last_login_at, created_at, updated_at)
VALUES (
    1,
    'admin@cafeboard.com',
    '$2a$10$.w/n28vvdXZaP1Jk5/O9qebDRaNwea3FCNQGpWdnGum88UErPa6Ye',
    '관리자',
    '관리자',
    NULL,
    NULL,
    NULL,
    NULL,
    'admin',
    true,
    '2026-02-19 11:08:10.549',
    '2026-02-13 09:47:35.818',
    '2026-02-19 11:08:10.55'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    nickname = EXCLUDED.nickname,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    gender = EXCLUDED.gender,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = EXCLUDED.updated_at;

-- 시퀀스 업데이트 (다음 ID가 2보다 작으면 3으로 설정)
SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 2));

-- 삽입 확인
SELECT id, email, nickname, name, role, is_active FROM users WHERE email = 'admin@cafeboard.com';
