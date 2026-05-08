import { useState } from 'react';
import { Trash2, FileSpreadsheet, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { deleteReport } from '../../db.js';
import { fmtDate } from '../../utils/formatters.js';
import { REPORT_TYPES, typeLabel, typeColor } from '../../utils/report_types.js';

function PageHeader({ title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>{title}</h1>
      <p style={{ fontSize: 18, color: T.textDim }}>{sub}</p>
    </div>
  );
}

function ReportRow({ report, onDelete, onSelect }) {
  const [confirm, setConfirm] = useState(false);
  const color = typeColor(report.type);
  const label = typeLabel(report.type);
  const dateStr = fmtDate(report.reportDate);
  const uploadedStr = fmtDate(report.uploadedAt);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 20px',
      borderBottom: `1px solid ${T.border}`,
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Type badge */}
      <div style={{
        width: 40, height: 40, borderRadius: RADIUS.sm,
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FileSpreadsheet size={18} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: 3,
            background: `${color}18`, color,
          }}>
            {label}
          </span>
          <span style={{ fontSize: 18, fontWeight: 600, color: T.text, fontFamily: MONO_STACK }}>
            {dateStr}
          </span>
        </div>
        <div style={{ fontSize: 13, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.filename}
        </div>
        <div style={{ fontSize: 13, color: T.textMute, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Clock size={10} />
          업로드: {uploadedStr}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button type="button"
          onClick={() => onSelect(report)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: RADIUS.xs,
            background: `${color}18`, border: `1px solid ${color}40`,
            color, fontSize: 15, fontWeight: 600, cursor: 'pointer',
            fontFamily: FONT_STACK,
          }}
        >
          조회 <ChevronRight size={12} />
        </button>

        {confirm ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button"
              onClick={async () => {
                await deleteReport(report.id);
                onDelete(report.id);
              }}
              style={{
                padding: '6px 10px', borderRadius: RADIUS.xs,
                background: T.redSoft, border: `1px solid ${T.red}40`,
                color: T.red, fontSize: 15, cursor: 'pointer', fontFamily: FONT_STACK,
              }}
            >
              삭제 확인
            </button>
            <button type="button"
              onClick={() => setConfirm(false)}
              style={{
                padding: '6px 10px', borderRadius: RADIUS.xs,
                background: T.card, border: `1px solid ${T.border}`,
                color: T.textDim, fontSize: 15, cursor: 'pointer', fontFamily: FONT_STACK,
              }}
            >
              취소
            </button>
          </div>
        ) : (
          <button type="button"
            onClick={() => setConfirm(true)}
            style={{
              padding: '6px 8px', borderRadius: RADIUS.xs,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMute, fontSize: 15, cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function HistoryView({ gfpReports, retailReports, autoReports, onSelectReport, onRefresh }) {
  const [filter, setFilter] = useState('all');

  const counts = { gfp: gfpReports.length, retail: retailReports.length, auto: autoReports.length };

  const allReports = [
    ...gfpReports.map(r => ({ ...r, type: 'gfp' })),
    ...retailReports.map(r => ({ ...r, type: 'retail' })),
    ...autoReports.map(r => ({ ...r, type: 'auto' })),
  ].sort((a, b) => new Date(b.reportDate) - new Date(a.reportDate));

  const filtered = filter === 'all' ? allReports : allReports.filter(r => r.type === filter);

  const handleDelete = () => onRefresh();

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      <PageHeader
        title="업로드 히스토리"
        sub={`총 ${allReports.length}개 보고서 저장됨 · ` +
          Object.entries(REPORT_TYPES).map(([k, t]) => `${t.label} ${counts[k]}개`).join(' · ')}
      />

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `전체 (${allReports.length})` },
          ...Object.entries(REPORT_TYPES).map(([key, t]) => ({
            key, label: `${t.label} (${counts[key]})`, color: t.color,
          })),
        ].map(f => (
          <button type="button"
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 14px', borderRadius: RADIUS.xs,
              background: filter === f.key ? (f.color || T.text) : T.card,
              border: `1px solid ${filter === f.key ? (f.color || T.text) : T.border}`,
              color: filter === f.key ? '#ffffff' : T.textDim,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_STACK,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{
        background: T.card, borderRadius: RADIUS.md,
        border: `1px solid ${T.border}`, overflow: 'hidden',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: T.textMute }}>
            <AlertTriangle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <div style={{ fontSize: 18 }}>저장된 보고서가 없습니다.</div>
            <div style={{ fontSize: 15, marginTop: 4 }}>파일 업로드 메뉴에서 엑셀 파일을 업로드하세요.</div>
          </div>
        ) : (
          filtered.map(r => (
            <ReportRow
              key={r.id}
              report={r}
              onDelete={handleDelete}
              onSelect={onSelectReport}
            />
          ))
        )}
      </div>
    </div>
  );
}
