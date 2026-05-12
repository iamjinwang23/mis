# MIS 일일업무보고 시스템 Planning Document

> **Summary**: GFP 총괄·자동차 보험·리테일 사업부 통합 일일업무 대시보드 — Excel 업로드 → 자동 파싱 → Supabase 저장 → 시각화 + 계정/권한 관리
>
> **Project**: gfp-dashboard
> **Version**: 2.0.0
> **Author**: 개발팀
> **Date**: 2026-05-12
> **Status**: Implemented (운영 중)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 일일 업무보고가 Excel 기반으로 분산 관리되어, 경영진이 세 사업부 실적을 한눈에 파악하기 어렵고 수동 취합에 시간이 소요됨 |
| **Solution** | Excel 파일 업로드 → 자동 파싱 → Supabase 클라우드 저장 → 멀티 섹션 대시보드 시각화, Supabase Auth 기반 계정/권한 관리 |
| **Function/UX Effect** | 업로드 즉시 KPI·차트·테이블로 렌더링, 날짜 비교·필터·정렬로 분석 효율 향상, 팀원 간 데이터 공유, 업로드 권한 세분화 |
| **Core Value** | 클라우드 저장으로 데이터 영속성·공유 확보 + 계정 기반 접근 제어 + 전문 대시보드 UX — 일일보고 데이터 축적으로 인사이트 도출 기반 구축 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 분산된 Excel 보고서를 통합 시각화하여 경영진 의사결정 속도 향상, 데이터 축적으로 인사이트 도출 |
| **WHO** | GFP 총괄·자동차 보험·리테일 사업부 팀장·경영진 (내부 사용자 14명, 계정 기반 접근) |
| **RISK** | Excel 파일 포맷 변경 시 파서 오류 / Supabase RLS 정책 오류 시 데이터 접근 불가 |
| **SUCCESS** | 파일 업로드 후 즉시 대시보드 렌더링, 전기 대비 비교, 지점별 필터·정렬 정상 동작 |
| **SCOPE** | GFP 5페이지 + 자동차 보험 5페이지 + 리테일 사업부 2페이지 + 공유 4페이지 (총 16페이지) |

---

## 1. Overview

### 1.1 Purpose

GFP 총괄·자동차 보험·리테일 사업부의 일일 Excel 보고서를 브라우저에서 직접 업로드·파싱하여 KPI, 차트, 테이블 형태로 시각화한다. Supabase 클라우드에 저장하여 팀원 간 데이터 공유와 영속성을 확보하고, 계정 기반 접근 제어로 보안을 유지한다.

### 1.2 Background

- 기존: 담당자가 Excel 파일을 수동 취합 → 경영진에게 이메일 전달
- 문제: 시각화 부재, 전기 비교 불편, 지점별 분석 어려움, 공유 불가
- v1 (2026-04-29): 브라우저 SPA, IndexedDB 로컬 저장, GFP + 리테일(auto) 2섹션
- v2 (2026-05-12): Supabase 클라우드 저장, Supabase Auth 인증/권한, 자동차 보험 섹션 분리, 리테일 사업부 신규 추가

### 1.3 Related Documents

- 디자인 토큰: `src/theme.js`
- DESIGN.md: `/DESIGN.md` (WCAG 준수 디자인 시스템)
- Excel 파서: `src/utils/parser.js`, `src/utils/auto_parser.js`, `src/utils/retail_parser.js`

---

## 2. Scope

### 2.1 In Scope

**GFP 총괄 섹션 (5페이지)**
- [x] 메인 대시보드 (KPI 6개, 직영/지사 비교 차트, 달성율 분포, DB 운영현황, TOP 10, 지점 테이블)
- [x] 지점별 실적 (검색/필터/정렬 테이블)
- [x] 인원 현황 (위촉/해촉, 채널별 비교)
- [x] DB 운영현황 (호전환/보장분석 상세)
- [x] DB 필요수량 (필요수량 시트 파싱 + 직영/지사 테이블 + 인사이트 박스)

**자동차 보험 섹션 (5페이지)** — `자동차daily R_*.xlsx`, auto_parser.js, 초록색 #3dba7e
- [x] 메인 대시보드 (KPI 6개, 부서별 카드, 차트)
- [x] TM 호전환 (관리자별 그룹화 테이블)
- [x] 계약실 상세 테이블
- [x] 딜러 (신규/갱신) 상세 테이블
- [x] 퍼미션실 상세 테이블

