import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, Target, Award, BarChart3, Calendar,
} from 'lucide-react';
import { T, MONO_STACK, RADIUS, FONT_STACK } from '../../theme.js';
import { fmtNum, fmtPct, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import KPICard from '../../components/KPICard.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';

const RETAIL_COLOR = T.purple;

const PRODUCTS = [
  { key: 'industrialNew',  label: '신산업재',   color: T.accent  },
  { key: 'industrialUsed', label: '중고산업재',  color: T.blue    },
  { key: 'opLease',        label: '운용리스',   color: T.green   },
  { key: 'ltRental',       label: '장기렌터카',  color: T.yellow  },
  { key: 'newInstall',     label: '신차할부',   color: RETAIL_COLOR },
];

export default function RetailDashboard({ report }) {
  const { reportDate, summary, companies, totals } = report.data;

  // 제품별 누계 차트 데이터
  const productChart = useMemo(() =>
    PRODUCTS.map(p => ({
      name: p.label,
      누계: totals[p.key]?.cumulative || 0,
      color: p.color,
    })),
    [totals]
  );

  // 금융사별 합계 TOP 차트 데이터
  const companyChart = useMemo(() =>
    [...companies]
      .sort((a, b) => b.total - a.total)
      .map(c => ({ name: c.name, 누계: c.total })),
    [companies]
  );

  const totalMonthCum = companies.reduce((s, c) => s + c.total, 0);

  // 월별 추세 차트 (이전 3개월 + 당월)
  const trendChart = useMemo(() => {
    const labels = summary.prevMonths?.length === 3
      ? summary.prevMonths
      : ['전전전월', '전전월', '전월'];
    const dateObj = reportDate instanceof Date ? reportDate : new Date(reportDate);
    const curLabel = isNaN(dateObj) ? '당월' : `${dateObj.getMonth() + 1}월`;
    return [
      { name: labels[0], 실적: summary.prev1 || 0, isCurrent: false },
      { name: labels[1], 실적: summary.prev2 || 0, isCurrent: false },
      { name: labels[2], 실적: summary.prev3 || 0, isCurrent: false },
      { name: curLabel,  실적: summary.monthCum || 0, isCurrent: true },
    ];
  }, [summary, reportDate]);

  return (
    <div className="page-wrap">
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>
          리테일 사업부 대시보드
        </h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {fmtDate(reportDate)} 기준
          {summary.businessDayInfo && ` · ${summary.businessDayInfo}`}
          {report.filename && ` · ${report.filename}`}
        </p>
      </div>

      {/* KPI 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <KPICard
          label="당일 신규 취급"
          value={`${fmtNum(summary.todayNew)}백만`}
          sub="단위: 백만원"
          color={RETAIL_COLOR}
          icon={TrendingUp}
        />
        <KPICard
          label="당월 누계"
          value={`${fmtNum(summary.monthCum)}백만`}
          sub={`목표 ${fmtNum(summary.monthlyTarget)}백만`}
          color={T.accent}
          icon={BarChart3}
        />
        <KPICard
          label="월 달성률"
          value={fmtPct(summary.monthAchieve)}
          sub={<ProgressBar value={summary.monthAchieve} color={summary.monthAchieve >= 1 ? T.green : RETAIL_COLOR} height={4} />}
          color={summary.monthAchieve >= 1 ? T.green : RETAIL_COLOR}
          icon={Target}
        />
        <KPICard
          label="분기 누계"
          value={`${fmtNum(summary.quarterCum)}백만`}
          sub={`목표 ${fmtNum(summary.quarterTarget)}백만`}
          color={T.blue}
          icon={Calendar}
        />
        <KPICard
          label="분기 달성률"
          value={fmtPct(summary.quarterAchieve)}
          sub={<ProgressBar value={summary.quarterAchieve} color={summary.quarterAchieve >= 1 ? T.green : T.blue} height={4} />}
          color={summary.quarterAchieve >= 1 ? T.green : T.blue}
          icon={Award}
        />
      </div>

      {/* 3열 카드 행 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {/* 제품별 당월 누계 */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>제품별 당월 누계</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 20 }}>전체 {fmtNum(totalMonthCum)}백만원</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="name" stroke={T.textDim} fontSize={11} />
              <YAxis stroke={T.textDim} fontSize={11} tickFormatter={v => `${v}`} />
              <Tooltip
                contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 15 }}
                formatter={v => [`${fmtNum(v)}백만`, '당월누계']}
                cursor={{ fill: `${RETAIL_COLOR}10` }}
              />
              <Bar dataKey="누계" radius={[6, 6, 0, 0]}>
                {productChart.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 월별 추세 (이전 3개월 + 당월) */}
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>월별 취급실적 추세</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>
            단위: 백만원
            {summary.monthlyTarget > 0 && (
              <span style={{ marginLeft: 8, color: T.yellow }}>
                — 목표 {fmtNum(summary.monthlyTarget)}백만
              </span>
            )}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trendChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
              <XAxis dataKey="name" stroke={T.textDim} fontSize={12} />
              <YAxis stroke={T.textDim} fontSize={11} tickFormatter={v => fmtNum(v)} width={42} />
              <Tooltip
                contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 13 }}
                formatter={v => [`${fmtNum(v)}백만`, '실적']}
                cursor={{ fill: `${RETAIL_COLOR}10` }}
              />
              {summary.monthlyTarget > 0 && (
                <ReferenceLine
                  y={summary.monthlyTarget}
                  stroke={T.yellow}
                  strokeDasharray="4 3"
                  label={{ value: '목표', fill: T.yellow, fontSize: 11, position: 'insideTopRight' }}
                />
              )}
              <Bar dataKey="실적" radius={[4, 4, 0, 0]} maxBarSize={52}>
                {trendChart.map((entry, i) => (
                  <Cell key={i} fill={entry.isCurrent ? RETAIL_COLOR : `${RETAIL_COLOR}55`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* 제품별 현황 */}
        <Card style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>제품별 현황</h3>
          <p style={{ fontSize: 15, color: T.textMute, marginBottom: 20 }}>당월 누계 비교</p>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {PRODUCTS.map(p => {
              const cum = totals[p.key]?.cumulative || 0;
              const maxCum = Math.max(...PRODUCTS.map(x => totals[x.key]?.cumulative || 0), 1);
              return (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 66, fontSize: 13, color: T.textDim, flexShrink: 0 }}>{p.label}</span>
                  <div style={{ flex: 1 }}>
                    <ProgressBar value={cum / maxCum} color={p.color} height={5} />
                  </div>
                  <span style={{ fontSize: 13, fontFamily: MONO_STACK, fontWeight: 700, color: cum > 0 ? p.color : T.textMute, minWidth: 60, textAlign: 'right' }}>
                    {cum > 0 ? `${fmtNum(cum)}백만` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 금융사별 누계 차트 */}
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: T.text }}>금융사별 당월 누계</h3>
        <p style={{ fontSize: 15, color: T.textMute, marginBottom: 16 }}>전 제품 합산 기준 · 전체 {companyChart.length}개사</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={companyChart} margin={{ top: 4, right: 24, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
            <XAxis dataKey="name" stroke={T.textDim} fontSize={11} angle={-25} textAnchor="end" interval={0} />
            <YAxis stroke={T.textDim} fontSize={11} tickFormatter={v => `${v}`} />
            <Tooltip
              contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: RADIUS.sm, fontSize: 15 }}
              formatter={v => [v > 0 ? `${fmtNum(v)}백만` : '—', '당월누계']}
              cursor={{ fill: `${RETAIL_COLOR}10` }}
            />
            <Bar dataKey="누계" radius={[6, 6, 0, 0]}>
              {companyChart.map((entry, i) => (
                <Cell key={i} fill={entry.누계 > 0 ? (i === 0 ? RETAIL_COLOR : `${RETAIL_COLOR}80`) : T.border} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 금융사별 상세 테이블 */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>금융사별 상세 실적</h3>
          <p style={{ fontSize: 15, color: T.textMute }}>제품별 당일 · 당월누계 · 단위: 백만원</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  금융사
                </th>
                {PRODUCTS.map(p => (
                  <th key={p.key} style={{ padding: '12px 10px', textAlign: 'right', color: p.color, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {p.label}
                  </th>
                ))}
                <th style={{ padding: '12px 16px', textAlign: 'right', color: RETAIL_COLOR, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  합계
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c, idx) => (
                <tr
                  key={c.name}
                  style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.cardHover; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px 16px', fontSize: 18, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', fontFamily: FONT_STACK }}>
                    {c.name}
                  </td>
                  {PRODUCTS.map(p => {
                    const cum = c.products[p.key].cumulative;
                    return (
                      <td key={p.key} style={{ padding: '12px 10px', fontSize: 18, fontFamily: MONO_STACK, textAlign: 'right', color: cum > 0 ? T.text : T.textMute }}>
                        {cum > 0 ? fmtNum(cum) : '—'}
                      </td>
                    );
                  })}
                  <td style={{ padding: '12px 16px', fontSize: 18, fontFamily: MONO_STACK, textAlign: 'right', fontWeight: 700, color: c.total > 0 ? RETAIL_COLOR : T.textMute }}>
                    {c.total > 0 ? fmtNum(c.total) : '—'}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${RETAIL_COLOR}40`, background: `${RETAIL_COLOR}0a` }}>
                <td style={{ padding: '12px 16px', fontSize: 18, fontWeight: 700, color: T.text, fontFamily: FONT_STACK }}>합계</td>
                {PRODUCTS.map(p => (
                  <td key={p.key} style={{ padding: '12px 10px', fontSize: 18, fontFamily: MONO_STACK, textAlign: 'right', fontWeight: 700, color: totals[p.key].cumulative > 0 ? T.text : T.textMute }}>
                    {totals[p.key].cumulative > 0 ? fmtNum(totals[p.key].cumulative) : '—'}
                  </td>
                ))}
                <td style={{ padding: '12px 16px', fontSize: 18, fontFamily: MONO_STACK, textAlign: 'right', fontWeight: 800, color: RETAIL_COLOR }}>
                  {fmtNum(totalMonthCum)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
