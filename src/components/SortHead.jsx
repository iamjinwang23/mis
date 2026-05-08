import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { T } from '../theme.js';

export default function SortHead({ k, sortKey, sortDir, onSort, children, align = 'right', padding = '12px 14px' }) {
  const active = sortKey === k;
  return (
    <th
      onClick={() => onSort(k)}
      style={{
        padding, textAlign: align, cursor: 'pointer',
        color: active ? T.accent : T.textDim,
        fontSize: 13, fontWeight: 600, letterSpacing: '0.05em',
        textTransform: 'uppercase', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        {children}
        {active
          ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
          : <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />}
      </span>
    </th>
  );
}
