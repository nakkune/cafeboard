--
-- PostgreSQL database dump
--

\restrict Y5I9Tnx1w1iMgS7ymcTFC467xAqPC6DY3QQrcVfPFiD3H0B2YUBnvWXrWpqlUcC

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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
-- Name: ChannelMemberRole; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."ChannelMemberRole" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE public."ChannelMemberRole" OWNER TO cafeboard;

--
-- Name: ChannelType; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."ChannelType" AS ENUM (
    'public',
    'private',
    'dm'
);


ALTER TYPE public."ChannelType" OWNER TO cafeboard;

--
-- Name: ConversationType; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."ConversationType" AS ENUM (
    'dm',
    'group'
);


ALTER TYPE public."ConversationType" OWNER TO cafeboard;

--
-- Name: MemberLevel; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."MemberLevel" AS ENUM (
    'regular',
    'general',
    'nonmember'
);


ALTER TYPE public."MemberLevel" OWNER TO cafeboard;

--
-- Name: MemberRole; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."MemberRole" AS ENUM (
    'owner',
    'admin',
    'member',
    'guest'
);


ALTER TYPE public."MemberRole" OWNER TO cafeboard;

--
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."MemberStatus" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public."MemberStatus" OWNER TO cafeboard;

--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."MessageType" AS ENUM (
    'text',
    'file',
    'image',
    'video',
    'system'
);


ALTER TYPE public."MessageType" OWNER TO cafeboard;

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
-- Name: PresenceStatus; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."PresenceStatus" AS ENUM (
    'online',
    'away',
    'busy',
    'offline'
);


ALTER TYPE public."PresenceStatus" OWNER TO cafeboard;

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

--
-- Name: SpaceType; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."SpaceType" AS ENUM (
    'task',
    'personal'
);


ALTER TYPE public."SpaceType" OWNER TO cafeboard;

--
-- Name: VideoStatus; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."VideoStatus" AS ENUM (
    'published',
    'hidden',
    'draft'
);


ALTER TYPE public."VideoStatus" OWNER TO cafeboard;

--
-- Name: VideoType; Type: TYPE; Schema: public; Owner: cafeboard
--

CREATE TYPE public."VideoType" AS ENUM (
    'local',
    'external'
);


