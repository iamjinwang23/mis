# MIS 일일업무보고 시스템 Design Document

> **Summary**: Excel 업로드 → IndexedDB 저장 → 14페이지 멀티섹션 대시보드 SPA 설계
>
> **Project**: gfp-dashboard
> **Version**: 1.0.0 (역기획)
> **Author**: 개발팀
> **Date**: 2026-04-29
> **Status**: Implemented (역기획 문서)
> **Planning Doc**: [mis-dashboard.plan.md](../01-plan/features/mis-dashboard.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A (IndexedDB, no SQL schema) |
| Phase 2 | Coding Conventions | ✅ (`docs/01-plan/features/mis-dashboard.plan.md` §8) |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | N/A (로컬 전용, 외부 API 없음) |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 분산된 Excel 보고서를 통합 시각화하여 경영진 의사결정 속도 향상 |
| **WHO** | GFP 총괄 및 리테일 사업부 팀장·경영진 (내부 사용자) |
| **RISK** | Excel 파일 포맷 변경 시 파서 오류 / IndexedDB 데이터 영속성 의존 |
| **SUCCESS** | 파일 업로드 후 즉시 대시보드 렌더링, 전기 대비 비교, 지점별 필터·정렬 정상 동작 |
| **SCOPE** | GFP 5페이지 + 리테일 6페이지 + 공유 3페이지 (총 14페이지) |

---

## Design Anchor (theme.js 기반)

| Category | Tokens |
|----------|--------|
| **Colors** | accent: `#3e8fd4` (직영), green: `#3dba7e` (지사), bg: `#f5f6fa`, card: `#ffffff`, text: `#1a2233` |
| **Typography** | Pretendard (FONT_STACK), D2Coding (MONO_STACK), FS 스케일: 13/15/18/22/26px |
| **Spacing** | card padding 20-24px, section gap 16-24px, page-wrap maxWidth 1200px |
| **Radius** | xs: 6px, sm: 8px, md: 12px |
| **Tone** | 라이트 메인 + 다크 LNB, 데이터 중심, 깔끔한 비즈니스 |
| **Layout** | LNB(220px) + Main 컨텐츠, responsive.css 그리드 클래스 기반 |

---

## 1. Overview

### 1.1 Design Goals

- 서버 없이 브라우저에서 완결되는 경량 MIS — 로컬 전용
- Excel 업로드부터 시각화까지 원스텝 처리 (파싱 지연 5초 이내)
- 14페이지 멀티섹션을 단일 SPA 라우팅으로 구성
- 디자인 토큰 중앙화(`theme.js`)로 UI 일관성 보장
- WCAG AA 명암비 4.5:1 준수 (DESIGN.md 린팅)

### 1.2 Design Principles

- **로컬 완결성**: 데이터가 브라우저 밖으로 절대 나가지 않음 (IndexedDB 전용)
- **파서 분리**: GFP 파서(`parser.js`)와 리테일 파서(`auto_parser.js`) 독립 운영
- **단순 상태 관리**: Context/Redux 없이 `App.jsx` 집중 관리 (14페이지 규모에 최적)
- **토큰 기반 스타일링**: `theme.js` 상수 참조, 직접 하드코딩 금지

---

## 2. Architecture

### 2.0 Architecture Comparison (역기획 — 구현된 방안 기준)

| Criteria | Option A: Minimal | Option B: Clean | **Option C: Pragmatic** ✅ |
|----------|:-:|:-:|:-:|
| **Approach** | 단순 파일 나열 | 완전 레이어 분리 | Feature-based 폴더 + 공유 컴포넌트 |
| **New Files** | 적음 | 많음 | 중간 |
| **Complexity** | Low | High | **Medium** |
| **Maintainability** | Low | High | **High** |
| **Effort** | Low | High | **Medium** |
| **Recommendation** | 소규모 MVP | 엔터프라이즈 | **내부 툴 최적** |

**Selected**: Option C (Pragmatic) — **Rationale**: 14페이지 규모에 레이어 완전 분리는 과도함. Feature-based 폴더 구조 + 공유 컴포넌트로 충분한 응집도 확보. BaaS/서버 없는 로컬 전용 구조에서 Infrastructure 레이어 불필요.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Local Only)                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  App.jsx (전역 상태 + 라우팅)                     │   │
│  │  - gfpReports[], autoReports[]                  │   │
│  │  - currentPage, selectedId                      │   │
│  └──────┬──────────────────────────┬───────────────┘   │
│         │                          │                    │
│  ┌──────▼──────┐          ┌────────▼────────┐          │
│  │  Layout.jsx  │          │  Page Components │          │
│  │  (LNB 네비)  │          │  (14페이지)      │          │
│  └─────────────┘          └────────┬────────┘          │
│                                    │                    │
│  ┌─────────────────────────────────▼──────────────┐   │
│  │  Shared Components                              │   │
│  │  Card · KPICard · SortHead · ProgressBar        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────┐    ┌──────────────────────────┐    │
│  │  Utils Layer   │    │  IndexedDB (db.js)        │    │
│  │  parser.js     │    │  - gfpReports store       │    │
│  │  auto_parser.js│    │  - autoReports store      │    │
│  │  formatters.js │    └──────────────────────────┘    │
│  │  date_from_    │                                     │
│  │  filename.js   │                                     │
│  └────────────────┘                                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
[Excel 파일]
     │  drag & drop / file input
     ▼
