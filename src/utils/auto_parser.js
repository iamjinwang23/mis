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

// Column indices (0-based, from header row analysis of 260424 file)
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

export function parseAutoReport(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const monthSheets = wb.SheetNames
    .map(n => n.trim())
    .filter(n => /^\d{4}$/.test(n))
    .sort();

  if (!monthSheets.length) {
    throw new Error('월별 시트(예: 2604)를 찾을 수 없습니다. 자동차 daily 파일인지 확인해주세요.');
  }

  const sheetName = monthSheets[monthSheets.length - 1];
  const yy = parseInt(sheetName.slice(0, 2));
  const mm = parseInt(sheetName.slice(2, 4));
  const reportDate = new Date(2000 + yy, mm - 1, 1);

  const ws = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Row index 2 = overall 합계
  const sumRow = aoa[2] || [];
  const summary = parseSectionRow(sumRow);

  const sections = {};
  let currentKey = null;
  let currentData = null;
  let currentAgents = [];
  let lastSubManager = null; // col2 carry-forward용

  const flush = () => {
    if (currentKey && currentData) {
      sections[currentKey] = {
        ...currentData,
        label: SECTION_LABELS[currentKey],
        agents: currentAgents,
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
      lastSubManager = null; // 섹션 전환 시 초기화
      continue;
    }

    if (!currentKey) continue;

    // Agent rows: col3 has agent name, col5 has status
    const agentName = row[C.sales];
    const status = row[C.status];
    const VALID_STATUSES = ['재직', '주말', '퇴사', '퇴사예정', '1차디비', '신풍'];

    if (isName(agentName) && status && VALID_STATUSES.includes(String(status).trim())) {
      // col2에 값이 있으면 새 관리자로 갱신, 없으면 직전 관리자 유지 (carry-forward)
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

  const sectionOrder = ['tmHoJeon', 'contract', 'dealerNew', 'dealerRenewal', 'permission'];
  const validSections = sectionOrder.filter(k => sections[k]);

  if (!validSections.length) {
    throw new Error('자동차 파일에서 섹션 데이터를 찾을 수 없습니다.');
  }

  return { reportDate, sheetName, summary, sections };
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
