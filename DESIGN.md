---
version: alpha
name: MIS 일일업무보고 시스템
description: GFP·리테일 통합 경영 대시보드. 라이트 캔버스 + 다크 LNB 구성.

colors:
  # Primary (required by spec — maps to accent sky blue)
  primary: "#3e8fd4"

  # Backgrounds
  bg: "#f7fafd"
  bg2: "#edf2f8"
  card: "#ffffff"
  card-hover: "#f7f9fc"

  # Text
  text: "#1a2744"
  text-dim: "#4a5e7a"
  text-mute: "#8fa3bc"

  blue: "#6ab0e8"

  # Semantic
  green: "#3dba7e"
  yellow: "#f5a623"
  red: "#e05252"
  purple: "#7c6fcd"

  # LNB dark sidebar
  lnb-bg: "#16202a"
  lnb-text: "#b9bcc0"

  # Tint backgrounds (10% opacity approximation on white)
  accent-tint: "#d6e9f7"
  green-tint: "#d0f0e3"

  # Darkened semantic (for solid-bg components)
  purple-dark: "#5a4fa0"

typography:
  body:
    fontFamily: Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif
    fontSize: 13px
    fontWeight: 600
    letterSpacing: 0.05em
  title:
    fontFamily: Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif
    fontSize: 26px
    fontWeight: 800
    lineHeight: 1.2
  kpi:
    fontFamily: Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif
    fontSize: 30px
    fontWeight: 700
    lineHeight: 1.1

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px

components:
  kpi-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
  kpi-card-delta-positive:
    textColor: "{colors.green}"
  kpi-card-delta-negative:
    textColor: "{colors.red}"
  nav-item-active:
    backgroundColor: "{colors.lnb-bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.xs}"
  nav-item-default:
    textColor: "{colors.lnb-text}"
    backgroundColor: "{colors.lnb-bg}"
  badge-direct:
    backgroundColor: "{colors.accent-tint}"
    textColor: "{colors.text}"
    rounded: "{rounded.xs}"
  badge-branch:
    backgroundColor: "{colors.green-tint}"
    textColor: "{colors.text}"
    rounded: "{rounded.xs}"
  table-header:
    backgroundColor: "{colors.bg2}"
    textColor: "{colors.text-dim}"
    typography: "{typography.label}"
  table-row-hover:
    backgroundColor: "{colors.card-hover}"
  progress-bar-warning:
    backgroundColor: "{colors.yellow}"
  progress-bar-muted:
    backgroundColor: "{colors.text-mute}"
  tag-secondary:
    backgroundColor: "{colors.purple-dark}"
    textColor: "{colors.card}"
    rounded: "{rounded.xs}"
  page-background:
    backgroundColor: "{colors.bg}"
  section-background:
    backgroundColor: "{colors.bg2}"
  secondary-accent:
    textColor: "{colors.blue}"
  stat-tertiary:
    textColor: "{colors.purple}"
  tag-highlight:
    backgroundColor: "{colors.purple-dark}"
    textColor: "{colors.card}"
    rounded: "{rounded.xs}"
---

# MIS 일일업무보고 시스템

CEO 대시보드 스타일. 라이트 그레이 캔버스 위에 스카이 블루 액센트.

## Overview

GFP 총괄과 리테일 사업부의 일일 영업 실적을 통합 시각화하는 내부 업무 보고 시스템. 데이터 밀도를 높이되 인지 부하를 낮추는 방향으로 설계. 수치 가독성과 계층 분리가 핵심 원칙.

**톤**: 전문적, 데이터 중심, 신뢰감  
**대상**: 경영진 및 팀장급 내부 사용자  
**레이아웃**: 좌측 고정 LNB(224px) + 우측 스크롤 메인 콘텐츠

## Colors

### 배경

라이트 모드를 기본으로 사용. 페이지 배경은 `bg`(연한 블루-화이트), 카드는 순백 `card`.

| 역할 | 토큰 | 값 |
|------|------|-----|
| 페이지 배경 | `colors.bg` | `#f7fafd` |
| 섹션 구분 배경 | `colors.bg2` | `#edf2f8` |
| 카드 배경 | `colors.card` | `#ffffff` |
| 카드 hover | `colors.card-hover` | `#f7f9fc` |

### 텍스트

다크 네이비 계열. 충분한 대비비 확보.

| 역할 | 토큰 | 값 |
|------|------|-----|
| 본문 | `colors.text` | `#1a2744` |
| 보조 | `colors.text-dim` | `#4a5e7a` |
| 힌트·비활성 | `colors.text-mute` | `#8fa3bc` |

### 액센트

GFP 총괄 섹션 컬러이자 전체 primary accent. 리테일 사업부는 `green`.

| 역할 | 토큰 | 값 |
|------|------|-----|
| Primary | `colors.accent` | `#3e8fd4` (sky blue) |
| Secondary | `colors.blue` | `#6ab0e8` |

### 시맨틱

수치 상태(긍정/경고/부정)를 색으로 구분.

| 역할 | 토큰 | 값 |
|------|------|-----|
| 긍정·리테일 | `colors.green` | `#3dba7e` |
| 경고·부분달성 | `colors.yellow` | `#f5a623` |
| 부정·해촉 | `colors.red` | `#e05252` |
| 보조강조 | `colors.purple` | `#7c6fcd` |

