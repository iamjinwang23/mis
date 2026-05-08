import { T, SHADOW, RADIUS } from '../theme.js';

export default function Card({ children, className = '', style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: RADIUS.md,
        boxShadow: SHADOW.card,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
