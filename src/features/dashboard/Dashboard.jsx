import { useState, useMemo, useEffect } from 'react';
import {
  Search, X,
  Phone, Shield, Award, Activity, BarChart3, TrendingUp, Users, Target, Network,
} from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS, SHADOW } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import KPICard from '../../components/KPICard.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import BranchDetailPanel from './BranchDetailPanel.jsx';
import SortHead from '../../components/SortHead.jsx';

function delta(curr, prev, isRate = false) {
  if (prev == null || curr == null) return undefined;
  const d = curr - prev;
  if (d === 0) return undefined;
  if (isRate) return `${d >= 0 ? '+' : ''}${(d * 100).toFixed(1)}%p`;
  return `${d >= 0 ? '+' : ''}${fmtNum(Math.abs(d))}${d < 0 ? '▼' : ''}`;
}

function deltaNum(curr, prev, isRate = false) {
  if (prev == null || curr == null) return undefined;
  const d = curr - prev;
  if (d === 0) return undefined;
  if (isRate) return (d * 100).toFixed(1) + '%p';
  return (d >= 0 ? '+' : '') + fmtNum(Math.round(Math.abs(d)));
}

export default function Dashboard({ data, prevData }) {
  const { reportDate, baseDate, branches, summary } = data;
  const total = summary.total || {};
  const direct = summary.direct || {};
  const branch = summary.branch || {};
  const pt = prevData?.summary?.total || null;

  const [sortKey, setSortKey] = useState('achieve');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  const filteredBranches = useMemo(() => {
    let list = [...branches];
    if (filterType === 'direct') list = list.filter(b => b.isDirect);
    else if (filterType === 'branch') list = list.filter(b => !b.isDirect);
    else if (filterType === 'active') list = list.filter(b => b.count > 0);
    else if (filterType === 'inactive') list = list.filter(b => b.count === 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.manager || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [branches, sortKey, sortDir, search, filterType]);

  const top10 = useMemo(() => (
    [...branches]
      .filter(b => b.monthly > 0)
      .sort((a, b) => b.monthly - a.monthly)
      .slice(0, 10)
      .map(b => ({ name: b.name?.replace(/^GFP/, '') || '', 월납P: b.monthly, 달성율: Math.round(b.achieve * 100) }))
  ), [branches]);

  const compareData = useMemo(() => ([
    { name: '직영', 건수: direct.count || 0, 월납P: direct.monthly || 0, 목표: direct.target || 0, 달성율: (direct.achieve || 0) * 100, 재적: direct.headcount || 0 },
    { name: '지사', 건수: branch.count || 0, 월납P: branch.monthly || 0, 목표: branch.target || 0, 달성율: (branch.achieve || 0) * 100, 재적: branch.headcount || 0 },
  ]), [direct, branch]);

  const dbStats = useMemo(() => ([
    { name: '호전환', icon: Phone, color: T.accent, ...total.hw, active: total.hw?.active || 0, target: total.hw?.targetDb || 0, assigned: total.hw?.assignedDb || 0, contracts: total.hw?.contracts || 0, amount: total.hw?.amount || 0, rate: total.hw?.contractRate || 0 },
    { name: '보장분석', icon: Shield, color: T.blue, ...total.cov, active: total.cov?.active || 0, target: total.cov?.targetDb || 0, assigned: total.cov?.assignedDb || 0, contracts: total.cov?.contracts || 0, amount: total.cov?.amount || 0, rate: total.cov?.contractRate || 0 },
  ]), [total]);

  const achieveBuckets = useMemo(() => {
    const buckets = [
      { range: '0%', min: 0, max: 0, count: 0, color: T.textMute },
      { range: '0~30%', min: 0.0001, max: 0.3, count: 0, color: T.red },
      { range: '30~60%', min: 0.3, max: 0.6, count: 0, color: T.yellow },
      { range: '60~100%', min: 0.6, max: 1, count: 0, color: T.blue },
      { range: '100%↑', min: 1, max: Infinity, count: 0, color: T.green },
    ];
    branches.forEach(b => {
      const a = b.achieve || 0;
      if (a === 0) buckets[0].count++;
      else if (a <= 0.3) buckets[1].count++;
      else if (a <= 0.6) buckets[2].count++;
      else if (a < 1) buckets[3].count++;
      else buckets[4].count++;
    });
    return buckets;
  }, [branches]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };



  return (
    <div className="page-wrap">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>
          GFP 총괄 대시보드
        </h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          보고일 {fmtDate(reportDate)} · 기준일 {fmtDate(baseDate)}
        </p>
      </div>

      <div>

        {/* KPI ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
          <KPICard label="전사 영업건수" value={fmtNum(total.count)} sub={`직영 ${fmtNum(direct.count)} · 지사 ${fmtNum(branch.count)}`} color={T.accent} icon={BarChart3} delta={pt ? (total.count - (pt.count||0)) : undefined} />
          <KPICard label="당월 월납P" value={fmtMan(total.monthly)} sub={`목표 ${fmtMan(total.target)}`} color={T.green} icon={TrendingUp} delta={pt ? (total.monthly - (pt.monthly||0)) : undefined} />
          <KPICard label="달성율" value={fmtPct(total.achieve)} sub={`직영 ${fmtPct(direct.achieve)} · 지사 ${fmtPct(branch.achieve)}`} color={total.achieve >= 1 ? T.green : total.achieve >= 0.5 ? T.yellow : T.red} icon={Target} delta={pt ? ((total.achieve - (pt.achieve||0)) * 100) : undefined} />
          <KPICard label="재적 인원" value={fmtNum(total.headcount)} sub={`직영 ${fmtNum(direct.headcount)} · 지사 ${fmtNum(branch.headcount)}`} color={T.blue} icon={Users} delta={pt ? (total.headcount - (pt.headcount||0)) : undefined} />
          <KPICard label="당월 위촉/해촉" value={`${fmtNum(total.hire)} / ${fmtNum(total.fire)}`} sub={`순증감 ${fmtNum((total.hire || 0) - (total.fire || 0))}명`} color={T.purple} icon={Network} />
          <KPICard label="DB 체결 합계" value={fmtMan((total.hw?.amount || 0) + (total.cov?.amount || 0))} sub={`체결건수 ${fmtNum((total.hw?.contracts || 0) + (total.cov?.contracts || 0))}건`} color={T.yellow} icon={Award} delta={pt ? ((total.hw?.amount||0) + (total.cov?.amount||0) - ((pt.hw?.amount||0) + (pt.cov?.amount||0))) : undefined} />
        </div>

        {/* 직영 vs 지사 + 달성율 분포 */}
        <div className="grid-2-1">
          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>직영 vs 지사 비교</h3>
            <p style={{ fontSize: 15, color: T.textMute, marginBottom: 28 }}>채널별 영업 실적과 인력 구성</p>
            <div className="grid-3col" style={{ gap: 40 }}>
              {[
                {
                  label: '월납P',
                  direct: { value: direct.monthly || 0, display: fmtMan(direct.monthly) },
                  branch: { value: branch.monthly || 0, display: fmtMan(branch.monthly) },
                },
                {
                  label: '건수',
                  direct: { value: direct.count || 0, display: fmtNum(direct.count) },
                  branch: { value: branch.count || 0, display: fmtNum(branch.count) },
                },
                {
                  label: '재적인원',
                  direct: { value: direct.headcount || 0, display: fmtNum(direct.headcount) },
                  branch: { value: branch.headcount || 0, display: fmtNum(branch.headcount) },
                },
              ].map(({ label, direct: d, branch: b }) => {
                const max = Math.max(d.value, b.value, 1);
                const BAR_H = 180;
                const BAR_W = 56;
                const bars = [
                  { name: '직영', color: T.accent, data: d },
                  { name: '지사', color: T.green,  data: b },
                ];
                return (
                  <div key={label} style={{ maxWidth: 200, margin: '0 auto', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', justifyContent: 'center', height: BAR_H + 8 }}>
                      {bars.map(({ name, color, data }) => {
                        const h = Math.max(Math.round((data.value / max) * BAR_H), 4);
                        return (
                          <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: BAR_W }}>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO_STACK, color }}>{data.display}</span>
                            <div style={{ width: '100%', height: animated ? h : 0, background: color, borderRadius: '4px 4px 0 0', opacity: 0.9, transition: 'height 0.6s ease' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ height: 1, background: T.border, marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 6 }}>
                      {bars.map(({ name, color }) => (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, width: BAR_W, justifyContent: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: T.textDim }}>{name}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: T.textMute, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card style={{ padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>달성율 분포</h3>
            <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>지점/지사 {branches.length}곳 기준</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...achieveBuckets].reverse().map(bucket => {
                const max = Math.max(...achieveBuckets.map(b => b.count));
                const w = max > 0 ? (bucket.count / max) * 100 : 0;
                return (
                  <div key={bucket.range}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 15 }}>
                      <span style={{ color: T.textDim, fontFamily: MONO_STACK }}>{bucket.range}</span>
                      <span style={{ fontFamily: MONO_STACK, fontWeight: 700, color: bucket.color }}>{bucket.count}곳</span>
                    </div>
                    <div style={{ width: '100%', height: 22, borderRadius: 4, background: T.bg2, overflow: 'hidden' }}>
                      <div style={{ width: animated ? `${w}%` : '0%', height: '100%', background: bucket.color, opacity: 0.85, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* DB 운영 */}
        <Card style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>DB 운영 현황</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 20 }}>호전환 vs 보장분석 — 전사 통합 기준</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {dbStats.map(s => {
              const Icon = s.icon;
              const utilRate = s.target > 0 ? s.assigned / s.target : 0;
              return (
                <div key={s.name} style={{ padding: 18, borderRadius: RADIUS.sm, background: `${s.color}0e`, border: `1px solid ${s.color}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: RADIUS.sm, background: `${s.color}1f`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{s.name}</div>
                        <div style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK }}>가동 {s.active}명</div>
                      </div>
                    </div>
                    <div style={{ padding: '4px 10px', borderRadius: RADIUS.pill, background: `${s.color}1a`, color: s.color, fontSize: 15, fontWeight: 700, fontFamily: MONO_STACK }}>
                      체결율 {fmtPct(s.rate)}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {[
                      { label: '월배분목표', value: fmtNum(s.target) },
                      { label: '배정 디비', value: fmtNum(s.assigned), sub: `배정률 ${fmtPct(utilRate)}` },
                      { label: '체결건수', value: fmtNum(s.contracts), color: s.color },
                      { label: '실적', value: fmtMan(s.amount), color: s.color },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label}>
                        <div style={{ fontSize: 13, color: T.textDim, marginBottom: 4 }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO_STACK, color: color || T.text }}>{value}</div>
                        {sub && <div style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK, marginTop: 2 }}>{sub}</div>}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: T.textDim }}>배정 → 체결 전환율</span>
                      <span style={{ fontFamily: MONO_STACK, fontWeight: 600, color: s.color }}>{fmtPct(s.rate)}</span>
                    </div>
                    <ProgressBar value={s.rate} color={s.color} height={5} />
                  </div>
                </div>
              );
            })}
          </div>
          {dbStats[0].rate > 0 && dbStats[1].rate > 0 && (
            <div style={{ marginTop: 16, padding: 12, borderRadius: RADIUS.sm, background: T.accentSoft, border: `1px solid ${T.accentBorder}`, fontSize: 15, color: T.textDim, lineHeight: 1.6 }}>
              <strong style={{ color: T.accent }}>인사이트</strong> · 호전환 체결율 {fmtPct(dbStats[0].rate)} vs 보장분석 체결율 {fmtPct(dbStats[1].rate)}
              {' '}— 호전환이 약 <strong style={{ color: T.text, fontFamily: MONO_STACK }}>{(dbStats[0].rate / dbStats[1].rate).toFixed(1)}배</strong> 효율
            </div>
          )}
        </Card>

        {/* TOP 10 테이블 */}
        <Card style={{ overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${T.border}` }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>월납P TOP 10 지점/지사</h3>
            <p style={{ fontSize: 15, color: T.textMute }}>당월 누적 기준</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                  {['순위', '지점/지사', '당월P', '달성율'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: i >= 2 ? 'right' : 'left',
                      color: T.textDim, fontSize: 13, fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top10.map((d, i) => {
                  const achieveColor = d.달성율 >= 100 ? T.green : d.달성율 >= 50 ? T.accent : T.yellow;
                  return (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.cardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '11px 16px', width: 52 }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, fontFamily: MONO_STACK,
                          color: i < 3 ? T.accent : T.textMute,
                        }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 15, fontWeight: 600, color: T.text }}>{d.name}</td>
                      <td style={{ padding: '11px 16px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, fontWeight: 700, color: T.text, whiteSpace: 'nowrap' }}>
                        {fmtMan(d.월납P)}
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div style={{ width: 64 }}>
                            <ProgressBar value={d.달성율 / 100} color={achieveColor} height={4} />
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO_STACK, color: achieveColor, minWidth: 48, textAlign: 'right' }}>
                            {d.달성율}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 지점/지사 테이블 */}
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>지점·지사 상세</h3>
                <p style={{ fontSize: 15, color: T.textMute }}>전체 {branches.length}곳 · 표시 {filteredBranches.length}곳 {selectedBranch ? '· 클릭하여 상세 확인' : '· 행 클릭 시 상세 열람'}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, minWidth: 200 }}>
                <Search size={14} style={{ color: T.textMute }} />
                <input
                  type="text" placeholder="지점명·관리자 검색"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 18, flex: 1, fontFamily: FONT_STACK }}
                />
                {search && <X size={14} style={{ color: T.textMute, cursor: 'pointer' }} onClick={() => setSearch('')} />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: '전체', count: branches.length },
                { key: 'direct', label: '직영', count: branches.filter(b => b.isDirect).length },
                { key: 'branch', label: '지사', count: branches.filter(b => !b.isDirect).length },
                { key: 'active', label: '실적O', count: branches.filter(b => b.count > 0).length },
                { key: 'inactive', label: '실적X', count: branches.filter(b => b.count === 0).length },
              ].map(f => (
                <button type="button" key={f.key} onClick={() => setFilterType(f.key)} style={{
                  padding: '6px 12px', borderRadius: RADIUS.xs, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  background: filterType === f.key ? T.accent : T.bg2,
                  color: filterType === f.key ? T.bg : T.textDim,
                  border: `1px solid ${filterType === f.key ? T.accent : T.border}`,
                  fontFamily: FONT_STACK,
                }}>
                  {f.label} <span style={{ opacity: 0.7, fontFamily: MONO_STACK }}>{f.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>구분</th>
                  <SortHead k="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left">지점명</SortHead>
                  <SortHead k="manager" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} align="left">관리자</SortHead>
                  <SortHead k="count" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>건수</SortHead>
                  <SortHead k="monthly" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>당월P</SortHead>
                  <SortHead k="target" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>목표</SortHead>
                  <SortHead k="achieve" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>달성율</SortHead>
                  <SortHead k="headcount" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>재적</SortHead>
                  <SortHead k="hire" sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>위촉</SortHead>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((b, i) => {
                  const isSelected = selectedBranch?.name === b.name;
                  return (
                    <tr key={`${b.no}-${b.name}-${i}`}
                      onClick={() => setSelectedBranch(isSelected ? null : b)}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: isSelected ? T.accentSoft : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.cardHover; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '12px 14px', fontSize: 13 }}>
                        <span style={{ padding: '3px 8px', borderRadius: 4, background: b.isDirect ? T.accentSoft : T.greenSoft, color: b.isDirect ? T.accent : T.green, fontWeight: 700, letterSpacing: '0.04em' }}>
                          {b.isDirect ? '직영' : '지사'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 15, fontWeight: isSelected ? 700 : 500, color: isSelected ? T.accent : T.text }}>{b.name}</td>
                      <td style={{ padding: '12px 14px', fontSize: 15, color: T.textDim }}>{b.manager || '-'}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtNum(b.count)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtMan(b.monthly)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, color: T.textDim }}>{fmtMan(b.target)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <div style={{ width: 60 }}>
                            <ProgressBar value={b.achieve} color={b.achieve >= 1 ? T.green : b.achieve >= 0.5 ? T.accent : b.achieve > 0 ? T.yellow : T.textMute} height={4} />
                          </div>
                          <span style={{ fontFamily: MONO_STACK, fontSize: 15, fontWeight: 600, minWidth: 50, textAlign: 'right', color: b.achieve >= 1 ? T.green : b.achieve >= 0.5 ? T.text : b.achieve > 0 ? T.yellow : T.textMute }}>
                            {fmtPct(b.achieve)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtNum(b.headcount)}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, color: b.hire > 0 ? T.green : T.textMute }}>
                        {b.hire > 0 ? `+${fmtNum(b.hire)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredBranches.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: T.textMute, fontSize: 18 }}>
                조건에 맞는 지점이 없습니다.
              </div>
            )}
          </div>
        </Card>

        <div style={{ marginTop: 24, padding: 16, textAlign: 'center', color: T.textMute, fontSize: 13, fontFamily: MONO_STACK }}>
          파싱: SheetJS · 시각화: Recharts · 데이터는 브라우저에서만 처리됩니다
        </div>
      </div>

      {/* 지점 상세 사이드 패널 */}
      {selectedBranch && (
        <BranchDetailPanel branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      )}
    </div>
  );
}
