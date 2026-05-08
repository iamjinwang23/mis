import { T } from '../theme.js';

export const REPORT_TYPES = {
  gfp: {
    label: 'GFP 총괄',
    color: T.accent,
    fileExample: '●최종_(MIS)글로벌 GFP총괄 DailyReport_*.xlsx',
    detail: '순번·지점명 헤더 포함 파일',
  },
  retail: {
    label: '리테일 사업부',
    color: T.purple,
    fileExample: 'DailyReport_*.xlsx',
    detail: '일일실적현황 시트 포함 파일',
  },
  auto: {
    label: '자동차 보험',
    color: T.green,
    fileExample: '자동차daily R_*.xlsx',
    detail: '2604 형식 월별 시트 포함 파일',
  },
};

export const typeLabel = (t) => REPORT_TYPES[t]?.label ?? t;
export const typeColor = (t) => REPORT_TYPES[t]?.color ?? T.textMute;
