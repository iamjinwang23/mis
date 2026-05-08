export function parseNum(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/[,\s%]/g, ''));
  return isNaN(n) ? 0 : n;
}
