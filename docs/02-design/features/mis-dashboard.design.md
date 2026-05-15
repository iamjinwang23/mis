# MIS 일일업무보고 시스템 Design Document

> **Summary**: Excel 업로드 → Supabase 클라우드 저장 → 16페이지 멀티섹션 대시보드 SPA + Supabase Auth 계정/권한 시스템 설계
>
> **Project**: gfp-dashboard
> **Version**: 2.1.0
> **Author**: 개발팀
> **Date**: 2026-05-15
> **Status**: Implemented (운영 중)
> **Planning Doc**: [mis-dashboard.plan.md](../01-plan/features/mis-dashboard.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | ✅ Supabase `reports`, `profiles` 테이블 (§3) |
| Phase 2 | Coding Conventions | ✅ (`docs/01-plan/features/mis-dashboard.plan.md` §8) |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | ✅ (Supabase 함수 — §4) |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 분산된 Excel 보고서를 통합 시각화하여 경영진 의사결정 속도 향상 |
| **WHO** | GFP 총괄·자동차 보험·리테일 사업부 팀장·경영진 (내부 사용자 14명, 계정 기반 접근) |
| **RISK** | Excel 파일 포맷 변경 시 파서 오류 / Supabase RLS 정책 오류 시 데이터 접근 불가 |
| **SUCCESS** | 파일 업로드 후 즉시 대시보드 렌더링, 전기 대비 비교, 지점별 필터·정렬 정상 동작 |
| **SCOPE** | GFP 5페이지 + 자동차 보험 5페이지 + 리테일 사업부 2페이지 + 공유 4페이지 (총 16페이지) |

---

## Design Anchor (theme.js 기반)

| Category | Tokens |
|----------|--------|
| **Colors** | accent: `#3e8fd4` (GFP/직영), green: `#3dba7e` (자동차/지사), purple: `#9b8fe8` (리테일), bg: `#f5f6fa`, card: `#ffffff`, text: `#1a2233` |
| **Typography** | Pretendard (FONT_STACK), D2Coding (MONO_STACK), FS 스케일: 13/15/18/22/26px |
| **Spacing** | card padding 20-24px, section gap 16-24px, page-wrap maxWidth 1200px |
| **Radius** | xs: 6px, sm: 8px, md: 12px, lg: 16px |
| **Tone** | 라이트 메인 + 다크 LNB (#16202a), 데이터 중심, 깔끔한 비즈니스 |
| **Layout** | LNB(224px) + Main 컨텐츠, responsive.css 그리드 클래스 기반 |

---

## 1. Overview

### 1.1 Design Goals

- Supabase 클라우드 저장으로 팀원 간 데이터 공유 및 영속성 확보
- Excel 업로드부터 시각화까지 원스텝 처리 (파싱 지연 5초 이내)
- 16페이지 멀티섹션을 단일 SPA 라우팅으로 구성
- 디자인 토큰 중앙화(`theme.js`)로 UI 일관성 보장
- WCAG AA 명암비 4.5:1 준수 (DESIGN.md 린팅)
- Supabase Auth 기반 로그인 게이트 — 비인가 접근 차단

### 1.2 Design Principles

- **클라우드 저장**: Supabase `reports` 테이블에 저장, RLS로 인증 사용자만 접근
- **Auth Gate**: 로그인 전 모든 페이지 차단, `onAuthStateChange`로 세션 동기화
- **파서 분리**: GFP(`parser.js`), 자동차 보험(`auto_parser.js`), 리테일(`retail_parser.js`) 독립 운영
- **단순 상태 관리**: Context/Redux 없이 `App.jsx` 집중 관리
- **토큰 기반 스타일링**: `theme.js` 상수 참조, 직접 하드코딩 금지

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | **Option C: Pragmatic** ✅ |
|----------|:-:|:-:|:-:|
| **Approach** | 단순 파일 나열 | 완전 레이어 분리 | Feature-based 폴더 + 공유 컴포넌트 |
| **New Files** | 적음 | 많음 | 중간 |
| **Complexity** | Low | High | **Medium** |
| **Maintainability** | Low | High | **High** |
| **Effort** | Low | High | **Medium** |
| **Recommendation** | 소규모 MVP | 엔터프라이즈 | **내부 툴 최적** |

**Selected**: Option C (Pragmatic) — Feature-based 폴더 구조 + 공유 컴포넌트로 충분한 응집도 확보.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (SPA)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  App.jsx (전역 상태 + 라우팅 + Auth Gate)              │   │
│  │  - user, profile, authReady                         │   │
│  │  - gfpReports[], autoReports[], retailReports[]     │   │
│  │  - currentPage, selectedId                          │   │
│  └──────┬──────────────────────────┬────────────────────┘  │
│         │                          │                        │
│  ┌──────▼──────┐          ┌────────▼────────┐              │
│  │  Layout.jsx  │          │  Page Components │              │
│  │  (LNB + 계정)│          │  (16페이지)      │              │
│  └─────────────┘          └────────┬────────┘              │
│                                    │                        │
│  ┌─────────────────────────────────▼──────────────────┐   │
│  │  Shared Components                                  │   │
│  │  Card · KPICard · SortHead · ProgressBar            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌────────────────┐    ┌──────────────────────────────┐    │
│  │  Utils Layer   │    │  Auth Components              │    │
│  │  parser.js     │    │  LoginPage.jsx                │    │
│  │  auto_parser.js│    │  MyPage.jsx                   │    │
│  │  retail_parser │    └──────────────────────────────┘    │
│  │  formatters.js │                                         │
│  └────────────────┘                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         │ Supabase JS Client
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Cloud                                              │
│  ├─ Auth (이메일+비밀번호, 세션 관리)                         │
│  ├─ reports 테이블 (RLS: 인증 사용자만 접근)                  │
│  └─ profiles 테이블 (RLS: 본인 조회, 관리자만 수정)           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[로그인]
     │  LoginPage → signInWithPassword
     ▼
[App.jsx onAuthStateChange]
     │  user, profile 상태 설정
     ▼
[Excel 파일]
     │  drag & drop / file input (업로드 권한 있는 사용자만)
     ▼
[UploadView.jsx]
     │  FileReader (ArrayBuffer)
     ▼
[parser.js / auto_parser.js / retail_parser.js]
     │  SheetJS (xlsx) 파싱 → 정형 데이터 구조
     │  date_from_filename.js → reportDate 추출
     ▼
[db.js (Supabase)]
     │  INSERT INTO reports (type, filename, report_date, data, uploader_email)
     │  toLocalDateStr() — UTC 변환 버그 방지
     ▼
[App.jsx 상태 업데이트]
     │  gfpReports[] / autoReports[] / retailReports[] 갱신
     ▼
[Page Components (Recharts, 테이블)]
     │  props로 report 데이터 수신
     ▼
[브라우저 렌더링]
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| LoginPage.jsx | db.js (signIn) | 이메일+비밀번호 로그인 |
| MyPage.jsx | db.js (changePassword, listProfiles, updateCanUpload) | 비밀번호 변경, 권한 관리 |
| Dashboard.jsx | App.jsx (props) | GFP KPI/차트/테이블 렌더링 |
| AutoDashboard.jsx | App.jsx (props) | 자동차 보험 KPI/차트 렌더링 |
| RetailDashboard.jsx | App.jsx (props) | 리테일 사업부 KPI/차트 렌더링 |
| UploadView.jsx | parser.js, auto_parser.js, retail_parser.js, db.js | 파일 파싱 및 저장 |
| CompareView.jsx | gfpReports[], autoReports[] | 날짜 비교 분석 |
| HistoryView.jsx | db.js | 저장 목록 조회·삭제, uploaderEmail 표시 |
| KPICard.jsx | theme.js, formatters.js | KPI 수치 + 델타 표시 |
| parser.js | xlsx (SheetJS) | GFP Excel 파싱 |
| auto_parser.js | xlsx (SheetJS) | 자동차 보험 Excel 파싱 |
| retail_parser.js | xlsx (SheetJS) | 리테일 사업부 Excel 파싱 |

---

## 3. Data Model

### 3.1 Supabase 테이블 스키마

```sql
-- reports 테이블
CREATE TABLE public.reports (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type          text NOT NULL,              -- 'gfp' | 'auto' | 'retail'
  filename      text NOT NULL,
  report_date   date NOT NULL,              -- 로컬 날짜 (toLocalDateStr())
  uploaded_at   timestamptz DEFAULT now(),
  data          jsonb NOT NULL,
  uploader_email text                       -- auth.users.email 참조
);

-- profiles 테이블 (Supabase Auth 사용자와 연동)
CREATE TABLE public.profiles (
  email         text PRIMARY KEY,           -- auth.users.email과 일치
  name          text NOT NULL,
  position      text NOT NULL,
  is_admin      boolean DEFAULT false,
  can_upload    boolean DEFAULT false
);

-- RLS 정책
-- reports: 인증 사용자 SELECT/INSERT/DELETE 허용
-- profiles: 인증 사용자 SELECT, 관리자 3명만 UPDATE
--   admin_update 정책: auth.email() IN ('jinwang@g-insu.com', 'jjhy123@g-insu.com', 'bongwhan@g-insu.com')
```

### 3.2 GFP Report 데이터 구조 (reports.data jsonb)

```javascript
{
  reportDate: string,            // "2026-05-12"
  summary: {
    total: {
      count: number,             // 영업건수
      monthly: number,           // 당월 월납P (원)
      achieve: number,           // 달성율 (0~1)
      headcount: number,         // 재적인원
      hw: { amount: number, count: number },   // 호전환
      cov: { amount: number, count: number },  // 보장분석
    },
    direct: { count, monthly, achieve, headcount, hw, cov },  // 직영
    branch: { count, monthly, achieve, headcount, hw, cov },  // 지사
  },
  branches: [
    {
      name: string,              // 지점명
      isDirect: boolean,         // true=직영, false=지사
      count: number,
      monthly: number,
      achieve: number,
      headcount: number,
      achieveBucket: string,     // '100%이상' | '90~100%' | '70~90%' | '50~70%' | '50%미만'
    }
  ],
  personnel: {
    hired: number,               // 위촉
    fired: number,               // 해촉
    channels: [{ name, count }]
  },
  dbOps: { hw: { ... }, coverage: { ... } },
  dbNeeds: [
    {
      sheetName: string,
      monthLabel: string,
      workingDays: number,
      elapsedDays: number,
      remainDays: number,
      summary: {
        cov: { min: number, max: number },
        hw:  { min: number },
      },
      direct: [{ name, manager, isDirect: true, cov: {...}, hw: {...}, actual }],
      indirect: [{ name, manager, isDirect: false, cov: {...}, hw: {...}, actual }],
    }
  ]
}
```

### 3.3 Auto (자동차 보험) Report 데이터 구조

```javascript
{
  reportDate: string,
  summary: {
    sales: number,               // 총 영업인원
    support: number,             // 보조인원
    renewalDb: number,           // 갱신 DB 보유
    newDb: number,               // 신규 DB
    assigned: number,            // 갱신 배분
    successRate: number,         // TM 성공률 (0~1)
    tmRenewalSuccess: number,
    success1st: number,          // 1차 호전환
    coverage: number,            // 보장분석 합계
  },
  sections: {
    tmHoJeon: SectionData,       // TM 호전환
    contract: SectionData,       // 계약실
    dealerNew: SectionData,      // 딜러 신규실
    dealerRenewal: SectionData,  // 딜러 갱신실
    permission: SectionData,     // 퍼미션실
  }
}

// SectionData 공통 구조
{
  label, manager, assigned, newDb, coverage,
  success1st, driverConnect, successRate,
  agents: [{ name, status, coverage, success1st, ... }]
}
```

### 3.4 Entity Relationships

```
Supabase Auth users ──── profiles (email PK, 1:1)
reports (N) ←── uploader_email ──── Auth users (1)
GFP Report (1) ──── (N) Branch
Auto Report (1) ──── (N) Section
Auto Section (1) ──── (N) Agent
```

---

## 4. API Specification

### 4.1 Supabase 보고서 API (db.js)

| Function | Description | Returns |
|----------|-------------|---------|
| `saveReport(type, data)` | 보고서 저장 (uploader_email 자동 포함) | Promise\<void\> |
| `listReports(type?)` | 타입별 보고서 목록 (전체 또는 타입 필터) | Promise\<Report[]\> |
| `getReport(id)` | 단건 조회 | Promise\<Report\> |
| `deleteReport(id)` | 삭제 | Promise\<void\> |

**Report 객체 형태** (toRow 매핑):
```javascript
{
  id, type, filename, reportDate,   // report_date → reportDate
  uploadedAt, uploaderEmail,        // uploaded_at, uploader_email
  data                              // jsonb → parsed object
}
```

### 4.2 Supabase Auth API (db.js)

| Function | Description | Returns |
|----------|-------------|---------|
| `onAuthStateChange(cb)` | 세션 변경 구독 | Subscription |
| `signIn(email, password)` | 로그인 | Promise\<User\> |
| `signOut()` | 로그아웃 | Promise\<void\> |
| `changePassword(email, currentPw, newPw)` | 비밀번호 변경 (현재 PW 검증 후) | Promise\<void\> |

### 4.3 Supabase 프로필 API (db.js)

| Function | Description | Returns |
|----------|-------------|---------|
| `getProfile(email)` | 이메일로 프로필 조회 | Promise\<Profile\> |
| `listProfiles()` | 전체 프로필 목록 (관리자용) | Promise\<Profile[]\> |
| `updateCanUpload(email, canUpload)` | 업로드 권한 변경 (관리자만) | Promise\<void\> |

### 4.4 AI 인사이트 API (hooks/useAiInsight.js)

| 항목 | 값 |
|------|-----|
| 모델 | `gemini-2.5-flash-lite` |
| 엔드포인트 | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |
| API 키 | `VITE_GEMINI_API_KEY` (환경변수) |
| 호출 방식 | 대시보드별 순차 큐 (gfp: 0ms, auto: 4000ms, retail: 8000ms 딜레이) |
| 캐싱 | `sessionStorage` — 키: `ai-insight-v{VERSION}-{type}-{reportDate}` |
| 출력 형식 | 자연어 단일 문단 (JSON→파싱→텍스트 추출, 추출 실패 시 원문 사용) |

| Return | Type | Description |
|--------|------|-------------|
| `insight` | string \| null | 생성된 인사이트 문단 |
| `loading` | boolean | API 호출 중 여부 |
| `error` | string \| null | 오류 메시지 (API 키 누락 포함) |
| `onRefresh` | function | 캐시 무효화 후 재호출 |

### 4.5 Parser API (utils/)

| Function | File | Input | Output |
|----------|------|-------|--------|
| `parseGFPReport(arrayBuffer)` | parser.js | ArrayBuffer | GFP data object (dbNeeds 포함) |
| `parseDbNeeds(wb, branches)` | parser.js (내부) | workbook | 월별 필요수량 배열 |
| `parseAutoReport(arrayBuffer)` | auto_parser.js | ArrayBuffer | Auto data object |
| `parseRetailReport(arrayBuffer)` | retail_parser.js | ArrayBuffer | Retail data object |
| `parseDateFromFilename(filename)` | date_from_filename.js | string | ISO date string |
| `detectFileType(buffer)` | auto_parser.js | ArrayBuffer | 'gfp' \| 'auto' \| 'retail' \| 'unknown' |
| `toLocalDateStr(date)` | db.js | Date | "YYYY-MM-DD" (UTC 변환 버그 방지) |

---

## 5. UI/UX Design

### 5.1 전체 레이아웃

```
┌─────────────────────────────────────────────────┐
│  LNB (224px, 다크 #16202a)                       │
│  ┌─────────────────────────────────────────┐    │
│  │ Logo / Title                            │    │
│  │ ─────────────────────                   │    │
│  │ GFP 총괄 (#3e8fd4)                      │    │
│  │  └ 메인 대시보드                         │    │
│  │  └ 지점별 실적                           │    │
│  │  └ DB 운영현황                           │    │
│  │  └ 인원 현황                             │    │
│  │  └ DB 필요수량                           │    │
│  │ 자동차 보험 (#3dba7e)                   │    │
│  │  └ 메인 대시보드                         │    │
│  │  └ TM 호전환                            │    │
│  │  └ 계약실                               │    │
│  │  └ 딜러                                │    │
│  │  └ 퍼미션실                             │    │
│  │ 리테일 사업부 (#9b8fe8)                 │    │
│  │  └ 메인 대시보드                         │    │
│  │  └ 실행내역                             │    │
│  │ ─────────────────────                   │    │
│  │ 파일 업로드                              │    │
│  │ 업로드 히스토리                          │    │
│  │ 날짜 비교                               │    │
│  │ ─────────────────────                   │    │
│  │ [아바타] 이름 직책     [로그아웃]         │    │
│  │          이메일                          │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Main Content (flex: 1, 라이트 #f5f6fa)          │
│  ┌─────────────────────────────────────────┐    │
│  │  page-wrap (maxWidth 1200px, padding)   │    │
│  │  ┌─ Page Header (h1 + 날짜 서브텍스트) ─┐│    │
│  │  ├─ KPI Cards (grid auto-fit 160px) ───┤│    │
│  │  ├─ Charts (grid-2col / grid-3col) ────┤│    │
│  │  └─ Tables (overflow-x: auto) ─────────┘│    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### 5.2 User Flow

```
[미로그인]
     │  App.jsx authReady + !user
     ▼
[LoginPage] → 이메일+비밀번호 입력 → signIn()
     │  성공
     ▼
[App.jsx] → onAuthStateChange → user 설정 → loadReports() + getProfile()
     │
     ▼
[자동: GFP 메인 대시보드]
     │  LNB에서 페이지 선택
     ├─ GFP 총괄 (5페이지)
     ├─ 자동차 보험 (5페이지)
     ├─ 리테일 사업부 (2페이지)
     ├─ 파일 업로드 (권한 있는 사용자만)
     ├─ 업로드 히스토리
     ├─ 날짜 비교 (기준일 현재 vs 비교일 과거, 역선택 불가)
     └─ 마이페이지 (계정 영역 클릭)
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `App.jsx` | `src/` | 전역 상태, 라우팅, Auth Gate, 데이터 로딩 |
| `Layout.jsx` | `src/` | LNB 네비게이션, 계정 영역, 모바일 오버레이 |
| `LoginPage` | `src/features/auth/` | 이메일+비밀번호 로그인 폼 |
| `MyPage` | `src/features/auth/` | 내 정보, 비밀번호 변경 모달, 관리자 권한 테이블 |
| `Card` | `src/components/` | 카드 컨테이너 (border, shadow, radius) |
| `KPICard` | `src/components/` | KPI 수치 + 전기 대비 델타 뱃지 |
| `SortHead` | `src/components/` | 정렬 가능한 테이블 헤더 |
| `ProgressBar` | `src/components/` | 비율 시각화 바 |
| `AiInsightCard` | `src/components/` | AI 인사이트 — 자연어 단일 문단, 스켈레톤 로딩, 새로고침 버튼 |
| `useAiInsight` (hook) | `src/hooks/` | Gemini 2.5 Flash Lite API 호출, 결과 캐싱, 순차 큐 (3개 동시 호출 방지) |
| `Dashboard` | `src/features/dashboard/` | GFP 메인 대시보드 |
| `GfpBranches` | `src/features/dashboard/` | GFP 지점별 실적 테이블 |
| `GfpPersonnel` | `src/features/dashboard/` | GFP 인원 현황 |
| `GfpDbPage` | `src/features/dashboard/` | GFP DB 운영현황 (레거시) |
| `GfpDb` | `src/features/dashboard/` | GFP DB 운영현황 (v2-redesign 통합본, GfpDbPage 대체) |
| `BranchDetailPanel` | `src/features/dashboard/` | 지점 상세 슬라이드 패널 |
| `GfpDbNeeds` | `src/features/dashboard/` | DB 필요수량 |
| `AutoDashboard` | `src/features/auto/` | 자동차 보험 메인 대시보드 |
| `AutoDetail` | `src/features/auto/` | 자동차 보험 부서별 상세 |
| `RetailDashboard` | `src/features/retail/` | 리테일 사업부 메인 |
| `RetailExecution` | `src/features/retail/` | 리테일 실행내역 |
| `UploadView` | `src/features/upload/` | 파일 업로드 (권한 체크 포함) |
| `HistoryView` | `src/features/history/` | 업로드 히스토리 (달력+패널, uploaderEmail) |
| `CompareView` | `src/features/compare/` | 날짜 비교 (기준일/비교일 제한) |

### 5.4 Page UI Checklist

#### 로그인 (LoginPage.jsx)

- [x] 이메일 + 비밀번호 입력 폼
- [x] 로그인 오류 메시지 (잘못된 이메일/비밀번호)
- [x] 로딩 상태 표시
- [x] "계정 문의는 관리자에게 연락하세요" 안내

#### GFP 메인 대시보드 (Dashboard.jsx)

- [x] KPI 카드 6개: 영업건수, 당월 월납P, 달성율, 재적인원, 위촉/해촉, DB체결
- [x] KPI 카드: "전기 대비" 레이블 + 델타 뱃지 (ArrowUpRight/ArrowDownRight)
- [x] 직영/지사 비교 차트: 수직 막대 3개 (월납P, 건수, 재적인원), 직영=accent, 지사=green
- [x] 달성율 분포 시각화: 5단계 버킷 (100%이상, 90~100%, 70~90%, 50~70%, 50%미만)
- [x] DB 운영현황 인사이트 박스
- [x] TOP 10 지점 테이블
- [x] 지점 전체 테이블: 검색 input, 직영/지사/전체 필터 버튼, SortHead 정렬
- [x] 지점 행 클릭 → BranchDetailPanel 슬라이드 패널
- [x] AI 인사이트 카드 (자연어 단일 문단, Gemini 2.5 Flash Lite)

#### GFP 지점별 실적 (GfpBranches.jsx)

- [x] 검색 input (지점명)
- [x] 직영/지사/전체 필터 버튼
- [x] 테이블: 지점명, 구분 뱃지, 건수, 월납P, 달성율, 재적인원 — SortHead 정렬
- [x] 달성율 ProgressBar 인라인 표시

#### DB 필요수량 (GfpDbNeeds.jsx)

- [x] 월 탭: 복수 시트 존재 시 탭 전환
- [x] 핵심 요약 카드 3개: 보장분석 월최소(min~max), 호전환 월최소, 영업일/경과일/잔여일
- [x] 직영 조직 테이블: 지점명, 관리자, 가동인원, 보장분석 월최소 + 실적 ProgressBar, 호전환 월최소 + 실적 ProgressBar
- [x] 지사 조직 테이블: 지점명, 관리자, 가동인원, 보장분석 월최소 + 실적 ProgressBar
- [x] 인사이트 박스: 목표 달성 지점(green), 50% 미달 지점(red) 자동 표시

#### 자동차 보험 메인 대시보드 (AutoDashboard.jsx)

- [x] KPI 카드 6개: 총 영업인원, 갱신 DB 보유, 신규 DB, 보장분석 합계, 1차 호전환, TM 성공률
- [x] 부서별 현황 카드 5개 (클릭 → 상세 이동): TM호전환, 계약실, 딜러신규, 딜러갱신, 퍼미션실
- [x] 부서별 보장분석 파이 차트
- [x] TM 호전환 TOP 10 바 차트
- [x] DB 운용 현황 요약 (배분 수치 + ProgressBar)
- [x] 월별 추세 차트 (v2-redesign Stage 3)
- [x] AI 인사이트 카드 (자연어 단일 문단, Gemini 2.5 Flash Lite)

#### 리테일 사업부 메인 대시보드 (RetailDashboard.jsx)

- [x] KPI 카드 (부서별 실적 요약)
- [x] 부서별 현황 카드
- [x] 월별 추세 차트 (v2-redesign Stage 4)
- [x] AI 인사이트 카드 (자연어 단일 문단, Gemini 2.5 Flash Lite)

#### 파일 업로드 (UploadView.jsx)

- [x] 업로드 권한 없는 사용자: "🔒 업로드 권한이 없습니다" 차단 화면
- [x] 드래그&드롭 영역 (dragover/drop 이벤트)
- [x] 파일 선택 input (accept=".xlsx,.xls")
- [x] 포맷 자동 감지 (GFP vs 자동차 vs 리테일)
- [x] 업로드 진행 상태 / 성공 메시지
- [x] 파싱 오류 메시지

#### 업로드 히스토리 (HistoryView.jsx)

- [x] 달력 + 우측 패널 레이아웃
- [x] 날짜 클릭 → 해당 날짜 파일 목록 조회
- [x] GFP/자동차/리테일/전체 필터 탭
- [x] 파일명, 업로드 시간, 업로더 이메일 표시
- [x] 삭제 버튼 (커스텀 확인 모달)

#### 날짜 비교 (CompareView.jsx)

- [x] GFP/자동차 토글 버튼
- [x] 기준일(현재/최신) vs 비교일(과거) 날짜 셀렉터
- [x] 기준일보다 최신인 날짜를 비교일로 선택 불가 (역선택 방지)
- [x] KPI 비교 카드 (비교일값 → 기준일값 + 델타)
- [x] GFP: 지점별 변화 테이블 (달성율 변화, 월납P 변화, SortHead)
- [x] 신규/소멸 지점 뱃지

#### 마이페이지 (MyPage.jsx)

- [x] 내 정보 카드: 이름, 직책, 이메일, 권한(관리자/업로드가능/조회전용)
- [x] 비밀번호 변경 버튼 → PasswordModal (현재 PW 검증 → 새 PW 변경)
- [x] 관리자 전용: 전체 사용자 업로드 권한 토글 테이블 (관리자 행 비활성)

---

## 6. Error Handling

### 6.1 에러 케이스

| Case | Cause | Handling |
|------|-------|----------|
| 로그인 실패 | 잘못된 이메일/비밀번호 | LoginPage 에러 메시지 표시 |
| 비밀번호 변경 실패 | 현재 PW 불일치 | PasswordModal 에러 메시지 |
| 업로드 권한 없음 | can_upload=false | UploadView 전체 차단 메시지 |
| RLS 접근 거부 | 인증 토큰 만료 | 자동 로그아웃 → LoginPage |
| Excel 파싱 실패 | 포맷 변경 / 헤더 불일치 | 오류 메시지 표시, 업로드 중단 |
| Supabase 저장 실패 | 네트워크 / 할당량 초과 | 스낵바 에러 알림 |
| 보고서 0개 상태 | 첫 방문 / 데이터 없음 | 빈 상태 UI + 업로드 안내 메시지 |
| 날짜 추출 실패 | 파일명 패턴 불일치 | 오늘 날짜 fallback |

### 6.2 에러 표시 패턴

```jsx
// 빈 상태 패턴
{!hasData && (
  <Card style={{ padding: 32, textAlign: 'center' }}>
    <Icon style={{ color: T.textMute }} />
    <div style={{ color: T.textDim }}>안내 메시지</div>
  </Card>
)}

// 스낵바 패턴 (App.jsx)
setSnack({ msg: '오류 메시지', type: 'error' });
```

---

## 7. Security Considerations

- [x] Supabase Auth — 로그인 없이 데이터 접근 불가
- [x] RLS (Row Level Security) — `reports`/`profiles` 테이블 모두 활성화
- [x] 업로드 권한 — `profiles.can_upload=true`인 사용자만 UploadView 접근
- [x] 관리자 권한 — RLS UPDATE 정책에 관리자 3명 이메일 하드코딩
- [x] 비밀번호 변경 — 현재 비밀번호 재검증 후 변경 (re-signIn 패턴)
- [x] 파일 읽기는 FileReader API (XSS 불가)
- [ ] 대용량 파일 제한 (50MB 초과 경고) — 미구현
- [ ] 입력값 검증: 파일 확장자 검사 (.xlsx/.xls만 허용) — 구현 권장

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Status |
|------|--------|------|--------|
| L1: 파서 단위 테스트 | parser.js, auto_parser.js, retail_parser.js | 수동 / 실제 Excel | 수동 검증 완료 |
| L2: UI 동작 테스트 | 업로드, 필터, 정렬, 비교, 로그인 | 브라우저 수동 | 수동 검증 완료 |
| L3: E2E 시나리오 | 로그인 → Excel 업로드 → 대시보드 표시 | 브라우저 수동 | 수동 검증 완료 |

### 8.2 L2: UI 동작 테스트 시나리오

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | 로그인 | 이메일+비밀번호 입력 | 로그인 성공 → GFP 대시보드 |
| 2 | 로그인 | 잘못된 비밀번호 | 오류 메시지 표시 |
| 3 | 업로드 | 권한 없는 사용자 접근 | "업로드 권한 없음" 차단 화면 |
| 4 | 업로드 | GFP Excel 드래그&드롭 | "업로드 성공" 메시지 + GFP 대시보드 이동 |
| 5 | GFP 대시보드 | 페이지 로드 | KPI 6개 + 직영/지사 차트 + 테이블 표시 |
| 6 | 날짜 비교 | 기준일 선택 후 기준일보다 최신 날짜 비교일 선택 시도 | 해당 날짜 선택 불가 |
| 7 | 마이페이지 | 비밀번호 변경 (현재 PW 오입력) | "현재 비밀번호가 올바르지 않습니다" |
| 8 | 마이페이지 (관리자) | can_upload 토글 | Supabase profiles 업데이트, 즉시 반영 |
| 9 | 히스토리 | 날짜 클릭 | 해당 날짜 파일 목록 + 업로더 이메일 표시 |

---

## 9. Architecture Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| LoginPage, MyPage | Presentation (Auth) | `src/features/auth/` |
| Dashboard, AutoDashboard, CompareView 등 | Presentation | `src/features/*/` |
| KPICard, Card, SortHead, ProgressBar | Presentation (Shared) | `src/components/` |
| db.js (Supabase API) | Infrastructure | `src/db.js` |
| parser.js, auto_parser.js, retail_parser.js | Infrastructure | `src/utils/` |
| formatters.js, date_from_filename.js | Domain (Utils) | `src/utils/` |
| theme.js | Domain (Design Tokens) | `src/theme.js` |
| App.jsx | Application (State/Routing/Auth) | `src/App.jsx` |
| Layout.jsx | Presentation (Layout) | `src/Layout.jsx` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `KPICard`, `GfpBranches`, `LoginPage` |
| Functions/Hooks | camelCase | `fmtNum()`, `signIn()`, `getProfile()` |
| Design Tokens | 단문 대문자 접두사 | `T.accent`, `RADIUS.md`, `FS.xl` |
| Feature 폴더 | camelCase | `dashboard/`, `auto/`, `auth/` |
| 파일 (컴포넌트) | PascalCase.jsx | `MyPage.jsx`, `LoginPage.jsx` |
| 파일 (유틸) | camelCase.js | `formatters.js`, `db.js` |

### 10.2 이 프로젝트의 핵심 컨벤션

| Item | Convention |
|------|-----------|
| 버튼 | `type="button"` 필수 명시 |
| hover 색상 | `T.cardHover` 토큰 사용 (직접 값 금지) |
| 숫자 포맷 | `fmtNum`, `fmtMan`, `fmtPct` 일관 적용 |
| 색상 | `T.accent` (직영/GFP), `T.green` (지사/자동차), `T.purple` (리테일) |
| 뱃지 배경 | `${T.accent}18` 형식 (투명도 18 헥스) |
| 날짜 저장 | `toLocalDateStr()` 사용 (UTC 변환 버그 방지) |
| 확인 대화상자 | 커스텀 모달 사용 (window.confirm Vercel 차단) |

---

## 11. Implementation Guide

### 11.1 File Structure (현재 구현)

```
src/
├── components/
│   ├── Card.jsx
│   ├── KPICard.jsx
│   ├── SortHead.jsx
│   ├── ProgressBar.jsx
│   └── AiInsightCard.jsx          # AI 인사이트 (자연어 단일 문단, 스켈레톤, 새로고침)
├── hooks/
│   └── useAiInsight.js            # Gemini 2.5 Flash Lite API 호출 + 캐싱 + 순차 큐
├── features/
│   ├── auth/
│   │   ├── LoginPage.jsx          # 로그인 폼
│   │   └── MyPage.jsx             # 마이페이지 + PasswordModal
│   ├── dashboard/
│   │   ├── Dashboard.jsx          # GFP 메인 (AI 인사이트 포함)
│   │   ├── GfpBranches.jsx        # 지점별 실적
│   │   ├── GfpPersonnel.jsx       # 인원 현황
│   │   ├── GfpDbPage.jsx          # DB 운영현황 (레거시)
│   │   ├── GfpDb.jsx              # DB 운영현황 (v2-redesign 통합본)
│   │   ├── BranchDetailPanel.jsx  # 지점 상세 패널
│   │   └── GfpDbNeeds.jsx         # DB 필요수량
│   ├── auto/
│   │   ├── AutoDashboard.jsx      # 자동차 보험 메인 (월별 추세 차트 + AI 인사이트)
│   │   └── AutoDetail.jsx         # 부서 상세
│   ├── retail/
│   │   ├── RetailDashboard.jsx    # 리테일 사업부 메인 (월별 추세 차트 + AI 인사이트)
│   │   └── RetailExecution.jsx    # 실행내역
│   ├── upload/
│   │   └── UploadView.jsx         # canUpload prop으로 권한 차단
│   ├── history/
│   │   └── HistoryView.jsx        # uploaderEmail 표시
│   └── compare/
│       └── CompareView.jsx        # 날짜 역선택 방지
├── utils/
│   ├── parser.js                  # GFP Excel 파서
│   ├── auto_parser.js             # 자동차 보험 Excel 파서
│   ├── retail_parser.js           # 리테일 사업부 Excel 파서
│   ├── formatters.js              # fmtNum/fmtMan/fmtPct/fmtDate
│   ├── date_from_filename.js      # 파일명 날짜 추출
│   ├── numbers.js                 # parseNum() — 숫자 파싱 공통 유틸
│   └── report_types.js            # REPORT_TYPES 상수 (라벨, 색상 등)
├── theme.js                       # 디자인 토큰
├── db.js                          # Supabase API (Auth + CRUD + 프로필)
├── responsive.css                 # 반응형 미디어 쿼리
├── App.jsx                        # 라우팅 + 전역 상태 + Auth Gate
└── Layout.jsx                     # LNB 네비게이션 + 계정 영역 (카테고리 구분선 포함)
```

### 11.2 신규 기능 추가 순서 (참고)

1. Supabase 테이블 스키마 변경 필요 시 → Supabase 콘솔 SQL 에디터에서 마이그레이션
2. Excel 파서 수정 → `src/utils/parser.js` or `auto_parser.js` or `retail_parser.js`
3. 신규 컴포넌트 → `src/features/{feature}/` 또는 공유면 `src/components/`
4. App.jsx 라우팅 추가 (페이지 증가 시)
5. Layout.jsx LNB 메뉴 항목 추가 (NAV_SECTIONS 배열)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-29 | 역기획 초안 — 구현 완료 기준 소급 작성 | 개발팀 |
| 0.2 | 2026-04-29 | FR-14 GfpDbNeeds 컴포넌트 추가, 데이터 모델 dbNeeds 섹션 추가 | 개발팀 |
| 2.0.0 | 2026-05-12 | Supabase 클라우드 저장·Auth 인증 시스템 반영, 자동차 보험·리테일 사업부 섹션 분리, LoginPage/MyPage 추가, API 명세 전면 재작성, 날짜 비교 역선택 방지 설계 반영 | 개발팀 |
| 2.1.0 | 2026-05-15 | AI 인사이트 카드 (AiInsightCard, useAiInsight) 추가, 월별 추세 차트 (자동차/리테일), GfpDb.jsx 통합, hooks/ 디렉터리, numbers.js·report_types.js 유틸 추가, LNB 카테고리 구분, v2-redesign 디자인시스템 통일 | 개발팀 |
