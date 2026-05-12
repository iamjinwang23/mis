import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, FileSpreadsheet, Info } from 'lucide-react';
import { T, MONO_STACK, RADIUS } from '../../theme.js';
import { parseGFPReport } from '../../utils/parser.js';
import { parseAutoReport, detectFileType } from '../../utils/auto_parser.js';
import { parseRetailReport } from '../../utils/retail_parser.js';
import { parseDateFromFilename } from '../../utils/date_from_filename.js';
import { saveReport, listReports, deleteReport } from '../../db.js';
import { fmtDate } from '../../utils/formatters.js';
import { REPORT_TYPES, typeLabel, typeColor } from '../../utils/report_types.js';

export default function UploadView({ onUploaded, canUpload }) {
  if (!canUpload) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '70vh', color: T.textMute, padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.3 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: T.textDim, marginBottom: 8 }}>업로드 권한이 없습니다</div>
        <div style={{ fontSize: 15 }}>관리자에게 업로드 권한을 요청하세요</div>
      </div>
    );
  }
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dupConfirm, setDupConfirm] = useState(null); // { resolve, sameDate, newFile, type, reportDate, dateSource, parsed }

  const doSave = async ({ type, filename, reportDate, data, parsed, dateSource, sameDate, replaced }) => {
    const id = await saveReport({ type, filename, reportDate, data: parsed });
    setResult({
      ok: true, type, reportDate, filename, id,
      dateSource,
      replaced,
      replacedFilename: sameDate?.filename,
    });
    onUploaded(type, id);
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      setError('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const type = detectFileType(buffer);

      let parsed;
      if (type === 'gfp') parsed = parseGFPReport(buffer);
      else if (type === 'retail') parsed = parseRetailReport(buffer);
      else if (type === 'auto') parsed = parseAutoReport(buffer);
      else throw new Error(
        '파일 형식을 인식할 수 없습니다.\n' +
        '· GFP 총괄 보고서: "순번" + "지점명" 헤더가 있어야 합니다.\n' +
        '· 리테일 사업부: "일일실적현황" 시트가 있어야 합니다.\n' +
        '· 자동차 보험: "2604" 같은 월별 시트가 있어야 합니다.'
      );

      const dateFromName = parseDateFromFilename(file.name);
      const dateFromFile = parsed.reportDate;
      const reportDate = dateFromName || dateFromFile || new Date();
      const dateSource = dateFromName ? 'filename' : 'filecontent';

      const existing = await listReports(type);
      const pad = n => String(n).padStart(2, '0');
      const reportDateStr = `${reportDate.getFullYear()}-${pad(reportDate.getMonth()+1)}-${pad(reportDate.getDate())}`;
      const sameDate = existing.find(r => r.report_date === reportDateStr);

      if (sameDate) {
        setLoading(false);
        setDupConfirm({ sameDate, file, type, reportDate, dateSource, parsed });
        return;
      }

      await doSave({ type, filename: file.name, reportDate, parsed, dateSource, sameDate: null, replaced: false });
    } catch (err) {
      setError(err.message || '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDupReplace = async () => {
    const { sameDate, file, type, reportDate, dateSource, parsed } = dupConfirm;
    setDupConfirm(null);
    setLoading(true);
    try {
      await deleteReport(sameDate.id);
      await doSave({ type, filename: file.name, reportDate, parsed, dateSource, sameDate, replaced: true });
    } catch (err) {
      setError(err.message || '파일 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDupCancel = () => setDupConfirm(null);

  const reset = () => { setResult(null); setError(null); };

  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>

      {/* 중복 확인 모달 */}
      {dupConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: T.card, borderRadius: RADIUS.lg,
            border: `1px solid ${T.border}`,
            padding: 28, maxWidth: 440, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 16 }}>
              이미 같은 날짜 데이터가 있어요
            </div>
            <div style={{ fontSize: 14, color: T.textDim, marginBottom: 8 }}>
              <span style={{ color: T.textMute }}>날짜: </span>
              <span style={{ fontFamily: MONO_STACK, color: T.text }}>{fmtDate(dupConfirm.reportDate)}</span>
              <span style={{ marginLeft: 8, fontSize: 13, padding: '1px 6px', borderRadius: 3, background: `${typeColor(dupConfirm.type)}18`, color: typeColor(dupConfirm.type) }}>
                {typeLabel(dupConfirm.type)}
              </span>
            </div>
            <div style={{ fontSize: 13, color: T.textMute, marginBottom: 4 }}>
              기존: <span style={{ fontFamily: MONO_STACK, color: T.textDim }}>{dupConfirm.sameDate.filename}</span>
            </div>
            <div style={{ fontSize: 13, color: T.textMute, marginBottom: 20 }}>
              새 파일: <span style={{ fontFamily: MONO_STACK, color: T.textDim }}>{dupConfirm.file.name}</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={handleDupReplace} style={{
                flex: 1, padding: '10px 0', borderRadius: RADIUS.xs,
                background: T.accent, color: T.bg,
                fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
              }}>
                교체하기
              </button>
              <button type="button" onClick={handleDupCancel} style={{
                flex: 1, padding: '10px 0', borderRadius: RADIUS.xs,
                background: 'transparent', color: T.textDim,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${T.border}`,
              }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>파일 업로드</h1>
        <p style={{ fontSize: 18, color: T.textDim }}>
          GFP 총괄 또는 리테일 사업부 Daily 파일을 업로드합니다.<br />
          파일 형식을 자동으로 감지하고 브라우저에 저장합니다.
        </p>
      </div>

      {/* Upload zone */}
      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); reset(); }}
        style={{
          display: 'block', cursor: loading ? 'wait' : 'pointer',
          padding: 48, borderRadius: RADIUS.lg,
          background: dragOver ? `${T.accent}0a` : T.card,
          border: `2px dashed ${dragOver ? T.accent : T.border}`,
          textAlign: 'center', transition: 'all 0.2s',
          marginBottom: 20,
        }}
      >
        <input
          type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
          onChange={(e) => { reset(); handleFile(e.target.files?.[0]); }}
          disabled={loading}
        />
        <div style={{
          width: 56, height: 56, borderRadius: RADIUS.md, margin: '0 auto 16px',
          background: loading ? 'rgba(255,255,255,0.06)' : dragOver ? T.accent : `${T.accent}18`,
          color: dragOver ? T.bg : T.accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          {loading
            ? <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid rgba(255,255,255,0.2)`, borderTopColor: T.accent, animation: 'spin 1s linear infinite' }} />
            : <Upload size={24} strokeWidth={2} />
          }
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, color: T.text, marginBottom: 6 }}>
          {loading ? '파일 분석 중...' : '클릭하거나 드래그해서 업로드'}
        </div>
        <div style={{ color: T.textMute, fontSize: 15 }}>
          GFP 총괄 · 리테일 사업부 · 자동차 보험 파일 지원
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </label>

      {/* Success */}
      {result?.ok && (
        <div style={{
          padding: 16, borderRadius: RADIUS.md,
          background: `${T.green}0f`, border: `1px solid ${T.green}30`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <CheckCircle2 size={18} style={{ color: T.green, flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, color: T.green, marginBottom: 6 }}>
              {result.replaced ? '데이터 교체 완료' : '업로드 완료'}
            </div>
            {result.replaced && (
              <div style={{
                fontSize: 14, color: T.yellow, marginBottom: 6,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Info size={13} style={{ flexShrink: 0 }} />
                <span>기존 파일 <span style={{ fontFamily: MONO_STACK }}>{result.replacedFilename}</span> 을 삭제하고 교체했습니다.</span>
              </div>
            )}
            <div style={{ fontSize: 18, color: T.textDim, marginBottom: 4 }}>
              <span style={{
                fontSize: 13, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                background: `${typeColor(result.type)}18`,
                color: typeColor(result.type),
                marginRight: 6,
              }}>
                {typeLabel(result.type)}
              </span>
              <span style={{ fontFamily: MONO_STACK }}>{result.filename}</span>
            </div>
            <div style={{ fontSize: 15, color: T.textMute, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>조회 기준일:</span>
              <span style={{ fontFamily: MONO_STACK, color: T.text, fontWeight: 600 }}>
                {fmtDate(result.reportDate)}
              </span>
              <span style={{
                fontSize: 13, padding: '1px 5px', borderRadius: 3,
                background: result.dateSource === 'filename' ? `${T.accent}18` : 'rgba(255,255,255,0.06)',
                color: result.dateSource === 'filename' ? T.accent : T.textMute,
              }}>
                {result.dateSource === 'filename' ? '파일명 파싱' : '파일 내용'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: 16, borderRadius: RADIUS.md,
          background: T.redSoft, border: `1px solid ${T.red}40`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <AlertCircle size={18} style={{ color: T.red, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 600, color: T.red, marginBottom: 4 }}>파일 처리 실패</div>
            <div style={{ fontSize: 18, color: T.textDim, whiteSpace: 'pre-line', lineHeight: 1.6 }}>{error}</div>
          </div>
        </div>
      )}

      {/* Guide */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 12 }}>지원 파일 형식</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 12 }}>
          {Object.entries(REPORT_TYPES).map(([key, t]) => (
            <div key={key} style={{
              padding: 14, borderRadius: RADIUS.sm,
              background: T.card, border: `1px solid ${T.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileSpreadsheet size={14} style={{ color: t.color }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: t.color }}>{t.label}</span>
              </div>
              <div style={{ fontSize: 13, color: T.textMute, fontFamily: MONO_STACK, marginBottom: 4, wordBreak: 'break-all' }}>{t.fileExample}</div>
              <div style={{ fontSize: 13, color: T.textDim }}>{t.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
