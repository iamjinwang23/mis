import { useState } from 'react';
import { T, FONT_STACK, MONO_STACK, RADIUS, SHADOW } from '../../theme.js';
import { fmtNum } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';

function NeedsBadge({ monthly, actual }) {
  if (!monthly) return <span style={{ color: T.textMute, fontFamily: MONO_STACK }}>—</span>;
  const remain = Math.max(0, monthly - (actual || 0));
  const rate = monthly > 0 ? Math.min((actual || 0) / monthly, 1) : 0;
  const color = rate >= 1 ? T.green : rate >= 0.6 ? T.yellow : T.red;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, fontWeight: 700, color }}>
          {fmtNum(actual || 0)}
        </span>
        <span style={{ color: T.textMute, fontSize: 13 }}>/ {fmtNum(monthly)}</span>
      </div>
      <ProgressBar value={rate} color={color} height={4} />
      {remain > 0 && (
        <div style={{ fontSize: 12, color: T.textMute, marginTop: 3, fontFamily: MONO_STACK }}>
          잔여 {fmtNum(remain)}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, min, max, color }) {
  return (
    <div style={{
      padding: '16px 20px', borderRadius: RADIUS.md,
      background: T.card, border: `1px solid ${T.border}`,
      boxShadow: SHADOW.card,
    }}>
      <div style={{ fontSize: 13, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, fontFamily: MONO_STACK, color }}>
          {fmtNum(min)}
        </span>
        {max > 0 && max !== min && (
          <span style={{ fontSize: 15, color: T.textMute, fontFamily: MONO_STACK }}>~ {fmtNum(max)}</span>
        )}
      </div>
      <div style={{ fontSize: 13, color: T.textMute, marginTop: 4 }}>월 최소수량</div>
    </div>
  );
}

export default function GfpDbNeeds({ report }) {
  const dbNeeds = report?.data?.dbNeeds || [];
  const [activeIdx, setActiveIdx] = useState(0);

  if (!dbNeeds.length) {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>DB 필요수량</h1>
          <p style={{ fontSize: 18, color: T.textDim }}>파일: {report?.filename}</p>
        </div>
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: T.textDim, marginBottom: 8 }}>
            이 보고서에 필요수량 시트가 없습니다.
          </div>
          <div style={{ fontSize: 15, color: T.textMute }}>
            "○월 필요수량" 시트가 포함된 GFP 보고서를 업로드해주세요.
          </div>
        </Card>
      </div>
    );
  }

  const data = dbNeeds[activeIdx];
  const allBranches = [...(data.direct || []), ...(data.indirect || [])];

  return (
    <div className="page-wrap">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>DB 필요수량</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {report?.filename} · 영업일 {data.workingDays}일 기준
          {data.remainDays > 0 && ` · 잔여 ${data.remainDays}일`}
        </p>
      </div>

      {/* 월 탭 */}
      {dbNeeds.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {dbNeeds.map((d, i) => (
            <button type="button" key={i} onClick={() => setActiveIdx(i)}
              style={{
                padding: '7px 18px', borderRadius: RADIUS.xs,
                background: activeIdx === i ? T.accent : T.card,
                border: `1px solid ${activeIdx === i ? T.accent : T.border}`,
                color: activeIdx === i ? '#fff' : T.textDim,
                fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_STACK,
              }}
            >
              {d.monthLabel}
            </button>
          ))}
        </div>
      )}

      {/* 핵심 요약 */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: T.textDim, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          핵심 요약
        </h2>
        <div className="grid-3col" style={{ gap: 12, marginBottom: 0 }}>
          <SummaryCard label="보장분석 필요수량" min={data.summary.cov.min} max={data.summary.cov.max} color={T.blue} />
          <SummaryCard label="호전환 필요수량" min={data.summary.hw.min} max={0} color={T.accent} />
          <div style={{
            padding: '16px 20px', borderRadius: RADIUS.md,
            background: T.card, border: `1px solid ${T.border}`,
            boxShadow: SHADOW.card,
          }}>
            <div style={{ fontSize: 13, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
              진행 현황
            </div>
            <div style={{ fontSize: 13, color: T.textMute, lineHeight: 1.8 }}>
              <div>영업일: <span style={{ color: T.text, fontWeight: 700, fontFamily: MONO_STACK }}>{data.workingDays}일</span></div>
              {data.elapsedDays > 0 && <div>경과: <span style={{ color: T.text, fontWeight: 700, fontFamily: MONO_STACK }}>{data.elapsedDays}일</span></div>}
              {data.remainDays > 0 && <div>잔여: <span style={{ color: T.yellow, fontWeight: 700, fontFamily: MONO_STACK }}>{data.remainDays}일</span></div>}
            </div>
          </div>
        </div>
      </div>

      {/* 직영 조직 */}
      {data.direct.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>
            직영 조직
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: `${T.accent}18`, color: T.accent, fontSize: 13, fontWeight: 700 }}>
              {data.direct.length}개 지점
            </span>
          </h2>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                    {['지점명', '관리자', '가동인원', '보장분석 월최소', '호전환 월최소'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === '지점명' || h === '관리자' ? 'left' : 'center', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.direct.map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', fontSize: 15, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{b.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 14, color: T.textDim }}>{b.manager || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: MONO_STACK, fontSize: 15, color: T.text }}>{b.cov.active || '—'}</td>
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <NeedsBadge monthly={b.cov.monthly} actual={b.actual?.covContracts} />
                      </td>
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <NeedsBadge monthly={b.hw.monthly} actual={b.actual?.hwContracts} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 지사 조직 */}
      {data.indirect.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>
            지사 조직
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: `${T.green}18`, color: T.green, fontSize: 13, fontWeight: 700 }}>
              {data.indirect.length}개 지점
            </span>
          </h2>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                    {['지점명', '관리자', '가동인원', '보장분석 월최소'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === '지점명' || h === '관리자' ? 'left' : 'center', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.indirect.map((b, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', fontSize: 15, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{b.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 14, color: T.textDim }}>{b.manager || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: MONO_STACK, fontSize: 15, color: T.text }}>{b.cov.active || '—'}</td>
                      <td style={{ padding: '10px 14px', minWidth: 140 }}>
                        <NeedsBadge monthly={b.cov.monthly} actual={b.actual?.covContracts} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* 인사이트 */}
      {allBranches.some(b => b.actual) && (
        <Card style={{ padding: 18, background: `${T.blue}08`, border: `1px solid ${T.blue}30` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.blue, marginBottom: 8 }}>💡 인사이트</div>
          <div style={{ fontSize: 14, color: T.textDim, lineHeight: 1.7 }}>
            {(() => {
              const behind = allBranches.filter(b => b.actual && b.cov.monthly > 0 && (b.actual.covContracts / b.cov.monthly) < 0.5);
              const onTrack = allBranches.filter(b => b.actual && b.cov.monthly > 0 && (b.actual.covContracts / b.cov.monthly) >= 1);
              return (
                <>
                  {onTrack.length > 0 && <div>✅ 목표 달성 지점: <strong style={{ color: T.green }}>{onTrack.map(b => b.name).join(', ')}</strong></div>}
                  {behind.length > 0 && <div>⚠️ 50% 미달 지점: <strong style={{ color: T.red }}>{behind.map(b => b.name).join(', ')}</strong></div>}
                </>
              );
            })()}
          </div>
        </Card>
      )}
    </div>
  );
}