**리테일 사업부 섹션 (2페이지)** — `DailyReport_YYMMDD.xlsx`, retail_parser.js, 보라색 #9b8fe8
- [x] 메인 대시보드 (KPI, 부서별 카드, 차트)
- [x] 실행내역

**공유 기능 (4페이지)**
- [x] 파일 업로드 (드래그&드롭, 자동 포맷 감지, 업로드 권한 차단)
- [x] 업로드 히스토리 (달력+우측패널, 날짜 클릭 → 파일 조회/삭제, 업로더 이메일 표시)
- [x] 날짜 비교 (기준일 현재 vs 비교일 과거, 기준일보다 최신인 비교일 선택 불가)
- [x] 마이페이지 (내 정보, 비밀번호 변경, 관리자 전용 업로드 권한 토글)

**인증 시스템**
- [x] 로그인 게이트 (비로그인 시 LoginPage 전체 화면)
- [x] Supabase Auth 이메일+비밀번호 (관리자 초대 전용, 자가 회원가입 불가)
- [x] 사이드바 하단 계정 영역 (이름+직책+이메일, 클릭 → 마이페이지, 로그아웃 버튼)

**공통 UX**
- [x] 다크 LNB + 라이트 메인 혼합 테마
- [x] 모바일 반응형 (768px 기준)
- [x] 전기 대비 델타 뱃지 (KPI 카드)
- [x] 정렬/검색/필터 (모든 테이블)
- [x] WCAG AA 명암비 준수 (DESIGN.md 린팅 완료)
- [x] 스낵바 알림 (업로드 성공/오류)
- [x] 커스텀 확인 모달 (window.confirm 대체)

### 2.2 Out of Scope

- 서버 사이드 렌더링 / 별도 API 서버
- 자가 회원가입 (관리자 직접 등록만 허용)
- 데이터 내보내기 (CSV/PDF)
- 다크 모드 토글
- 프린트 최적화
- 푸시 알림

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Priority | Requirement | Status |
|----|----------|-------------|--------|
| FR-01 | Must | GFP Excel 파일 업로드 및 자동 파싱 | ✅ |
| FR-02 | Must | 자동차 보험 Excel 파일 업로드 및 자동 파싱 | ✅ |
| FR-03 | Must | 파일명에서 날짜 자동 추출 | ✅ |
| FR-04 | Must | Supabase 클라우드 저장 (팀원 공유, 영속성) | ✅ |
| FR-05 | Must | GFP KPI 6개 표시 (건수, 월납P, 달성율, 인원, 위촉/해촉, DB체결) | ✅ |
| FR-06 | Must | 직영 vs 지사 비교 차트 (월납P, 건수, 재적인원) | ✅ |
| FR-07 | Must | 달성율 분포 시각화 (5단계 버킷) | ✅ |
| FR-08 | Must | 지점/지사 테이블 (검색, 필터, 정렬) | ✅ |
| FR-09 | Must | 지점 상세 슬라이드 패널 | ✅ |
| FR-10 | Must | 자동차 보험 부서별 현황 카드 5개 | ✅ |
| FR-11 | Must | 날짜 비교 기능 (기준일 현재 vs 비교일 과거 KPI 변화) | ✅ |
| FR-12 | Must | Supabase Auth 로그인 게이트 (비로그인 차단) | ✅ |
| FR-13 | Must | 업로드 권한 관리 (can_upload=true인 사용자만 업로드) | ✅ |
| FR-14 | Should | 전기 대비 델타 뱃지 (KPI 카드) | ✅ |
| FR-15 | Should | DB 운영현황 인사이트 박스 | ✅ |
| FR-16 | Should | 마이페이지 — 비밀번호 변경, 관리자 권한 토글 | ✅ |
| FR-17 | Should | 리테일 사업부 Excel 파일 업로드 및 자동 파싱 | ✅ |
| FR-18 | Could | DB 필요수량 페이지 | ✅ |

### 3.2 Non-Functional Requirements

