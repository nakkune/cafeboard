--
-- PostgreSQL database dump
--

\restrict 3QydOIegTxSP03GQRjjsnbpNnVHZiNb5arw7bDoblET62H3GKnXqLDKSO01pgNU

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
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: cafeboard
--

COPY public.categories (id, name, description, sort_order, is_active, read_permission, write_permission, created_at, updated_at) FROM stdin;
1	공지사항	커뮤니티 공지 및 안내사항	1	t	all	admin	2026-02-13 09:47:35.735	2026-02-13 09:47:35.735
2	자유게시판	자유롭게 이야기 나누는 공간	2	t	all	member	2026-02-13 09:47:35.748	2026-02-13 09:47:35.748
3	질문게시판	궁금한 점을 질문하고 답변하는 공간	3	t	all	member	2026-02-13 09:47:35.751	2026-02-13 09:47:35.751
4	정보공유	유용한 정보와 지식을 공유하는 공간	4	t	all	member	2026-02-13 09:47:35.753	2026-02-13 09:47:35.753
5	홍보게시판	프로젝트, 서비스, 이벤트 홍보 공간	5	t	all	member	2026-02-13 09:47:35.756	2026-02-13 09:47:35.756
6	건의사항	커뮤니티 개선을 위한 제안	6	t	all	member	2026-02-13 09:47:35.759	2026-02-13 09:47:35.759
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cafeboard
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- PostgreSQL database dump complete
--

\unrestrict 3QydOIegTxSP03GQRjjsnbpNnVHZiNb5arw7bDoblET62H3GKnXqLDKSO01pgNU

