import * as XLSX from 'xlsx';
import { parseNum } from './numbers.js';

function isName(v) {
  if (!v || typeof v !== 'string') return false;
  const s = v.trim();
  return s.length > 1 && s !== '-';
}

const SECTION_MAP = {
  'TM호전환': 'tmHoJeon',
  '계약실': 'contract',
  '딜러신규실': 'dealerNew',
  '딜러갱신실': 'dealerRenewal',
  '퍼미션실': 'permission',
};

const SECTION_LABELS = {
  tmHoJeon: 'TM 호전환',
  contract: '계약실',
  dealerNew: '딜러 신규실',
  dealerRenewal: '딜러 갱신실',
  permission: '퍼미션실',
};

// Column indices (0-based, from header row of YYMM sheets)
const C = {
  major: 0,
  minor: 1,
  manager: 2,
  sales: 3,
  support: 4,
  status: 5,
  renewal: 6,
  newDb: 7,
  assigned: 8,
  driver: 9,
  coverage: 10,
  success1: 11,
  carContract: 12,
  tmNewSuccess: 17,
  successRate: 18,
  tmRenewalSuccess: 19,
};

function parseSectionRow(row) {
  return {
    manager: row[C.manager] || null,
    sales: parseNum(row[C.sales]),
    support: parseNum(row[C.support]),
    renewalDb: parseNum(row[C.renewal]),
    newDb: parseNum(row[C.newDb]),
    assigned: parseNum(row[C.assigned]),
    driverConnect: parseNum(row[C.driver]),
    coverage: parseNum(row[C.coverage]),
    success1st: parseNum(row[C.success1]),
    carContract: parseNum(row[C.carContract]),
    tmNewSuccess: parseNum(row[C.tmNewSuccess]),
    successRate: parseNum(row[C.successRate]),
    tmRenewalSuccess: parseNum(row[C.tmRenewalSuccess]),
  };
}

// 단일 YYMM 시트에서 summary + sections + agents를 파싱한다.
function parseMonthSheet(wb, sheetName, includeAgents = false) {
  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const sumRow = aoa[2] || [];
  const summary = parseSectionRow(sumRow);

  const sections = {};
  let currentKey = null;
  let currentData = null;
  let currentAgents = [];
  let lastSubManager = null;

  const flush = () => {
    if (currentKey && currentData) {
      sections[currentKey] = {
        ...currentData,
        label: SECTION_LABELS[currentKey],
        agents: includeAgents ? currentAgents : [],
      };
    }
  };

  for (let i = 3; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const minorRaw = row[C.minor];
    const minorStr = minorRaw && typeof minorRaw === 'string' ? minorRaw.trim() : '';

    if (SECTION_MAP[minorStr]) {
      flush();
      currentKey = SECTION_MAP[minorStr];
      currentData = parseSectionRow(row);
      currentData.manager = row[C.manager] || null;
      currentAgents = [];
      lastSubManager = null;
      continue;
    }

    if (!currentKey || !includeAgents) continue;

    const agentName = row[C.sales];
    const status = row[C.status];
    const VALID_STATUSES = ['재직', '주말', '퇴사', '퇴사예정', '1차디비', '신풍'];

    if (isName(agentName) && status && VALID_STATUSES.includes(String(status).trim())) {
      const col2 = row[C.manager];
      if (isName(col2)) lastSubManager = String(col2).trim();

      currentAgents.push({
        name: String(agentName).trim(),
        subManager: lastSubManager,
        status: String(status).trim(),
        renewalDb: parseNum(row[C.renewal]),
        newDb: parseNum(row[C.newDb]),
        assigned: parseNum(row[C.assigned]),
        driverConnect: parseNum(row[C.driver]),
        coverage: parseNum(row[C.coverage]),
        success1st: parseNum(row[C.success1]),
      });
    }
  }
  flush();

  return { summary, sections };
}

// 보장분석 시트에서 날짜별 집계 → 최신일 = 당일실적
function parseCoverageSheet(wb) {
  const ws = wb.Sheets['보장분석'];
  if (!ws) return { today: 0, latestDate: null };

  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  const byDate = {};

  for (let i = 1; i < aoa.length; i++) {
    const dateStr = aoa[i]?.[5]; // 배정일 (col 5, "YYYY-MM-DD" 문자열)
    if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) continue;
    const d = dateStr.slice(0, 10); // "YYYY-MM-DD"
    byDate[d] = (byDate[d] || 0) + 1;
  }

  const dates = Object.keys(byDate).sort();
  const latestDate = dates.at(-1) || null;
  return { today: latestDate ? byDate[latestDate] : 0, latestDate };
}

export function parseAutoReport(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const monthSheets = wb.SheetNames
    .map(n => n.trim())
    .filter(n => /^\d{4}$/.test(n))
    .sort();

  if (!monthSheets.length) {
    throw new Error('월별 시트(예: 2604)를 찾을 수 없습니다. 자동차 daily 파일인지 확인해주세요.');
  }

  // 전체 월 데이터 → 추세용 (agents 제외, 속도 우선)
  const monthlyTrend = monthSheets.map(sheetName => {
    const mm = parseInt(sheetName.slice(2, 4));
    const { summary, sections } = parseMonthSheet(wb, sheetName, false);
    return { month: sheetName, label: `${mm}월`, summary, sections };
  });

  // 최신 월 → 상세 데이터 (agents 포함)
  const sheetName = monthSheets[monthSheets.length - 1];
  const yy = parseInt(sheetName.slice(0, 2));
  const mm = parseInt(sheetName.slice(2, 4));
  const reportDate = new Date(2000 + yy, mm - 1, 1);

  const { summary, sections } = parseMonthSheet(wb, sheetName, true);

  const sectionOrder = ['tmHoJeon', 'contract', 'dealerNew', 'dealerRenewal', 'permission'];
  const validSections = sectionOrder.filter(k => sections[k]);

  if (!validSections.length) {
    throw new Error('자동차 파일에서 섹션 데이터를 찾을 수 없습니다.');
  }

  // 보장분석 시트 → 당일실적
  const { today: coverageToday } = parseCoverageSheet(wb);
  summary.coverageToday = coverageToday;

  return { reportDate, sheetName, summary, sections, monthlyTrend };
}

export function detectFileType(buffer) {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });

    // 리테일 사업부: '일일실적현황' 시트 + A1에 '리테일금융' 포함
    if (wb.SheetNames.includes('일일실적현황')) {
      const ws = wb.Sheets['일일실적현황'];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
      const a1 = String(aoa[0]?.[0] || '');
      if (a1.includes('리테일')) return 'retail';
    }

    // 자동차 보험: YYMM 형식 월별 시트
    const hasMonthSheet = wb.SheetNames.some(n => /^\d{4}$/.test(n.trim()));
    if (hasMonthSheet) return 'auto';

    // GFP: 순번+지점명 헤더
    const firstWs = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json(firstWs, { header: 1, defval: null });
    for (let i = 0; i < Math.min(10, aoa.length); i++) {
      const row = aoa[i] || [];
      if (row.some(c => c === '순번') && row.some(c => c === '지점명')) return 'gfp';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}
