--
-- PostgreSQL database dump
--

\restrict KZSFbYs3XEq0GGoXD7s4WPdPFPqkriMb5kRPA1EPf13ZfzufHqKAnkSdjP2MxUO

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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cafeboard
--

COPY public.users (id, email, password_hash, nickname, name, phone, gender, profile_image, bio, role, is_active, last_login_at, created_at, updated_at) FROM stdin;
2	knh5007@nate.com	$2a$10$allOKeB79ov2ZnelK.Wwd.2Nkv0shzNG4EGAGK6ZKNGgF/m4eJZqK	nak	김남호	010-1234-5678	male	\N	\N	member	t	2026-02-19 11:12:37.553	2026-02-13 09:27:17.952	2026-02-19 11:12:37.553
3	ksh5009@nate.com	$2a$10$y7gN0WxrfUFFG9KIgBQU..iLFl9APh3toxGte5Haa028qbuO95jBW	kim	김성호	010-9876-5432	female	\N	\N	member	t	2026-02-19 11:11:32.894	2026-02-19 10:49:25.687	2026-02-19 11:11:32.894
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cafeboard
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict KZSFbYs3XEq0GGoXD7s4WPdPFPqkriMb5kRPA1EPf13ZfzufHqKAnkSdjP2MxUO