[UploadView.jsx]
     │  FileReader (ArrayBuffer)
     ▼
[parser.js / auto_parser.js]
     │  SheetJS (xlsx) 파싱 → 정형 데이터 구조
     │  date_from_filename.js → reportDate 추출
     ▼
[db.js (IndexedDB)]
     │  idb-keyval / 직접 IDB API
     │  저장: { id, filename, reportDate, type, data }
     ▼
[App.jsx 상태 업데이트]
     │  gfpReports[] / autoReports[] 갱신
     ▼
[Page Components (Recharts, 테이블)]
     │  props로 report 데이터 수신
     ▼
[브라우저 렌더링]
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Dashboard.jsx | App.jsx (props) | GFP KPI/차트/테이블 렌더링 |
| AutoDashboard.jsx | App.jsx (props) | 리테일 KPI/차트 렌더링 |
| UploadView.jsx | parser.js, auto_parser.js, db.js | 파일 파싱 및 저장 |
| CompareView.jsx | gfpReports[], autoReports[] | 날짜 비교 분석 |
| HistoryView.jsx | db.js | 저장 목록 조회·삭제 |
| KPICard.jsx | theme.js, formatters.js | KPI 수치 + 델타 표시 |
| parser.js | xlsx (SheetJS) | GFP Excel 파싱 |
| auto_parser.js | xlsx (SheetJS) | 리테일 Excel 파싱 |

---

## 3. Data Model

### 3.1 GFP Report 구조

```javascript
// IndexedDB 'gfpReports' store
{
  id: number,                    // auto-increment
  filename: string,              // "GFP_20260429.xlsx"
  reportDate: string,            // "2026-04-29" (ISO)
  type: 'gfp',
  data: {
    reportDate: string,
    summary: {
      total: {
        count: number,           // 영업건수
        monthly: number,         // 당월 월납P (원)
        achieve: number,         // 달성율 (0~1)
        headcount: number,       // 재적인원
        hw: { amount: number, count: number },   // 호전환
        cov: { amount: number, count: number },  // 보장분석
      },
      direct: { count, monthly, achieve, headcount, hw, cov },  // 직영
      branch: { count, monthly, achieve, headcount, hw, cov },  // 지사
    },
    branches: [
      {
        name: string,            // 지점명
        isDirect: boolean,       // true=직영, false=지사
        count: number,
        monthly: number,
        achieve: number,
        headcount: number,
        achieveBucket: string,   // '100%이상' | '90~100%' | ...
      }
    ],
    personnel: {                 // 인원 현황
      hired: number,             // 위촉
      fired: number,             // 해촉
      channels: [{ name, count }]
    },
    dbOps: {                     // DB 운영현황
      hw: { ... },
      coverage: { ... }
    },
    dbNeeds: [                   // DB 필요수량 (필요수량 시트별 배열)
      {
        sheetName: string,       // "4월 필요수량"
        monthLabel: string,      // "4월"
        workingDays: number,     // 영업일
        elapsedDays: number,     // 경과일
        remainDays: number,      // 잔여일
        summary: {
          cov: { min: number, max: number },  // 보장분석 최소/최대
          hw:  { min: number },               // 호전환 최소
        },
        direct: [{ name, manager, isDirect: true, cov: { active, perDay, monthly }, hw: { active, perDay, monthly }, actual }],
        indirect: [{ name, manager, isDirect: false, cov: { active, perDay, monthly }, hw: { active:0, perDay:0, monthly:0 }, actual }],
      }
    ]
  }
}
```

