import { useState, useMemo } from 'react';
import { Trash2, FileSpreadsheet, Clock, ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { deleteReport } from '../../db.js';
import { fmtDate } from '../../utils/formatters.js';
import { REPORT_TYPES, typeLabel, typeColor } from '../../utils/report_types.js';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function toDateKey(d) {
  if (!d) return '';
  return (typeof d === 'string' ? d : d.toISOString()).slice(0, 10);
}

function ReportRow({ report, onDelete, onSelect }) {
  const [confirm, setConfirm] = useState(false);
  const color = typeColor(report.type);
  const label = typeLabel(report.type);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: RADIUS.sm,
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <FileSpreadsheet size={16} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 3 }}>
          <span style={{
            fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
            padding: '2px 6px', borderRadius: 3,
            background: `${color}18`, color,
          }}>
            {label}
          </span>
        </div>
        <div style={{ fontSize: 13, color: T.textMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {report.filename}
        </div>
        <div style={{ fontSize: 12, color: T.textMute, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Clock size={10} /> 업로드: {fmtDate(report.uploadedAt)}
          {report.uploaderEmail && (
            <span style={{ marginLeft: 4, color: T.textMute }}>· {report.uploaderEmail}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button type="button"
          onClick={() => onSelect(report)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px', borderRadius: RADIUS.xs,
            background: `${color}18`, border: `1px solid ${color}40`,
            color, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_STACK,
          }}
        >
          조회 <ChevronRight size={11} />
        </button>

        {confirm ? (
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button"
              onClick={async () => { await deleteReport(report.id); onDelete(report.id); }}
              style={{ padding: '5px 8px', borderRadius: RADIUS.xs, background: T.redSoft, border: `1px solid ${T.red}40`, color: T.red, fontSize: 13, cursor: 'pointer', fontFamily: FONT_STACK }}
            >
              확인
            </button>
            <button type="button"
              onClick={() => setConfirm(false)}
              style={{ padding: '5px 8px', borderRadius: RADIUS.xs, background: T.card, border: `1px solid ${T.border}`, color: T.textDim, fontSize: 13, cursor: 'pointer', fontFamily: FONT_STACK }}
            >
              취소
            </button>
          </div>
        ) : (
          <button type="button"
            onClick={() => setConfirm(true)}
            style={{ padding: '5px 7px', borderRadius: RADIUS.xs, background: 'transparent', border: `1px solid ${T.border}`, color: T.textMute, cursor: 'pointer' }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function CalendarGrid({ year, month, byDate, selectedDate, onSelectDate }) {
  const todayKey = toDateKey(new Date());
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return (day >= 1 && day <= daysInMonth) ? day : null;
  });

  return (
    <div>
      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, padding: '0 0 6px',
            color: i === 0 ? T.red : i === 6 ? T.accent : T.textMute,
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 셀 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ aspectRatio: '1' }} />;

          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const reports = byDate[dateKey] || [];
          const isSelected = selectedDate === dateKey;
          const isToday = todayKey === dateKey;
          const hasData = reports.length > 0;

          return (
            <div
              key={dateKey}
              onClick={() => hasData && onSelectDate(isSelected ? null : dateKey)}
              style={{
                borderRadius: RADIUS.xs,
                padding: '6px 2px 5px',
                textAlign: 'center',
                cursor: hasData ? 'pointer' : 'default',
                background: isSelected ? T.accent : isToday ? `${T.accent}12` : 'transparent',
                border: isToday && !isSelected ? `1px solid ${T.accent}40` : '1px solid transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (hasData && !isSelected) e.currentTarget.style.background = T.bg2; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? `${T.accent}12` : 'transparent'; }}
            >
              <div style={{
                fontSize: 13, lineHeight: 1, fontFamily: MONO_STACK,
                fontWeight: isSelected || isToday ? 700 : 400,
                color: isSelected ? '#fff' : isToday ? T.accent : T.text,
              }}>
                {day}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4, minHeight: 7 }}>
                {reports.map(r => (
                  <span key={r.id} style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? 'rgba(255,255,255,0.8)' : typeColor(r.type),
                  }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoryView({ gfpReports, retailReports, autoReports, onSelectReport, onRefresh }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const allReports = useMemo(() => [
    ...gfpReports.map(r => ({ ...r, type: 'gfp' })),
    ...retailReports.map(r => ({ ...r, type: 'retail' })),
    ...autoReports.map(r => ({ ...r, type: 'auto' })),
  ], [gfpReports, retailReports, autoReports]);

  const byDate = useMemo(() => {
    const map = {};
    allReports.forEach(r => {
      const key = toDateKey(r.reportDate);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [allReports]);

  const selectedReports = selectedDate ? (byDate[selectedDate] || []) : [];

  const prevMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    setSelectedDate(null);
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const handleDelete = (id) => {
    const remaining = (byDate[selectedDate] || []).filter(r => r.id !== id).length;
    if (remaining === 0) setSelectedDate(null);
    onRefresh();
  };

  const counts = { gfp: gfpReports.length, retail: retailReports.length, auto: autoReports.length };

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>업로드 히스토리</h1>
        <p style={{ fontSize: 18, color: T.textDim }}>
          총 {allReports.length}개 보고서 저장됨 &middot;{' '}
          {Object.entries(REPORT_TYPES).map(([k, t]) => `${t.label} ${counts[k]}개`).join(' · ')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>

        {/* ── 달력 패널 ── */}
        <div style={{
          width: 296, flexShrink: 0,
          background: T.card, borderRadius: RADIUS.md, border: `1px solid ${T.border}`,
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button type="button" onClick={prevMonth} style={{
              width: 28, height: 28, borderRadius: RADIUS.xs,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.textDim, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text, fontFamily: MONO_STACK }}>
              {viewYear}년 {MONTH_NAMES[viewMonth]}
            </span>
            <button type="button" onClick={nextMonth} style={{
              width: 28, height: 28, borderRadius: RADIUS.xs,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.textDim, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ChevronRight size={14} />
            </button>
          </div>

          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            byDate={byDate}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* 범례 */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            {Object.entries(REPORT_TYPES).map(([key, t]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: T.textMute }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 우측 리스트 패널 ── */}
        <div style={{
          flex: 1,
          background: T.card, borderRadius: RADIUS.md, border: `1px solid ${T.border}`,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {selectedDate ? (
            <>
              <div style={{
                padding: '16px 20px', borderBottom: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'baseline', gap: 10,
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: T.text, fontFamily: MONO_STACK }}>
                  {fmtDate(selectedDate)}
                </span>
                <span style={{ fontSize: 13, color: T.textMute }}>
                  {selectedReports.length}개 파일
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {selectedReports.map(r => (
                  <ReportRow
                    key={r.id}
                    report={r}
                    onDelete={handleDelete}
                    onSelect={onSelectReport}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: T.textMute, padding: 40, textAlign: 'center',
            }}>
              <Calendar size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
              <div style={{ fontSize: 15, color: T.textDim }}>날짜를 선택하면 업로드 파일이 표시됩니다</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>점이 표시된 날짜를 클릭하세요</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