| ID | Category | Requirement | Status |
|----|----------|-------------|--------|
| NFR-01 | 보안 | Supabase RLS로 인증된 사용자만 데이터 접근 가능 | ✅ |
| NFR-02 | 성능 | Excel 파일 파싱 5초 이내 | ✅ |
| NFR-03 | 접근성 | WCAG AA 명암비 4.5:1 이상 | ✅ |
| NFR-04 | 반응형 | 모바일 768px 이하 지원 | ✅ |
| NFR-05 | 유지보수 | 디자인 토큰 중앙화 (theme.js) | ✅ |
| NFR-06 | 문서화 | DESIGN.md 기계 가독 디자인 시스템 | ✅ |
| NFR-07 | 가용성 | Vercel 배포 + Supabase 클라우드 (24/7 접근) | ✅ |

---

## 4. User Stories

| ID | As a | I want to | So that |
|----|------|-----------|---------|
| US-01 | 경영진 | GFP 전사 KPI를 한눈에 보고 싶다 | 일일 실적을 즉시 파악할 수 있다 |
| US-02 | 팀장 | 직영과 지사의 실적을 비교하고 싶다 | 채널별 전략을 수립할 수 있다 |
| US-03 | 담당자 | Excel 파일을 업로드하면 바로 대시보드가 보이길 원한다 | 수동 취합 시간을 절약할 수 있다 |
| US-04 | 경영진 | 이번 달과 지난 달 실적을 비교하고 싶다 | 추세를 파악할 수 있다 |
| US-05 | 팀장 | 특정 지점의 상세 실적을 확인하고 싶다 | 지점 관리에 활용할 수 있다 |
| US-06 | 담당자 | 모바일에서도 대시보드를 확인하고 싶다 | 외출 중에도 실적을 확인할 수 있다 |
| US-07 | 관리자 | 업로드 권한을 팀원별로 부여·회수하고 싶다 | 데이터 무결성을 유지할 수 있다 |
| US-08 | 사용자 | 내 비밀번호를 직접 변경하고 싶다 | 보안을 스스로 관리할 수 있다 |

---

## 5. Success Criteria

| Criteria | Measurement | Status |
|----------|-------------|--------|
| Excel 업로드 후 대시보드 자동 렌더링 | 파싱 오류 없이 전체 KPI 표시 | ✅ |
| 전기 대비 델타 정확성 | KPI 카드 델타 = 현재값 - 전기값 | ✅ |
| 지점 테이블 검색/필터/정렬 동작 | 3가지 필터링 조건 모두 정상 동작 | ✅ |
| 모바일 반응형 | 768px 이하에서 레이아웃 깨짐 없음 | ✅ |
| WCAG AA 명암비 | design.md lint 0 errors | ✅ |
| 로그인 게이트 | 비로그인 시 대시보드 접근 불가 | ✅ |
| 업로드 권한 관리 | can_upload=false인 사용자 업로드 차단 | ✅ |
| DB 필요수량 시각화 | 지점별 월최소수량 + 실적 진행률 표시 | ✅ |
| 날짜 비교 제한 | 기준일보다 최신인 날짜를 비교일로 선택 불가 | ✅ |

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| Excel 파일 포맷 변경 | High | High | 동적 헤더 감지 로직 구현, 파서 분리 |
| Supabase 무료 플랜 제한 (API 호출, DB 용량) | Medium | Medium | 히스토리 수동 삭제, 유료 플랜 업그레이드 검토 |
| 모바일 성능 저하 (대용량 테이블) | Medium | Low | overflowX: auto로 스크롤 처리 |
| RLS 정책 오류 시 데이터 접근 불가 | Low | High | 정책 테스트 후 배포, 관리자 직접 Supabase 콘솔 접근 가능 |
| 이메일 발송 제한 (무료 플랜 시간당 3~4건) | High | Low | Add user 방식으로 직접 계정 생성 (초대 메일 미사용) |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Selected | Rationale |
|-------|:--------:|-----------|
| **Starter** | ☐ | 멀티 섹션, 파싱 로직, 라우팅, BaaS 연동으로 Starter 초과 |
| **Dynamic** | ✅ | Feature-based 폴더 구조, 상태 관리, Supabase BaaS 사용 |
| **Enterprise** | ☐ | 내부 전용 툴로 레이어 분리 과도함 |

