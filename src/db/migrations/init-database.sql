--
-- PostgreSQL database dump
--

-- Dumped from database version 12.13 (Ubuntu 12.13-0ubuntu0.20.04.1)
-- Dumped by pg_dump version 12.13 (Ubuntu 12.13-0ubuntu0.20.04.1)

-- Started on 2023-01-31 23:09:09 EET

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
-- TOC entry 562 (class 1247 OID 58582)
-- Name: CertificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CertificationStatus" AS ENUM (
    'active',
    'inactive',
    'coming_soon',
    'deprecated',
    'coming-soon'
);


ALTER TYPE public."CertificationStatus" OWNER TO postgres;

--
-- TOC entry 650 (class 1247 OID 58594)
-- Name: CourseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CourseStatus" AS ENUM (
    'available',
    'coming_soon',
    'not_available',
    'removed'
);


ALTER TYPE public."CourseStatus" OWNER TO postgres;

--
-- TOC entry 653 (class 1247 OID 58604)
-- Name: FccCertificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FccCertificationType" AS ENUM (
    'certification',
    'course-completion'
);


ALTER TYPE public."FccCertificationType" OWNER TO postgres;

--
-- TOC entry 656 (class 1247 OID 58610)
-- Name: LearnerLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LearnerLevel" AS ENUM (
    'Beginner',
    'Intermediate',
    'Expert',
    'All Levels'
);


ALTER TYPE public."LearnerLevel" OWNER TO postgres;

--
-- TOC entry 659 (class 1247 OID 58620)
-- Name: ResourceableType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ResourceableType" AS ENUM (
    'FreeCodeCampCertification',
    'TopcoderUdemyCourse'
);


ALTER TYPE public."ResourceableType" OWNER TO postgres;

--
-- TOC entry 662 (class 1247 OID 58626)
-- Name: enum_CertificationEnrollment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_CertificationEnrollment_status" AS ENUM (
    'enrolled',
    'disenrolled',
    'completed'
);


ALTER TYPE public."enum_CertificationEnrollment_status" OWNER TO postgres;

--
-- TOC entry 665 (class 1247 OID 58634)
-- Name: enum_CertificationEnrollments_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_CertificationEnrollments_status" AS ENUM (
    'enrolled',
    'disenrolled',
    'completed'
);


ALTER TYPE public."enum_CertificationEnrollments_status" OWNER TO postgres;

--
-- TOC entry 668 (class 1247 OID 58642)
-- Name: enum_CertificationResourceProgresses_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_CertificationResourceProgresses_status" AS ENUM (
    'not-started',
    'in-progress',
    'completed'
);


ALTER TYPE public."enum_CertificationResourceProgresses_status" OWNER TO postgres;

--
-- TOC entry 671 (class 1247 OID 58650)
-- Name: enum_CertificationResource_resourceableType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_CertificationResource_resourceableType" AS ENUM (
    'FreeCodeCampCertification',
    'TopcoderUdemyCourse'
);


ALTER TYPE public."enum_CertificationResource_resourceableType" OWNER TO postgres;

--
-- TOC entry 674 (class 1247 OID 58656)
-- Name: enum_FccCertificationProgresses_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FccCertificationProgresses_status" AS ENUM (
    'in-progress',
    'completed',
    'not-started'
);


ALTER TYPE public."enum_FccCertificationProgresses_status" OWNER TO postgres;

--
-- TOC entry 677 (class 1247 OID 58664)
-- Name: enum_FccCourseProgresses_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FccCourseProgresses_status" AS ENUM (
    'in-progress',
    'completed'
);


ALTER TYPE public."enum_FccCourseProgresses_status" OWNER TO postgres;

--
-- TOC entry 680 (class 1247 OID 58670)
-- Name: enum_FccCourses_learnerLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FccCourses_learnerLevel" AS ENUM (
    'Beginner',
    'Intermediate',
    'Expert',
    'All Levels'
);


ALTER TYPE public."enum_FccCourses_learnerLevel" OWNER TO postgres;

