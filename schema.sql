--
-- PostgreSQL database dump
--

\restrict fCGTQKpC9rbDeyHCcUlxNL6R46gNgDfRIbwIfNhQm2UMbcfnSEKKzyqm8sPOvSf

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: PostStatus; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."PostStatus" AS ENUM (
    'published',
    'draft',
    'hidden'
);


ALTER TYPE public."PostStatus" OWNER TO cafeboard;

--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'pending',
    'resolved',
    'rejected'
);


ALTER TYPE public."ReportStatus" OWNER TO cafeboard;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."Role" AS ENUM (
    'member',
    'moderator',
    'admin'
);


ALTER TYPE public."Role" OWNER TO cafeboard;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO cafeboard;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    read_permission character varying(20) DEFAULT 'all'::character varying NOT NULL,
    write_permission character varying(20) DEFAULT 'member'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.categories OWNER TO cafeboard;

--
-- Name: TABLE categories; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.categories IS '게시판 카테고리 정보';


--
-- Name: COLUMN categories.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.id IS '카테고리 고유 ID';


--
-- Name: COLUMN categories.name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.name IS '카테고리 이름';


--
-- Name: COLUMN categories.description; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.description IS '카테고리 설명';


--
-- Name: COLUMN categories.sort_order; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.sort_order IS '정렬 순서 (낮을수록 먼저 표시)';


--
-- Name: COLUMN categories.is_active; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.is_active IS '카테고리 활성화 상태';


--
-- Name: COLUMN categories.read_permission; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.read_permission IS '읽기 권한 (all/member)';


--
-- Name: COLUMN categories.write_permission; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.write_permission IS '쓰기 권한 (member/admin)';


--
-- Name: COLUMN categories.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.created_at IS '카테고리 생성일';


--
-- Name: COLUMN categories.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.categories.updated_at IS '카테고리 수정일';


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.categories_id_seq OWNER TO cafeboard;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    post_id integer NOT NULL,
    author_id integer,
    parent_id integer,
    content text NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO cafeboard;

--
-- Name: TABLE comments; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.comments IS '게시글 댓글 정보';


--
-- Name: COLUMN comments.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.id IS '댓글 고유 ID';


--
-- Name: COLUMN comments.post_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.post_id IS '게시글 ID (posts.id 참조)';


--
-- Name: COLUMN comments.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.author_id IS '작성자 ID (users.id 참조)';


--
-- Name: COLUMN comments.parent_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.parent_id IS '부모 댓글 ID (대댓글인 경우)';


--
-- Name: COLUMN comments.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.content IS '댓글 내용';


--
-- Name: COLUMN comments.like_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.like_count IS '댓글 추천수';


--
-- Name: COLUMN comments.is_deleted; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.is_deleted IS '삭제 여부 (true면 삭제됨)';


--
-- Name: COLUMN comments.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.created_at IS '댓글 작성일';


--
-- Name: COLUMN comments.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.comments.updated_at IS '댓글 수정일';


--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.comments_id_seq OWNER TO cafeboard;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    user_id integer NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.likes OWNER TO cafeboard;

--
-- Name: TABLE likes; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.likes IS '게시글 및 댓글 추천 정보';


--
-- Name: COLUMN likes.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.likes.id IS '좋아요 고유 ID';


--
-- Name: COLUMN likes.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.likes.user_id IS '사용자 ID (users.id 참조)';


--
-- Name: COLUMN likes.target_type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.likes.target_type IS '대상 타입 (post/comment)';


--
-- Name: COLUMN likes.target_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.likes.target_id IS '대상 ID (posts.id 또는 comments.id)';


--
-- Name: COLUMN likes.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.likes.created_at IS '좋아요 생성일';


--
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.likes_id_seq OWNER TO cafeboard;

--
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text,
    related_id integer,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO cafeboard;

--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.notifications IS '사용자 알림 정보';


--
-- Name: COLUMN notifications.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.id IS '알림 고유 ID';


--
-- Name: COLUMN notifications.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.user_id IS '알림 수신자 ID (users.id 참조)';


--
-- Name: COLUMN notifications.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.type IS '알림 타입 (comment/like/scrap/etc)';


--
-- Name: COLUMN notifications.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.title IS '알림 제목';


--
-- Name: COLUMN notifications.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.content IS '알림 내용';


--
-- Name: COLUMN notifications.related_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.related_id IS '관련된 게시글/댓글 ID';


--
-- Name: COLUMN notifications.is_read; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.is_read IS '읽음 여부 (true/false)';


