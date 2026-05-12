import { useState } from 'react';
import { T, FONT_STACK, MONO_STACK, RADIUS, SHADOW } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { Phone, Shield } from 'lucide-react';

// ── DB 운영현황 ───────────────────────────────────────────────
function DbOps({ report }) {
  const { reportDate, summary } = report.data;
  const total = summary?.total || {};
  const hw = total.hw || {};
  const cov = total.cov || {};

  const sections = [
    {
      label: '호전환', icon: Phone, color: T.accent,
      active: hw.active, targetDb: hw.targetDb, assignedDb: hw.assignedDb,
      assignRate: hw.assignRate, contracts: hw.contracts, amount: hw.amount,
      contractRate: hw.contractRate,
      desc: '기존 고객 DB를 활용해 전화 상담으로 전환하는 채널. 가동인원 대비 체결률이 핵심 지표입니다.',
    },
    {
      label: '보장분석', icon: Shield, color: T.blue,
      active: cov.active, targetDb: cov.targetDb, assignedDb: cov.assignedDb,
      assignRate: cov.assignRate, contracts: cov.contracts, amount: cov.amount,
      contractRate: cov.contractRate,
      desc: '방문 상담을 통해 고객 보장 분석 후 계약을 체결하는 채널. 배정률과 체결률이 핵심 지표입니다.',
    },
  ];

  return (
    <>
      <p style={{ fontSize: 15, color: T.textDim, fontFamily: MONO_STACK, marginBottom: 20 }}>
        {fmtDate(reportDate)} 기준 · GFP 전사 통합
      </p>

      <div style={{
        padding: '14px 16px', borderRadius: RADIUS.sm,
        background: `${T.accent}0a`, border: `1px solid ${T.accent}18`,
        marginBottom: 24, fontSize: 15, color: T.textDim, lineHeight: 1.8,
      }}>
        <strong style={{ color: T.accent }}>전사 DB 합산</strong>
        &nbsp;·&nbsp;호전환+보장분석 체결액&nbsp;
        <strong style={{ color: T.text, fontFamily: MONO_STACK }}>{fmtMan((hw.amount || 0) + (cov.amount || 0))}</strong>
        &nbsp;·&nbsp;체결건수&nbsp;
        <strong style={{ color: T.text, fontFamily: MONO_STACK }}>{fmtNum((hw.contracts || 0) + (cov.contracts || 0))}</strong>건
      </div>

      {sections.map(sec => {
        const Icon = sec.icon;
        const utilRate = sec.targetDb > 0 ? (sec.assignedDb || 0) / sec.targetDb : 0;
        return (
          <div key={sec.label} style={{ marginBottom: 28 }}>
            <div style={{
              padding: '14px 18px', borderLeft: `3px solid ${sec.color}`,
              background: `${sec.color}08`, borderRadius: `0 ${RADIUS.sm}px ${RADIUS.sm}px 0`, marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: RADIUS.sm, background: `${sec.color}20`, color: sec.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={14} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: T.text, margin: 0 }}>{sec.label}</h2>
                  <p style={{ fontSize: 13, color: T.textMute, margin: 0 }}>{sec.desc}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
              {[
                { label: '가동 인원',    value: fmtNum(sec.active),       sub: '명',                           color: T.text },
                { label: '월 배분 목표', value: fmtNum(sec.targetDb),     sub: '건',                           color: T.text },
                { label: '배정 DB',      value: fmtNum(sec.assignedDb),   sub: `배정률 ${fmtPct(sec.assignRate)}`, color: sec.color },
                { label: '체결 건수',    value: fmtNum(sec.contracts),    sub: '건',                           color: sec.color },
                { label: '실적 (월납P)', value: fmtMan(sec.amount),       sub: '',                             color: sec.color },
                { label: '체결율',       value: fmtPct(sec.contractRate), sub: '',                             color: sec.contractRate >= 0.1 ? T.green : T.yellow },
              ].map(item => (
                <div key={item.label} style={{ padding: '14px 16px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, color: T.textMute, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: MONO_STACK, color: item.color }}>{item.value}</div>
                  {item.sub && <div style={{ fontSize: 13, color: T.textMute, marginTop: 2, fontFamily: MONO_STACK }}>{item.sub}</div>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: T.textDim, marginBottom: 6 }}>
                <span>DB 배정률 (배정 / 목표)</span>
                <span style={{ fontFamily: MONO_STACK, color: sec.color }}>{fmtPct(utilRate)}</span>
              </div>
              <ProgressBar value={utilRate} color={sec.color} height={6} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.textMute, marginTop: 4, fontFamily: MONO_STACK }}>
                <span>0</span>
                <span>배정 {fmtNum(sec.assignedDb)} / 목표 {fmtNum(sec.targetDb)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {hw.contractRate > 0 && cov.contractRate > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: RADIUS.sm, background: `${T.accent}08`, border: `1px solid ${T.accent}18`, fontSize: 15, color: T.textDim, lineHeight: 1.7 }}>
          <strong style={{ color: T.accent }}>인사이트</strong> · 호전환 체결율 {fmtPct(hw.contractRate)} vs 보장분석 {fmtPct(cov.contractRate)}
          {hw.contractRate !== cov.contractRate && (
            <span> — <strong style={{ color: T.text }}>{hw.contractRate > cov.contractRate ? '호전환' : '보장분석'}</strong>이 약 {(Math.max(hw.contractRate, cov.contractRate) / Math.min(hw.contractRate, cov.contractRate)).toFixed(1)}배 효율적</span>
          )}
        </div>
      )}
    </>
  );
}

// ── DB 필요수량 ───────────────────────────────────────────────
function NeedsBadge({ monthly, actual }) {
  if (!monthly) return <span style={{ color: T.textMute, fontFamily: MONO_STACK }}>—</span>;
  const remain = Math.max(0, monthly - (actual || 0));
  const rate = monthly > 0 ? Math.min((actual || 0) / monthly, 1) : 0;
  const color = rate >= 1 ? T.green : rate >= 0.6 ? T.yellow : T.red;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: MONO_STACK, fontSize: 15, fontWeight: 700, color }}>{fmtNum(actual || 0)}</span>
        <span style={{ color: T.textMute, fontSize: 12 }}>/ {fmtNum(monthly)}</span>
      </div>
      <ProgressBar value={rate} color={color} height={4} />
      {remain > 0 && <div style={{ fontSize: 11, color: T.textMute, marginTop: 3, fontFamily: MONO_STACK }}>잔여 {fmtNum(remain)}</div>}
    </div>
  );
}

function SummaryCard({ label, min, max, color }) {
  return (
    <div style={{ padding: '16px 20px', borderRadius: RADIUS.md, background: T.card, border: `1px solid ${T.border}`, boxShadow: SHADOW.card }}>
      <div style={{ fontSize: 12, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 800, fontFamily: MONO_STACK, color }}>{fmtNum(min)}</span>
        {max > 0 && max !== min && <span style={{ fontSize: 14, color: T.textMute, fontFamily: MONO_STACK }}>~ {fmtNum(max)}</span>}
      </div>
      <div style={{ fontSize: 12, color: T.textMute, marginTop: 4 }}>월 최소수량</div>
    </div>
  );
}

function DbNeeds({ report }) {
  const dbNeeds = report?.data?.dbNeeds || [];
  const [activeIdx, setActiveIdx] = useState(0);

  if (!dbNeeds.length) {
    return (
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: T.textDim, marginBottom: 8 }}>이 보고서에 필요수량 시트가 없습니다.</div>
        <div style={{ fontSize: 13, color: T.textMute }}>"○월 필요수량" 시트가 포함된 GFP 보고서를 업로드해주세요.</div>
      </Card>
    );
  }

  const data = dbNeeds[activeIdx];
  const allBranches = [...(data.direct || []), ...(data.indirect || [])];

  return (
    <>
      {dbNeeds.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {dbNeeds.map((d, i) => (
            <button type="button" key={i} onClick={() => setActiveIdx(i)}
              style={{
                padding: '6px 16px', borderRadius: RADIUS.xs,
                background: activeIdx === i ? T.accent : T.card,
                border: `1px solid ${activeIdx === i ? T.accent : T.border}`,
                color: activeIdx === i ? T.card : T.textDim,
                fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_STACK,
              }}
            >
              {d.monthLabel}
            </button>
          ))}
        </div>
      )}

      <p style={{ fontSize: 15, color: T.textDim, fontFamily: MONO_STACK, marginBottom: 20 }}>
        {report?.filename} · 영업일 {data.workingDays}일 기준{data.remainDays > 0 ? ` · 잔여 ${data.remainDays}일` : ''}
      </p>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: T.textDim, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>핵심 요약</h3>
        <div className="grid-3col" style={{ gap: 12 }}>
          <SummaryCard label="보장분석 필요수량" min={data.summary.cov.min} max={data.summary.cov.max} color={T.blue} />
          <SummaryCard label="호전환 필요수량" min={data.summary.hw.min} max={0} color={T.accent} />
          <div style={{ padding: '16px 20px', borderRadius: RADIUS.md, background: T.card, border: `1px solid ${T.border}`, boxShadow: SHADOW.card }}>
            <div style={{ fontSize: 12, color: T.textDim, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>진행 현황</div>
            <div style={{ fontSize: 13, color: T.textMute, lineHeight: 1.8 }}>
              <div>영업일: <span style={{ color: T.text, fontWeight: 700, fontFamily: MONO_STACK }}>{data.workingDays}일</span></div>
              {data.elapsedDays > 0 && <div>경과: <span style={{ color: T.text, fontWeight: 700, fontFamily: MONO_STACK }}>{data.elapsedDays}일</span></div>}
              {data.remainDays > 0 && <div>잔여: <span style={{ color: T.yellow, fontWeight: 700, fontFamily: MONO_STACK }}>{data.remainDays}일</span></div>}
            </div>
          </div>
        </div>
      </div>

      {data.direct.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>
            직영 조직
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: `${T.accent}18`, color: T.accent, fontSize: 12, fontWeight: 700 }}>{data.direct.length}개 지점</span>
          </h3>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                    {['지점명', '관리자', '가동인원', '보장분석 월최소', '호전환 월최소'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === '지점명' || h === '관리자' ? 'left' : 'center', color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
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
                      <td style={{ padding: '10px 14px', fontSize: 15, color: T.textDim }}>{b.manager || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: MONO_STACK, fontSize: 15, color: T.text }}>{b.cov.active || '—'}</td>
                      <td style={{ padding: '10px 14px', minWidth: 130 }}><NeedsBadge monthly={b.cov.monthly} actual={b.actual?.covContracts} /></td>
                      <td style={{ padding: '10px 14px', minWidth: 130 }}><NeedsBadge monthly={b.hw.monthly} actual={b.actual?.hwContracts} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {data.indirect.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>
            지사 조직
            <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: `${T.green}18`, color: T.green, fontSize: 12, fontWeight: 700 }}>{data.indirect.length}개 지점</span>
          </h3>
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                    {['지점명', '관리자', '가동인원', '보장분석 월최소'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: h === '지점명' || h === '관리자' ? 'left' : 'center', color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
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
                      <td style={{ padding: '10px 14px', fontSize: 15, color: T.textDim }}>{b.manager || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontFamily: MONO_STACK, fontSize: 15, color: T.text }}>{b.cov.active || '—'}</td>
                      <td style={{ padding: '10px 14px', minWidth: 130 }}><NeedsBadge monthly={b.cov.monthly} actual={b.actual?.covContracts} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {allBranches.some(b => b.actual) && (
        <Card style={{ padding: 18, background: `${T.blue}08`, border: `1px solid ${T.blue}30` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.blue, marginBottom: 8 }}>인사이트</div>
          <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.7 }}>
            {(() => {
              const behind = allBranches.filter(b => b.actual && b.cov.monthly > 0 && (b.actual.covContracts / b.cov.monthly) < 0.5);
              const onTrack = allBranches.filter(b => b.actual && b.cov.monthly > 0 && (b.actual.covContracts / b.cov.monthly) >= 1);
              return (
                <>
                  {onTrack.length > 0 && <div>목표 달성 지점: <strong style={{ color: T.green }}>{onTrack.map(b => b.name).join(', ')}</strong></div>}
                  {behind.length > 0 && <div>50% 미달 지점: <strong style={{ color: T.red }}>{behind.map(b => b.name).join(', ')}</strong></div>}
                </>
              );
            })()}
          </div>
        </Card>
      )}
    </>
  );
}

// ── 탭 컨테이너 ───────────────────────────────────────────────
const TABS = [
  { key: 'ops',   label: 'DB 운영현황' },
  { key: 'needs', label: 'DB 필요수량' },
];

export default function GfpDb({ report }) {
  const [tab, setTab] = useState('ops');

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 14 }}>DB 현황</h1>
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(t => (
            <button key={t.key} type="button"
              onClick={() => setTab(t.key)}
              style={{
                padding: '9px 22px',
                border: 'none', background: 'transparent',
                color: tab === t.key ? T.accent : T.textDim,
                fontWeight: tab === t.key ? 700 : 400,
                fontSize: 15, cursor: 'pointer',
                borderBottom: tab === t.key ? `2px solid ${T.accent}` : '2px solid transparent',
                marginBottom: -1, fontFamily: FONT_STACK, transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'ops' ? <DbOps report={report} /> : <DbNeeds report={report} />}
    </div>
  );
}
