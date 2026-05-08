import * as XLSX from 'xlsx';
import { parseNum } from './numbers.js';

// Design Ref: §3 — detectFormat은 GFP 포맷 여부를 헤더 12줄 탐색으로 판별
function detectFormat(wb) {
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: null });

  for (let i = 0; i < Math.min(15, aoa.length); i++) {
    const row = aoa[i] || [];
    if (row.some(c => c === '순번') && row.some(c => c === '지점명')) {
      return { type: 'gfp', headerRow: i, aoa, sheetName: wb.SheetNames[0] };
    }
  }

  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    const row = aoa[i] || [];
    const txt = row.map(c => String(c || '')).join(' ');
    if (txt.includes('당월보유디비') || txt.includes('1차호전환')) {
      return { type: 'car_callcenter' };
    }
  }

  return { type: 'unknown' };
}

/**
 * GFP 총괄 보고서 xlsx 버퍼를 파싱한다.
 * @param {ArrayBuffer} buffer
 * @returns {{ reportDate: Date|null, baseDate: Date|null, branches: object[], summary: object, sheetName: string }}
 */
export function parseGFPReport(buffer) {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const detect = detectFormat(wb);

  if (detect.type === 'car_callcenter') {
    const err = new Error(
      '이 파일은 자동차 콜센터 일일보고 포맷이에요(예: 박시내 자동차_R 파일).\n' +
      '현재 대시보드는 GFP 총괄 DailyReport 전용입니다.'
    );
    err.formatType = 'car_callcenter';
    throw err;
  }
  if (detect.type !== 'gfp') {
    throw new Error(
      'GFP 총괄 보고서 형식이 아닌 것 같아요.\n' +
      '첫 시트에 "순번" + "지점명" 헤더가 있는 보고서를 올려주세요.'
    );
  }

  const { aoa, headerRow, sheetName } = detect;
  const headers = aoa[headerRow] || [];

  const findCol = (...keywords) => {
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j];
      if (h && keywords.some(k => String(h).trim() === k)) return j;
    }
    return -1;
  };
  const findColContains = (kw, fromIdx = 0) => {
    for (let j = fromIdx; j < headers.length; j++) {
      const h = headers[j];
      if (h && String(h).includes(kw)) return j;
    }
    return -1;
  };

  const C = {
    no: findCol('순번'),
    name: findCol('지점명'),
    manager: findCol('관리자명'),
    count: findCol('건수'),
    today: findCol('당일'),
    monthly: findCol('당월'),
    target: findCol('목표'),
    achieve: findCol('달성율'),
    headcount: findCol('재적인원'),
    hire: findCol('당월 위촉'),
    fire: findCol('당월 해촉'),
  };

  const activeCol1 = findColContains('가동인원');
  const activeCol2 = activeCol1 >= 0 ? findColContains('가동인원', activeCol1 + 1) : -1;

  const sectionCols = (start) => start < 0 ? null : ({
    active: start,
    targetDb: start + 1,
    assignedDb: start + 2,
    assignRate: start + 3,
    contracts: start + 4,
    amount: start + 5,
    contractRate: start + 6,
  });
  const HW = sectionCols(activeCol1);
  const COV = sectionCols(activeCol2);
  const channelCol = activeCol1 >= 0 ? activeCol1 - 1 : -1;

  if (C.no < 0 || C.name < 0) {
    throw new Error('헤더에서 "순번" 또는 "지점명" 컬럼을 찾지 못했습니다.');
  }

  let reportDate = null, baseDate = null;
  for (let i = 0; i < headerRow; i++) {
    const row = aoa[i] || [];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (cell && typeof cell === 'string' && cell.includes('보고기준일')) {
        const next = row[j + 1];
        if (next instanceof Date) reportDate = next;
        else if (typeof next === 'string' && next.length > 0) {
          const d = new Date(next);
          if (!isNaN(d)) reportDate = d;
        }
      }
    }
    for (const cell of row) {
      if (cell instanceof Date && !baseDate) {
        if (!reportDate || cell.getTime() !== reportDate.getTime()) baseDate = cell;
      }
    }
  }

  const emptyDb = () => ({ active: 0, targetDb: 0, assignedDb: 0, assignRate: 0, contracts: 0, amount: 0, contractRate: 0 });

  const branches = [];
  const summary = { direct: null, branch: null, total: null };
  let directBoundaryHit = false;

  for (let i = headerRow + 1; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const no = row[C.no];
    const name = row[C.name];
    if (!name && !no) continue;

    const data = {
      no, name, manager: row[C.manager],
      count: parseNum(row[C.count]),
      today: parseNum(row[C.today]),
      monthly: parseNum(row[C.monthly]),
      target: parseNum(row[C.target]),
      achieve: parseNum(row[C.achieve]),
      headcount: parseNum(row[C.headcount]),
      hire: parseNum(row[C.hire]),
      fire: parseNum(row[C.fire]),
      channel: channelCol >= 0 ? row[channelCol] : null,
      hw: HW ? {
        active: parseNum(row[HW.active]),
        targetDb: parseNum(row[HW.targetDb]),
        assignedDb: parseNum(row[HW.assignedDb]),
        assignRate: parseNum(row[HW.assignRate]),
        contracts: parseNum(row[HW.contracts]),
        amount: parseNum(row[HW.amount]),
        contractRate: parseNum(row[HW.contractRate]),
      } : emptyDb(),
      cov: COV ? {
        active: parseNum(row[COV.active]),
        targetDb: parseNum(row[COV.targetDb]),
        assignedDb: parseNum(row[COV.assignedDb]),
        assignRate: parseNum(row[COV.assignRate]),
        contracts: parseNum(row[COV.contracts]),
        amount: parseNum(row[COV.amount]),
        contractRate: parseNum(row[COV.contractRate]),
      } : emptyDb(),
    };

    const noStr = String(no || '').trim();
    const nameStr = String(name || '').trim();
    if (noStr === '직영소계' || nameStr === '직영소계') {
      summary.direct = data;
      directBoundaryHit = true;
    } else if (noStr === '지사소계' || nameStr === '지사소계') {
      summary.branch = data;
    } else if (noStr === '합계' || nameStr === '합계') {
      summary.total = data;
    } else if (nameStr.length > 0) {
      data.isDirect = !directBoundaryHit;
      branches.push(data);
    }
  }

  if (!branches.length) {
    throw new Error('지점 데이터를 찾을 수 없습니다. 보고서 본문 행이 비어있습니다.');
  }

  const dbNeeds = parseDbNeeds(wb, branches);
  return { reportDate, baseDate, branches, summary, sheetName, dbNeeds };
}

