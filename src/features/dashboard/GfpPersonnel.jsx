import { T, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react';

export default function GfpPersonnel({ report }) {
  const { reportDate, branches, summary } = report.data;
  const total = summary?.total || {};
  const direct = summary?.direct || {};
  const branch = summary?.branch || {};

  const netChange = (total.hire || 0) - (total.fire || 0);

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>인원 현황</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{fmtDate(reportDate)} 기준 · GFP 전사 영업직</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: '전사 재적인원', value: fmtNum(total.headcount), icon: Users, color: T.accent, sub: `직영 ${fmtNum(direct.headcount)} · 지사 ${fmtNum(branch.headcount)}` },
          { label: '당월 위촉', value: fmtNum(total.hire), icon: UserPlus, color: T.green, sub: '신규 입사' },
          { label: '당월 해촉', value: fmtNum(total.fire), icon: UserMinus, color: T.red, sub: '퇴사' },
          { label: '순증감', value: `${netChange >= 0 ? '+' : ''}${fmtNum(netChange)}`, icon: TrendingUp, color: netChange >= 0 ? T.green : T.red, sub: '위촉 - 해촉' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={{ padding: '16px 18px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: RADIUS.sm, background: `${item.color}18`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} />
                </div>
                <span style={{ fontSize: 13, color: T.textMute }}>{item.label}</span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, fontFamily: MONO_STACK, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>{item.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Markdown: 직영 vs 지사 */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ padding: '14px 18px', borderLeft: `3px solid ${T.accent}`, background: `${T.accent}08`, borderRadius: `0 ${RADIUS.sm}px ${RADIUS.sm}px 0`, marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>채널별 인원 현황</h2>
          <p style={{ fontSize: 13, color: T.textMute, margin: 0 }}>직영·지사 기준 위촉·해촉 및 재적인원</p>
        </div>
        <div className="grid-2col" style={{ gap: 16 }}>
          {[
            { label: '직영', data: direct, color: T.accent },
            { label: '지사', data: branch, color: T.green },
          ].map(({ label, data, color }) => (
            <div key={label} style={{ padding: 18, borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: T.text }}>{label}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: '재적', value: fmtNum(data.headcount), color: T.text },
                  { label: '위촉', value: fmtNum(data.hire), color: T.green },
                  { label: '해촉', value: fmtNum(data.fire), color: T.red },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 13, color: T.textMute, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO_STACK, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-branch table */}
      <div style={{ marginBottom: 12, padding: '14px 18px', borderLeft: `3px solid ${T.green}`, background: `${T.green}08`, borderRadius: `0 ${RADIUS.sm}px ${RADIUS.sm}px 0` }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>지점별 인원 상세</h2>
        <p style={{ fontSize: 13, color: T.textMute, margin: 0 }}>위촉·해촉 발생 지점 상위 표시</p>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                {['구분', '지점명', '관리자', '재적인원', '당월위촉', '당월해촉', '순증감'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: i > 2 ? 'right' : 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...branches]
                .sort((a, b) => (b.hire + b.fire) - (a.hire + a.fire))
                .filter(b => b.headcount > 0 || b.hire > 0 || b.fire > 0)
                .map((b, i) => {
                  const net = (b.hire || 0) - (b.fire || 0);
                  return (
                    <tr key={`${b.name}-${i}`} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>
                        <span style={{ padding: '2px 6px', borderRadius: 3, background: b.isDirect ? `${T.accent}18` : `${T.green}18`, color: b.isDirect ? T.accent : T.green, fontWeight: 700 }}>
                          {b.isDirect ? '직영' : '지사'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 18, fontWeight: 500, color: T.text }}>{b.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 18, color: T.textDim }}>{b.manager || '-'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 18 }}>{fmtNum(b.headcount)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 18, color: b.hire > 0 ? T.green : T.textMute }}>
                        {b.hire > 0 ? fmtNum(b.hire) : '-'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 18, color: b.fire > 0 ? T.red : T.textMute }}>
                        {b.fire > 0 ? fmtNum(b.fire) : '-'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 18, color: net > 0 ? T.green : net < 0 ? T.red : T.textMute }}>
                        {net !== 0 ? `${net > 0 ? '+' : ''}${fmtNum(net)}` : '-'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