--
-- Name: COLUMN notifications.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.notifications.created_at IS '알림 생성일';


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO cafeboard;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: post_files; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.post_files (
    id integer NOT NULL,
    post_id integer NOT NULL,
    file_url character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    file_size integer,
    mime_type character varying(100),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_files OWNER TO cafeboard;

--
-- Name: post_files_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.post_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_files_id_seq OWNER TO cafeboard;

--
-- Name: post_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.post_files_id_seq OWNED BY public.post_files.id;


--
-- Name: post_images; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.post_images (
    id integer NOT NULL,
    post_id integer NOT NULL,
    image_url character varying(500) NOT NULL,
    file_name character varying(255),
    file_size integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.post_images OWNER TO cafeboard;

--
-- Name: TABLE post_images; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.post_images IS '게시글에 첨부된 이미지 정보';


--
-- Name: COLUMN post_images.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.id IS '이미지 고유 ID';


--
-- Name: COLUMN post_images.post_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.post_id IS '게시글 ID (posts.id 참조)';


--
-- Name: COLUMN post_images.image_url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.image_url IS '이미지 파일 URL';


--
-- Name: COLUMN post_images.file_name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.file_name IS '원본 파일명';


--
-- Name: COLUMN post_images.file_size; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.file_size IS '파일 크기 (바이트)';


--
-- Name: COLUMN post_images.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_images.created_at IS '업로드일';


--
-- Name: post_images_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.post_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.post_images_id_seq OWNER TO cafeboard;

--
-- Name: post_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.post_images_id_seq OWNED BY public.post_images.id;


--
-- Name: posts; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    author_id integer,
    category_id integer NOT NULL,
    is_notice boolean DEFAULT false NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    comment_count integer DEFAULT 0 NOT NULL,
    status public."PostStatus" DEFAULT 'published'::public."PostStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.posts OWNER TO cafeboard;

--
-- Name: TABLE posts; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.posts IS '게시글 정보를 저장하는 테이블';


--
-- Name: COLUMN posts.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.id IS '게시글 고유 ID';


--
-- Name: COLUMN posts.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.title IS '게시글 제목';


--
-- Name: COLUMN posts.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.content IS '게시글 내용 (HTML)';


--
-- Name: COLUMN posts.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.author_id IS '작성자 ID (users.id 참조)';


--
-- Name: COLUMN posts.category_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.category_id IS '카테고리 ID (categories.id 참조)';


--
-- Name: COLUMN posts.is_notice; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.is_notice IS '공지사항 여부 (true면 상단 고정)';


--
-- Name: COLUMN posts.is_secret; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.is_secret IS '비밀글 여부';


--
-- Name: COLUMN posts.view_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.view_count IS '조회수';


--
-- Name: COLUMN posts.like_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.like_count IS '추천수';


--
-- Name: COLUMN posts.comment_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.comment_count IS '댓글 수';


--
-- Name: COLUMN posts.status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.status IS '게시글 상태 (published/draft/hidden)';


--
-- Name: COLUMN posts.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.created_at IS '게시글 작성일';


--
-- Name: COLUMN posts.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.posts.updated_at IS '게시글 수정일';


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO cafeboard;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    reporter_id integer,
    target_type character varying(20) NOT NULL,
    target_id integer NOT NULL,
    reason text NOT NULL,
    status public."ReportStatus" DEFAULT 'pending'::public."ReportStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at timestamp(3) without time zone
);


ALTER TABLE public.reports OWNER TO cafeboard;

--
-- Name: TABLE reports; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.reports IS '게시글/댓글 신고 정보';


--
-- Name: COLUMN reports.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.id IS '신고 고유 ID';


--
-- Name: COLUMN reports.reporter_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.reporter_id IS '신고자 ID (users.id 참조)';


--
-- Name: COLUMN reports.target_type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.target_type IS '신고 대상 타입 (post/comment)';


--
-- Name: COLUMN reports.target_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.target_id IS '신고 대상 ID';


--
-- Name: COLUMN reports.reason; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.reason IS '신고 사유';


--
-- Name: COLUMN reports.status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.status IS '신고 처리 상태 (pending/resolved/rejected)';


--
-- Name: COLUMN reports.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.created_at IS '신고일';


--
-- Name: COLUMN reports.resolved_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reports.resolved_at IS '처리 완료일';


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reports_id_seq OWNER TO cafeboard;

--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: scraps; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.scraps (
    id integer NOT NULL,
    user_id integer NOT NULL,
    post_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.scraps OWNER TO cafeboard;

--
-- Name: TABLE scraps; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.scraps IS '사용자의 게시글 스크랩 정보';


--
-- Name: COLUMN scraps.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.scraps.id IS '스크랩 고유 ID';


--
-- Name: COLUMN scraps.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.scraps.user_id IS '사용자 ID (users.id 참조)';


--
-- Name: COLUMN scraps.post_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.scraps.post_id IS '게시글 ID (posts.id 참조)';


--
-- Name: COLUMN scraps.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.scraps.created_at IS '스크랩 생성일';


--
-- Name: scraps_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.scraps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scraps_id_seq OWNER TO cafeboard;

--
-- Name: scraps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.scraps_id_seq OWNED BY public.scraps.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    refresh_token character varying(500) NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sessions OWNER TO cafeboard;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.sessions IS '사용자 로그인 세션 정보';


--
-- Name: COLUMN sessions.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.sessions.id IS '세션 고유 ID';


--
-- Name: COLUMN sessions.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.sessions.user_id IS '사용자 ID (users.id 참조)';


--
-- Name: COLUMN sessions.refresh_token; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.sessions.refresh_token IS 'JWT 리프레시 토큰';


--
-- Name: COLUMN sessions.expires_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.sessions.expires_at IS '세션 만료일';


--
-- Name: COLUMN sessions.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.sessions.created_at IS '세션 생성일';


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO cafeboard;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    nickname character varying(50) NOT NULL,
    profile_image character varying(500),
    bio text,
    role public."Role" DEFAULT 'member'::public."Role" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO cafeboard;

--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.users IS '사용자 정보를 저장하는 테이블';


--
-- Name: COLUMN users.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.id IS '사용자 고유 ID (자동 증가)';


--
-- Name: COLUMN users.email; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.email IS '사용자 이메일 주소 (로그인 ID)';


--
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.password_hash IS 'bcrypt로 해싱된 비밀번호';


--
-- Name: COLUMN users.nickname; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.nickname IS '사용자 닉네임 (화면 표시명)';


--
-- Name: COLUMN users.profile_image; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.profile_image IS '프로필 이미지 URL';


--
-- Name: COLUMN users.bio; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.bio IS '사용자 자기소개';


--
-- Name: COLUMN users.role; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.role IS '사용자 권한 (member/moderator/admin)';


--
-- Name: COLUMN users.is_active; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.is_active IS '계정 활성화 상태 (true/false)';


--
-- Name: COLUMN users.last_login_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.last_login_at IS '마지막 로그인 시간';


--
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.created_at IS '계정 생성일';


--
-- Name: COLUMN users.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.updated_at IS '계정 정보 수정일';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO cafeboard;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: post_files id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_files ALTER COLUMN id SET DEFAULT nextval('public.post_files_id_seq'::regclass);


--
-- Name: post_images id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_images ALTER COLUMN id SET DEFAULT nextval('public.post_images_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: scraps id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.scraps ALTER COLUMN id SET DEFAULT nextval('public.scraps_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: post_files post_files_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_files
    ADD CONSTRAINT post_files_pkey PRIMARY KEY (id);


--
-- Name: post_images post_images_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: scraps scraps_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: comments_parent_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX comments_parent_id_idx ON public.comments USING btree (parent_id);


--
-- Name: comments_post_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX comments_post_id_idx ON public.comments USING btree (post_id);


--
-- Name: likes_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX likes_target_type_target_id_idx ON public.likes USING btree (target_type, target_id);


--
-- Name: likes_user_id_target_type_target_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX likes_user_id_target_type_target_id_key ON public.likes USING btree (user_id, target_type, target_id);


--
-- Name: notifications_user_id_is_read_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX notifications_user_id_is_read_idx ON public.notifications USING btree (user_id, is_read);


--
-- Name: posts_author_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX posts_author_id_idx ON public.posts USING btree (author_id);


--
-- Name: posts_category_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX posts_category_id_idx ON public.posts USING btree (category_id);


--
-- Name: posts_created_at_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at);


--
-- Name: posts_status_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX posts_status_idx ON public.posts USING btree (status);


--
-- Name: scraps_user_id_post_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX scraps_user_id_post_id_key ON public.scraps USING btree (user_id, post_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_files post_files_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_files
    ADD CONSTRAINT post_files_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: post_images post_images_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.post_images
    ADD CONSTRAINT post_images_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: posts posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: posts posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: scraps scraps_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scraps scraps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.scraps
    ADD CONSTRAINT scraps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict fCGTQKpC9rbDeyHCcUlxNL6R46gNgDfRIbwIfNhQm2UMbcfnSEKKzyqm8sPOvSf

