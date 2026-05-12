import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { fmtNum, fmtPct, fmtMan, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import BranchDetailPanel from './BranchDetailPanel.jsx';
import SortHead from '../../components/SortHead.jsx';



export default function GfpBranches({ report }) {
  const { reportDate, branches, summary } = report.data;
  const [sortKey, setSortKey] = useState('achieve');
  const [sortDir, setSortDir] = useState('desc');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState(null);

  const filtered = useMemo(() => {
    let list = [...branches];
    if (filterType === 'direct') list = list.filter(b => b.isDirect);
    else if (filterType === 'branch') list = list.filter(b => !b.isDirect);
    else if (filterType === 'active') list = list.filter(b => b.count > 0);
    else if (filterType === 'inactive') list = list.filter(b => b.count === 0);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        (b.name || '').toLowerCase().includes(q) ||
        (b.manager || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [branches, sortKey, sortDir, search, filterType]);

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const sortProps = { sortKey, sortDir, onSort: handleSort };

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>지점별 실적</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{fmtDate(reportDate)} 기준</p>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 18, color: T.textDim }}>
              전체 <strong style={{ color: T.text }}>{branches.length}</strong>곳 · 표시 <strong style={{ color: T.text }}>{filtered.length}</strong>곳
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: RADIUS.xs, background: T.bg2, border: `1px solid ${T.border}`, minWidth: 200 }}>
              <Search size={13} style={{ color: T.textMute }} />
              <input
                type="text" placeholder="지점명·관리자 검색"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: T.text, fontSize: 18, flex: 1, fontFamily: FONT_STACK }}
              />
              {search && <X size={13} style={{ color: T.textMute, cursor: 'pointer' }} onClick={() => setSearch('')} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: '전체', count: branches.length },
              { key: 'direct', label: '직영', count: branches.filter(b => b.isDirect).length },
              { key: 'branch', label: '지사', count: branches.filter(b => !b.isDirect).length },
              { key: 'active', label: '실적O', count: branches.filter(b => b.count > 0).length },
              { key: 'inactive', label: '실적X', count: branches.filter(b => b.count === 0).length },
            ].map(f => (
              <button type="button" key={f.key} onClick={() => setFilterType(f.key)} style={{
                padding: '5px 10px', borderRadius: RADIUS.xs, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                background: filterType === f.key ? T.accent : T.bg2,
                color: filterType === f.key ? T.bg : T.textDim,
                border: `1px solid ${filterType === f.key ? T.accent : T.border}`,
                fontFamily: FONT_STACK,
              }}>
                {f.label} <span style={{ opacity: 0.7, fontFamily: MONO_STACK }}>{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                <th style={{ padding: '12px 14px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>구분</th>
                <SortHead k="name" {...sortProps} align="left">지점명</SortHead>
                <SortHead k="manager" {...sortProps} align="left">관리자</SortHead>
                <SortHead k="count" {...sortProps}>건수</SortHead>
                <SortHead k="monthly" {...sortProps}>당월P</SortHead>
                <SortHead k="target" {...sortProps}>목표</SortHead>
                <SortHead k="achieve" {...sortProps}>달성율</SortHead>
                <SortHead k="headcount" {...sortProps}>재적</SortHead>
                <SortHead k="hire" {...sortProps}>위촉</SortHead>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const isSelected = selectedBranch?.name === b.name;
                return (
                  <tr
                    key={`${b.no}-${b.name}-${i}`}
                    onClick={() => setSelectedBranch(isSelected ? null : b)}
                    style={{
                      borderBottom: `1px solid ${T.border}`,
                      background: isSelected ? `${T.accent}0a` : 'transparent',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.cardHover; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>
                      <span style={{ padding: '2px 6px', borderRadius: 3, background: b.isDirect ? `${T.accent}18` : `${T.green}18`, color: b.isDirect ? T.accent : T.green, fontWeight: 700 }}>
                        {b.isDirect ? '직영' : '지사'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 15, fontWeight: isSelected ? 700 : 500, color: isSelected ? T.accent : T.text }}>{b.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 15, color: T.textDim }}>{b.manager || '-'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtNum(b.count)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtMan(b.monthly)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, color: T.textDim }}>{fmtMan(b.target)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                        <div style={{ width: 52 }}>
                          <ProgressBar value={b.achieve} color={b.achieve >= 1 ? T.green : b.achieve >= 0.5 ? T.accent : b.achieve > 0 ? T.yellow : T.textMute} height={4} />
                        </div>
                        <span style={{ fontFamily: MONO_STACK, fontSize: 15, fontWeight: 600, minWidth: 48, textAlign: 'right', color: b.achieve >= 1 ? T.green : b.achieve >= 0.5 ? T.text : b.achieve > 0 ? T.yellow : T.textMute }}>
                          {fmtPct(b.achieve)}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15 }}>{fmtNum(b.headcount)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: MONO_STACK, fontSize: 15, color: b.hire > 0 ? T.green : T.textMute }}>
                      {b.hire > 0 ? `+${fmtNum(b.hire)}` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMute, fontSize: 18 }}>
              조건에 맞는 지점이 없습니다.
            </div>
          )}
        </div>
      </Card>

      {selectedBranch && (
        <BranchDetailPanel branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      )}
    </div>
  );
}