--
-- TOC entry 683 (class 1247 OID 58680)
-- Name: enum_FccModuleProgresses_moduleStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FccModuleProgresses_moduleStatus" AS ENUM (
    'not-started',
    'in-progress',
    'completed'
);


ALTER TYPE public."enum_FccModuleProgresses_moduleStatus" OWNER TO postgres;

--
-- TOC entry 686 (class 1247 OID 58688)
-- Name: enum_FreeCodeCampCertification_certType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FreeCodeCampCertification_certType" AS ENUM (
    'certification',
    'course-completion'
);


ALTER TYPE public."enum_FreeCodeCampCertification_certType" OWNER TO postgres;

--
-- TOC entry 689 (class 1247 OID 58694)
-- Name: enum_FreeCodeCampCertification_learnerLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FreeCodeCampCertification_learnerLevel" AS ENUM (
    'Beginner',
    'Intermediate',
    'Expert',
    'All Levels'
);


ALTER TYPE public."enum_FreeCodeCampCertification_learnerLevel" OWNER TO postgres;

--
-- TOC entry 692 (class 1247 OID 58704)
-- Name: enum_FreeCodeCampCertification_state; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_FreeCodeCampCertification_state" AS ENUM (
    'active',
    'inactive',
    'coming_soon',
    'coming-soon',
    'deprecated'
);


ALTER TYPE public."enum_FreeCodeCampCertification_state" OWNER TO postgres;

--
-- TOC entry 695 (class 1247 OID 58716)
-- Name: enum_TopcoderCertification_learnerLevel; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_TopcoderCertification_learnerLevel" AS ENUM (
    'Beginner',
    'Intermediate',
    'Expert',
    'All Levels'
);


ALTER TYPE public."enum_TopcoderCertification_learnerLevel" OWNER TO postgres;

--
-- TOC entry 698 (class 1247 OID 58726)
-- Name: enum_TopcoderCertification_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_TopcoderCertification_status" AS ENUM (
    'active',
    'inactive',
    'coming_soon',
    'deprecated'
);


ALTER TYPE public."enum_TopcoderCertification_status" OWNER TO postgres;

--
-- TOC entry 701 (class 1247 OID 58736)
-- Name: enum_TopcoderUdemyCourse_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_TopcoderUdemyCourse_status" AS ENUM (
    'available',
    'coming_soon',
    'not_available',
    'removed'
);


ALTER TYPE public."enum_TopcoderUdemyCourse_status" OWNER TO postgres;

--
-- TOC entry 704 (class 1247 OID 58746)
-- Name: enum_UdemyCourse_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."enum_UdemyCourse_level" AS ENUM (
    'Beginner',
    'Intermediate',
    'Expert',
    'All Levels'
);


ALTER TYPE public."enum_UdemyCourse_level" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 202 (class 1259 OID 58755)
-- Name: CertificationCategory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CertificationCategory" (
    id integer NOT NULL,
    category text NOT NULL,
    track text NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public."CertificationCategory" OWNER TO postgres;

--
-- TOC entry 203 (class 1259 OID 58761)
-- Name: CertificationCategory_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CertificationCategory_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."CertificationCategory_id_seq" OWNER TO postgres;

--
-- TOC entry 3194 (class 0 OID 0)
-- Dependencies: 203
-- Name: CertificationCategory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CertificationCategory_id_seq" OWNED BY public."CertificationCategory".id;


--
-- TOC entry 204 (class 1259 OID 58763)
-- Name: CertificationEnrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CertificationEnrollments" (
    id integer NOT NULL,
    "topcoderCertificationId" integer,
    "userId" character varying(255),
    "userHandle" character varying(255),
    status public."enum_CertificationEnrollments_status" DEFAULT 'enrolled'::public."enum_CertificationEnrollments_status",
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "completedAt" timestamp with time zone
);


ALTER TABLE public."CertificationEnrollments" OWNER TO postgres;

--
-- TOC entry 205 (class 1259 OID 58770)
-- Name: CertificationEnrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CertificationEnrollments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."CertificationEnrollments_id_seq" OWNER TO postgres;