### 3.2 Auto (리테일) Report 구조

```javascript
// IndexedDB 'autoReports' store
{
  id: number,
  filename: string,
  reportDate: string,
  type: 'auto',
  data: {
    reportDate: string,
    summary: {
      sales: number,             // 총 영업인원
      support: number,           // 보조인원
      renewalDb: number,         // 갱신 DB 보유
      newDb: number,             // 신규 DB
      assigned: number,          // 갱신 배분
      successRate: number,       // TM 성공률 (0~1)
      tmRenewalSuccess: number,
      success1st: number,        // 1차 호전환
      coverage: number,          // 보장분석 합계
    },
    sections: {
      tmHoJeon: SectionData,     // TM 호전환
      contract: SectionData,     // 계약실
      dealerNew: SectionData,    // 딜러 신규실
      dealerRenewal: SectionData,// 딜러 갱신실
      permission: SectionData,   // 퍼미션실
    }
  }
}

// SectionData 공통 구조
{
  label: string,
  manager: string,
  assigned: number,
  newDb: number,
  coverage: number,
  success1st: number,
  driverConnect: number,
  successRate: number,
  agents: [
    { name, status, coverage, success1st, ... }
  ]
}
```

### 3.3 Entity Relationships

```
GFP Report (1) ──── (N) Branch
Auto Report (1) ──── (N) Section
Auto Section (1) ──── (N) Agent
```

---

## 4. API Specification

이 프로젝트는 서버 API 없음. 모든 데이터 접근은 IndexedDB를 통해 로컬에서 처리.

### 4.1 IndexedDB API (db.js)

| Function | Description | Returns |
|----------|-------------|---------|
| `saveReport(type, data)` | 보고서 저장 | Promise\<id\> |
| `getReports(type)` | 타입별 전체 조회 | Promise\<Report[]\> |
| `getReport(id)` | 단건 조회 | Promise\<Report\> |
| `deleteReport(id)` | 삭제 | Promise\<void\> |
| `getAllReports()` | GFP+Auto 전체 | Promise\<{gfp, auto}\> |

### 4.2 Parser API

| Function | File | Input | Output |
|----------|------|-------|--------|
| `parseGFPReport(arrayBuffer)` | parser.js | ArrayBuffer | GFP data object (dbNeeds 포함) |
| `parseDbNeeds(wb, branches)` | parser.js (내부) | workbook | 월별 필요수량 배열 |
| `parseAutoReport(arrayBuffer)` | auto_parser.js | ArrayBuffer | Auto data object |
| `parseDateFromFilename(filename)` | date_from_filename.js | string | ISO date string |
| `detectFileType(buffer)` | auto_parser.js | ArrayBuffer | 'gfp' \| 'auto' \| 'unknown' |

---

## 5. UI/UX Design

### 5.1 전체 레이아웃

