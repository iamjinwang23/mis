import { T, MONO_STACK, RADIUS } from '../theme.js';
import Card from './Card.jsx';

export default function KPICard({ label, value, sub, color = T.accent, icon: Icon, delta }) {
  return (
    <Card style={{ padding: 24, minHeight: 140 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ color: T.textDim, fontSize: 15, letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 500 }}>
          {label}
        </span>
        {Icon && (
          <div style={{ padding: 6, borderRadius: RADIUS.sm, background: `${color}1a`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} strokeWidth={2} />
          </div>
        )}
      </div>
      <div style={{ color: T.text, fontSize: 30, fontWeight: 700, fontFamily: MONO_STACK, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: T.textMute, fontSize: 15, marginTop: 6, fontFamily: MONO_STACK }}>
          {sub}
        </div>
      )}
      {delta != null && !isNaN(delta) && delta !== 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 7px', borderRadius: RADIUS.pill,
            background: delta >= 0 ? T.greenSoft : T.redSoft,
            color: delta >= 0 ? T.green : T.red,
            fontSize: 13, fontWeight: 700, fontFamily: MONO_STACK,
          }}>
            {delta >= 0 ? '+' : '−'}{typeof delta === 'number' ? (Number.isInteger(delta) ? Math.abs(delta).toLocaleString() : Math.abs(delta).toFixed(1)) : delta}
          </div>
          <span style={{ fontSize: 12, color: T.textMute }}>전기 대비</span>
        </div>
      )}
    </Card>
  );
}
