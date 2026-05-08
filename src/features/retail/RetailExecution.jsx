import { T, RADIUS, MONO_STACK, FONT_STACK } from '../../theme.js';
import { fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';

const RETAIL_COLOR = '#7c6fcd';

const CAT_COLOR = {
  '신산업재':   T.accent,
  '신차산업재':  T.accent,
  '중고산업재':  T.yellow,
  '운용리스':   T.green,
  '장기렌터카':  T.blue,
  '신차할부':   RETAIL_COLOR,
};

function parseExecution(text) {
  const dateMatch = text.match(/^(\d+\/\d+)/);
  const dateStr = dateMatch ? dateMatch[1] : '';
  const rest = dateStr ? text.slice(dateStr.length).trim() : text;

  const categories = ['신차산업재', '신산업재', '중고산업재', '운용리스', '장기렌터카', '신차할부'];
  let category = '';
  let remaining = rest;
  for (const cat of categories) {
    if (rest.startsWith(cat)) {
      category = cat;
      remaining = rest.slice(cat.length).trim();
      break;
    }
  }

  const amountMatch = remaining.match(/(\d[\d,]*)백만원/);
  const amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;

  return { date: dateStr, category, detail: remaining, amount, raw: text };
}

export default function RetailExecution({ report }) {
  const { executions, reportDate } = report.data;

  if (!executions || executions.length === 0) {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>실행내역</h1>
          <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
            {fmtDate(reportDate)} 기준
          </p>
        </div>
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: T.textMute, fontSize: 18 }}>이 보고서에 실행내역 데이터가 없습니다.</div>
        </Card>
      </div>
    );
  }

  const parsed = executions.map(parseExecution);
  const totalAmount = parsed.reduce((s, e) => s + e.amount, 0);

  // 카테고리별 집계
  const byCategory = {};
  for (const e of parsed) {
    if (!e.category) continue;
    const key = e.category === '신차산업재' ? '신산업재' : e.category;
    byCategory[key] = (byCategory[key] || 0) + e.amount;
  }

  return (
    <div className="page-wrap">
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>실행내역</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {fmtDate(reportDate)} 기준 · 총 {parsed.length}건
          {totalAmount > 0 && (
            <span style={{ color: RETAIL_COLOR, fontWeight: 700, marginLeft: 8 }}>
              {totalAmount.toLocaleString()}백만원
            </span>
          )}
        </p>
      </div>

      {/* 카테고리별 요약 카드 */}
      {Object.keys(byCategory).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
          {Object.entries(byCategory).map(([cat, amt]) => {
            const color = CAT_COLOR[cat] || RETAIL_COLOR;
            return (
              <div key={cat} style={{
                padding: '8px 16px',
                borderRadius: RADIUS.sm,
                background: T.card,
                border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ fontSize: 15, fontWeight: 600, color: T.text, fontFamily: FONT_STACK }}>{cat}</span>
                <span style={{ fontSize: 15, fontWeight: 700, fontFamily: MONO_STACK, color }}>
                  {amt.toLocaleString()}백만
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 실행내역 리스트 */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 4 }}>당월 실행 완료 건</h3>
          <p style={{ fontSize: 15, color: T.textMute }}>날짜순 정렬</p>
        </div>
        {parsed.map((e, idx) => {
          const color = CAT_COLOR[e.category] || RETAIL_COLOR;
          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 24px',
                borderBottom: idx < parsed.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
              onMouseEnter={el => { el.currentTarget.style.background = T.cardHover; }}
              onMouseLeave={el => { el.currentTarget.style.background = 'transparent'; }}
            >
              {/* 날짜 */}
              <span style={{
                fontSize: 13, fontFamily: MONO_STACK, fontWeight: 600,
                color: T.textMute, minWidth: 36, paddingTop: 2, flexShrink: 0,
              }}>
                {e.date}
              </span>

              {/* 카테고리 뱃지 */}
              {e.category && (
                <span style={{
                  fontSize: 13, fontWeight: 700, padding: '2px 8px',
                  borderRadius: RADIUS.xs, flexShrink: 0, marginTop: 1,
                  background: `${color}1a`, color,
                }}>
                  {e.category === '신차산업재' ? '신산업재' : e.category}
                </span>
              )}

              {/* 내용 */}
              <span style={{ flex: 1, fontSize: 15, color: T.text, lineHeight: 1.5, fontFamily: FONT_STACK }}>
                {e.detail}
              </span>

              {/* 금액 */}
              {e.amount > 0 && (
                <span style={{
                  fontSize: 15, fontFamily: MONO_STACK, fontWeight: 700,
                  color: RETAIL_COLOR, flexShrink: 0,
                }}>
                  {e.amount.toLocaleString()}백만
                </span>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
