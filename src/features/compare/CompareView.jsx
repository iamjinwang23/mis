import { useState, useMemo, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, Calendar, RefreshCcw } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import { REPORT_TYPES, typeLabel } from '../../utils/report_types.js';
import Card from '../../components/Card.jsx';

function DeltaBadge({ delta, isRate = false }) {
  if (delta === 0 || delta == null) return <span style={{ color: T.textMute, fontFamily: MONO_STACK, fontSize: 15 }}>—</span>;
  const up = delta > 0;
  const color = up ? T.green : T.red;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const sign = up ? '+' : '';
  const text = isRate
    ? `${sign}${(delta * 100).toFixed(1)}%p`
    : `${sign}${Math.abs(delta) >= 10000 ? fmtMan(delta) : fmtNum(delta)}`;
  return (
    <span style={{ color, fontFamily: MONO_STACK, fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Icon size={12} />{text}
    </span>
  );
}

function DateSelect({ label, reports, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: T.textMute, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: RADIUS.xs,
          background: T.card, border: `1px solid ${T.border}`,
          color: T.text, fontSize: 18, fontFamily: FONT_STACK, cursor: 'pointer',
          appearance: 'none',
        }}
      >
        <option value="">날짜 선택...</option>
        {reports.map(r => (
          <option key={r.id} value={r.id}>
            {fmtDate(r.reportDate)} — {r.filename}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function CompareView({ gfpReports, retailReports, autoReports }) {
  const [compareType, setCompareType] = useState('gfp');
  const [idA, setIdA] = useState(null);
  const [idB, setIdB] = useState(null);
  const [sortKey, setSortKey] = useState('achieveDelta');
  const [sortDir, setSortDir] = useState('desc');

  const reportsByType = { gfp: gfpReports, retail: retailReports, auto: autoReports };
  const reports = reportsByType[compareType] || [];

  const reportA = idA != null ? reports.find(r => r.id === idA) : null;
  const reportB = idB != null ? reports.find(r => r.id === idB) : null;

  // 기준일(B=최신) 선택 시 비교일(A)은 그보다 이전 날짜만 선택 가능
  const aReports = reportB
    ? reports.filter(r => r.reportDate < reportB.reportDate)
    : reports;
  // 비교일(A=과거) 선택 시 기준일(B)은 그보다 이후 날짜만 선택 가능
  const bReports = reportA
    ? reports.filter(r => r.reportDate > reportA.reportDate)
    : reports;

  // GFP compare
  const gfpKpi = useMemo(() => {
    if (compareType !== 'gfp' || !reportA || !reportB) return null;
    const tA = reportA.data.summary?.total || {};
    const tB = reportB.data.summary?.total || {};
    const delta = (a, b) => ({ a: a || 0, b: b || 0, delta: (b || 0) - (a || 0) });
    return [
      { label: '영업건수', ...delta(tA.count, tB.count), fmt: fmtNum },
      { label: '당월 월납P', ...delta(tA.monthly, tB.monthly), fmt: fmtMan },
      { label: '달성율', ...delta(tA.achieve, tB.achieve), fmt: fmtPct, isRate: true },
      { label: '재적인원', ...delta(tA.headcount, tB.headcount), fmt: fmtNum },
      { label: 'DB 체결액', ...delta((tA.hw?.amount || 0) + (tA.cov?.amount || 0), (tB.hw?.amount || 0) + (tB.cov?.amount || 0)), fmt: fmtMan },
    ];
  }, [reportA, reportB, compareType]);

  const gfpBranches = useMemo(() => {
    if (compareType !== 'gfp' || !reportA || !reportB) return null;
    const mapA = Object.fromEntries((reportA.data.branches || []).map(b => [b.name, b]));
    const mapB = Object.fromEntries((reportB.data.branches || []).map(b => [b.name, b]));
    const allNames = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])];
    return allNames.map(name => {
      const a = mapA[name];
      const b = mapB[name];
      return {
        name,
        isDirect: (a || b)?.isDirect,
        status: !a ? 'new' : !b ? 'lost' : 'both',
        achieveA: a?.achieve || 0,
        achieveB: b?.achieve || 0,
        achieveDelta: (b?.achieve || 0) - (a?.achieve || 0),
        monthlyA: a?.monthly || 0,
        monthlyB: b?.monthly || 0,
        monthlyDelta: (b?.monthly || 0) - (a?.monthly || 0),
      };
    });
  }, [reportA, reportB, compareType]);

  const sortedBranches = useMemo(() => {
    if (!gfpBranches) return [];
    return [...gfpBranches].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [gfpBranches, sortKey, sortDir]);

  // Auto compare
  const autoKpi = useMemo(() => {
    if (compareType !== 'auto' || !reportA || !reportB) return null;
    const sA = reportA.data.summary || {};
    const sB = reportB.data.summary || {};
    const delta = (a, b) => ({ a: a || 0, b: b || 0, delta: (b || 0) - (a || 0) });
    return [
      { label: '총 영업인원', ...delta(sA.sales, sB.sales), fmt: fmtNum },
      { label: '갱신 DB 보유', ...delta(sA.renewalDb, sB.renewalDb), fmt: fmtNum },
      { label: '보장분석 합계', ...delta(sA.coverage, sB.coverage), fmt: fmtNum },
      { label: '1차 호전환', ...delta(sA.success1st, sB.success1st), fmt: fmtNum },
      { label: 'TM 성공률', ...delta(sA.successRate, sB.successRate), fmt: v => `${(v * 100).toFixed(1)}%`, isRate: true },
    ];
  }, [reportA, reportB, compareType]);

  // Retail compare
  const retailKpi = useMemo(() => {
    if (compareType !== 'retail' || !reportA || !reportB) return null;
    const sA = reportA.data.summary || {};
    const sB = reportB.data.summary || {};
    const delta = (a, b) => ({ a: a || 0, b: b || 0, delta: (b || 0) - (a || 0) });
    return [
      { label: '당일 신규',   ...delta(sA.todayNew, sB.todayNew),         fmt: fmtNum },
      { label: '월 누적',     ...delta(sA.monthCum, sB.monthCum),         fmt: fmtNum },
      { label: '월 달성율',   ...delta(sA.monthAchieve, sB.monthAchieve), fmt: fmtPct, isRate: true },
      { label: '분기 누적',   ...delta(sA.quarterCum, sB.quarterCum),     fmt: fmtNum },
      { label: '분기 달성율', ...delta(sA.quarterAchieve, sB.quarterAchieve), fmt: fmtPct, isRate: true },
    ];
  }, [reportA, reportB, compareType]);

  // 기준일 변경 시 비교일이 기준일보다 최신이면 초기화
  useEffect(() => {
    if (idB && reportA && reportB && reportA.reportDate >= reportB.reportDate) setIdA(null);
  }, [idB]);
  // 비교일 변경 시 기준일이 비교일보다 과거이면 초기화
  useEffect(() => {
    if (idA && reportA && reportB && reportB.reportDate <= reportA.reportDate) setIdB(null);
  }, [idA]);

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const SortHead = ({ k, children }) => (
    <th onClick={() => handleSort(k)} style={{
      padding: '10px 12px', textAlign: 'right', cursor: 'pointer',
      color: sortKey === k ? T.accent : T.textDim,
      fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
      textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
      </span>
    </th>
  );

  const kpiByType = { gfp: gfpKpi, retail: retailKpi, auto: autoKpi };
  const kpi = kpiByType[compareType];
  const dateA = reportA ? fmtDate(reportA.reportDate) : '?';
  const dateB = reportB ? fmtDate(reportB.reportDate) : '?';

  const hasData = reports.length >= 2;

  return (
    <div className="page-wrap" style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>날짜 비교</h1>
        <p style={{ fontSize: 18, color: T.textDim }}>저장된 두 보고서를 선택하여 KPI 변화를 비교합니다.</p>
      </div>

      {/* Type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(REPORT_TYPES).map(([key, meta]) => ({
          key, label: `${meta.label} 비교`, color: meta.color, count: reportsByType[key].length,
        })).map(t => (
          <button type="button"
            key={t.key}
            onClick={() => { setCompareType(t.key); setIdA(null); setIdB(null); }}
            style={{
              padding: '8px 16px', borderRadius: RADIUS.xs,
              background: compareType === t.key ? t.color : T.card,
              border: `1px solid ${compareType === t.key ? t.color : T.border}`,
              color: compareType === t.key ? T.bg : T.textDim,
              fontSize: 18, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_STACK,
            }}
          >
            {t.label} ({t.count}개)
          </button>
        ))}
      </div>

      {!hasData ? (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <Calendar size={32} style={{ color: T.textMute, margin: '0 auto 12px' }} />
          <div style={{ fontSize: 18, color: T.textDim, marginBottom: 4 }}>
            {typeLabel(compareType)} 보고서가 2개 이상 필요합니다.
          </div>
          <div style={{ fontSize: 15, color: T.textMute }}>파일 업로드 메뉴에서 추가로 업로드해주세요.</div>
        </Card>
      ) : (
        <>
          {/* Date selectors */}
          <Card style={{ padding: 20, marginBottom: 24 }}>
            <div className="grid-2col" style={{ gap: 20 }}>
              <DateSelect label="비교일 (과거)" reports={aReports} value={idA} onChange={(v) => { setIdA(v); }} />
              <DateSelect label="기준일 (현재)" reports={bReports} value={idB} onChange={(v) => { setIdB(v); }} />
            </div>
            {idA && idB && idA === idB && (
              <div style={{ marginTop: 12, fontSize: 15, color: T.yellow }}>
                ⚠️ 같은 날짜를 선택했습니다. 다른 날짜를 선택하세요.
              </div>
            )}
          </Card>

          {/* KPI comparison */}
          {kpi && idA !== idB && (
            <>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 2 }}>KPI 비교</h2>
                <p style={{ fontSize: 15, color: T.textMute }}>{dateA} → {dateB}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
                {kpi.map(k => (
                  <Card key={k.label} style={{ padding: 16 }}>
                    <div style={{ fontSize: 13, color: T.textDim, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>{k.label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK }}>{k.fmt(k.a)}</span>
                      <span style={{ fontSize: 13, color: T.textMute }}>→</span>
                      <span style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO_STACK }}>{k.fmt(k.b)}</span>
                    </div>
                    <DeltaBadge delta={k.delta} isRate={k.isRate} />
                  </Card>
                ))}
              </div>

              {/* GFP Branch table */}
              {compareType === 'gfp' && sortedBranches.length > 0 && (
                <>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>지점별 변화</h2>
                  <Card style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>지점명</th>
                            <th style={{ padding: '10px 12px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600 }}>구분</th>
                            <SortHead k="achieveA">달성율 {dateA}</SortHead>
                            <SortHead k="achieveB">달성율 {dateB}</SortHead>
                            <SortHead k="achieveDelta">달성율 변화</SortHead>
                            <SortHead k="monthlyDelta">월납P 변화</SortHead>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedBranches.map((b, i) => (
                            <tr key={`${b.name}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}
                              onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                              <td style={{ padding: '10px 12px', fontSize: 18, fontWeight: 500, color: T.text }}>
                                {b.name}
                                {b.status === 'new' && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 3, background: `${T.green}18`, color: T.green, fontSize: 13, fontWeight: 700 }}>신규</span>}
                                {b.status === 'lost' && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 3, background: T.redSoft, color: T.red, fontSize: 13, fontWeight: 700 }}>소멸</span>}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ padding: '2px 6px', borderRadius: 3, background: b.isDirect ? `${T.accent}18` : `${T.green}18`, color: b.isDirect ? T.accent : T.green, fontSize: 13, fontWeight: 700 }}>
                                  {b.isDirect ? '직영' : '지사'}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, color: T.textDim }}>{b.status !== 'new' ? fmtPct(b.achieveA) : '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{b.status !== 'lost' ? fmtPct(b.achieveB) : '-'}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{b.status === 'both' ? <DeltaBadge delta={b.achieveDelta} isRate /> : <span style={{ color: T.textMute }}>-</span>}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{b.status === 'both' ? <DeltaBadge delta={b.monthlyDelta} /> : <span style={{ color: T.textMute }}>-</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </>
              )}
            </>
          )}

          {(!idA || !idB) && (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMute, fontSize: 18 }}>
              위에서 두 날짜를 선택하면 비교 결과가 표시됩니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}