--
-- TOC entry 3195 (class 0 OID 0)
-- Dependencies: 205
-- Name: CertificationEnrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CertificationEnrollments_id_seq" OWNED BY public."CertificationEnrollments".id;


--
-- TOC entry 206 (class 1259 OID 58772)
-- Name: CertificationResource; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CertificationResource" (
    id integer NOT NULL,
    "resourceProviderId" integer NOT NULL,
    "resourceableId" integer NOT NULL,
    "resourceableType" public."ResourceableType" NOT NULL,
    "displayOrder" integer,
    "completionOrder" integer,
    "resourceDescription" text,
    "resourceTitle" text,
    "topcoderCertificationId" integer,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public."CertificationResource" OWNER TO postgres;

--
-- TOC entry 207 (class 1259 OID 58778)
-- Name: CertificationResourceProgresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CertificationResourceProgresses" (
    id integer NOT NULL,
    "certificationEnrollmentId" integer,
    "certificationResourceId" integer,
    status public."enum_CertificationResourceProgresses_status" DEFAULT 'not-started'::public."enum_CertificationResourceProgresses_status",
    "resourceProgressId" integer,
    "resourceProgressType" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."CertificationResourceProgresses" OWNER TO postgres;

--
-- TOC entry 208 (class 1259 OID 58782)
-- Name: CertificationResourceProgresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CertificationResourceProgresses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."CertificationResourceProgresses_id_seq" OWNER TO postgres;

--
-- TOC entry 3196 (class 0 OID 0)
-- Dependencies: 208
-- Name: CertificationResourceProgresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CertificationResourceProgresses_id_seq" OWNED BY public."CertificationResourceProgresses".id;


--
-- TOC entry 209 (class 1259 OID 58784)
-- Name: CertificationResource_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."CertificationResource_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."CertificationResource_id_seq" OWNER TO postgres;

--
-- TOC entry 3197 (class 0 OID 0)
-- Dependencies: 209
-- Name: CertificationResource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."CertificationResource_id_seq" OWNED BY public."CertificationResource".id;


--
-- TOC entry 210 (class 1259 OID 58786)
-- Name: DataVersion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DataVersion" (
    version timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DataVersion" OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 58789)
-- Name: FccCertificationProgresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccCertificationProgresses" (
    id integer NOT NULL,
    "fccCertificationId" integer,
    "certProgressDynamoUuid" uuid,
    "fccCourseId" integer,
    "userId" character varying(255) NOT NULL,
    certification character varying(255),
    "certificationId" character varying(255),
    "certificationTitle" character varying(255),
    "certificationTrackType" character varying(255),
    "certType" character varying(255),
    "courseKey" character varying(255) NOT NULL,
    status public."enum_FccCertificationProgresses_status" NOT NULL,
    "startDate" timestamp with time zone,
    "lastInteractionDate" timestamp with time zone,
    "completedDate" timestamp with time zone,
    "academicHonestyPolicyAcceptedAt" timestamp with time zone,
    "currentLesson" character varying(255),
    "certificationImageUrl" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."FccCertificationProgresses" OWNER TO postgres;

--
-- TOC entry 212 (class 1259 OID 58795)
-- Name: FccCertificationProgresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FccCertificationProgresses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."FccCertificationProgresses_id_seq" OWNER TO postgres;

--
-- TOC entry 3198 (class 0 OID 0)
-- Dependencies: 212
-- Name: FccCertificationProgresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FccCertificationProgresses_id_seq" OWNED BY public."FccCertificationProgresses".id;


--
-- TOC entry 213 (class 1259 OID 58797)
-- Name: FccCompletedLessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccCompletedLessons" (
    id character varying(255) NOT NULL,
    "fccModuleProgressId" integer NOT NULL,
    "dashedName" character varying(255) NOT NULL,
    "completedDate" timestamp with time zone
);


