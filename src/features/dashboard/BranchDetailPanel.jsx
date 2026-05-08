import { useEffect } from 'react';
import { X, Phone, Shield } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan } from '../../utils/formatters.js';
import ProgressBar from '../../components/ProgressBar.jsx';

// Design Ref: §5.1 BranchDetailPanel — 오른쪽 슬라이드인, ESC/X로 닫기
function DBSection({ title, icon: Icon, color, data }) {
  const rows = [
    { label: '가동 인원', value: `${fmtNum(data.active)}명` },
    { label: '월배분목표', value: fmtNum(data.targetDb) },
    { label: '배정 디비', value: fmtNum(data.assignedDb) },
    { label: '배정률', value: fmtPct(data.assignRate) },
    { label: '체결건수', value: fmtNum(data.contracts), color },
    { label: '실적', value: fmtMan(data.amount), color },
  ];

  return (
    <div style={{ padding: 16, borderRadius: RADIUS.sm, background: T.bg2, border: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: RADIUS.sm, background: `${color}1f`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{title}</span>
        </div>
        <span style={{ padding: '3px 8px', borderRadius: RADIUS.pill, background: `${color}1a`, color, fontSize: 13, fontWeight: 700, fontFamily: MONO_STACK }}>
          체결율 {fmtPct(data.contractRate)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {rows.map(({ label, value, color: vc }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, color: T.textDim }}>{label}</span>
            <span style={{ fontFamily: MONO_STACK, fontSize: 18, fontWeight: 600, color: vc || T.text }}>{value}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: T.textDim }}>체결 전환율</span>
          <span style={{ fontFamily: MONO_STACK, color }}>{fmtPct(data.contractRate)}</span>
        </div>
        <ProgressBar value={data.contractRate} color={color} height={4} />
      </div>
    </div>
  );
}

export default function BranchDetailPanel({ branch, onClose }) {
  // Plan SC: ESC 키 닫기 — 키보드 접근성 지원
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* 반투명 오버레이 */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }}
      />

      {/* 사이드 패널 */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 360, zIndex: 101,
        background: T.card,
        borderLeft: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column',
        fontFamily: FONT_STACK,
        overflowY: 'auto',
        animation: 'slideIn 0.2s ease',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* 패널 헤더 */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, background: T.card, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 4, wordBreak: 'break-all' }}>
                {branch.name}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: branch.isDirect ? T.accentSoft : T.blueSoft, color: branch.isDirect ? T.accent : T.blue, fontSize: 13, fontWeight: 700 }}>
                  {branch.isDirect ? '직영' : '지사'}
                </span>
                {branch.manager && (
                  <span style={{ fontSize: 15, color: T.textDim }}>관리자: {branch.manager}</span>
                )}
              </div>
            </div>
            <button type="button" onClick={onClose} style={{ padding: 6, borderRadius: RADIUS.xs, background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* 영업 지표 요약 */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 15, color: T.textMute, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 12 }}>영업 실적</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: '영업건수', value: fmtNum(branch.count) },
              { label: '당월 월납P', value: fmtMan(branch.monthly) },
              { label: '목표', value: fmtMan(branch.target), dim: true },
              { label: '재적인원', value: `${fmtNum(branch.headcount)}명`, dim: true },
            ].map(({ label, value, dim }) => (
              <div key={label}>
                <div style={{ fontSize: 13, color: T.textDim, marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: MONO_STACK, color: dim ? T.textDim : T.text }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, marginBottom: 5 }}>
              <span style={{ color: T.textDim }}>달성율</span>
              <span style={{ fontFamily: MONO_STACK, fontWeight: 700, color: branch.achieve >= 1 ? T.green : branch.achieve >= 0.5 ? T.accent : T.yellow }}>
                {fmtPct(branch.achieve)}
              </span>
            </div>
            <ProgressBar
              value={branch.achieve}
              color={branch.achieve >= 1 ? T.green : branch.achieve >= 0.5 ? T.accent : T.yellow}
              height={6}
            />
          </div>
        </div>

        {/* DB 운영 섹션 */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 15, color: T.textMute, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>DB 운영</div>
          <DBSection title="호전환" icon={Phone} color={T.accent} data={branch.hw} />
          <DBSection title="보장분석" icon={Shield} color={T.blue} data={branch.cov} />
        </div>

        {branch.hire > 0 || branch.fire > 0 ? (
          <div style={{ padding: '0 20px 20px' }}>
            <div style={{ padding: 12, borderRadius: RADIUS.sm, background: T.bg2, border: `1px solid ${T.border}`, fontSize: 15 }}>
              <span style={{ color: T.textDim }}>당월 인력 변동 </span>
              <span style={{ color: T.green, fontFamily: MONO_STACK, fontWeight: 700 }}>+{fmtNum(branch.hire)}</span>
              <span style={{ color: T.textDim }}> 위촉 / </span>
              <span style={{ color: T.red, fontFamily: MONO_STACK, fontWeight: 700 }}>-{fmtNum(branch.fire)}</span>
              <span style={{ color: T.textDim }}> 해촉</span>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
