import { T, RADIUS, MONO_STACK, FONT_STACK } from '../../theme.js';
import { fmtNum, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';

const RETAIL_COLOR = '#7c6fcd';

const CAT_COLOR = {
  '신산업재':  T.accent,
  '신차산업재': T.accent,
  '중고산업재': T.yellow,
  '운용리스':  T.green,
  '장기렌터카': T.blue,
  '신차할부':  RETAIL_COLOR,
};

// ── 구 문자열 형식 fallback ──────────────────────────────────
function parseExecutionStr(text) {
  const dateMatch = text.match(/^(\d+\/\d+)/);
  const dateStr = dateMatch ? dateMatch[1] : '';
  const rest = dateStr ? text.slice(dateStr.length).trim() : text;
  const cats = ['신차산업재', '신산업재', '중고산업재', '운용리스', '장기렌터카', '신차할부'];
  let category = '', remaining = rest;
  for (const cat of cats) {
    if (rest.startsWith(cat)) { category = cat; remaining = rest.slice(cat.length).trim(); break; }
  }
  const amtMatch = remaining.match(/(\d[\d,]*)백만원/);
  const amount = amtMatch ? parseInt(amtMatch[1].replace(/,/g, '')) : 0;
  return { date: dateStr, product: category, customer: remaining, vehicle: null, amount, bank: null };
}

// ── 공통 행 렌더러 ────────────────────────────────────────────
function ExecRow({ e, idx, total }) {
  const color = CAT_COLOR[e.product] || CAT_COLOR['신차산업재'] || RETAIL_COLOR;
  const normalProduct = e.product === '신차산업재' ? '신산업재' : e.product;
  return (
    <tr
      style={{ borderBottom: idx < total - 1 ? `1px solid ${T.border}` : 'none' }}
      onMouseEnter={el => { el.currentTarget.style.background = T.cardHover; }}
      onMouseLeave={el => { el.currentTarget.style.background = 'transparent'; }}
    >
      <td style={{ padding: '10px 16px', fontSize: 13, fontFamily: MONO_STACK, color: T.textMute, whiteSpace: 'nowrap' }}>
        {e.date || '—'}
      </td>
      <td style={{ padding: '10px 10px' }}>
        {normalProduct ? (
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '2px 7px', borderRadius: RADIUS.xs,
            background: `${color}1a`, color, whiteSpace: 'nowrap',
          }}>
            {normalProduct}
          </span>
        ) : <span style={{ color: T.textMute }}>—</span>}
      </td>
      <td style={{ padding: '10px 10px', fontSize: 14, color: T.text, fontFamily: FONT_STACK }}>
        {e.customer || '—'}
      </td>
      <td style={{ padding: '10px 10px', fontSize: 13, color: T.textDim, fontFamily: FONT_STACK }}>
        {e.vehicle || '—'}
      </td>
      <td style={{ padding: '10px 10px', fontSize: 13, color: T.textDim }}>
        {e.bank || '—'}
      </td>
      <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: 14, fontFamily: MONO_STACK, fontWeight: 700, color: e.amount > 0 ? RETAIL_COLOR : T.textMute, whiteSpace: 'nowrap' }}>
        {e.amount > 0 ? `${fmtNum(e.amount)}백만` : '—'}
      </td>
    </tr>
  );
}

export default function RetailExecution({ report }) {
  const { executions, reportDate } = report.data;

  if (!executions || executions.length === 0) {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>실행내역</h1>
          <p style={{ fontSize: 15, color: T.textDim, fontFamily: MONO_STACK }}>{fmtDate(reportDate)} 기준</p>
        </div>
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ color: T.textMute, fontSize: 16 }}>이 보고서에 실행내역 데이터가 없습니다.</div>
        </Card>
      </div>
    );
  }

  // 구 문자열 형식 vs 신 구조화 객체 형식 감지
  const isStructured = typeof executions[0] === 'object' && executions[0] !== null && 'product' in executions[0];
  const rows = isStructured ? executions : executions.map(parseExecutionStr);

  const totalAmount = rows.reduce((s, e) => s + (e.amount || 0), 0);

  // 제품별 금액 집계
  const byProduct = {};
  for (const e of rows) {
    const key = (e.product === '신차산업재' ? '신산업재' : e.product) || '';
    if (!key) continue;
    byProduct[key] = (byProduct[key] || 0) + (e.amount || 0);
  }

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>실행내역</h1>
        <p style={{ fontSize: 15, color: T.textDim, fontFamily: MONO_STACK }}>
          {fmtDate(reportDate)} 기준 · 총 {rows.length}건
          {totalAmount > 0 && (
            <span style={{ color: RETAIL_COLOR, fontWeight: 700, marginLeft: 8 }}>
              {fmtNum(totalAmount)}백만원
            </span>
          )}
        </p>
      </div>

      {/* 제품별 요약 뱃지 */}
      {Object.keys(byProduct).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {Object.entries(byProduct).map(([prod, amt]) => {
            const color = CAT_COLOR[prod] || RETAIL_COLOR;
            return (
              <div key={prod} style={{
                padding: '7px 14px', borderRadius: RADIUS.sm,
                background: T.card, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{prod}</span>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: MONO_STACK, color }}>
                  {fmtNum(amt)}백만
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 실행내역 테이블 */}
      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 2 }}>당월 실행 완료 건</h3>
          <p style={{ fontSize: 13, color: T.textMute }}>날짜순</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                {['날짜', '제품', '고객', '차량', '금융사', '금액'].map((h, i) => (
                  <th key={h} style={{
                    padding: '10px 10px', textAlign: i === 5 ? 'right' : 'left',
                    color: T.textDim, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    paddingLeft: i === 0 || i === 5 ? 16 : 10,
                    paddingRight: i === 5 ? 16 : 10,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <ExecRow key={i} e={e} idx={i} total={rows.length} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