ALTER TABLE public."FccCompletedLessons" OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 58803)
-- Name: FccCourses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccCourses" (
    id integer NOT NULL,
    "fccCourseUuid" uuid NOT NULL,
    "providerId" integer,
    key character varying(255),
    title character varying(255),
    "certificationId" integer,
    "estimatedCompletionTimeValue" integer,
    "estimatedCompletionTimeUnits" character varying(255),
    "introCopy" character varying(255)[],
    "keyPoints" character varying(255)[],
    "completionSuggestions" character varying(255)[],
    note character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    skills character varying(255)[],
    "learnerLevel" public."enum_FccCourses_learnerLevel" DEFAULT 'Beginner'::public."enum_FccCourses_learnerLevel"
);


ALTER TABLE public."FccCourses" OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 58810)
-- Name: FccCourses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FccCourses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."FccCourses_id_seq" OWNER TO postgres;

--
-- TOC entry 3199 (class 0 OID 0)
-- Dependencies: 215
-- Name: FccCourses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FccCourses_id_seq" OWNED BY public."FccCourses".id;


--
-- TOC entry 216 (class 1259 OID 58812)
-- Name: FccLessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccLessons" (
    id character varying(255) NOT NULL,
    "fccModuleId" integer,
    title character varying(255) NOT NULL,
    "dashedName" character varying(255) NOT NULL,
    "isAssessment" boolean DEFAULT false NOT NULL,
    "order" integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."FccLessons" OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 58819)
-- Name: FccModuleProgresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccModuleProgresses" (
    id integer NOT NULL,
    module character varying(255) NOT NULL,
    "moduleStatus" public."enum_FccModuleProgresses_moduleStatus" DEFAULT 'not-started'::public."enum_FccModuleProgresses_moduleStatus",
    "lessonCount" integer,
    "isAssessment" boolean,
    "startDate" timestamp with time zone,
    "lastInteractionDate" timestamp with time zone,
    "completedDate" timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "fccCertificationProgressId" integer
);


ALTER TABLE public."FccModuleProgresses" OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 58823)
-- Name: FccModuleProgresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FccModuleProgresses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."FccModuleProgresses_id_seq" OWNER TO postgres;

--
-- TOC entry 3200 (class 0 OID 0)
-- Dependencies: 218
-- Name: FccModuleProgresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FccModuleProgresses_id_seq" OWNED BY public."FccModuleProgresses".id;


--
-- TOC entry 219 (class 1259 OID 58825)
-- Name: FccModules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FccModules" (
    id integer NOT NULL,
    "fccCourseId" integer,
    key character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    "dashedName" character varying(255) NOT NULL,
    "estimatedCompletionTimeValue" integer,
    "estimatedCompletionTimeUnits" character varying(255),
    "introCopy" character varying(255)[],
    "isAssessment" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."FccModules" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 58832)
-- Name: FccModules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FccModules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."FccModules_id_seq" OWNER TO postgres;

--
-- TOC entry 3201 (class 0 OID 0)
-- Dependencies: 220
-- Name: FccModules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FccModules_id_seq" OWNED BY public."FccModules".id;


--
-- TOC entry 221 (class 1259 OID 58834)
-- Name: FreeCodeCampCertification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FreeCodeCampCertification" (
    id integer NOT NULL,
    "fccId" uuid NOT NULL,
    key text NOT NULL,
    "providerCertificationId" text NOT NULL,
    title text NOT NULL,
    certification text NOT NULL,
    "completionHours" integer NOT NULL,
    state public."CertificationStatus" DEFAULT 'active'::public."CertificationStatus" NOT NULL,
    "certificationCategoryId" integer NOT NULL,
    "certType" public."FccCertificationType" DEFAULT 'certification'::public."FccCertificationType" NOT NULL,
    "publishedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "learnerLevel" public."enum_FreeCodeCampCertification_learnerLevel" DEFAULT 'Beginner'::public."enum_FreeCodeCampCertification_learnerLevel",
    description text
);


ALTER TABLE public."FreeCodeCampCertification" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 58843)
-- Name: FreeCodeCampCertification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FreeCodeCampCertification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."FreeCodeCampCertification_id_seq" OWNER TO postgres;