### 7.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| Framework | React 18 + Vite | 빠른 번들, SPA에 최적 |
| State Management | App.jsx 집중 관리 | 규모상 Context 불필요, 단순성 우선 |
| 스타일링 | 인라인 스타일 + responsive.css | 디자인 토큰 theme.js와 연동 |
| 데이터 저장 | Supabase (db.js) | 클라우드 저장, 팀원 공유, RLS 보안 |
| 인증 | Supabase Auth (이메일+비밀번호) | 관리자 초대 전용, 자가 회원가입 불가 |
| Excel 파싱 | SheetJS (xlsx) | GFP/자동차/리테일 복잡한 헤더 처리 |
| 차트 | Recharts | React 친화적, 반응형 컨테이너 |
| 아이콘 | lucide-react | 일관된 선형 아이콘 세트 |
| 배포 | Vercel (git push 자동 배포) | 무료 플랜, 자동 HTTPS, Preview URL |

### 7.3 폴더 구조

```
src/
├── components/          # 공유 컴포넌트 (Card, KPICard, SortHead, ProgressBar)
├── features/
│   ├── auth/            # 인증 (LoginPage, MyPage)
│   ├── dashboard/       # GFP 총괄 5페이지
│   ├── auto/            # 자동차 보험 5페이지
│   ├── retail/          # 리테일 사업부 2페이지
│   ├── upload/          # 파일 업로드
│   ├── history/         # 업로드 히스토리
│   └── compare/         # 날짜 비교
├── utils/               # 파서, 포맷터, 날짜 유틸
├── theme.js             # 디자인 토큰
├── db.js                # Supabase API (인증 + 보고서 CRUD + 프로필 관리)
├── responsive.css       # 반응형 미디어 쿼리
├── App.jsx              # 라우팅 + 전역 상태 + Auth 게이트
└── Layout.jsx           # LNB 네비게이션 + 계정 영역
```

---

## 8. Convention Prerequisites

### 8.1 Existing Conventions

- [x] 디자인 토큰 중앙화: `src/theme.js` (T, FS, RADIUS, SHADOW, FONT_STACK)
- [x] DESIGN.md: 기계 가독 디자인 시스템 (WCAG AA 준수)
- [x] 반응형 클래스: `responsive.css` (page-wrap, grid-2-1, grid-2col, grid-3col)
- [x] 숫자 포맷: `utils/formatters.js` (fmtNum, fmtPct, fmtMan, fmtDate)
- [x] 정렬 컴포넌트: `components/SortHead.jsx` (재사용 가능)
- [ ] TypeScript 미적용 (JS only)
- [ ] 테스트 설정 없음

### 8.2 코딩 컨벤션 (암묵적)

| Category | Rule |
|----------|------|
| 버튼 | `type="button"` 명시 |
| hover | `T.cardHover` 토큰 사용 (직접 값 하드코딩 금지) |
| 숫자 | `fmtNum`, `fmtMan` 포맷터 일관 적용 |
| 색상 | theme.js 토큰 참조 (`T.accent`, `T.green`, `T.purple` 등) |
| 뱃지 | 직영 = `T.accent`, 지사 = `T.green` (반대 금지) |
| 섹션 색상 | GFP = `#3e8fd4`, 자동차 보험 = `T.green (#3dba7e)`, 리테일 = `T.purple (#9b8fe8)` |
| 날짜 저장 | `toLocalDateStr()` 사용 (UTC 변환 버그 방지) |

---

## 9. Next Steps

1. [x] Design 문서 작성 (`mis-dashboard.design.md`)
2. [x] DB 필요수량 페이지 구현 (FR-18)
3. [x] Supabase Auth 연동 — 로그인 게이트, 계정 시스템, 권한 관리 (FR-12, 13, 16)
4. [x] 자동차 보험 / 리테일 사업부 섹션 분리 및 메뉴 순서 정렬
5. [x] 날짜 비교 기준일/비교일 UX 개선 (최신일 선택 제한)
6. [x] 문서 최신화 (v2.0.0)
7. [ ] 자동차보험 계약수당 자동매칭 및 수당산출 (신규 과제 — 대표님 요청)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-29 | 역기획 초안 — 구현 완료 기준 소급 작성 |
| 0.2 | 2026-04-29 | FR-14 DB 필요수량 구현 완료, Next Steps 업데이트 |
| 2.0.0 | 2026-05-12 | Supabase 클라우드 저장, Auth 인증/권한 시스템, 자동차 보험·리테일 사업부 섹션 분리, 날짜 비교 UX 개선, 문서 전면 최신화 |
