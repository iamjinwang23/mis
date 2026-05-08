import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import { Phone, Shield } from 'lucide-react';

export default function GfpDbPage({ report }) {
  const { reportDate, summary } = report.data;
  const total = summary?.total || {};
  const hw = total.hw || {};
  const cov = total.cov || {};

  const sections = [
    {
      label: '호전환', icon: Phone, color: T.accent,
      active: hw.active,
      targetDb: hw.targetDb,
      assignedDb: hw.assignedDb,
      assignRate: hw.assignRate,
      contracts: hw.contracts,
      amount: hw.amount,
      contractRate: hw.contractRate,
      desc: '기존 고객 DB를 활용해 전화 상담으로 전환하는 채널. 가동인원 대비 체결률이 핵심 지표입니다.',
    },
    {
      label: '보장분석', icon: Shield, color: T.blue,
      active: cov.active,
      targetDb: cov.targetDb,
      assignedDb: cov.assignedDb,
      assignRate: cov.assignRate,
      contracts: cov.contracts,
      amount: cov.amount,
      contractRate: cov.contractRate,
      desc: '방문 상담을 통해 고객 보장 분석 후 계약을 체결하는 채널. 배정률과 체결률이 핵심 지표입니다.',
    },
  ];

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>DB 운영현황</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{fmtDate(reportDate)} 기준 · GFP 전사 통합</p>
      </div>

      {/* 전사 합계 summary bar */}
      <div style={{
        padding: '14px 16px', borderRadius: RADIUS.sm,
        background: `${T.accent}0a`, border: `1px solid ${T.accent}18`,
        marginBottom: 24, fontSize: 18, color: T.textDim, lineHeight: 1.8,
      }}>
        <strong style={{ color: T.accent }}>전사 DB 합산</strong> ·
        &nbsp;호전환+보장분석 체결액 <strong style={{ color: T.text, fontFamily: MONO_STACK }}>{fmtMan((hw.amount || 0) + (cov.amount || 0))}</strong> ·
        &nbsp;체결건수 <strong style={{ color: T.text, fontFamily: MONO_STACK }}>{fmtNum((hw.contracts || 0) + (cov.contracts || 0))}</strong>건
      </div>

      {sections.map(sec => {
        const Icon = sec.icon;
        const utilRate = sec.targetDb > 0 ? (sec.assignedDb || 0) / sec.targetDb : 0;
        return (
          <div key={sec.label} style={{ marginBottom: 28 }}>
            {/* Markdown-style section header */}
            <div style={{
              padding: '14px 18px',
              borderLeft: `3px solid ${sec.color}`,
              background: `${sec.color}08`,
              borderRadius: `0 ${RADIUS.sm}px ${RADIUS.sm}px 0`,
              marginBottom: 14,
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
                { label: '가동 인원', value: fmtNum(sec.active), sub: '명', color: T.text },
                { label: '월 배분 목표', value: fmtNum(sec.targetDb), sub: '건', color: T.text },
                { label: '배정 DB', value: fmtNum(sec.assignedDb), sub: `배정률 ${fmtPct(sec.assignRate)}`, color: sec.color },
                { label: '체결 건수', value: fmtNum(sec.contracts), sub: '건', color: sec.color },
                { label: '실적 (월납P)', value: fmtMan(sec.amount), sub: '', color: sec.color },
                { label: '체결율', value: fmtPct(sec.contractRate), sub: '', color: sec.contractRate >= 0.1 ? T.green : T.yellow },
              ].map(item => (
                <div key={item.label} style={{ padding: '14px 16px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 13, color: T.textMute, marginBottom: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO_STACK, color: item.color }}>{item.value}</div>
                  {item.sub && <div style={{ fontSize: 13, color: T.textMute, marginTop: 2, fontFamily: MONO_STACK }}>{item.sub}</div>}
                </div>
              ))}
            </div>

            {/* DB utilization bar */}
            <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: RADIUS.sm, background: T.card, border: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: T.textDim, marginBottom: 6 }}>
                <span>DB 배정률 (배정 / 목표)</span>
                <span style={{ fontFamily: MONO_STACK, color: sec.color }}>{fmtPct(utilRate)}</span>
              </div>
              <ProgressBar value={utilRate} color={sec.color} height={6} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: T.textMute, marginTop: 4, fontFamily: MONO_STACK }}>
                <span>0</span>
                <span>배정 {fmtNum(sec.assignedDb)} / 목표 {fmtNum(sec.targetDb)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* 인사이트 */}
      {hw.contractRate > 0 && cov.contractRate > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: RADIUS.sm, background: `${T.accent}08`, border: `1px solid ${T.accent}18`, fontSize: 18, color: T.textDim, lineHeight: 1.7 }}>
          <strong style={{ color: T.accent }}>인사이트</strong> · 호전환 체결율 {fmtPct(hw.contractRate)} vs 보장분석 {fmtPct(cov.contractRate)}
          {hw.contractRate !== cov.contractRate && (
            <span> — <strong style={{ color: T.text }}>{hw.contractRate > cov.contractRate ? '호전환' : '보장분석'}</strong>이 약 {(Math.max(hw.contractRate, cov.contractRate) / Math.min(hw.contractRate, cov.contractRate)).toFixed(1)}배 효율적</span>
          )}
        </div>
      )}
    </div>
  );
}
