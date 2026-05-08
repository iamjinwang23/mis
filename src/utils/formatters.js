export const fmtNum = (n) => Number(n || 0).toLocaleString('ko-KR');

export const fmtPct = (n) => `${(Number(n || 0) * 100).toFixed(1)}%`;

export const fmtMan = (n) => {
  const v = Number(n || 0);
  if (v === 0) return '0';
  if (v >= 100000000) return `${(v / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}억`;
  if (v >= 10000) return `${Math.round(v / 10000).toLocaleString('ko-KR')}만`;
  return v.toLocaleString('ko-KR');
};

export const fmtDate = (d) => {
  if (!d) return '-';
  const date = d instanceof Date ? d : new Date(d);
  // Invalid Date 또는 epoch 0 (보고서 데이터로 나올 일 없는 값) 방어
  if (isNaN(date.getTime()) || date.getTime() === 0) return '-';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};
