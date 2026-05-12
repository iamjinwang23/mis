import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import {
  Phone, FileText, Truck, Lock, Users, Database,
  TrendingUp, Activity, Award, Target,
} from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS, SHADOW, PALETTE } from '../../theme.js';
import { fmtNum, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import KPICard from '../../components/KPICard.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';

function SectionCard({ data, color, icon: Icon, onClick }) {
  if (!data) return null;
  const activeAgents = data.agents?.filter(a => a.status === '재직' || a.status === '주말').length || 0;
  return (
    <div
      onClick={onClick}
      style={{
        padding: 18, borderRadius: RADIUS.md,
        background: T.card, border: `1px solid ${T.border}`,
        boxShadow: SHADOW.card, cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: RADIUS.sm,
          background: `${color}18`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{data.label}</div>
          <div style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK }}>
            재직 {activeAgents}명 · 관리자 {data.manager || '-'}
          </div>
        </div>
      </div>

      <div className="grid-2col" style={{ gap: 10 }}>
        {[
          { label: '갱신 분배', value: fmtNum(data.assigned), show: data.assigned > 0 },
          { label: '신규 DB', value: fmtNum(data.newDb), show: data.newDb > 0 },
          { label: '보장 분석', value: fmtNum(data.coverage), show: data.coverage > 0 },
          { label: '1차 호전환', value: fmtNum(data.success1st), show: data.success1st > 0 },
          { label: '운전자 연결', value: fmtNum(data.driverConnect), show: data.driverConnect > 0 },
          { label: '성공률', value: `${(data.successRate * 100).toFixed(1)}%`, show: data.successRate > 0 },
        ].filter(i => i.show).slice(0, 4).map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 13, color: T.textMute, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO_STACK, color }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AutoDashboard({ report, prevReport, onNavigate }) {
  const { summary, sections, monthlyTrend } = report.data;
  const reportDate = report.reportDate;
  const s = sections || {};
  const ps = prevReport?.data?.summary || null;

  const sectionDefs = [
    { key: 'tmHoJeon', label: 'TM 호전환', icon: Phone, color: T.accent, nav: 'tm' },
    { key: 'contract', label: '계약실', icon: FileText, color: T.blue, nav: 'contract' },
    { key: 'dealerNew', label: '딜러 신규실', icon: Truck, color: T.green, nav: 'dealer' },
    { key: 'dealerRenewal', label: '딜러 갱신실', icon: Truck, color: T.yellow, nav: 'dealer' },
    { key: 'permission', label: '퍼미션실', icon: Lock, color: T.purple, nav: 'permission' },
  ];

  const coverageChart = useMemo(() => {
    return sectionDefs
      .filter(d => s[d.key]?.coverage > 0)
      .map(d => ({ name: d.label, value: s[d.key].coverage, color: d.color }));
  }, [s]);

  const agentChart = useMemo(() => {
    const tm = s.tmHoJeon?.agents || [];
    return tm
      .filter(a => a.status === '재직' || a.status === '주말')
      .sort((a, b) => b.success1st - a.success1st)
      .slice(0, 10)
      .map(a => ({ name: a.name, 호전환: a.success1st, 보장분석: a.coverage }));
  }, [s]);

  const totalCoverage = Object.values(s).reduce((sum, sec) => sum + (sec?.coverage || 0), 0);
  const totalSuccess = Object.values(s).reduce((sum, sec) => sum + (sec?.success1st || 0), 0);
  const totalAssigned = Object.values(s).reduce((sum, sec) => sum + (sec?.assigned || 0), 0);

  const trendData = useMemo(() => {
    if (!monthlyTrend?.length) return [];
    return monthlyTrend.map(m => {
      const secs = Object.values(m.sections || {});
      return {
        name: m.label,
        보장분석: secs.reduce((a, sec) => a + (sec?.coverage || 0), 0),
        '1차호전환': secs.reduce((a, sec) => a + (sec?.success1st || 0), 0),
        신규DB: m.summary?.newDb || 0,
        갱신배분: m.summary?.assigned || 0,
      };
    });
  }, [monthlyTrend]);

  return (
    <div className="page-wrap">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>
              자동차 보험 대시보드
            </h1>
            <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
              {fmtDate(reportDate)} 기준 · {report.filename}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KPICard label="총 영업인원" value={fmtNum(summary.sales)} sub={`보조 ${fmtNum(summary.support)}명`} color={T.accent} icon={Users} delta={ps ? summary.sales - (ps.sales||0) : undefined} />
        <KPICard label="갱신 DB 보유" value={fmtNum(summary.renewalDb)} sub={`배분 ${fmtNum(summary.assigned)}`} color={T.blue} icon={Database} delta={ps ? summary.renewalDb - (ps.renewalDb||0) : undefined} />
        <KPICard label="신규 DB" value={fmtNum(summary.newDb)} sub="신규 유입" color={T.green} icon={TrendingUp} delta={ps ? summary.newDb - (ps.newDb||0) : undefined} />
        <KPICard label="보장 분석 합계" value={fmtNum(totalCoverage)} sub="전 부서 합산" color={T.yellow} icon={Activity} delta={ps ? totalCoverage - Object.values(prevReport?.data?.sections||{}).reduce((s,sec)=>s+(sec?.coverage||0),0) : undefined} />
        <KPICard label="1차 호전환" value={fmtNum(totalSuccess)} sub="전 부서 합산" color={T.purple} icon={Award} delta={ps ? totalSuccess - Object.values(prevReport?.data?.sections||{}).reduce((s,sec)=>s+(sec?.success1st||0),0) : undefined} />
        <KPICard label="TM 성공률" value={`${(summary.successRate * 100).toFixed(1)}%`} sub={`TM 갱신성공 ${fmtNum(summary.tmRenewalSuccess)}`} color={summary.successRate >= 0.5 ? T.green : T.yellow} icon={Target} delta={ps ? (summary.successRate - (ps.successRate||0)) * 100 : undefined} />
      </div>

      {/* 월별 추세 */}
      {trendData.length >= 2 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>월별 추세</h2>
          <p style={{ fontSize: 13, color: T.textMute, marginBottom: 16 }}>
            {trendData.map(d => d.name).join(' → ')} · 전사 합산
          </p>
          <div className="grid-2col" style={{ gap: 16 }}>
            {/* 보장분석 + 1차호전환 */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>보장분석 · 1차 호전환</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" stroke={T.textDim} fontSize={12} />
                  <YAxis stroke={T.textDim} fontSize={11} width={36} />
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 13 }}
                    formatter={v => fmtNum(v)}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="보장분석" fill={T.blue} radius={[3, 3, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="1차호전환" fill={T.accent} radius={[3, 3, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
                {[{ label: '보장분석', color: T.blue }, { label: '1차호전환', color: T.accent }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.textDim }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 신규 DB + 갱신 배분 */}
            <Card style={{ padding: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>신규 DB · 갱신 배분</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" stroke={T.textDim} fontSize={12} />
                  <YAxis stroke={T.textDim} fontSize={11} width={40} />
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 13 }}
                    formatter={v => fmtNum(v)}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="신규DB" fill={T.green} radius={[3, 3, 0, 0]} maxBarSize={48} />
                  <Bar dataKey="갱신배분" fill={T.yellow} radius={[3, 3, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10 }}>
                {[{ label: '신규DB', color: T.green }, { label: '갱신배분', color: T.yellow }].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: T.textDim }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Section Cards Grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>부서별 현황</h2>
        <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>클릭하면 상세 페이지로 이동합니다</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {sectionDefs.map(def => (
            <SectionCard
              key={def.key}
              data={s[def.key]}
              color={def.color}
              icon={def.icon}
              onClick={() => onNavigate(def.nav)}
            />
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2col" style={{ gap: 16, marginBottom: 24 }}>
        {/* Coverage pie */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>부서별 보장분석</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>전체 {fmtNum(totalCoverage)}건</p>
          {coverageChart.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={coverageChart}
                    cx="50%"
                    cy="95%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={100}
                    outerRadius={150}
                    paddingAngle={2}
                    cornerRadius={4}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive
                    animationDuration={500}
                    animationEasing="ease-out"
                  >
                    {coverageChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 15 }}
                    formatter={v => fmtNum(v)}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 16px', marginTop: 12, justifyContent: 'center' }}>
                {coverageChart.map(entry => {
                  const pct = totalCoverage > 0 ? (entry.value / totalCoverage * 100) : 0;
                  return (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{entry.name}</span>
                      <span style={{ fontSize: 13, color: entry.color, fontWeight: 700, fontFamily: MONO_STACK }}>{pct.toFixed(0)}%</span>
                      <span style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK }}>· {fmtNum(entry.value)}건</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMute, fontSize: 18 }}>데이터 없음</div>
          )}
        </Card>

        {/* TM agent bar chart */}
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>TM 호전환 TOP 10</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>1차 호전환 성공건 기준</p>
          {agentChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={agentChart} margin={{ top: 20, right: 8, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="name" stroke={T.textDim} fontSize={10} angle={-35} textAnchor="end" interval={0} />
                <YAxis stroke={T.textDim} fontSize={10} domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]} />
                <Tooltip
                  contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 15 }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="호전환" fill={T.accent} radius={[4, 4, 0, 0]} />
                <Bar dataKey="보장분석" fill={T.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: T.textMute, fontSize: 18 }}>TM 데이터 없음</div>
          )}
        </Card>
      </div>

      {/* DB 운용 현황 */}
      <Card style={{ padding: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>DB 운용 현황 요약</h3>
        <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>갱신 DB 분배 현황</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {sectionDefs.filter(d => s[d.key]?.assigned > 0).map(def => {
            const sec = s[def.key];
            const util = summary.renewalDb > 0 ? sec.assigned / summary.renewalDb : 0;
            return (
              <div key={def.key} style={{ padding: 14, borderRadius: RADIUS.sm, background: T.bg2, border: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: def.color }} />
                  <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{def.label}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO_STACK, color: def.color, marginBottom: 6 }}>
                  {fmtNum(sec.assigned)}
                </div>
                <ProgressBar value={util} color={def.color} height={4} />
                <div style={{ fontSize: 13, color: T.textMute, marginTop: 4, fontFamily: MONO_STACK }}>
                  전체의 {(util * 100).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