--
-- TOC entry 3202 (class 0 OID 0)
-- Dependencies: 222
-- Name: FreeCodeCampCertification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FreeCodeCampCertification_id_seq" OWNED BY public."FreeCodeCampCertification".id;


--
-- TOC entry 223 (class 1259 OID 58845)
-- Name: ResourceProvider; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ResourceProvider" (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    "attributionStatement" text,
    url text,
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone
);


ALTER TABLE public."ResourceProvider" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 58851)
-- Name: ResourceProvider_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ResourceProvider_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."ResourceProvider_id_seq" OWNER TO postgres;

--
-- TOC entry 3203 (class 0 OID 0)
-- Dependencies: 224
-- Name: ResourceProvider_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ResourceProvider_id_seq" OWNED BY public."ResourceProvider".id;


--
-- TOC entry 225 (class 1259 OID 58853)
-- Name: TopcoderCertification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TopcoderCertification" (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    "estimatedCompletionTime" integer NOT NULL,
    status public."CertificationStatus" DEFAULT 'active'::public."CertificationStatus" NOT NULL,
    "sequentialCourses" boolean DEFAULT false NOT NULL,
    "learnerLevel" public."LearnerLevel" NOT NULL,
    version timestamp(3) without time zone NOT NULL,
    "certificationCategoryId" integer NOT NULL,
    "stripeProductId" text,
    skills character varying(255)[],
    "createdAt" timestamp with time zone,
    "updatedAt" timestamp with time zone,
    "learningOutcomes" character varying(255)[],
    prerequisites character varying(255)[],
    "dashedName" character varying(255),
    "introText" text
);


ALTER TABLE public."TopcoderCertification" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 58861)
-- Name: TopcoderCertification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."TopcoderCertification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."TopcoderCertification_id_seq" OWNER TO postgres;

--
-- TOC entry 3204 (class 0 OID 0)
-- Dependencies: 226
-- Name: TopcoderCertification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."TopcoderCertification_id_seq" OWNED BY public."TopcoderCertification".id;


--
-- TOC entry 227 (class 1259 OID 58863)
-- Name: TopcoderUdemyCourse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TopcoderUdemyCourse" (
    id integer NOT NULL,
    title text NOT NULL,
    status public."CourseStatus" DEFAULT 'available'::public."CourseStatus" NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "removedAt" timestamp(3) without time zone
);


ALTER TABLE public."TopcoderUdemyCourse" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 58870)
-- Name: UdemyCourse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UdemyCourse" (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    headline text NOT NULL,
    url text NOT NULL,
    categories text[],
    topics text[],
    promo_video_url jsonb NOT NULL,
    instructors text[],
    requirements text[],
    what_you_will_learn text[],
    level public."LearnerLevel" NOT NULL,
    images jsonb NOT NULL,
    locale character varying(6) NOT NULL,
    primary_category character varying(100),
    primary_subcategory character varying(100),
    estimated_content_length integer NOT NULL,
    estimated_content_length_video integer NOT NULL,
    num_lectures integer NOT NULL,
    num_videos integer NOT NULL,
    last_update_date timestamp(3) without time zone NOT NULL,
    data_version timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."UdemyCourse" OWNER TO postgres;

--
-- TOC entry 2985 (class 2604 OID 58876)
-- Name: CertificationCategory id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationCategory" ALTER COLUMN id SET DEFAULT nextval('public."CertificationCategory_id_seq"'::regclass);


--
-- TOC entry 2987 (class 2604 OID 58877)
-- Name: CertificationEnrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationEnrollments" ALTER COLUMN id SET DEFAULT nextval('public."CertificationEnrollments_id_seq"'::regclass);


--
-- TOC entry 2988 (class 2604 OID 58878)
-- Name: CertificationResource id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResource" ALTER COLUMN id SET DEFAULT nextval('public."CertificationResource_id_seq"'::regclass);


