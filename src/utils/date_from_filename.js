/**
 * 파일명에서 날짜를 추출한다.
 *
 * 지원 패턴:
 *   GFP:  "DailyReport_20260427 (...).xlsx"  → 2026-04-27
 *   Auto: "자동차daily R_박시내_260424.xlsx"  → 2026-04-24
 *
 * @param {string} filename
 * @returns {Date|null}
 */
export function parseDateFromFilename(filename) {
  if (!filename) return null;

  // GFP: DailyReport_YYYYMMDD
  const gfpMatch = filename.match(/DailyReport[_\s-](\d{8})/i);
  if (gfpMatch) {
    const s = gfpMatch[1];
    const y = parseInt(s.slice(0, 4));
    const m = parseInt(s.slice(4, 6)) - 1;
    const d = parseInt(s.slice(6, 8));
    const date = new Date(y, m, d);
    if (!isNaN(date)) return date;
  }

  // Auto: _YYMMDD.xlsx (끝에서 6자리 숫자)
  const autoMatch = filename.match(/_(\d{6})\.xlsx?$/i);
  if (autoMatch) {
    const s = autoMatch[1];
    const y = 2000 + parseInt(s.slice(0, 2));
    const m = parseInt(s.slice(2, 4)) - 1;
    const d = parseInt(s.slice(4, 6));
    const date = new Date(y, m, d);
    if (!isNaN(date)) return date;
  }

  // Fallback: 파일명 내 8자리 연속 숫자 (YYYYMMDD)
  const fallback8 = filename.match(/(\d{8})/);
  if (fallback8) {
    const s = fallback8[1];
    const y = parseInt(s.slice(0, 4));
    if (y >= 2020 && y <= 2035) {
      const m = parseInt(s.slice(4, 6)) - 1;
      const d = parseInt(s.slice(6, 8));
      const date = new Date(y, m, d);
      if (!isNaN(date)) return date;
    }
  }

  // Fallback: 6자리 숫자 (YYMMDD)
  const fallback6 = filename.match(/(\d{6})/);
  if (fallback6) {
    const s = fallback6[1];
    const y = 2000 + parseInt(s.slice(0, 2));
    const m = parseInt(s.slice(2, 4)) - 1;
    const d = parseInt(s.slice(4, 6));
    if (m >= 0 && m < 12 && d >= 1 && d <= 31) {
      const date = new Date(y, m, d);
      if (!isNaN(date)) return date;
    }
  }

  return null;
}
