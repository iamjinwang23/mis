import { useState, useEffect, useRef } from 'react';

const MODEL = 'gemini-2.5-flash-lite';
const API_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// 대시보드별 순차 호출을 위한 전역 큐 (동시 3개 호출 방지)
let callQueue = Promise.resolve();
const TYPE_DELAY = { gfp: 0, auto: 4000, retail: 8000 };

function buildPrompt(type, data) {
  if (type === 'gfp') {
    const { total = {}, direct = {}, branch = {}, branches = [] } = data;
    const buckets = [0, 0, 0, 0, 0];
    branches.forEach(b => {
      const a = b.achieve || 0;
      if (a === 0) buckets[0]++;
      else if (a <= 0.3) buckets[1]++;
      else if (a <= 0.6) buckets[2]++;
      else if (a < 1)   buckets[3]++;
      else               buckets[4]++;
    });
    const hw  = total.hw  || {};
    const cov = total.cov || {};
    return `당신은 영업 데이터 분석 전문가입니다. 아래 GFP 총괄 대시보드 데이터를 분석해서 한국어로 인사이트를 생성해주세요.

데이터:
- 전사 달성율: ${((total.achieve||0)*100).toFixed(1)}%
- 전사 월납P: ${total.monthly||0}만원 / 목표: ${total.target||0}만원
- 전사 영업건수: ${total.count||0}건
- 재적 인원: ${total.headcount||0}명 (직영 ${direct.headcount||0} / 지사 ${branch.headcount||0})
- 당월 위촉: ${total.hire||0}명 / 해촉: ${total.fire||0}명
- 직영 달성율: ${((direct.achieve||0)*100).toFixed(1)}% / 지사 달성율: ${((branch.achieve||0)*100).toFixed(1)}%
- 지점 수: ${branches.length}곳 (달성율 0%: ${buckets[0]}곳, 0~30%: ${buckets[1]}곳, 30~60%: ${buckets[2]}곳, 60~100%: ${buckets[3]}곳, 100%이상: ${buckets[4]}곳)
- 호전환 체결율: ${((hw.contractRate||0)*100).toFixed(1)}% (체결 ${hw.contracts||0}건 / 배정 ${hw.assignedDb||0}건)
- 보장분석 체결율: ${((cov.contractRate||0)*100).toFixed(1)}% (체결 ${cov.contracts||0}건 / 배정 ${cov.assignedDb||0}건)

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"diagnosis":"진단 내용 (50자 이내)","risk":"리스크 탐지 내용 (50자 이내)","forecast":"예측 내용 (50자 이내)","action":"처방/추천 내용 (50자 이내)"}`;
  }

  if (type === 'auto') {
    const { summary = {}, sections = {}, totalCoverage = 0, totalSuccess = 0, totalAssigned = 0 } = data;
    const sectionRows = Object.entries(sections)
      .filter(([, s]) => s)
      .map(([k, s]) => `  ${k}: 보장분석 ${s.coverage||0}건, 1차호전환 ${s.success1st||0}건, 배정 ${s.assigned||0}건`)
      .join('\n');
    return `당신은 영업 데이터 분석 전문가입니다. 아래 자동차 보험 대시보드 데이터를 분석해서 한국어로 인사이트를 생성해주세요.

데이터:
- 총 영업인원: ${summary.sales||0}명
- 갱신 DB 보유: ${summary.renewalDb||0}건 / 배분: ${summary.assigned||0}건
- 신규 DB: ${summary.newDb||0}건
- 전사 보장분석: ${totalCoverage}건
- 전사 1차호전환: ${totalSuccess}건
- TM 성공률: ${((summary.successRate||0)*100).toFixed(1)}% (TM 갱신성공 ${summary.tmRenewalSuccess||0}건)
- 전사 배분 DB: ${totalAssigned}건
부서별:
${sectionRows}

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"diagnosis":"진단 내용 (50자 이내)","risk":"리스크 탐지 내용 (50자 이내)","forecast":"예측 내용 (50자 이내)","action":"처방/추천 내용 (50자 이내)"}`;
  }

  if (type === 'retail') {
    const { summary = {}, companies = [], totals = {} } = data;
    const productLines = Object.entries(totals)
      .map(([k, v]) => `  ${k}: 당월누계 ${v?.cumulative||0}백만원`)
      .join('\n');
    const topCo = [...companies].sort((a, b) => b.total - a.total).slice(0, 3)
      .map(c => `${c.company||c.name} ${c.total||0}백만`).join(', ');
    return `당신은 영업 데이터 분석 전문가입니다. 아래 리테일 사업부 대시보드 데이터를 분석해서 한국어로 인사이트를 생성해주세요.

데이터:
- 당일 신규 취급: ${summary.todayNew||0}백만원
- 당월 누계: ${summary.monthCum||0}백만원 / 목표: ${summary.monthlyTarget||0}백만원
- 월 달성율: ${((summary.monthAchieve||0)*100).toFixed(1)}%
- 분기 누계: ${summary.quarterCum||0}백만원 / 목표: ${summary.quarterTarget||0}백만원
- 분기 달성율: ${((summary.quarterAchieve||0)*100).toFixed(1)}%
- 전월 추세: ${summary.prev1||0} → ${summary.prev2||0} → ${summary.prev3||0} → 당월 ${summary.monthCum||0} (백만원)
- 상위 금융사: ${topCo || '데이터 없음'}
제품별:
${productLines || '  데이터 없음'}

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"diagnosis":"진단 내용 (50자 이내)","risk":"리스크 탐지 내용 (50자 이내)","forecast":"예측 내용 (50자 이내)","action":"처방/추천 내용 (50자 이내)"}`;
  }

  return null;
}

