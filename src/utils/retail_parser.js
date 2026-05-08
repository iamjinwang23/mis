import * as XLSX from 'xlsx';
import { parseNum } from './numbers.js';

// 0-indexed column positions
const PRODUCTS = [
  { key: 'industrialNew',  label: '신산업재',   dayCol: 2,  cumCol: 3  },
  { key: 'industrialUsed', label: '중고산업재',  dayCol: 4,  cumCol: 5  },
  { key: 'opLease',        label: '운용리스',   dayCol: 6,  cumCol: 7  },
  { key: 'ltRental',       label: '장기렌터카',  dayCol: 8,  cumCol: 9  },
  { key: 'newInstall',     label: '신차할부',   dayCol: 10, cumCol: 11 },
];

export function parseRetailReport(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const ws = wb.Sheets['일일실적현황'];
  if (!ws) throw new Error('일일실적현황 시트를 찾을 수 없습니다.');

  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // row index 2 (행3) — 보고 기준일
  const dateRaw = aoa[2]?.[0];
  const reportDate = dateRaw instanceof Date ? dateRaw : new Date(dateRaw);

  // row index 1 (행2) — 영업일 정보
  const businessDayInfo = String(aoa[1]?.[4] || '').trim();

  // row index 5 (행6) — 합계 KPI
  const sumRow = aoa[5] || [];
  const monthlyTarget  = parseNum(sumRow[2]);   // C6
  const prev1          = parseNum(sumRow[4]);   // E6 1월
  const prev2          = parseNum(sumRow[5]);   // F6 2월
  const prev3          = parseNum(sumRow[6]);   // G6 3월
  const quarterTarget  = parseNum(sumRow[7]);   // H6
  const quarterCum     = parseNum(sumRow[8]);   // I6
  const todayNew       = parseNum(sumRow[10]);  // K6
  const monthCum       = parseNum(sumRow[11]);  // L6
  const monthAchieve   = monthlyTarget > 0 ? monthCum / monthlyTarget : 0;
  const quarterAchieve = quarterTarget > 0 ? quarterCum / quarterTarget : 0;

  const summary = {
    monthlyTarget, monthCum, monthAchieve,
    quarterTarget, quarterCum, quarterAchieve,
    todayNew,
    prev1, prev2, prev3,
    businessDayInfo,
  };

  // rows index 8-18 (행9-19) — 금융사별
  const companies = [];
  for (let i = 8; i <= 18; i++) {
    const row = aoa[i] || [];
    const name = row[0];
    if (!name || typeof name !== 'string') continue;
    const nameStr = name.trim();
    if (!nameStr || nameStr === '합계' || nameStr === '금융사') continue;

    const products = {};
    for (const p of PRODUCTS) {
      products[p.key] = { label: p.label, today: parseNum(row[p.dayCol]), cumulative: parseNum(row[p.cumCol]) };
    }
    companies.push({ name: nameStr, products, total: parseNum(row[12]) });
  }

  // row index 19 (행20) — 제품별 합계
  const totRow = aoa[19] || [];
  const totals = {};
  for (const p of PRODUCTS) {
    totals[p.key] = { label: p.label, today: parseNum(totRow[p.dayCol]), cumulative: parseNum(totRow[p.cumCol]) };
  }

  // 실행내역 시트
  const executions = [];
  const ws2 = wb.Sheets['실행내역'];
  if (ws2) {
    const aoa2 = XLSX.utils.sheet_to_json(ws2, { header: 1, defval: null });
    for (const row of aoa2) {
      const v = row[0];
      if (v && typeof v === 'string' && v.trim()) executions.push(v.trim());
    }
  }

  return { reportDate, summary, companies, totals, executions };
}