ALTER TYPE public."VideoType" OWNER TO cafeboard;

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
-- Name: attachments; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.attachments (
    id integer NOT NULL,
    message_id integer NOT NULL,
    uploader_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(100) NOT NULL,
    size integer NOT NULL,
    url character varying(500) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.attachments OWNER TO cafeboard;

--
-- Name: TABLE attachments; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.attachments IS '채팅 중 공유된 파일/이미지 정보';


--
-- Name: COLUMN attachments.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.id IS '첨부파일 고유 ID';


--
-- Name: COLUMN attachments.message_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.message_id IS '연결된 메시지 ID';


--
-- Name: COLUMN attachments.uploader_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.uploader_id IS '업로더 ID';


--
-- Name: COLUMN attachments.filename; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.filename IS '저장된 파일명';


--
-- Name: COLUMN attachments.original_name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.original_name IS '원본 파일명';


--
-- Name: COLUMN attachments.mime_type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.mime_type IS '파일 MIME 타입';


--
-- Name: COLUMN attachments.size; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.size IS '파일 크기 (바이트)';


--
-- Name: COLUMN attachments.url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.url IS '파일 접근 URL';


--
-- Name: COLUMN attachments.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.attachments.created_at IS '업로드 일시';


--
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.attachments_id_seq OWNER TO cafeboard;

--
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- Name: blocks; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.blocks (
    id integer NOT NULL,
    page_id integer NOT NULL,
    parent_id integer,
    type character varying(50) NOT NULL,
    content jsonb NOT NULL,
    properties jsonb,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.blocks OWNER TO cafeboard;

--
-- Name: TABLE blocks; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.blocks IS '페이지 내의 개별 콘텐츠 블록';


--
-- Name: COLUMN blocks.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.id IS '블록 고유 ID';


--
-- Name: COLUMN blocks.page_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.page_id IS '소속된 페이지 ID';


--
-- Name: COLUMN blocks.parent_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.parent_id IS '부모 블록 ID (중첩 블록 관리)';


--
-- Name: COLUMN blocks.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.type IS '블록 타입 (text/heading/image/etc)';


--
-- Name: COLUMN blocks.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.content IS '블록 주요 내용 (텍스트 등)';


--
-- Name: COLUMN blocks.properties; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.properties IS '블록 스타일 및 부가 속성 (JSON)';


--
-- Name: COLUMN blocks."position"; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks."position" IS '페이지 내 정렬 위치';


--
-- Name: COLUMN blocks.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.created_at IS '생성일시';


--
-- Name: COLUMN blocks.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.blocks.updated_at IS '수정일시';


--
-- Name: blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.blocks_id_seq OWNER TO cafeboard;

--
-- Name: blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.blocks_id_seq OWNED BY public.blocks.id;


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
-- Name: channel_members; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.channel_members (
    id integer NOT NULL,
    channel_id integer NOT NULL,
    user_id integer NOT NULL,
    role public."ChannelMemberRole" DEFAULT 'member'::public."ChannelMemberRole" NOT NULL,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_read_at timestamp(3) without time zone
);


ALTER TABLE public.channel_members OWNER TO cafeboard;

--
-- Name: TABLE channel_members; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.channel_members IS '채팅 채널의 참여 멤버 정보';


--
-- Name: COLUMN channel_members.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.id IS '레코드 고유 ID';


--
-- Name: COLUMN channel_members.channel_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.channel_id IS '채널 ID';


--
-- Name: COLUMN channel_members.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.user_id IS '사용자 ID';


--
-- Name: COLUMN channel_members.role; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.role IS '채널 내 역할 (owner/admin/member)';


--
-- Name: COLUMN channel_members.joined_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.joined_at IS '채널 참여 일시';


--
-- Name: COLUMN channel_members.last_read_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channel_members.last_read_at IS '마지막 메시지 읽은 시간';


--
-- Name: channel_members_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.channel_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.channel_members_id_seq OWNER TO cafeboard;

--
-- Name: channel_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.channel_members_id_seq OWNED BY public.channel_members.id;


--
-- Name: channels; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.channels (
    id integer NOT NULL,
    workspace_id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    type public."ChannelType" DEFAULT 'public'::public."ChannelType" NOT NULL,
    topic character varying(500),
    is_archived boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.channels OWNER TO cafeboard;

--
-- Name: TABLE channels; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.channels IS '워크스페이스 내의 채팅방/채널 정보';


--
-- Name: COLUMN channels.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.id IS '채널 고유 ID';


--
-- Name: COLUMN channels.workspace_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.workspace_id IS '소속된 워크스페이스 ID';


--
-- Name: COLUMN channels.name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.name IS '채널 이름';


--
-- Name: COLUMN channels.description; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.description IS '채널 설명';


--
-- Name: COLUMN channels.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.type IS '채널 타입 (public/private/dm)';


--
-- Name: COLUMN channels.topic; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.topic IS '채널 주제(토픽)';


--
-- Name: COLUMN channels.is_archived; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.is_archived IS '보관 처리 여부';


--
-- Name: COLUMN channels.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.created_at IS '채널 생성일';


--
-- Name: COLUMN channels.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.channels.updated_at IS '채널 수정일';


--
-- Name: channels_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.channels_id_seq OWNER TO cafeboard;

--
-- Name: channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.channels_id_seq OWNED BY public.channels.id;


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
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.conversation_participants (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    user_id integer NOT NULL,
    role public."ChannelMemberRole" DEFAULT 'member'::public."ChannelMemberRole" NOT NULL,
    last_read_at timestamp(3) without time zone,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversation_participants OWNER TO cafeboard;

--
-- Name: TABLE conversation_participants; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.conversation_participants IS '개별 대화방의 참여자 정보';


--
-- Name: COLUMN conversation_participants.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.id IS '레코드 ID';


--
-- Name: COLUMN conversation_participants.conversation_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.conversation_id IS '대화 ID';


--
-- Name: COLUMN conversation_participants.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.user_id IS '사용자 ID';


--
-- Name: COLUMN conversation_participants.role; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.role IS '대화방 내 역할';


--
-- Name: COLUMN conversation_participants.last_read_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.last_read_at IS '마지막 읽은 시간';


--
-- Name: COLUMN conversation_participants.joined_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversation_participants.joined_at IS '참여 일시';


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.conversation_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conversation_participants_id_seq OWNER TO cafeboard;

--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    type public."ConversationType" DEFAULT 'dm'::public."ConversationType" NOT NULL,
    name character varying(100),
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.conversations OWNER TO cafeboard;

--
-- Name: TABLE conversations; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.conversations IS '채널 이외의 1:1 또는 그룹 대화 정보';


--
-- Name: COLUMN conversations.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversations.id IS '대화 고유 ID';


--
-- Name: COLUMN conversations.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversations.type IS '대화 타입 (dm/group)';


--
-- Name: COLUMN conversations.name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversations.name IS '대화방 이름 (그룹 대화인 경우)';


--
-- Name: COLUMN conversations.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversations.created_at IS '생성 일시';


--
-- Name: COLUMN conversations.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.conversations.updated_at IS '최근 활동 일시';


--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.conversations_id_seq OWNER TO cafeboard;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    start_date timestamp(3) without time zone NOT NULL,
    end_date timestamp(3) without time zone,
    all_day boolean DEFAULT false NOT NULL,
    color character varying(20),
    author_id integer,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.events OWNER TO cafeboard;

--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.events IS '커뮤니티/워크스페이스 일정 정보';


--
-- Name: COLUMN events.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.id IS '일정 고유 ID';


--
-- Name: COLUMN events.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.title IS '일정 제목';


--
-- Name: COLUMN events.description; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.description IS '일정 상세 설명';


--
-- Name: COLUMN events.start_date; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.start_date IS '시작 일시';


--
-- Name: COLUMN events.end_date; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.end_date IS '종료 일시';


--
-- Name: COLUMN events.all_day; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.all_day IS '하루 종일 여부';


--
-- Name: COLUMN events.color; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.color IS '캘린더 표시 색상';


--
-- Name: COLUMN events.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.author_id IS '작성자 ID';


--
-- Name: COLUMN events.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.created_at IS '작성일시';


--
-- Name: COLUMN events.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.events.updated_at IS '수정일시';


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.events_id_seq OWNER TO cafeboard;

--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: galleries; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.galleries (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text,
    author_id integer NOT NULL,
    like_count integer DEFAULT 0 NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.galleries OWNER TO cafeboard;

--
-- Name: TABLE galleries; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.galleries IS '사진첩 게시글 정보를 저장하는 테이블';


--
-- Name: COLUMN galleries.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.id IS '사진첩 게시글 고유 ID';


--
-- Name: COLUMN galleries.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.title IS '사진첩 제목';


--
-- Name: COLUMN galleries.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.content IS '사진첩 상세 설명 내용';


--
-- Name: COLUMN galleries.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.author_id IS '작성자 ID (users.id 참조)';


--
-- Name: COLUMN galleries.like_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.like_count IS '좋아요/추천 수';


--
-- Name: COLUMN galleries.view_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.view_count IS '조회수';


--
-- Name: COLUMN galleries.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.created_at IS '게시글 등록 일시';


--
-- Name: COLUMN galleries.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.galleries.updated_at IS '게시글 최종 수정 일시';


--
-- Name: galleries_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.galleries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.galleries_id_seq OWNER TO cafeboard;

--
-- Name: galleries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.galleries_id_seq OWNED BY public.galleries.id;


--
-- Name: gallery_comments; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.gallery_comments (
    id integer NOT NULL,
    gallery_id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.gallery_comments OWNER TO cafeboard;

--
-- Name: TABLE gallery_comments; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.gallery_comments IS '사진첩 게시글에 작성된 댓글 정보';


--
-- Name: COLUMN gallery_comments.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.id IS '댓글 고유 ID';


--
-- Name: COLUMN gallery_comments.gallery_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.gallery_id IS '대상 사진첩 ID (galleries.id 참조)';


--
-- Name: COLUMN gallery_comments.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.author_id IS '댓글 작성자 ID (users.id 참조)';


--
-- Name: COLUMN gallery_comments.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.content IS '댓글 본문 내용';


--
-- Name: COLUMN gallery_comments.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.created_at IS '댓글 작성 일시';


--
-- Name: COLUMN gallery_comments.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_comments.updated_at IS '댓글 최종 수정 일시';


--
-- Name: gallery_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.gallery_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gallery_comments_id_seq OWNER TO cafeboard;

--
-- Name: gallery_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.gallery_comments_id_seq OWNED BY public.gallery_comments.id;


--
-- Name: gallery_images; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.gallery_images (
    id integer NOT NULL,
    gallery_id integer NOT NULL,
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.gallery_images OWNER TO cafeboard;

--
-- Name: TABLE gallery_images; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.gallery_images IS '사진첩 게시글에 포함된 이미지 파일 정보';


--
-- Name: COLUMN gallery_images.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_images.id IS '이미지 고유 ID';


--
-- Name: COLUMN gallery_images.gallery_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_images.gallery_id IS '소속된 사진첩 ID (galleries.id 참조)';


--
-- Name: COLUMN gallery_images.image_url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_images.image_url IS '이미지 저장 경로 또는 접근 URL';


--
-- Name: COLUMN gallery_images.sort_order; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_images.sort_order IS '이미지 표시 순서 (낮을수록 먼저 표시)';


--
-- Name: COLUMN gallery_images.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.gallery_images.created_at IS '이미지 업로드 일시';


--
-- Name: gallery_images_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.gallery_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gallery_images_id_seq OWNER TO cafeboard;

--
-- Name: gallery_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.gallery_images_id_seq OWNED BY public.gallery_images.id;


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
-- Name: message_reads; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.message_reads (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.message_reads OWNER TO cafeboard;

--
-- Name: TABLE message_reads; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.message_reads IS '메시지별 개별 읽음 확인 정보';


--
-- Name: COLUMN message_reads.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.message_reads.id IS '레코드 ID';


--
-- Name: COLUMN message_reads.message_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.message_reads.message_id IS '메시지 ID';


--
-- Name: COLUMN message_reads.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.message_reads.user_id IS '읽은 사용자 ID';


--
-- Name: COLUMN message_reads.read_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.message_reads.read_at IS '읽은 시간';


--
-- Name: message_reads_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.message_reads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.message_reads_id_seq OWNER TO cafeboard;

--
-- Name: message_reads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.message_reads_id_seq OWNED BY public.message_reads.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    channel_id integer,
    author_id integer NOT NULL,
    parent_id integer,
    content text NOT NULL,
    type public."MessageType" DEFAULT 'text'::public."MessageType" NOT NULL,
    is_edited boolean DEFAULT false NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    conversation_id integer
);


ALTER TABLE public.messages OWNER TO cafeboard;

--
-- Name: TABLE messages; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.messages IS '채팅 채널 및 개별 대화에서 주고받은 메시지';


--
-- Name: COLUMN messages.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.id IS '메시지 고유 ID';


--
-- Name: COLUMN messages.channel_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.channel_id IS '소속 채널 ID (채널 메시지인 경우)';


--
-- Name: COLUMN messages.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.author_id IS '메시지 작성자 ID';


--
-- Name: COLUMN messages.parent_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.parent_id IS '답장인 경우 부모 메시지 ID (스레드)';


--
-- Name: COLUMN messages.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.content IS '메시지 본문 내용';


--
-- Name: COLUMN messages.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.type IS '메시지 종류 (text/file/image/video/system)';


--
-- Name: COLUMN messages.is_edited; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.is_edited IS '수정 여부';


--
-- Name: COLUMN messages.is_deleted; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.is_deleted IS '삭제 여부';


--
-- Name: COLUMN messages.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.created_at IS '메시지 전송 일시';


--
-- Name: COLUMN messages.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.updated_at IS '메시지 수정 일시';


--
-- Name: COLUMN messages.conversation_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.messages.conversation_id IS '소속 대화 ID (개별 대화/DM인 경우)';


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO cafeboard;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


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
-- Name: pages; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.pages (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    icon character varying(10),
    cover_image character varying(500),
    content jsonb,
    parent_id integer,
    author_id integer,
    is_public boolean DEFAULT true NOT NULL,
    is_archived boolean DEFAULT false NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    space_type public."SpaceType" DEFAULT 'personal'::public."SpaceType" NOT NULL
);


ALTER TABLE public.pages OWNER TO cafeboard;

--
-- Name: TABLE pages; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.pages IS '노션 스타일의 통합 문서/페이지 정보';


--
-- Name: COLUMN pages.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.id IS '페이지 고유 ID';


--
-- Name: COLUMN pages.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.title IS '페이지 제목';


--
-- Name: COLUMN pages.icon; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.icon IS '페이지 아이콘 (이모지 등)';


--
-- Name: COLUMN pages.cover_image; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.cover_image IS '페이지 커버 이미지 URL';


--
-- Name: COLUMN pages.content; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.content IS '페이지 본문 데이터 (JSON)';


--
-- Name: COLUMN pages.parent_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.parent_id IS '부모 페이지 ID (계층 구조 관리)';


--
-- Name: COLUMN pages.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.author_id IS '작성자 ID';


--
-- Name: COLUMN pages.is_public; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.is_public IS '공개 여부';


--
-- Name: COLUMN pages.is_archived; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.is_archived IS '보관 처리 여부';


--
-- Name: COLUMN pages."position"; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages."position" IS '표시 순서 정렬값';


--
-- Name: COLUMN pages.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.created_at IS '생성일시';


--
-- Name: COLUMN pages.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.pages.updated_at IS '수정일시';


--
-- Name: pages_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.pages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pages_id_seq OWNER TO cafeboard;

--
-- Name: pages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.pages_id_seq OWNED BY public.pages.id;


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
-- Name: TABLE post_files; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.post_files IS '게시글에 첨부된 일반 파일 정보';


--
-- Name: COLUMN post_files.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.id IS '파일 고유 ID';


--
-- Name: COLUMN post_files.post_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.post_id IS '소속 게시글 ID';


--
-- Name: COLUMN post_files.file_url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.file_url IS '파일 다운로드 URL';


--
-- Name: COLUMN post_files.file_name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.file_name IS '저장된 파일명';


--
-- Name: COLUMN post_files.original_name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.original_name IS '원본 파일명';


--
-- Name: COLUMN post_files.file_size; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.file_size IS '파일 크기 (바이트)';


--
-- Name: COLUMN post_files.mime_type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.mime_type IS '파일 MIME 타입';


--
-- Name: COLUMN post_files.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.post_files.created_at IS '업로드 일시';


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
-- Name: reactions; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.reactions (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    emoji character varying(50) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.reactions OWNER TO cafeboard;

--
-- Name: TABLE reactions; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.reactions IS '채팅 메시지에 대한 이모지 반응 정보';


--
-- Name: COLUMN reactions.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reactions.id IS '반응 고유 ID';


--
-- Name: COLUMN reactions.message_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reactions.message_id IS '대상 메시지 ID';


--
-- Name: COLUMN reactions.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reactions.user_id IS '반응을 남긴 사용자 ID';


--
-- Name: COLUMN reactions.emoji; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reactions.emoji IS '반응 이모지 코드';


--
-- Name: COLUMN reactions.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.reactions.created_at IS '반응 일시';


--
-- Name: reactions_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.reactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reactions_id_seq OWNER TO cafeboard;

--
-- Name: reactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.reactions_id_seq OWNED BY public.reactions.id;


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
-- Name: system_settings; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text NOT NULL,
    type character varying(20) DEFAULT 'string'::character varying NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO cafeboard;

--
-- Name: TABLE system_settings; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.system_settings IS '시스템 전역 설정을 관리하는 테이블';


--
-- Name: COLUMN system_settings.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.system_settings.id IS '설정 고유 ID';


--
-- Name: COLUMN system_settings.key; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.system_settings.key IS '설정 식별 키 (예: site_name, maintenance_mode)';


--
-- Name: COLUMN system_settings.value; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.system_settings.value IS '설정 데이터 값 (텍스트 또는 JSON 포맷)';


--
-- Name: COLUMN system_settings.type; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.system_settings.type IS '데이터 타입 구분 (string, boolean, json)';


--
-- Name: COLUMN system_settings.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.system_settings.updated_at IS '최종 수정 일시';


--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.system_settings_id_seq OWNER TO cafeboard;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: user_presences; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.user_presences (
    id integer NOT NULL,
    user_id integer NOT NULL,
    status public."PresenceStatus" DEFAULT 'offline'::public."PresenceStatus" NOT NULL,
    last_active_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_presences OWNER TO cafeboard;

--
-- Name: TABLE user_presences; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.user_presences IS '사용자의 실시간 접속 상태 정보';


--
-- Name: COLUMN user_presences.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.user_presences.id IS '상태 레코드 ID';


--
-- Name: COLUMN user_presences.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.user_presences.user_id IS '사용자 ID';


--
-- Name: COLUMN user_presences.status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.user_presences.status IS '접속 상태 (online/away/busy/offline)';


--
-- Name: COLUMN user_presences.last_active_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.user_presences.last_active_at IS '마지막 활동 시간';


--
-- Name: user_presences_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.user_presences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_presences_id_seq OWNER TO cafeboard;

--
-- Name: user_presences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.user_presences_id_seq OWNED BY public.user_presences.id;


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
    updated_at timestamp(3) without time zone NOT NULL,
    gender character varying(10),
    name character varying(100),
    phone character varying(20),
    approved_at timestamp(3) without time zone,
    approved_by integer,
    member_status public."MemberStatus" DEFAULT 'pending'::public."MemberStatus" NOT NULL,
    rejection_reason text,
    member_level public."MemberLevel" DEFAULT 'general'::public."MemberLevel" NOT NULL
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

COMMENT ON COLUMN public.users.role IS '사용자 상위 권한 (member/moderator/admin)';


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
-- Name: COLUMN users.gender; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.gender IS '성별';


--
-- Name: COLUMN users.name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.name IS '사용자 실명';


--
-- Name: COLUMN users.phone; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.phone IS '전화번호';


--
-- Name: COLUMN users.approved_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.approved_at IS '가입 승인 일시';


--
-- Name: COLUMN users.approved_by; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.approved_by IS '승인 처리한 관리자 ID';


--
-- Name: COLUMN users.member_status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.member_status IS '가입 승인 상태 (pending/approved/rejected)';


--
-- Name: COLUMN users.rejection_reason; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.rejection_reason IS '가입 거절 사유';


--
-- Name: COLUMN users.member_level; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.users.member_level IS '회원 등급 (regular/general/nonmember)';


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
-- Name: videos; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.videos (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    "videoType" public."VideoType" NOT NULL,
    video_url character varying(500) NOT NULL,
    thumbnail_url character varying(500),
    duration integer,
    category_id integer,
    author_id integer NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    status public."VideoStatus" DEFAULT 'published'::public."VideoStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.videos OWNER TO cafeboard;

--
-- Name: TABLE videos; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.videos IS '게시판 내 동영상 콘텐츠 정보';


--
-- Name: COLUMN videos.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.id IS '동영상 고유 ID';


--
-- Name: COLUMN videos.title; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.title IS '동영상 제목';


--
-- Name: COLUMN videos.description; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.description IS '동영상 설명';


--
-- Name: COLUMN videos."videoType"; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos."videoType" IS '동영상 타입 (local/external)';


--
-- Name: COLUMN videos.video_url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.video_url IS '동영상 재생/스트리밍 URL';


--
-- Name: COLUMN videos.thumbnail_url; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.thumbnail_url IS '동영상 미리보기 이미지 URL';


--
-- Name: COLUMN videos.duration; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.duration IS '재생 시간 (초)';


--
-- Name: COLUMN videos.category_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.category_id IS '소속 카테고리 ID';


--
-- Name: COLUMN videos.author_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.author_id IS '업로더 ID';


--
-- Name: COLUMN videos.view_count; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.view_count IS '조회수';


--
-- Name: COLUMN videos.status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.status IS '상태 (published/hidden/draft)';


--
-- Name: COLUMN videos.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.created_at IS '등록일시';


--
-- Name: COLUMN videos.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.videos.updated_at IS '수정일시';


--
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.videos_id_seq OWNER TO cafeboard;

--
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- Name: workspace_join_requests; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.workspace_join_requests (
    id integer NOT NULL,
    workspace_id integer NOT NULL,
    user_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    processed_at timestamp(3) without time zone
);


ALTER TABLE public.workspace_join_requests OWNER TO cafeboard;

--
-- Name: TABLE workspace_join_requests; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.workspace_join_requests IS '비공개 워크스페이스 가입 신청 정보';


--
-- Name: COLUMN workspace_join_requests.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.id IS '요청 고유 ID';


--
-- Name: COLUMN workspace_join_requests.workspace_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.workspace_id IS '대상 워크스페이스 ID';


--
-- Name: COLUMN workspace_join_requests.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.user_id IS '신청자 ID';


--
-- Name: COLUMN workspace_join_requests.status; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.status IS '상태 (pending/approved/rejected)';


--
-- Name: COLUMN workspace_join_requests.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.created_at IS '신청 일시';


--
-- Name: COLUMN workspace_join_requests.processed_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_join_requests.processed_at IS '승인/거절 처리 일시';


--
-- Name: workspace_join_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.workspace_join_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workspace_join_requests_id_seq OWNER TO cafeboard;

--
-- Name: workspace_join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.workspace_join_requests_id_seq OWNED BY public.workspace_join_requests.id;


--
-- Name: workspace_members; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.workspace_members (
    id integer NOT NULL,
    workspace_id integer NOT NULL,
    user_id integer NOT NULL,
    role public."MemberRole" DEFAULT 'member'::public."MemberRole" NOT NULL,
    joined_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.workspace_members OWNER TO cafeboard;

--
-- Name: TABLE workspace_members; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.workspace_members IS '워크스페이스에 소속된 멤버 정보';


--
-- Name: COLUMN workspace_members.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_members.id IS '멤버 레코드 고유 ID';


--
-- Name: COLUMN workspace_members.workspace_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_members.workspace_id IS '워크스페이스 ID';


--
-- Name: COLUMN workspace_members.user_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_members.user_id IS '사용자 ID';


--
-- Name: COLUMN workspace_members.role; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_members.role IS '멤버 역할 (owner/admin/member/guest)';


--
-- Name: COLUMN workspace_members.joined_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspace_members.joined_at IS '워크스페이스 가입 일시';


--
-- Name: workspace_members_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.workspace_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workspace_members_id_seq OWNER TO cafeboard;

--
-- Name: workspace_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.workspace_members_id_seq OWNED BY public.workspace_members.id;


--
-- Name: workspaces; Type: TABLE; Schema: public; Owner: cafeboard
--

CREATE TABLE public.workspaces (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(500),
    owner_id integer NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    is_public boolean DEFAULT true NOT NULL
);


ALTER TABLE public.workspaces OWNER TO cafeboard;

--
-- Name: TABLE workspaces; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON TABLE public.workspaces IS '협업을 위한 워크스페이스(팀) 정보';


--
-- Name: COLUMN workspaces.id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.id IS '워크스페이스 고유 ID';


--
-- Name: COLUMN workspaces.name; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.name IS '워크스페이스 이름';


--
-- Name: COLUMN workspaces.description; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.description IS '워크스페이스 설명';


--
-- Name: COLUMN workspaces.icon; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.icon IS '워크스페이스 아이콘 URL';


--
-- Name: COLUMN workspaces.owner_id; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.owner_id IS '워크스페이스 소유자 ID';


--
-- Name: COLUMN workspaces.created_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.created_at IS '생성일시';


--
-- Name: COLUMN workspaces.updated_at; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.updated_at IS '수정일시';


--
-- Name: COLUMN workspaces.is_public; Type: COMMENT; Schema: public; Owner: cafeboard
--

COMMENT ON COLUMN public.workspaces.is_public IS '공개 여부 (누구나 가입 요청 가능 여부)';


--
-- Name: workspaces_id_seq; Type: SEQUENCE; Schema: public; Owner: cafeboard
--

CREATE SEQUENCE public.workspaces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.workspaces_id_seq OWNER TO cafeboard;

--
-- Name: workspaces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cafeboard
--

ALTER SEQUENCE public.workspaces_id_seq OWNED BY public.workspaces.id;


--
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- Name: blocks id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.blocks ALTER COLUMN id SET DEFAULT nextval('public.blocks_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: channel_members id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channel_members ALTER COLUMN id SET DEFAULT nextval('public.channel_members_id_seq'::regclass);


--
-- Name: channels id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channels ALTER COLUMN id SET DEFAULT nextval('public.channels_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: galleries id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.galleries ALTER COLUMN id SET DEFAULT nextval('public.galleries_id_seq'::regclass);


--
-- Name: gallery_comments id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_comments ALTER COLUMN id SET DEFAULT nextval('public.gallery_comments_id_seq'::regclass);


--
-- Name: gallery_images id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_images ALTER COLUMN id SET DEFAULT nextval('public.gallery_images_id_seq'::regclass);


--
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: message_reads id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.message_reads ALTER COLUMN id SET DEFAULT nextval('public.message_reads_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: pages id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.pages ALTER COLUMN id SET DEFAULT nextval('public.pages_id_seq'::regclass);


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
-- Name: reactions id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reactions ALTER COLUMN id SET DEFAULT nextval('public.reactions_id_seq'::regclass);


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
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: user_presences id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.user_presences ALTER COLUMN id SET DEFAULT nextval('public.user_presences_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- Name: workspace_join_requests id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_join_requests ALTER COLUMN id SET DEFAULT nextval('public.workspace_join_requests_id_seq'::regclass);


--
-- Name: workspace_members id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_members ALTER COLUMN id SET DEFAULT nextval('public.workspace_members_id_seq'::regclass);


--
-- Name: workspaces id; Type: DEFAULT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspaces ALTER COLUMN id SET DEFAULT nextval('public.workspaces_id_seq'::regclass);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: blocks blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: channel_members channel_members_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_pkey PRIMARY KEY (id);


--
-- Name: channels channels_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: galleries galleries_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_pkey PRIMARY KEY (id);


--
-- Name: gallery_comments gallery_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_comments
    ADD CONSTRAINT gallery_comments_pkey PRIMARY KEY (id);


--
-- Name: gallery_images gallery_images_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: message_reads message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


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
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


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
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: user_presences user_presences_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.user_presences
    ADD CONSTRAINT user_presences_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: workspace_join_requests workspace_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_pkey PRIMARY KEY (id);


--
-- Name: workspace_members workspace_members_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_pkey PRIMARY KEY (id);


--
-- Name: workspaces workspaces_pkey; Type: CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_pkey PRIMARY KEY (id);


--
-- Name: blocks_page_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX blocks_page_id_idx ON public.blocks USING btree (page_id);


--
-- Name: blocks_parent_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX blocks_parent_id_idx ON public.blocks USING btree (parent_id);


--
-- Name: categories_name_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);


--
-- Name: channel_members_channel_id_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX channel_members_channel_id_user_id_key ON public.channel_members USING btree (channel_id, user_id);


--
-- Name: channels_workspace_id_name_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX channels_workspace_id_name_key ON public.channels USING btree (workspace_id, name);


--
-- Name: comments_parent_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX comments_parent_id_idx ON public.comments USING btree (parent_id);


--
-- Name: comments_post_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX comments_post_id_idx ON public.comments USING btree (post_id);


--
-- Name: conversation_participants_conversation_id_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX conversation_participants_conversation_id_user_id_key ON public.conversation_participants USING btree (conversation_id, user_id);


--
-- Name: events_author_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX events_author_id_idx ON public.events USING btree (author_id);


--
-- Name: events_start_date_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX events_start_date_idx ON public.events USING btree (start_date);


--
-- Name: likes_target_type_target_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX likes_target_type_target_id_idx ON public.likes USING btree (target_type, target_id);


--
-- Name: likes_user_id_target_type_target_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX likes_user_id_target_type_target_id_key ON public.likes USING btree (user_id, target_type, target_id);


--
-- Name: message_reads_message_id_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX message_reads_message_id_user_id_key ON public.message_reads USING btree (message_id, user_id);


--
-- Name: messages_channel_id_created_at_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX messages_channel_id_created_at_idx ON public.messages USING btree (channel_id, created_at);


--
-- Name: notifications_user_id_is_read_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX notifications_user_id_is_read_idx ON public.notifications USING btree (user_id, is_read);


--
-- Name: pages_author_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX pages_author_id_idx ON public.pages USING btree (author_id);


--
-- Name: pages_parent_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX pages_parent_id_idx ON public.pages USING btree (parent_id);


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
-- Name: reactions_message_id_user_id_emoji_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX reactions_message_id_user_id_emoji_key ON public.reactions USING btree (message_id, user_id, emoji);


--
-- Name: scraps_user_id_post_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX scraps_user_id_post_id_key ON public.scraps USING btree (user_id, post_id);


--
-- Name: system_settings_key_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX system_settings_key_key ON public.system_settings USING btree (key);


--
-- Name: user_presences_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX user_presences_user_id_key ON public.user_presences USING btree (user_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: videos_author_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX videos_author_id_idx ON public.videos USING btree (author_id);


--
-- Name: videos_category_id_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX videos_category_id_idx ON public.videos USING btree (category_id);


--
-- Name: videos_status_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX videos_status_idx ON public.videos USING btree (status);


--
-- Name: videos_videoType_idx; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE INDEX "videos_videoType_idx" ON public.videos USING btree ("videoType");


--
-- Name: workspace_join_requests_workspace_id_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX workspace_join_requests_workspace_id_user_id_key ON public.workspace_join_requests USING btree (workspace_id, user_id);


--
-- Name: workspace_members_workspace_id_user_id_key; Type: INDEX; Schema: public; Owner: cafeboard
--

CREATE UNIQUE INDEX workspace_members_workspace_id_user_id_key ON public.workspace_members USING btree (workspace_id, user_id);


--
-- Name: attachments attachments_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attachments attachments_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: blocks blocks_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: blocks blocks_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.blocks
    ADD CONSTRAINT blocks_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.blocks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: channel_members channel_members_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: channel_members channel_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channel_members
    ADD CONSTRAINT channel_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: channels channels_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.channels
    ADD CONSTRAINT channels_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: conversation_participants conversation_participants_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: events events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: galleries galleries_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.galleries
    ADD CONSTRAINT galleries_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gallery_comments gallery_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_comments
    ADD CONSTRAINT gallery_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: gallery_comments gallery_comments_gallery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_comments
    ADD CONSTRAINT gallery_comments_gallery_id_fkey FOREIGN KEY (gallery_id) REFERENCES public.galleries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gallery_images gallery_images_gallery_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.gallery_images
    ADD CONSTRAINT gallery_images_gallery_id_fkey FOREIGN KEY (gallery_id) REFERENCES public.galleries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: likes likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reads message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: message_reads message_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.message_reads
    ADD CONSTRAINT message_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: messages messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.channels(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messages messages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pages pages_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: pages pages_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: reactions reactions_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: reactions reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.reactions
    ADD CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


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
-- Name: user_presences user_presences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.user_presences
    ADD CONSTRAINT user_presences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: videos videos_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: videos videos_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: workspace_join_requests workspace_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_join_requests workspace_join_requests_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_join_requests
    ADD CONSTRAINT workspace_join_requests_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspace_members workspace_members_workspace_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspace_members
    ADD CONSTRAINT workspace_members_workspace_id_fkey FOREIGN KEY (workspace_id) REFERENCES public.workspaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: workspaces workspaces_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cafeboard
--

ALTER TABLE ONLY public.workspaces
    ADD CONSTRAINT workspaces_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Y5I9Tnx1w1iMgS7ymcTFC467xAqPC6DY3QQrcVfPFiD3H0B2YUBnvWXrWpqlUcC