/**
 * GFP 워크북에서 "필요수량" 시트들을 파싱한다.
 * @param {object} wb - XLSX workbook
 * @param {object[]} branches - 이미 파싱된 지점 실적 (actuals 매칭용)
 * @returns {object[]} 월별 필요수량 배열
 */
function parseDbNeeds(wb, branches) {
  const needsSheets = wb.SheetNames.filter(n => n.includes('필요수량'));
  if (!needsSheets.length) return [];

  const branchMap = {};
  (branches || []).forEach(b => {
    if (b.name) branchMap[String(b.name).trim()] = b;
  });

  return needsSheets.map(sheetName => {
    const sheet = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // 헤더 행 (row 1): 영업일, 진행일, 남은일
    const hdr = aoa[1] || [];
    const workingDays = parseNum(hdr[2]);
    const elapsedDays = parseNum(hdr[3]);
    const remainDays = parseNum(hdr[4]);

    // 핵심 요약 (rows 4-5)
    const covRow = aoa[4] || [];
    const hwRow = aoa[5] || [];
    const summary = {
      cov: { min: parseNum(covRow[1]), max: parseNum(covRow[2]) },
      hw:  { min: parseNum(hwRow[1]) },
    };

    // 지점별 파싱
    const direct = [];
    const indirect = [];
    let section = null; // 'direct' | 'indirect' | 'pending'

    for (let i = 6; i < aoa.length; i++) {
      const row = aoa[i] || [];
      const c0 = String(row[0] || '').trim();
      const c1 = String(row[1] || '').trim();

      if (c0.startsWith('1.직영')) { section = 'direct'; continue; }
      if (c0.startsWith('2.지사') && !c0.includes('도입')) { section = 'indirect'; continue; }
      if (c0.includes('도입예정')) { section = 'pending'; continue; }
      if (c0.includes('합계')) continue;

      // 헤더 행 스킵 (지점명 = '지점명')
      if (c0 === '지점명') continue;
      if (!c0 || c0.length === 0) continue;

      const name = c0;
      const actual = branchMap[name] || null;

      if (section === 'direct') {
        direct.push({
          name,
          manager: c1 || null,
          isDirect: true,
          // 보장분석 필요량
          cov: {
            active: parseNum(row[2]),
            perDay: parseNum(row[3]),
            monthly: parseNum(row[5]),
            addPersonnel: parseNum(row[7]),
            addMonthly: parseNum(row[10]),
          },
          // 호전환 필요량 (직영만 별도 컬럼)
          hw: {
            active: parseNum(row[12]),
            perDay: parseNum(row[13]),
            monthly: parseNum(row[15]),
          },
          // 현재 실적 (main 시트에서 매칭)
          actual: actual ? {
            hwContracts: actual.hw?.contracts || 0,
            covContracts: actual.cov?.contracts || 0,
          } : null,
        });
      } else if (section === 'indirect') {
        indirect.push({
          name,
          manager: c1 || null,
          isDirect: false,
          cov: {
            active: parseNum(row[2]),
            perDay: parseNum(row[3]),
            monthly: parseNum(row[5]),
          },
          hw: { active: 0, perDay: 0, monthly: 0 },
          actual: actual ? {
            hwContracts: actual.hw?.contracts || 0,
            covContracts: actual.cov?.contracts || 0,
          } : null,
        });
      }
    }

    const monthLabel = sheetName.replace('필요수량', '').trim();
    return { sheetName, monthLabel, workingDays, elapsedDays, remainDays, summary, direct, indirect };
  });
}
