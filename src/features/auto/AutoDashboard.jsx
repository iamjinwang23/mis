import { useState, useMemo } from 'react';
import { Users, Database, TrendingUp, Activity, Award, Target } from 'lucide-react';
import { T, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import KPICard from '../../components/KPICard.jsx';
import { isHoliday } from '../../utils/koreaHolidays.js';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

const SECTION_DEFS = [
  { key: 'tmHoJeon',     label: 'TM 호전환',   mainField: 'success1st' },
  { key: 'contract',     label: '계약실',       mainField: 'success1st' },
  { key: 'dealerNew',    label: '딜러 신규실',  mainField: 'success1st' },
  { key: 'dealerRenewal',label: '딜러 갱신실',  mainField: 'success1st' },
  { key: 'permission',   label: '퍼미션실',     mainField: 'success1st' },
];

// ── 스타일 헬퍼 ─────────────────────────────────────────────────
const TH = (align = 'center') => ({
  padding: '10px 12px', textAlign: align, color: T.textDim,
  fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
  whiteSpace: 'nowrap', background: T.bg2, borderBottom: `1px solid ${T.border}`,
});
const TD = (align = 'center', extra = {}) => ({
  padding: '12px 12px', textAlign: align, fontFamily: MONO_STACK,
  fontSize: 14, borderBottom: `1px solid ${T.border}`, ...extra,
});

const DASH = <span style={{ color: T.textMute }}>-</span>;

function Num({ v, color, bold }) {
  if (!v || v <= 0) return DASH;
  return <span style={{ color: color || T.text, fontWeight: bold ? 700 : 400 }}>{fmtNum(v)}</span>;
}

// ── 그룹 헤더 행 ────────────────────────────────────────────────
function GroupHeader({ label, color }) {
  return (
    <tr style={{ background: `${color}0a` }}>
      <td colSpan={9} style={{
        padding: '7px 14px', fontSize: 12, fontWeight: 700, color,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {label}
      </td>
    </tr>
  );
}

// ── 데이터 행 ────────────────────────────────────────────────────
function DataRow({ label, indent, todayVal, mainVal, prevVal, salesVal, accentColor }) {
  return (
    <tr
      style={{ borderBottom: `1px solid ${T.border}` }}
      onMouseEnter={e => { e.currentTarget.style.background = T.cardHover; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <td style={{ ...TD('left'), paddingLeft: indent ? 24 : 14, color: indent ? T.textDim : T.text, fontWeight: indent ? 400 : 700 }}>
        {indent && <span style={{ fontSize: 11, color: T.textMute, marginRight: 4 }}>└</span>}
        {label}
      </td>
      <td style={TD()}>{todayVal !== undefined ? <Num v={todayVal} color={T.accent} /> : DASH}</td>
      <td style={TD()}>
        <Num v={mainVal} color={!indent ? accentColor : undefined} bold={!indent} />
      </td>
      <td style={TD()}>{DASH}</td>
      <td style={TD()}>{DASH}</td>
      <td style={TD()}>{DASH}</td>
      <td style={TD()}><Num v={mainVal} /></td>
      <td style={TD()}><Num v={prevVal} color={T.textDim} /></td>
      <td style={TD()}>
        {salesVal !== undefined ? <Num v={salesVal} /> : DASH}
      </td>
    </tr>
  );
}

// ── 일별 달력 ────────────────────────────────────────────────────
function DailyCalendar({ allReports, year, month }) {
  const dateMap = useMemo(() => {
    const sorted = (allReports || [])
      .filter(r => {
        const d = r.reportDate ? new Date(r.reportDate) : null;
        return d && !isNaN(d);
      })
      .sort((a, b) => new Date(a.reportDate) - new Date(b.reportDate));

    const m = {};
    sorted.forEach((r, i) => {
      const d = new Date(r.reportDate);
      if (d.getFullYear() !== year || d.getMonth() !== month) return;
      const currVal = r.data?.summary?.success1st || 0;
      const prev = i > 0 ? sorted[i - 1] : null;
      const prevVal = prev?.data?.summary?.success1st || 0;
      const daily = prev ? Math.max(0, currVal - prevVal) : currVal;
      if (daily > 0) m[d.getDate()] = daily;
    });
    return m;
  }, [allReports, year, month]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear  = month === 0 ? year - 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear  = month === 11 ? year + 1 : year;
    const arr = [];
    for (let i = 0; i < firstDow; i++)
      arr.push({ day: prevMonthDays - (firstDow - 1 - i), isCurrentMonth: false, actualYear: prevYear, actualMonth: prevMonth });
    for (let d = 1; d <= daysInMonth; d++)
      arr.push({ day: d, isCurrentMonth: true, actualYear: year, actualMonth: month });
    let nextDay = 1;
    while (arr.length % 7 !== 0)
      arr.push({ day: nextDay++, isCurrentMonth: false, actualYear: nextYear, actualMonth: nextMonth });
    return arr;
  }, [year, month]);

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
        <thead>
          <tr>
            {DOW.map((d, i) => (
              <th key={d} style={{
                padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 700,
                width: `${100 / 7}%`,
                color: i === 0 || i === 6 ? T.red : T.textDim,
                background: T.bg2, border: `1px solid ${T.border}`,
              }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, wi) => (
            <tr key={wi}>
              {week.map((cell, di) => {
                const isWeekend = di === 0 || di === 6;
                const val = cell.isCurrentMonth ? dateMap[cell.day] : undefined;
                const hasData = val != null && val > 0;
                const holName = isHoliday(cell.actualYear, cell.actualMonth, cell.day);
                const isRed = isWeekend || !!holName;
                const dateColor = !cell.isCurrentMonth
                  ? T.textMute
                  : isRed ? T.red : T.textDim;
                return (
                  <td key={di} title={holName || undefined} style={{
                    border: `1px solid ${T.border}`,
                    background: '#ffffff',
                    position: 'relative',
                    height: 66,
                    verticalAlign: 'top',
                    minWidth: 40,
                  }}>
                    <span style={{
                      position: 'absolute', top: 5, left: 7,
                      fontSize: 13, fontFamily: MONO_STACK,
                      color: dateColor,
                      fontWeight: cell.isCurrentMonth ? 600 : 400,
                      opacity: cell.isCurrentMonth ? 1 : 0.45,
                    }}>{cell.day}</span>
                    {hasData && (
                      <span style={{
                        position: 'absolute', bottom: 5, right: 7,
                        fontSize: 14, fontWeight: 700, fontFamily: MONO_STACK,
                        color: T.accent,
                        opacity: cell.isCurrentMonth ? 1 : 0.45,
                      }}>{fmtNum(val)}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────
export default function AutoDashboard({ report, prevReport, allReports }) {
  const { summary, sections, monthlyTrend } = report.data;
  const reportDate = report.reportDate;
  const s = sections || {};
  const ps = prevReport?.data?.summary || null;

  const initDate = reportDate instanceof Date ? reportDate : new Date(reportDate || Date.now());
  const [calYear,  setCalYear]  = useState(initDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initDate.getMonth());

  const moveMonth = (delta) => {
    const d = new Date(calYear, calMonth + delta, 1);
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
  };

  const prevMonthTrend   = monthlyTrend?.length >= 2 ? monthlyTrend[monthlyTrend.length - 2] : null;
  const prevSummary      = prevMonthTrend?.summary  || {};
  const prevSections     = prevMonthTrend?.sections || {};

  // 전일 보고서 (같은 달, 현재 날짜 이전의 가장 최근 파일)
  const prevDayReport = useMemo(() => {
    if (!allReports?.length) return null;
    const curr = new Date(reportDate);
    return (allReports)
      .filter(r => {
        const d = new Date(r.reportDate);
        return d < curr && d.getFullYear() === curr.getFullYear() && d.getMonth() === curr.getMonth();
      })
      .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))[0] || null;
  }, [allReports, reportDate]);

  const prevDaySummary = prevDayReport?.data?.summary || null;
  const prevDaySecs    = prevDayReport?.data?.sections || {};
  const dayDiff = (curr, prev) =>
    prevDaySummary !== null ? Math.max(0, (curr || 0) - (prev || 0)) : undefined;

  const totalCoverage      = Object.values(s).reduce((a, sec) => a + (sec?.coverage      || 0), 0);
  const totalDriverConnect = Object.values(s).reduce((a, sec) => a + (sec?.driverConnect || 0), 0);
  const totalSuccess       = Object.values(s).reduce((a, sec) => a + (sec?.success1st    || 0), 0);
  const totalAssigned      = Object.values(s).reduce((a, sec) => a + (sec?.assigned      || 0), 0);

  const prevTotalCoverage      = Object.values(prevSections).reduce((a, sec) => a + (sec?.coverage      || 0), 0);
  const prevTotalDriverConnect = Object.values(prevSections).reduce((a, sec) => a + (sec?.driverConnect || 0), 0);


  const hasCalData = (allReports || []).some(r => {
    const d = r.reportDate ? new Date(r.reportDate) : null;
    return d && d.getFullYear() === calYear && d.getMonth() === calMonth;
  });

  return (
    <div className="page-wrap">
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>자동차 보험 대시보드</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {fmtDate(reportDate)} 기준 · {report.filename}
        </p>
      </div>

      {/* KPI 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="총 영업인원"   value={fmtNum(summary.sales)}   sub={`보조 ${fmtNum(summary.support)}명`}       color={T.accent} icon={Users}    delta={ps ? summary.sales   - (ps.sales   || 0) : undefined} />
        <KPICard label="갱신 DB 보유" value={fmtNum(summary.renewalDb)} sub={`배분 ${fmtNum(summary.assigned)}`}       color={T.blue}   icon={Database} delta={ps ? summary.renewalDb - (ps.renewalDb||0) : undefined} />
        <KPICard label="신규 DB"       value={fmtNum(summary.newDb)}   sub="신규 유입"                                 color={T.green}  icon={TrendingUp} delta={ps ? summary.newDb  - (ps.newDb  || 0) : undefined} />
        <KPICard label="보장 분석 합계" value={fmtNum(totalCoverage)}   sub="전 부서 합산"                             color={T.yellow} icon={Activity}  delta={ps ? totalCoverage - Object.values(prevReport?.data?.sections || {}).reduce((a, sec) => a + (sec?.coverage  || 0), 0) : undefined} />
        <KPICard label="1차 호전환"    value={fmtNum(totalSuccess)}     sub="전 부서 합산"                             color={T.purple} icon={Award}     delta={ps ? totalSuccess  - Object.values(prevReport?.data?.sections || {}).reduce((a, sec) => a + (sec?.success1st|| 0), 0) : undefined} />
        <KPICard label="TM 성공률"     value={`${(summary.successRate * 100).toFixed(1)}%`} sub={`TM 갱신성공 ${fmtNum(summary.tmRenewalSuccess)}`} color={summary.successRate >= 0.5 ? T.green : T.yellow} icon={Target} delta={ps ? (summary.successRate - (ps.successRate || 0)) * 100 : undefined} />
      </div>

      {/* 실적 현황 테이블 */}
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>실적 현황</h3>
          <p style={{ fontSize: 13, color: T.textMute }}>당월목표·예상실적은 원본 파일에 데이터 없음{prevDayReport ? '' : ' · 당일실적: 전일 파일 없음'}</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...TH('left'), width: '15%' }}>구분</th>
                <th style={{ ...TH(), color: T.textMute }}>당일실적</th>
                <th style={TH()}>당월누적</th>
                <th style={{ ...TH(), color: T.textMute }}>당월목표</th>
                <th style={{ ...TH(), color: T.textMute }}>목달도</th>
                <th style={{ ...TH(), color: T.textMute }}>예상실적</th>
                <th style={TH()}>당월건수</th>
                <th style={TH()}>전월실적</th>
                <th style={TH()}>인력현황</th>
              </tr>
            </thead>
            <tbody>
              {/* ── 자동차보험 ── */}
              <GroupHeader label="자동차보험" color={T.accent} />
              <DataRow
                label="전체"
                todayVal={dayDiff(summary.success1st, prevDaySummary?.success1st)}
                mainVal={summary.success1st}
                prevVal={prevSummary.success1st}
                salesVal={summary.sales}
                accentColor={T.accent}
              />
              {SECTION_DEFS.map(def => {
                const sec     = s[def.key]                || {};
                const prevSec = prevSections[def.key]     || {};
                const pdSec   = prevDaySecs[def.key]      || {};
                return (
                  <DataRow
                    key={def.key}
                    label={def.label}
                    indent
                    todayVal={dayDiff(sec[def.mainField], pdSec[def.mainField])}
                    mainVal={sec[def.mainField] || 0}
                    prevVal={prevSec[def.mainField] || 0}
                    salesVal={sec.sales}
                  />
                );
              })}

              {/* ── 보장분석 퍼미션 ── */}
              <GroupHeader label="보장분석 퍼미션" color={T.yellow} />
              <DataRow
                label="합계"
                todayVal={dayDiff(totalCoverage, Object.values(prevDaySecs).reduce((a, sec) => a + (sec?.coverage || 0), 0))}
                mainVal={totalCoverage}
                prevVal={prevTotalCoverage}
                accentColor={T.yellow}
              />
              {SECTION_DEFS.filter(def => (s[def.key]?.coverage || 0) > 0).map(def => {
                const sec     = s[def.key]            || {};
                const prevSec = prevSections[def.key] || {};
                const pdSec   = prevDaySecs[def.key]  || {};
                return (
                  <DataRow
                    key={`cov-${def.key}`}
                    label={def.label}
                    indent
                    todayVal={dayDiff(sec.coverage, pdSec.coverage)}
                    mainVal={sec.coverage || 0}
                    prevVal={prevSec.coverage || 0}
                  />
                );
              })}

              {/* ── 운전자보험 퍼미션 ── */}
              <GroupHeader label="운전자보험 퍼미션" color={T.green} />
              <DataRow
                label="합계"
                todayVal={dayDiff(totalDriverConnect, Object.values(prevDaySecs).reduce((a, sec) => a + (sec?.driverConnect || 0), 0))}
                mainVal={totalDriverConnect}
                prevVal={prevTotalDriverConnect}
                accentColor={T.green}
              />
              {SECTION_DEFS.filter(def => (s[def.key]?.driverConnect || 0) > 0).map(def => {
                const sec     = s[def.key]            || {};
                const prevSec = prevSections[def.key] || {};
                const pdSec   = prevDaySecs[def.key]  || {};
                return (
                  <DataRow
                    key={`drv-${def.key}`}
                    label={def.label}
                    indent
                    todayVal={dayDiff(sec.driverConnect, pdSec.driverConnect)}
                    mainVal={sec.driverConnect || 0}
                    prevVal={prevSec.driverConnect || 0}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 당월 계약 추이 달력 */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '30px 20px 14px', borderTop: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textMute }}>1차호전환 성공건 추이</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => moveMonth(-1)} style={{ padding: '3px 8px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>‹</button>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: MONO_STACK, minWidth: 80, textAlign: 'center' }}>
              {calYear}. {calMonth + 1}
            </span>
            <button type="button" onClick={() => moveMonth(1)} style={{ padding: '3px 8px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>›</button>
          </div>
          <div />
        </div>
        <div style={{ padding: '12px 20px 20px' }}>
          {!hasCalData ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: T.textMute, fontSize: 13 }}>
              {calYear}년 {calMonth + 1}월 업로드된 보고서가 없습니다.
            </div>
          ) : (
            <DailyCalendar allReports={allReports} year={calYear} month={calMonth} />
          )}
        </div>
      </Card>
    </div>
  );
}