--
-- TOC entry 2990 (class 2604 OID 58879)
-- Name: CertificationResourceProgresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResourceProgresses" ALTER COLUMN id SET DEFAULT nextval('public."CertificationResourceProgresses_id_seq"'::regclass);


--
-- TOC entry 2991 (class 2604 OID 58880)
-- Name: FccCertificationProgresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCertificationProgresses" ALTER COLUMN id SET DEFAULT nextval('public."FccCertificationProgresses_id_seq"'::regclass);


--
-- TOC entry 2993 (class 2604 OID 58881)
-- Name: FccCourses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCourses" ALTER COLUMN id SET DEFAULT nextval('public."FccCourses_id_seq"'::regclass);


--
-- TOC entry 2996 (class 2604 OID 58882)
-- Name: FccModuleProgresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModuleProgresses" ALTER COLUMN id SET DEFAULT nextval('public."FccModuleProgresses_id_seq"'::regclass);


--
-- TOC entry 2998 (class 2604 OID 58883)
-- Name: FccModules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModules" ALTER COLUMN id SET DEFAULT nextval('public."FccModules_id_seq"'::regclass);


--
-- TOC entry 3002 (class 2604 OID 58884)
-- Name: FreeCodeCampCertification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FreeCodeCampCertification" ALTER COLUMN id SET DEFAULT nextval('public."FreeCodeCampCertification_id_seq"'::regclass);


--
-- TOC entry 3003 (class 2604 OID 58885)
-- Name: ResourceProvider id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceProvider" ALTER COLUMN id SET DEFAULT nextval('public."ResourceProvider_id_seq"'::regclass);


--
-- TOC entry 3006 (class 2604 OID 58886)
-- Name: TopcoderCertification id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TopcoderCertification" ALTER COLUMN id SET DEFAULT nextval('public."TopcoderCertification_id_seq"'::regclass);


--
-- TOC entry 3010 (class 2606 OID 58888)
-- Name: CertificationCategory CertificationCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationCategory"
    ADD CONSTRAINT "CertificationCategory_pkey" PRIMARY KEY (id);


--
-- TOC entry 3012 (class 2606 OID 58890)
-- Name: CertificationEnrollments CertificationEnrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationEnrollments"
    ADD CONSTRAINT "CertificationEnrollments_pkey" PRIMARY KEY (id);


--
-- TOC entry 3017 (class 2606 OID 58892)
-- Name: CertificationResourceProgresses CertificationResourceProgresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResourceProgresses"
    ADD CONSTRAINT "CertificationResourceProgresses_pkey" PRIMARY KEY (id);


--
-- TOC entry 3015 (class 2606 OID 58894)
-- Name: CertificationResource CertificationResource_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResource"
    ADD CONSTRAINT "CertificationResource_pkey" PRIMARY KEY (id);


--
-- TOC entry 3019 (class 2606 OID 58896)
-- Name: DataVersion DataVersion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DataVersion"
    ADD CONSTRAINT "DataVersion_pkey" PRIMARY KEY (version);


--
-- TOC entry 3021 (class 2606 OID 58898)
-- Name: FccCertificationProgresses FccCertificationProgresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCertificationProgresses"
    ADD CONSTRAINT "FccCertificationProgresses_pkey" PRIMARY KEY (id);


--
-- TOC entry 3024 (class 2606 OID 58900)
-- Name: FccCompletedLessons FccCompletedLessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCompletedLessons"
    ADD CONSTRAINT "FccCompletedLessons_pkey" PRIMARY KEY (id, "fccModuleProgressId");


--
-- TOC entry 3026 (class 2606 OID 58902)
-- Name: FccCourses FccCourses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCourses"
    ADD CONSTRAINT "FccCourses_pkey" PRIMARY KEY (id);


--
-- TOC entry 3028 (class 2606 OID 58904)
-- Name: FccLessons FccLessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccLessons"
    ADD CONSTRAINT "FccLessons_pkey" PRIMARY KEY (id);


--
-- TOC entry 3030 (class 2606 OID 58906)
-- Name: FccModuleProgresses FccModuleProgresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModuleProgresses"
    ADD CONSTRAINT "FccModuleProgresses_pkey" PRIMARY KEY (id);