### LNB 다크 팔레트

LNB(사이드바)만 독립된 다크 배경 사용. 나머지 전체 UI는 라이트 모드.

| 역할 | 값 |
|------|-----|
| 사이드바 배경 | `#16202a` |
| 기본 텍스트 | `rgba(255,255,255,0.92)` |
| 비활성 텍스트 | `rgba(255,255,255,0.70)` |
| 힌트 텍스트 | `rgba(255,255,255,0.38)` |
| hover 배경 | `rgba(255,255,255,0.07)` |
| 테두리 | `rgba(255,255,255,0.08)` |

## Typography

기본 폰트: **Pretendard**. 한글·숫자 혼용 환경 최적화, 숫자 가독성 우수.

| 스타일 | 토큰 | 크기 | 굵기 | 용도 |
|--------|------|------|------|------|
| 페이지 타이틀 | `typography.title` | 26px | 800 | 페이지 상단 h1 |
| KPI 수치 | `typography.kpi` | 30px | 700 | 핵심 지표 숫자 |
| 본문 | `typography.body` | 18px | 400 | 테이블 셀, 일반 내용 |
| 레이블·헤더 | `typography.label` | 13px | 600 | 테이블 헤더, 뱃지, 캡션 |

추가 보조 크기: `15px`(필터 버튼), `22px`(서브타이틀).

## Layout

- **LNB 너비**: 224px 고정, `position: fixed`
- **페이지 패딩**: `32px 32px 64px` (상·좌우·하)
- **카드 내부**: `20px 24px`
- **그리드 갭**: 12px (KPI 카드), 16px (섹션)
- **테이블 셀 패딩**: `11px 14px`

### 반응형

768px 이하에서 LNB는 오프캔버스로 전환. 햄버거 버튼으로 토글.

## Elevation & Depth

| 레벨 | 값 | 용도 |
|------|-----|------|
| card | `rgba(26,39,68,0.06) 0 2px 12px, rgba(26,39,68,0.04) 0 1px 4px` | 기본 카드 |
| deep | `rgba(26,39,68,0.10) 0 8px 24px, rgba(26,39,68,0.06) 0 3px 8px` | 드롭다운, 모달 |

## Shapes

| 토큰 | 값 | 용도 |
|------|-----|------|
| `rounded.xs` | 4px | 뱃지, 태그, 필터 버튼 |
| `rounded.sm` | 8px | 카드, 입력 필드 |
| `rounded.md` | 12px | 모달, 패널 |
| `rounded.lg` | 16px | 대형 컨테이너 |
| `rounded.full` | 9999px | 완전 라운드 (칩) |

## Components

### KPI Card

핵심 지표 요약 카드. 상단 레이블 + 대형 수치 + 델타 뱃지.

- 배경: `colors.card` / 테두리: `rgba(0,0,0,0.08)`
- 수치: `typography.kpi` (30px, 700)
- 델타: `+`/`−` 기호 사용 (화살표 아이콘 미사용 — 기호와 중복)
- 긍정 델타: `colors.green` / 부정 델타: `colors.red`

### Navigation (LNB)

- 활성 항목: 섹션 컬러 배경 tint + 좌측 2px solid 보더
- GFP 총괄 섹션 컬러: `colors.accent`
- 리테일 사업부 섹션 컬러: `colors.green`
- 비활성: `rgba(255,255,255,0.70)`, hover: `rgba(255,255,255,0.07)`

### Table

- 헤더: `colors.bg2` 배경, `typography.label` (13px, uppercase)
- 셀: `typography.body` (18px)
- 행 hover: `colors.card-hover`
- 정렬 컬럼(`SortHead`): 활성 시 `colors.accent`, 비활성 시 `ChevronsUpDown` 아이콘 (opacity 0.3)

### Progress Bar

달성율 시각화. 높이 4px.

| 범위 | 색상 |
|------|------|
| 100% 이상 | `colors.green` |
| 50–99% | `colors.accent` |
| 1–49% | `colors.yellow` |
| 0% | `colors.text-mute` |

### 구분 뱃지 (직영·지사)

| 구분 | 배경 | 텍스트 |
|------|------|--------|
| 직영 | `colors.accent` + 10% opacity | `colors.accent` |
| 지사 | `colors.green` + 10% opacity | `colors.green` |

## Do's and Don'ts

**Do**
- 수치는 항상 `ko-KR` 로케일로 쉼표 포맷 (`1,234`, `1,000만`)
- 달성율 색상은 Progress Bar 규칙을 일관되게 적용
- 버튼 요소에 `type="button"` 명시 (form 내 의도치 않은 submit 방지)
- hover 색상은 반드시 라이트 테마 토큰 사용 (`colors.card-hover`)

**Don't**
- LNB 다크 팔레트를 메인 콘텐츠 영역에 사용하지 않음
- 델타 뱃지에 화살표 아이콘 + `+`/`−` 기호 중복 사용 금지
- `borderRadius: 999` 하드코딩 — `rounded.full` 토큰 참조
- 직영은 `colors.accent`, 지사는 `colors.green` — 반대로 사용하지 않음
