import { useState, useMemo, useEffect } from 'react';
import {
  X, ChevronRight,
  Award, BarChart3, TrendingUp, Users, Target, Network,
} from 'lucide-react';
import { T, MONO_STACK, RADIUS, SHADOW } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import KPICard from '../../components/KPICard.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { isHoliday } from '../../utils/koreaHolidays.js';

// ── 아코디언 상세 (지점 클릭 시 인라인 표시) ───────────────────────
function BranchAccordion({ branch }) {
  const ac = branch.achieve >= 1 ? T.green : branch.achieve >= 0.5 ? T.accent : branch.achieve > 0 ? T.yellow : T.textMute;
  const dbSections = [
    { label: '호전환', color: T.accent, data: branch.hw || {} },
    { label: '보장분석', color: T.blue, data: branch.cov || {} },
  ];
  return (
    <div style={{ padding: '14px 16px', background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
      {/* 실적 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 12 }}>
        {[
          { label: '당월 건수', value: fmtNum(branch.count), color: T.text },
          { label: '당월 월납P', value: fmtMan(branch.monthly), color: T.text },
          { label: '목표', value: fmtMan(branch.target), color: T.textDim },
          { label: '재적', value: `${fmtNum(branch.headcount)}명`, color: T.textDim },
          { label: '당월 위촉/해촉', value: `+${fmtNum(branch.hire || 0)} / ${fmtNum(branch.fire || 0)}`, color: T.textDim },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: '10px 12px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 11, color: T.textMute, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: MONO_STACK, color }}>{value}</div>
          </div>
        ))}
      </div>
      {/* 달성율 바 */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textDim, marginBottom: 4 }}>
          <span>달성율</span>
          <span style={{ fontFamily: MONO_STACK, fontWeight: 700, color: ac }}>{fmtPct(branch.achieve)}</span>
        </div>
        <ProgressBar value={branch.achieve} color={ac} height={5} />
      </div>
      {/* DB 운영 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {dbSections.map(({ label, color, data }) => (
          <div key={label} style={{ padding: '10px 12px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${color}28` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{label}</span>
              <span style={{ fontSize: 12, fontFamily: MONO_STACK, color, fontWeight: 600 }}>체결율 {fmtPct(data.contractRate)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { l: '배정DB', v: fmtNum(data.assignedDb) },
                { l: '체결건수', v: fmtNum(data.contracts) },
                { l: '실적', v: fmtMan(data.amount) },
                { l: '가동인원', v: `${fmtNum(data.active)}명` },
              ].map(({ l, v }) => (
                <div key={l}>
                  <div style={{ fontSize: 11, color: T.textMute }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: MONO_STACK, color: T.text }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 채널 세부 팝업 ───────────────────────────────────────────────
function ChannelModal({ channelType, branches, onClose }) {
  const label = channelType === 'direct' ? '직영' : '지사';
  const color = channelType === 'direct' ? T.accent : T.green;
  const [expandedName, setExpandedName] = useState(null);

  const list = useMemo(
    () => branches
      .filter(b => channelType === 'direct' ? b.isDirect : !b.isDirect)
      .sort((a, b) => (b.achieve || 0) - (a.achieve || 0)),
    [branches, channelType]
  );

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(680px, 95vw)', height: 'min(78vh, 680px)',
        background: T.card, borderRadius: RADIUS.md, boxShadow: SHADOW.deep,
        zIndex: 201, display: 'flex', flexDirection: 'column',
        animation: 'fadeInModal 0.15s ease',
      }}>
        <style>{`@keyframes fadeInModal { from { opacity:0; transform:translate(-50%,-53%); } to { opacity:1; transform:translate(-50%,-50%); } }`}</style>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ padding: '2px 10px', borderRadius: RADIUS.pill, background: `${color}18`, color, fontSize: 13, fontWeight: 700 }}>{label}</span>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{label} 세부 현황</span>
            <span style={{ fontSize: 13, color: T.textMute }}>{list.length}개 지점 · 클릭 시 상세</span>
          </div>
          <button type="button" onClick={onClose} style={{ padding: 6, borderRadius: RADIUS.xs, background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg2, position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`, width: 20 }} />
                {['지점명', '관리자', '건수', '당월P', '달성율', '재적'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: i >= 2 ? 'right' : 'left', color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((b, i) => {
                const ac = b.achieve >= 1 ? T.green : b.achieve >= 0.5 ? T.accent : b.achieve > 0 ? T.yellow : T.textMute;
                const isOpen = expandedName === b.name;
                return (
                  <>
                    <tr key={`row-${i}`}
                      onClick={() => setExpandedName(isOpen ? null : b.name)}
                      style={{ borderBottom: isOpen ? 'none' : `1px solid ${T.border}`, cursor: 'pointer', background: isOpen ? T.accentSoft : 'transparent', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = T.cardHover; }}
                      onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, color: T.textMute }}>
                        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, fontWeight: 600, color: isOpen ? T.accent : T.text }}>{b.name}</td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: T.textDim }}>{b.manager || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 14 }}>{fmtNum(b.count)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 14 }}>{fmtMan(b.monthly)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontFamily: MONO_STACK, fontSize: 14, fontWeight: 700, color: ac }}>{fmtPct(b.achieve)}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 14 }}>{fmtNum(b.headcount)}</td>
                    </tr>
                    <tr key={`accordion-${i}`} style={{ borderBottom: isOpen ? `1px solid ${T.border}` : 'none' }}>
                      <td colSpan={7} style={{ padding: 0 }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateRows: isOpen ? '1fr' : '0fr',
                          transition: 'grid-template-rows 0.28s ease',
                        }}>
                          <div style={{ overflow: 'hidden' }}>
                            <BranchAccordion branch={b} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ── 일별 실적 달력 ───────────────────────────────────────────────
function DailyCalendar({ allReports, year, month, field }) {
  const dateMap = useMemo(() => {
    const map = {};
    (allReports || []).forEach(r => {
      const d = r.reportDate ? new Date(r.reportDate) : null;
      if (!d || isNaN(d) || d.getFullYear() !== year || d.getMonth() !== month) return;
      const val = r.data?.summary?.[field]?.today;
      if (val != null) map[d.getDate()] = val;
    });
    return map;
  }, [allReports, year, month, field]);

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

  const DOW = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
        <thead>
          <tr>
            {DOW.map((d, i) => (
              <th key={d} style={{
                padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 700,
                width: `${100/7}%`,
                color: i === 0 || i === 6 ? T.red : T.textDim,
                background: T.bg2,
                border: `1px solid ${T.border}`,
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
                const bg = '#ffffff';
                const holName = isHoliday(cell.actualYear, cell.actualMonth, cell.day);
                const isRed = isWeekend || !!holName;
                const dateColor = !cell.isCurrentMonth
                  ? T.textMute
                  : isRed ? T.red : T.textDim;
                return (
                  <td key={di} title={holName || undefined} style={{
                    border: `1px solid ${T.border}`,
                    background: bg,
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
                      }}>{fmtMan(val)}</span>
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

// ── 스타일 헬퍼 ──────────────────────────────────────────────────
const TH = (align = 'center') => ({
  padding: '10px 12px', textAlign: align, color: T.textDim,
  fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
  whiteSpace: 'nowrap', background: T.bg2, borderBottom: `1px solid ${T.border}`,
});
const TD = (align = 'center', extra = {}) => ({
  padding: '12px 12px', textAlign: align, fontFamily: MONO_STACK,
  fontSize: 14, borderBottom: `1px solid ${T.border}`, ...extra,
});

// ── 메인 ────────────────────────────────────────────────────────
export default function Dashboard({ data, prevData, allReports = [] }) {
  const { reportDate, baseDate, branches, summary } = data;
  const total = summary.total || {};
  const direct = summary.direct || {};
  const branch = summary.branch || {};
  const pt = prevData?.summary?.total || null;

  // 전월 마지막 파일 → 전월건수 / 전월인력 전용 (확정값)
  const prevMonthReport = useMemo(() => {
    if (!allReports?.length || !reportDate) return null;
    const curr = new Date(reportDate);
    const pmYear = curr.getMonth() === 0 ? curr.getFullYear() - 1 : curr.getFullYear();
    const pmMonth = curr.getMonth() === 0 ? 11 : curr.getMonth() - 1;
    return allReports
      .filter(r => { const d = new Date(r.reportDate); return d.getFullYear() === pmYear && d.getMonth() === pmMonth; })
      .sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate))[0] || null;
  }, [allReports, reportDate]);

  const pmTotal  = prevMonthReport?.data?.summary?.total  || null;
  const pmDirect = prevMonthReport?.data?.summary?.direct || null;
  const pmBranch = prevMonthReport?.data?.summary?.branch || null;


  const [channelPopup, setChannelPopup] = useState(null);
  const [dailyTab, setDailyTab] = useState('total');

  const initDate = reportDate instanceof Date ? reportDate : new Date(reportDate || Date.now());
  const [calYear, setCalYear] = useState(initDate.getFullYear());
  const [calMonth, setCalMonth] = useState(initDate.getMonth());

  const moveMonth = (delta) => {
    const newDate = new Date(calYear, calMonth + delta, 1);
    setCalYear(newDate.getFullYear());
    setCalMonth(newDate.getMonth());
  };

  // ── 실적 rows (전월건수: 전달 최종 파일 기준 확정값)
  const perfRows = [
    { label: '전체', d: total,  prev: pmTotal,  color: T.text,  bold: true },
    { label: '직영', d: direct, prev: pmDirect, color: T.accent, type: 'direct' },
    { label: '지사', d: branch, prev: pmBranch, color: T.green,  type: 'branch' },
  ];

  // ── 인원 rows (전월인력: 전달 최종 파일 기준 확정값)
  const personnelRows = [
    { label: '전체', d: total,  prev: pmTotal,  color: T.text,  bold: true },
    { label: '직영', d: direct, prev: pmDirect, color: T.accent, type: 'direct' },
    { label: '지사', d: branch, prev: pmBranch, color: T.green,  type: 'branch' },
  ];

  // ── DB rows ──
  const hwT = total.hw || {}, covT = total.cov || {};
  const hwD = direct.hw || {}, covD = direct.cov || {};
  const totalAssigned = (hwT.assignedDb || 0) + (covT.assignedDb || 0);
  const totalContracts = (hwT.contracts || 0) + (covT.contracts || 0);
  const dbRows = [
    {
      label: '전체', color: T.text, bold: true,
      targetDb: (hwT.targetDb || 0) + (covT.targetDb || 0),
      contracts: totalContracts,
      amount: (hwT.amount || 0) + (covT.amount || 0),
      contractRate: totalAssigned > 0 ? totalContracts / totalAssigned : 0,
    },
    {
      label: '직영_호전환', color: T.accent,
      targetDb: hwD.targetDb || 0,
      contracts: hwD.contracts || 0,
      amount: hwD.amount || 0,
      contractRate: hwD.contractRate || 0,
    },
    {
      label: '직영_퍼미션', color: T.blue,
      targetDb: covD.targetDb || 0,
      contracts: covD.contracts || 0,
      amount: covD.amount || 0,
      contractRate: covD.contractRate || 0,
    },
  ];

  return (
    <div className="page-wrap">
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>GFP 총괄 대시보드</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>보고일 {fmtDate(reportDate)} · 작성일 {fmtDate(baseDate)}</p>
      </div>

      {/* ─── KPI 카드 ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="전사 영업건수" value={fmtNum(total.count)} sub={`직영 ${fmtNum(direct.count)} · 지사 ${fmtNum(branch.count)}`} color={T.accent} icon={BarChart3} delta={pt ? (total.count - (pt.count || 0)) : undefined} />
        <KPICard label="당월 월납P" value={fmtMan(total.monthly)} sub={`목표 ${fmtMan(total.target)}`} color={T.green} icon={TrendingUp} delta={pt ? (total.monthly - (pt.monthly || 0)) : undefined} />
        <KPICard label="달성율" value={fmtPct(total.achieve)} sub={`직영 ${fmtPct(direct.achieve)} · 지사 ${fmtPct(branch.achieve)}`} color={total.achieve >= 1 ? T.green : total.achieve >= 0.5 ? T.yellow : T.red} icon={Target} delta={pt ? ((total.achieve - (pt.achieve || 0)) * 100) : undefined} />
        <KPICard label="재적 인원" value={fmtNum(total.headcount)} sub={`직영 ${fmtNum(direct.headcount)} · 지사 ${fmtNum(branch.headcount)}`} color={T.blue} icon={Users} delta={pt ? (total.headcount - (pt.headcount || 0)) : undefined} />
        <KPICard label="당월 위촉/해촉" value={`${fmtNum(total.hire)} / ${fmtNum(total.fire)}`} sub={`순증감 ${fmtNum((total.hire || 0) - (total.fire || 0))}명`} color={T.purple} icon={Network} />
        <KPICard label="DB 체결 합계" value={fmtMan((total.hw?.amount || 0) + (total.cov?.amount || 0))} sub={`체결건수 ${fmtNum((total.hw?.contracts || 0) + (total.cov?.contracts || 0))}건`} color={T.yellow} icon={Award} delta={pt ? ((total.hw?.amount || 0) + (total.cov?.amount || 0) - ((pt.hw?.amount || 0) + (pt.cov?.amount || 0))) : undefined} />
      </div>

      {/* ─── 실적 요약 + 일별 추이 (통합) ──────────────── */}
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        {/* 헤더 */}
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>실적 요약</h3>
          <p style={{ fontSize: 13, color: T.textMute }}>채널별 영업 실적 · 직영·지사 클릭 시 지점 세부</p>
        </div>
        {/* 실적 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...TH('left'), width: '13%' }}>구분</th>
                <th style={TH()}>당일</th>
                <th style={TH()}>당월누적(P)</th>
                <th style={TH()}>당월목표</th>
                <th style={{ ...TH(), width: '18%' }}>달성율</th>
                <th style={TH()}>당월건수</th>
                <th style={TH()}>전월건수</th>
              </tr>
            </thead>
            <tbody>
              {perfRows.map(({ label, d, prev, color, bold, type }) => {
                const ac = (d.achieve || 0) >= 1 ? T.green : (d.achieve || 0) >= 0.5 ? T.accent : (d.achieve || 0) > 0 ? T.yellow : T.textMute;
                const clickable = !!type;
                return (
                  <tr key={label}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: clickable ? 'pointer' : 'default', transition: 'background 0.15s' }}
                    onClick={clickable ? () => setChannelPopup(type) : undefined}
                    onMouseEnter={e => { if (clickable) e.currentTarget.style.background = T.cardHover; }}
                    onMouseLeave={e => { if (clickable) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {bold
                          ? <span style={{ fontSize: 14, fontWeight: 800, color }}>{label}</span>
                          : <span style={{ padding: '2px 8px', borderRadius: RADIUS.pill, background: `${color}18`, color, fontSize: 13, fontWeight: 700 }}>{label}</span>
                        }
                        {clickable && <ChevronRight size={12} color={T.textMute} />}
                      </div>
                    </td>
                    <td style={TD()}>{fmtMan(d.today)}</td>
                    <td style={{ ...TD(), fontWeight: bold ? 700 : 500, color: T.text }}>{fmtMan(d.monthly)}</td>
                    <td style={{ ...TD(), color: T.textDim }}>{fmtMan(d.target)}</td>
                    <td style={TD()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 44 }}><ProgressBar value={d.achieve} color={ac} height={3} /></div>
                        <span style={{ color: ac, fontWeight: 700, minWidth: 46 }}>{fmtPct(d.achieve)}</span>
                      </div>
                    </td>
                    <td style={{ ...TD(), fontWeight: bold ? 700 : 400 }}>{fmtNum(d.count)}</td>
                    <td style={{ ...TD(), color: prev ? T.textDim : T.textMute }}>{prev ? fmtNum(prev.count) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* 일별 추이 구분선 + 헤더 */}
        <div style={{ padding: '30px 20px 14px', borderTop: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          {/* Left: 레이블 */}
          <span style={{ fontSize: 12, color: T.textMute }}>일별 실적(P)</span>
          {/* Center: 월 네비게이터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => moveMonth(-1)} style={{ padding: '3px 8px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>‹</button>
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text, fontFamily: MONO_STACK, minWidth: 80, textAlign: 'center' }}>
              {calYear}. {calMonth + 1}
            </span>
            <button type="button" onClick={() => moveMonth(1)} style={{ padding: '3px 8px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>›</button>
          </div>
          {/* Right: 채널 탭 */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            {[['total', '전체'], ['direct', '직영'], ['branch', '지사']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setDailyTab(k)} style={{
                padding: '4px 10px', borderRadius: RADIUS.xs, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: dailyTab === k ? T.accent : T.bg2,
                color: dailyTab === k ? T.card : T.textDim,
                border: `1px solid ${dailyTab === k ? T.accent : T.border}`,
                fontFamily: MONO_STACK,
              }}>{l}</button>
            ))}
          </div>
        </div>
        {/* 달력 */}
        <div style={{ padding: '12px 20px 20px' }}>
          {allReports.filter(r => {
            const d = r.reportDate ? new Date(r.reportDate) : null;
            return d && d.getFullYear() === calYear && d.getMonth() === calMonth;
          }).length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: T.textMute, fontSize: 13 }}>
              {calYear}년 {calMonth + 1}월 업로드된 보고서가 없습니다.
            </div>
          ) : (
            <DailyCalendar allReports={allReports} year={calYear} month={calMonth} field={dailyTab} />
          )}
        </div>
      </Card>

      {/* ─── 인원 현황 ──────────────────────────────────── */}
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>인원 현황</h3>
          <p style={{ fontSize: 13, color: T.textMute }}>규모(재적·달성율) 및 생산성(인당 건수·P) · 직영·지사 클릭 시 세부</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...TH('left'), width: '13%' }}>구분</th>
                <th style={TH()}>재적</th>
                <th style={TH()}>당월위촉</th>
                <th style={TH()}>당월해촉</th>
                <th style={TH()}>전월인력</th>
                <th style={TH()}>인당 건수</th>
                <th style={TH()}>인당 월납P</th>
              </tr>
            </thead>
            <tbody>
              {personnelRows.map(({ label, d, prev, color, bold, type }) => {
                const hc = d.headcount || 0;
                const perCount = hc > 0 ? (d.count || 0) / hc : 0;
                const perP = hc > 0 ? (d.monthly || 0) / hc : 0;
                const clickable = !!type;
                return (
                  <tr key={label}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: clickable ? 'pointer' : 'default', transition: 'background 0.15s' }}
                    onClick={clickable ? () => setChannelPopup(type) : undefined}
                    onMouseEnter={e => { if (clickable) e.currentTarget.style.background = T.cardHover; }}
                    onMouseLeave={e => { if (clickable) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {bold
                          ? <span style={{ fontSize: 14, fontWeight: 800, color }}>{label}</span>
                          : <span style={{ padding: '2px 8px', borderRadius: RADIUS.pill, background: `${color}18`, color, fontSize: 13, fontWeight: 700 }}>{label}</span>
                        }
                        {clickable && <ChevronRight size={12} color={T.textMute} />}
                      </div>
                    </td>
                    <td style={{ ...TD(), fontWeight: bold ? 700 : 500, color: T.text }}>{fmtNum(d.headcount)}</td>
                    <td style={{ ...TD(), color: (d.hire || 0) > 0 ? T.green : T.textMute }}>
                      {(d.hire || 0) > 0 ? `+${fmtNum(d.hire)}` : '—'}
                    </td>
                    <td style={{ ...TD(), color: (d.fire || 0) > 0 ? T.red : T.textMute }}>
                      {(d.fire || 0) > 0 ? fmtNum(d.fire) : '—'}
                    </td>
                    <td style={{ ...TD(), color: prev ? T.textDim : T.textMute }}>{prev ? fmtNum(prev.headcount) : '—'}</td>
                    <td style={{ ...TD(), color: perCount > 0 ? T.text : T.textMute }}>{perCount > 0 ? `${perCount.toFixed(2)}건` : '—'}</td>
                    <td style={{ ...TD(), color: perP > 0 ? T.accent : T.textMute }}>{perP > 0 ? fmtMan(perP) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── DB 운영 현황 ────────────────────────────────── */}
      <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text }}>DB 운영 현황</h3>
          <p style={{ fontSize: 13, color: T.textMute }}>배분 · 체결 · 금액 기준 · 계약단가 = 계약금액 ÷ 계약건수</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ ...TH('left'), width: '16%' }}>구분</th>
                <th style={TH()}>배분</th>
                <th style={TH()}>계약건수</th>
                <th style={{ ...TH(), width: '20%' }}>체결율</th>
                <th style={TH()}>계약금액(총액)</th>
                <th style={TH()}>계약단가</th>
              </tr>
            </thead>
            <tbody>
              {dbRows.map(({ label, color, bold, targetDb, contracts, amount, contractRate }) => {
                const unitPrice = contracts > 0 ? amount / contracts : 0;
                const rc = contractRate >= 0.15 ? T.green : contractRate >= 0.1 ? T.accent : T.yellow;
                return (
                  <tr key={label} style={{ borderBottom: `1px solid ${T.border}` }}
                    onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 12px' }}>
                      {bold
                        ? <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{label}</span>
                        : <span style={{ padding: '2px 8px', borderRadius: RADIUS.pill, background: `${color}18`, color, fontSize: 13, fontWeight: 700 }}>{label}</span>
                      }
                    </td>
                    <td style={{ ...TD(), fontWeight: bold ? 700 : 400 }}>{fmtNum(targetDb)}</td>
                    <td style={{ ...TD(), color: contracts > 0 ? color : T.textMute, fontWeight: contracts > 0 ? 700 : 400 }}>{fmtNum(contracts)}</td>
                    <td style={TD()}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 40 }}><ProgressBar value={contractRate} color={rc} height={3} /></div>
                        <span style={{ color: rc, fontWeight: 700, minWidth: 44 }}>{fmtPct(contractRate)}</span>
                      </div>
                    </td>
                    <td style={{ ...TD(), fontWeight: bold ? 700 : 400, color: amount > 0 ? T.text : T.textMute }}>{fmtMan(amount)}</td>
                    <td style={{ ...TD(), color: unitPrice > 0 ? T.textDim : T.textMute }}>{unitPrice > 0 ? fmtMan(unitPrice) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

{channelPopup && <ChannelModal channelType={channelPopup} branches={branches} onClose={() => setChannelPopup(null)} />}
    </div>
  );
}