async function callWithRetry(url, body, signal, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify(body),
    });

    if (res.ok) return res;

    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || `API 오류 ${res.status}`;

    // 429 쿼터 초과 → retry-after 파싱 후 대기
    if (res.status === 429) {
      const retryMatch = msg.match(/retry in ([\d.]+)s/i);
      const waitMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1]) * 1000) + 500 : (attempt + 1) * 5000;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }
    }

    lastError = new Error(msg);
    break;
  }
  throw lastError;
}

export function useAiInsight(type, data, cacheKey) {
  const [insight, setInsight]  = useState(null);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);
  const abortRef = useRef(null);

  const storageKey = `ai_insight_${type}_${cacheKey}`;

  const fetchInsight = async (skipCache = false) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError('VITE_GEMINI_API_KEY가 설정되지 않았습니다.');
      return;
    }

    if (!skipCache) {
      const cached = sessionStorage.getItem(storageKey);
      if (cached) {
        try { setInsight(JSON.parse(cached)); return; } catch { /* ignore */ }
      }
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setLoading(true);
    setError(null);

    // 대시보드 타입별로 순차 호출 (동시 요청으로 인한 쿼터 초과 방지)
    const delay = TYPE_DELAY[type] ?? 0;
    callQueue = callQueue.then(() => new Promise(r => setTimeout(r, delay)));

    try {
      const prompt = buildPrompt(type, data);
      if (!prompt) throw new Error('지원하지 않는 대시보드 타입');

      await callQueue;
      if (signal.aborted) return;

      const res = await callWithRetry(
        `${API_URL}?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        },
        signal
      );

      const json = await res.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        const reason = json.candidates?.[0]?.finishReason;
        throw new Error(reason ? `응답 없음 (${reason})` : '빈 응답');
      }

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('응답 파싱 실패 — 새로고침을 눌러 재시도하세요');
        parsed = JSON.parse(match[0]);
      }

      setInsight(parsed);
      sessionStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data || !cacheKey) return;
    fetchInsight();
    return () => abortRef.current?.abort();
  }, [cacheKey]);

  return {
    insight,
    loading,
    error,
    refresh: () => {
      sessionStorage.removeItem(storageKey);
      fetchInsight(true);
    },
  };
}
