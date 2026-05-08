import { T } from '../theme.js';

export default function ProgressBar({ value, color = T.accent, height = 6 }) {
  const v = Math.min(Math.max(value * 100, 0), 200);
  return (
    <div style={{ width: '100%', height, borderRadius: height / 2, background: T.border, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: `${Math.min(v, 100)}%`, height: '100%',
        background: v > 100 ? T.green : color,
        borderRadius: height / 2,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}