--
-- TOC entry 3032 (class 2606 OID 58908)
-- Name: FccModules FccModules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModules"
    ADD CONSTRAINT "FccModules_pkey" PRIMARY KEY (id);


--
-- TOC entry 3036 (class 2606 OID 58910)
-- Name: FreeCodeCampCertification FreeCodeCampCertification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FreeCodeCampCertification"
    ADD CONSTRAINT "FreeCodeCampCertification_pkey" PRIMARY KEY (id);


--
-- TOC entry 3040 (class 2606 OID 58912)
-- Name: ResourceProvider ResourceProvider_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ResourceProvider"
    ADD CONSTRAINT "ResourceProvider_pkey" PRIMARY KEY (id);


--
-- TOC entry 3042 (class 2606 OID 58914)
-- Name: TopcoderCertification TopcoderCertification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TopcoderCertification"
    ADD CONSTRAINT "TopcoderCertification_pkey" PRIMARY KEY (id);


--
-- TOC entry 3045 (class 2606 OID 58916)
-- Name: TopcoderUdemyCourse TopcoderUdemyCourse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TopcoderUdemyCourse"
    ADD CONSTRAINT "TopcoderUdemyCourse_pkey" PRIMARY KEY (id);


--
-- TOC entry 3047 (class 2606 OID 58918)
-- Name: UdemyCourse UdemyCourse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UdemyCourse"
    ADD CONSTRAINT "UdemyCourse_pkey" PRIMARY KEY (id, data_version);


--
-- TOC entry 3008 (class 1259 OID 58919)
-- Name: CertificationCategory_category_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CertificationCategory_category_key" ON public."CertificationCategory" USING btree (category);


--
-- TOC entry 3034 (class 1259 OID 58920)
-- Name: FreeCodeCampCertification_fccId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FreeCodeCampCertification_fccId_key" ON public."FreeCodeCampCertification" USING btree ("fccId");


--
-- TOC entry 3037 (class 1259 OID 58921)
-- Name: FreeCodeCampCertification_title_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FreeCodeCampCertification_title_key" ON public."FreeCodeCampCertification" USING btree (title);


--
-- TOC entry 3038 (class 1259 OID 58922)
-- Name: ResourceProvider_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ResourceProvider_name_key" ON public."ResourceProvider" USING btree (name);


--
-- TOC entry 3043 (class 1259 OID 58923)
-- Name: TopcoderCertification_title_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "TopcoderCertification_title_key" ON public."TopcoderCertification" USING btree (title);


--
-- TOC entry 3013 (class 1259 OID 58924)
-- Name: certification_enrollments_topcoder_certification_id_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX certification_enrollments_topcoder_certification_id_user_id ON public."CertificationEnrollments" USING btree ("topcoderCertificationId", "userId");


--
-- TOC entry 3022 (class 1259 OID 58925)
-- Name: fcc_certification_progresses_fcc_certification_id_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX fcc_certification_progresses_fcc_certification_id_user_id ON public."FccCertificationProgresses" USING btree ("fccCertificationId", "userId");


--
-- TOC entry 3033 (class 1259 OID 58926)
-- Name: fcc_modules_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX fcc_modules_key ON public."FccModules" USING btree (key);


--
-- TOC entry 3048 (class 2606 OID 58927)
-- Name: CertificationEnrollments CertificationEnrollments_topcoderCertificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationEnrollments"
    ADD CONSTRAINT "CertificationEnrollments_topcoderCertificationId_fkey" FOREIGN KEY ("topcoderCertificationId") REFERENCES public."TopcoderCertification"(id);


--
-- TOC entry 3050 (class 2606 OID 58932)
-- Name: CertificationResourceProgresses CertificationResourceProgresses_certificationEnrollmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResourceProgresses"
    ADD CONSTRAINT "CertificationResourceProgresses_certificationEnrollmentId_fkey" FOREIGN KEY ("certificationEnrollmentId") REFERENCES public."CertificationEnrollments"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3051 (class 2606 OID 58937)