```
┌─────────────────────────────────────────────────┐
│  LNB (220px, 다크 #1a2233)                       │
│  ┌─────────────────────────────────────────┐    │
│  │ Logo / Title                            │    │
│  │ ─────────────────────                   │    │
│  │ GFP 총괄                                │    │
│  │  └ 메인 대시보드                         │    │
│  │  └ 지점별 실적                           │    │
│  │  └ 인원 현황                             │    │
│  │  └ DB 운영현황                           │    │
│  │  └ DB 필요수량                           │    │
│  │ 리테일 사업부                            │    │
│  │  └ 메인 대시보드                         │    │
│  │  └ TM 호전환                            │    │
│  │  └ 계약실                               │    │
│  │  └ 딜러(신규/갱신)                       │    │
│  │  └ 퍼미션실                             │    │
│  │ 공유                                    │    │
│  │  └ 파일 업로드                           │    │
│  │  └ 업로드 히스토리                       │    │
│  │  └ 날짜 비교                            │    │
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
업로드 → IndexedDB 저장 → 자동 GFP 대시보드 이동
  └→ 이후 세션: LNB에서 원하는 페이지 선택
      └→ 날짜 비교: 2개 보고서 선택 → KPI 델타 표시
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `App.jsx` | `src/` | 전역 상태, 라우팅, 데이터 로딩 |
| `Layout.jsx` | `src/` | LNB 네비게이션, 모바일 오버레이 |
| `Card` | `src/components/` | 카드 컨테이너 (border, shadow, radius) |
| `KPICard` | `src/components/` | KPI 수치 + 전기 대비 델타 뱃지 |
| `SortHead` | `src/components/` | 정렬 가능한 테이블 헤더 |
| `ProgressBar` | `src/components/` | 비율 시각화 바 |
| `Dashboard` | `src/features/dashboard/` | GFP 메인 대시보드 |
| `GfpBranches` | `src/features/dashboard/` | GFP 지점별 실적 테이블 |
| `GfpPersonnel` | `src/features/dashboard/` | GFP 인원 현황 |
| `GfpDbPage` | `src/features/dashboard/` | GFP DB 운영현황 |
| `BranchDetailPanel` | `src/features/dashboard/` | 지점 상세 슬라이드 패널 |
| `GfpDbNeeds` | `src/features/dashboard/` | DB 필요수량 — 핵심요약 + 직영/지사 테이블 + 인사이트 |
| `AutoDashboard` | `src/features/auto/` | 리테일 메인 대시보드 |
| `AutoDetail` | `src/features/auto/` | 리테일 부서별 상세 |
| `UploadView` | `src/features/upload/` | 파일 업로드 (드래그&드롭) |
| `HistoryView` | `src/features/history/` | 업로드 히스토리 |
| `CompareView` | `src/features/compare/` | 날짜 비교 |

### 5.4 Page UI Checklist

#### GFP 메인 대시보드 (Dashboard.jsx)

- [x] KPI 카드 6개: 영업건수, 당월 월납P, 달성율, 재적인원, 위촉/해촉, DB체결
- [x] KPI 카드: "전기 대비" 레이블 + 델타 뱃지 (ArrowUpRight/ArrowDownRight)
- [x] 직영/지사 비교 차트: 수직 막대 3개 (월납P, 건수, 재적인원), 직영=accent, 지사=green
- [x] 달성율 분포 시각화: 5단계 버킷 (100%이상, 90~100%, 70~90%, 50~70%, 50%미만)
- [x] DB 운영현황 인사이트 박스
- [x] TOP 10 지점 테이블
- [x] 지점 전체 테이블: 검색 input, 직영/지사/전체 필터 버튼, SortHead 정렬
- [x] 지점 행 클릭 → BranchDetailPanel 슬라이드 패널

#### GFP 지점별 실적 (GfpBranches.jsx)

- [x] 검색 input (지점명)
- [x] 직영/지사/전체 필터 버튼
- [x] 테이블: 지점명, 구분 뱃지, 건수, 월납P, 달성율, 재적인원 — SortHead 정렬
- [x] 달성율 ProgressBar 인라인 표시

#### GFP 인원 현황 (GfpPersonnel.jsx)

- [x] 위촉/해촉 수치 카드
- [x] 채널별 인원 비교 차트

#### GFP DB 운영현황 (GfpDbPage.jsx)

- [x] 호전환 상세 테이블
- [x] 보장분석 상세 테이블
- [x] 인사이트 요약 박스

#### 리테일 메인 대시보드 (AutoDashboard.jsx)

- [x] KPI 카드 6개: 총 영업인원, 갱신 DB 보유, 신규 DB, 보장분석 합계, 1차 호전환, TM 성공률
- [x] 부서별 현황 카드 5개 (클릭 → 상세 이동): TM호전환, 계약실, 딜러신규, 딜러갱신, 퍼미션실
- [x] 부서별 보장분석 파이 차트
- [x] TM 호전환 TOP 10 바 차트 (호전환+보장분석 grouped)
- [x] DB 운용 현황 요약 (배분 수치 + ProgressBar)

#### DB 필요수량 (GfpDbNeeds.jsx)

- [x] 월 탭: "4월 필요수량" / "5월 필요수량" 탭 전환 (복수 시트 존재 시)
- [x] 핵심 요약 카드 3개: 보장분석 월최소(min~max), 호전환 월최소, 영업일/경과일/잔여일
- [x] 직영 조직 테이블: 지점명, 관리자, 가동인원, 보장분석 월최소 + 실적 ProgressBar, 호전환 월최소 + 실적 ProgressBar
- [x] 지사 조직 테이블: 지점명, 관리자, 가동인원, 보장분석 월최소 + 실적 ProgressBar
- [x] 인사이트 박스: 목표 달성 지점(green), 50% 미달 지점(red) 자동 표시
- [x] 필요수량 시트 없을 시 빈 상태 안내 메시지

#### 리테일 부서 상세 (AutoDetail.jsx)

- [x] 관리자별 그룹화 테이블 (TM 호전환)
- [x] 에이전트별 실적 테이블 (검색, SortHead 정렬)

#### 파일 업로드 (UploadView.jsx)

- [x] 드래그&드롭 영역 (dragover/drop 이벤트)
- [x] 파일 선택 input (accept=".xlsx,.xls")
- [x] 포맷 자동 감지 (GFP vs 리테일)
- [x] 업로드 진행 상태 / 성공 메시지
- [x] 파싱 오류 메시지

#### 업로드 히스토리 (HistoryView.jsx)

- [x] GFP/리테일/전체 필터 탭
- [x] 저장된 보고서 목록 (파일명, 날짜)
- [x] 삭제 버튼 (개별)

#### 날짜 비교 (CompareView.jsx)

- [x] GFP/리테일 토글 버튼
- [x] 기준일(Before) / 비교일(After) 날짜 셀렉터
- [x] KPI 비교 카드 (A값 → B값 + 델타)
- [x] GFP: 지점별 변화 테이블 (달성율 변화, 월납P 변화, SortHead)
- [x] 신규/소멸 지점 뱃지

---

## 6. Error Handling

### 6.1 에러 케이스

| Case | Cause | Handling |
|------|-------|----------|
| Excel 파싱 실패 | 포맷 변경 / 헤더 불일치 | 사용자에게 오류 메시지 표시, 업로드 중단 |
| IndexedDB 저장 실패 | 용량 초과 / 브라우저 제한 | 콘솔 에러 + 히스토리에서 수동 삭제 안내 |
| 보고서 0개 상태 | 첫 방문 / 초기화 | 빈 상태 UI + 업로드 안내 메시지 |
| 날짜 추출 실패 | 파일명 패턴 불일치 | 오늘 날짜 fallback |
| 데이터 없음 (차트) | 파싱 결과 빈 배열 | "데이터 없음" 플레이스홀더 표시 |

### 6.2 에러 표시 패턴

```jsx
// 빈 상태 패턴
{!hasData && (
  <Card style={{ padding: 32, textAlign: 'center' }}>
    <Icon style={{ color: T.textMute }} />
    <div style={{ color: T.textDim }}>안내 메시지</div>
  </Card>
)}
```

---

## 7. Security Considerations

- [x] 데이터 외부 전송 없음 — 모든 처리가 브라우저 로컬에서 완결
- [x] 파일 읽기는 FileReader API (XSS 불가)
- [x] IndexedDB는 동일 출처 정책(SOP)으로 타 도메인 접근 불가
- [ ] 입력값 검증: 파일 확장자 검사 (.xlsx/.xls만 허용) — 구현 권장
- [ ] 대용량 파일 제한 (예: 50MB 초과 경고) — 미구현

---

## 8. Test Plan

### 8.1 Test Scope (로컬 SPA 기준)

| Type | Target | Tool | Status |
|------|--------|------|--------|
| L1: 파서 단위 테스트 | parser.js, auto_parser.js | 수동 / 실제 Excel | 수동 검증 완료 |
| L2: UI 동작 테스트 | 업로드, 필터, 정렬, 비교 | 브라우저 수동 | 수동 검증 완료 |
| L3: E2E 시나리오 | Excel 업로드 → 대시보드 표시 | 브라우저 수동 | 수동 검증 완료 |

> 서버 없는 SPA 특성상 Playwright/curl 기반 자동화 테스트 범위가 제한됨.
> 추후 Vitest + msw로 파서 단위 테스트 추가 권장.

### 8.2 L2: UI 동작 테스트 시나리오

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | 업로드 | GFP Excel 드래그&드롭 | "업로드 성공" 메시지 + GFP 대시보드 이동 |
| 2 | GFP 대시보드 | 페이지 로드 | KPI 6개 + 직영/지사 차트 + 테이블 표시 |
| 3 | 지점 테이블 | 지점명 검색 | 필터링된 결과만 표시 |
| 4 | 지점 테이블 | "직영" 필터 클릭 | isDirect=true 행만 표시 |
| 5 | 지점 테이블 | 월납P 컬럼 클릭 | 내림차순 정렬 → 재클릭 시 오름차순 |
| 6 | 지점 행 | 클릭 | 슬라이드 패널 열림 |
| 7 | 날짜 비교 | 두 날짜 선택 | KPI 변화 카드 표시 |
| 8 | 히스토리 | 삭제 버튼 | 목록에서 제거 |

### 8.3 L3: E2E 시나리오

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 최초 업로드 플로우 | 파일 업로드 → 대시보드 → KPI 확인 | KPI 수치 파일과 일치 |
| 2 | 전기 대비 비교 | 2개 파일 업로드 → 날짜 비교 → 델타 확인 | 델타 = B값 - A값 (정확) |
| 3 | 브라우저 재시작 | 업로드 후 새로고침 | IndexedDB 데이터 유지 |
| 4 | 모바일 레이아웃 | 768px 뷰포트 | LNB 햄버거 메뉴, 테이블 가로 스크롤 |

---

## 9. Architecture Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| Dashboard, AutoDashboard, CompareView 등 | Presentation | `src/features/*/` |
| KPICard, Card, SortHead, ProgressBar | Presentation (Shared) | `src/components/` |
| db.js (IndexedDB API) | Infrastructure | `src/db.js` |
| parser.js, auto_parser.js | Infrastructure | `src/utils/` |
| formatters.js, date_from_filename.js | Domain (Utils) | `src/utils/` |
| theme.js | Domain (Design Tokens) | `src/theme.js` |
| App.jsx | Application (State/Routing) | `src/App.jsx` |
| Layout.jsx | Presentation (Layout) | `src/Layout.jsx` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `KPICard`, `GfpBranches` |
| Functions/Hooks | camelCase | `fmtNum()`, `parseGfp()` |
| Design Tokens | 단문 대문자 접두사 | `T.accent`, `RADIUS.md`, `FS.xl` |
| Feature 폴더 | camelCase | `dashboard/`, `auto/`, `compare/` |
| 파일 (컴포넌트) | PascalCase.jsx | `AutoDashboard.jsx` |
| 파일 (유틸) | camelCase.js | `formatters.js` |

### 10.2 이 프로젝트의 핵심 컨벤션

| Item | Convention |
|------|-----------|
| 버튼 | `type="button"` 필수 명시 |
| hover 색상 | `T.cardHover` 토큰 사용 (직접 값 금지) |
| 숫자 포맷 | `fmtNum`, `fmtMan`, `fmtPct` 일관 적용 |
| 색상 | `T.accent` (직영), `T.green` (지사) — 역할 혼용 금지 |
| 뱃지 배경 | `${T.accent}18` 형식 (투명도 18 헥스) |
| 인라인 스타일 | theme.js 토큰 참조, magic color 금지 |

---

## 11. Implementation Guide

### 11.1 File Structure (현재 구현)

```
src/
├── components/
│   ├── Card.jsx            # 카드 컨테이너
│   ├── KPICard.jsx         # KPI 수치 카드
│   ├── SortHead.jsx        # 정렬 테이블 헤더
│   └── ProgressBar.jsx     # 비율 바
├── features/
│   ├── dashboard/
│   │   ├── Dashboard.jsx          # GFP 메인
│   │   ├── GfpBranches.jsx        # 지점별 실적
│   │   ├── GfpPersonnel.jsx       # 인원 현황
│   │   ├── GfpDbPage.jsx          # DB 운영현황
│   │   ├── BranchDetailPanel.jsx  # 지점 상세 패널
│   │   └── GfpDbNeeds.jsx         # DB 필요수량
│   ├── auto/
│   │   ├── AutoDashboard.jsx      # 리테일 메인
│   │   └── AutoDetail.jsx         # 부서 상세
│   ├── upload/
│   │   └── UploadView.jsx
│   ├── history/
│   │   └── HistoryView.jsx
│   └── compare/
│       └── CompareView.jsx
├── utils/
│   ├── parser.js                  # GFP Excel 파서 (parseGFPReport + parseDbNeeds)
│   ├── auto_parser.js             # 리테일 Excel 파서
│   ├── formatters.js              # fmtNum/fmtMan/fmtPct/fmtDate
│   └── date_from_filename.js      # 파일명 날짜 추출
├── theme.js                       # 디자인 토큰
├── db.js                          # IndexedDB API
├── responsive.css                 # 반응형 미디어 쿼리
├── App.jsx                        # 라우팅 + 전역 상태
└── Layout.jsx                     # LNB 네비게이션
```

### 11.2 Implementation Order (역기획 기준 — 신규 기능 추가 시 참고)

1. [ ] 데이터 모델 변경 → `db.js` 스키마 업데이트
2. [ ] Excel 파서 수정 → `parser.js` or `auto_parser.js`
3. [ ] 신규 컴포넌트 → `src/features/{feature}/` 또는 공유면 `src/components/`
4. [ ] App.jsx 라우팅 추가 (페이지 증가 시)
5. [ ] Layout.jsx LNB 메뉴 항목 추가
6. [ ] responsive.css 그리드 클래스 추가 필요 시

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Est. Turns |
|--------|-----------|-------------|:----------:|
| 파서 레이어 | `module-parser` | parser.js + auto_parser.js 수정 | 10-15 |
| GFP 대시보드 | `module-gfp` | Dashboard.jsx + GfpBranches.jsx | 20-30 |
| 리테일 대시보드 | `module-auto` | AutoDashboard.jsx + AutoDetail.jsx | 15-20 |
| 공유 기능 | `module-shared` | Upload/History/Compare | 15-20 |
| 공유 컴포넌트 | `module-components` | Card/KPICard/SortHead/ProgressBar | 5-10 |

#### Recommended Session Plan (신규 기능 추가 시)

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 20-25 |
| Session 2 | Do | `--scope module-parser` | 20-30 |
| Session 3 | Do | `--scope module-gfp,module-auto` | 40-50 |
| Session 4 | Do | `--scope module-shared,module-components` | 20-30 |
| Session 5 | Check + Report | 전체 | 20-30 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-29 | 역기획 초안 — 구현 완료 기준 소급 작성 | 개발팀 |
| 0.2 | 2026-04-29 | FR-14 GfpDbNeeds 컴포넌트 추가, 데이터 모델 dbNeeds 섹션 추가, Parser API 실제 함수명으로 수정 | 개발팀 |