-- Name: CertificationResourceProgresses CertificationResourceProgresses_certificationResourceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResourceProgresses"
    ADD CONSTRAINT "CertificationResourceProgresses_certificationResourceId_fkey" FOREIGN KEY ("certificationResourceId") REFERENCES public."CertificationResource"(id);


--
-- TOC entry 3049 (class 2606 OID 58942)
-- Name: CertificationResource CertificationResource_resourceProviderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CertificationResource"
    ADD CONSTRAINT "CertificationResource_resourceProviderId_fkey" FOREIGN KEY ("resourceProviderId") REFERENCES public."ResourceProvider"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3052 (class 2606 OID 58947)
-- Name: FccCertificationProgresses FccCertificationProgresses_fccCertificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCertificationProgresses"
    ADD CONSTRAINT "FccCertificationProgresses_fccCertificationId_fkey" FOREIGN KEY ("fccCertificationId") REFERENCES public."FreeCodeCampCertification"(id);


--
-- TOC entry 3053 (class 2606 OID 58952)
-- Name: FccCertificationProgresses FccCertificationProgresses_fccCourseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCertificationProgresses"
    ADD CONSTRAINT "FccCertificationProgresses_fccCourseId_fkey" FOREIGN KEY ("fccCourseId") REFERENCES public."FccCourses"(id);


--
-- TOC entry 3054 (class 2606 OID 58957)
-- Name: FccCompletedLessons FccCompletedLessons_fccModuleProgressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCompletedLessons"
    ADD CONSTRAINT "FccCompletedLessons_fccModuleProgressId_fkey" FOREIGN KEY ("fccModuleProgressId") REFERENCES public."FccModuleProgresses"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3055 (class 2606 OID 58962)
-- Name: FccCourses FccCourses_certificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCourses"
    ADD CONSTRAINT "FccCourses_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES public."FreeCodeCampCertification"(id);


--
-- TOC entry 3056 (class 2606 OID 58967)
-- Name: FccCourses FccCourses_providerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccCourses"
    ADD CONSTRAINT "FccCourses_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES public."ResourceProvider"(id);


--
-- TOC entry 3057 (class 2606 OID 58972)
-- Name: FccLessons FccLessons_fccModuleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccLessons"
    ADD CONSTRAINT "FccLessons_fccModuleId_fkey" FOREIGN KEY ("fccModuleId") REFERENCES public."FccModules"(id);


--
-- TOC entry 3058 (class 2606 OID 58977)
-- Name: FccModuleProgresses FccModuleProgresses_fccCertificationProgressId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModuleProgresses"
    ADD CONSTRAINT "FccModuleProgresses_fccCertificationProgressId_fkey" FOREIGN KEY ("fccCertificationProgressId") REFERENCES public."FccCertificationProgresses"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3059 (class 2606 OID 58982)
-- Name: FccModules FccModules_fccCourseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FccModules"
    ADD CONSTRAINT "FccModules_fccCourseId_fkey" FOREIGN KEY ("fccCourseId") REFERENCES public."FccCourses"(id);


--
-- TOC entry 3060 (class 2606 OID 58987)
-- Name: FreeCodeCampCertification FreeCodeCampCertification_certificationCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FreeCodeCampCertification"
    ADD CONSTRAINT "FreeCodeCampCertification_certificationCategoryId_fkey" FOREIGN KEY ("certificationCategoryId") REFERENCES public."CertificationCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3061 (class 2606 OID 58992)
-- Name: TopcoderCertification TopcoderCertification_certificationCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TopcoderCertification"
    ADD CONSTRAINT "TopcoderCertification_certificationCategoryId_fkey" FOREIGN KEY ("certificationCategoryId") REFERENCES public."CertificationCategory"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3193 (class 0 OID 0)
-- Dependencies: 3
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CREATE ON SCHEMA public TO PUBLIC;


-- Completed on 2023-01-31 23:09:09 EET

--
-- PostgreSQL database dump complete
--

