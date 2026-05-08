import { useState } from 'react';
import { Phone, FileText, Truck, Lock } from 'lucide-react';
import SortHead from '../../components/SortHead.jsx';
import { T, FONT_STACK, MONO_STACK, RADIUS, SHADOW } from '../../theme.js';
import { fmtNum, fmtDate } from '../../utils/formatters.js';
import Card from '../../components/Card.jsx';

const STATUS_COLOR = {
  '재직': T.green,
  '주말': T.blue,
  '퇴사예정': T.yellow,
  '퇴사': T.textMute,
  '1차디비': T.purple,
  '신풍': T.purple,
};



function AgentTable({ agents, columns, groupByManager = false }) {
  const [sortKey, setSortKey] = useState(null); // null = 원본 순서 유지
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (k) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const active = agents.filter(a => a.status === '재직' || a.status === '주말');
  const inactive = agents.filter(a => a.status !== '재직' && a.status !== '주말');

  const applySortToList = (list) => {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  };

  // 관리자 그룹화 (TM호전환 전용)
  const buildGroupedRows = (list) => {
    const groups = [];
    let currentMgr = null;
    list.forEach(agent => {
      if (agent.subManager !== currentMgr) {
        currentMgr = agent.subManager;
        groups.push({ type: 'header', label: currentMgr || '미지정' });
      }
      groups.push({ type: 'agent', agent });
    });
    return groups;
  };

  const renderAgentRow = (agent, dim = false, i) => (
    <tr key={`${agent.name}-${i}`}
      style={{ borderBottom: `1px solid ${T.border}`, opacity: dim ? 0.5 : 1 }}
      onMouseEnter={e => e.currentTarget.style.background = T.cardHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '10px 14px', fontSize: 18, fontWeight: 500, color: T.text }}>
        {agent.name}
      </td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{
          fontSize: 13, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
          background: `${STATUS_COLOR[agent.status] || T.textMute}18`,
          color: STATUS_COLOR[agent.status] || T.textMute,
        }}>
          {agent.status}
        </span>
      </td>
      {columns.map(col => (
        <td key={col.key} style={{
          padding: '10px 14px', textAlign: 'right',
          fontFamily: MONO_STACK, fontSize: 18,
          color: col.highlight && agent[col.key] > 0 ? col.highlight : T.text,
          fontWeight: agent[col.key] > 0 ? 600 : 400,
        }}>
          {agent[col.key] > 0 ? fmtNum(agent[col.key]) : <span style={{ color: T.textMute }}>-</span>}
        </td>
      ))}
    </tr>
  );

  const colCount = 2 + columns.length; // 담당자 + 상태 + 지표들

  const renderActive = () => {
    if (groupByManager && !sortKey) {
      // 관리자별 그룹 헤더 표시 (정렬 없을 때만)
      const grouped = buildGroupedRows(active);
      return grouped.map((item, i) => {
        if (item.type === 'header') {
          return (
            <tr key={`mgr-${item.label}-${i}`}>
              <td colSpan={colCount} style={{
                padding: '8px 14px', fontSize: 13, fontWeight: 700,
                color: T.accent, background: `${T.accent}0a`,
                borderBottom: `1px solid ${T.border}`,
                borderTop: i > 0 ? `1px solid ${T.border}` : undefined,
                letterSpacing: '0.03em',
              }}>
                ▸ {item.label} 관리자
              </td>
            </tr>
          );
        }
        return renderAgentRow(item.agent, false, i);
      });
    }
    return applySortToList(active).map((agent, i) => renderAgentRow(agent, false, i));
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
            <SortHead k="name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} padding="10px 14px" align="left">담당자</SortHead>
            <th style={{ padding: '10px 14px', textAlign: 'left', color: T.textDim, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>상태</th>
            {columns.map(col => (
              <SortHead key={col.key} k={col.key} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
                {col.label}
              </SortHead>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderActive()}
          {inactive.length > 0 && (
            <>
              <tr>
                <td colSpan={colCount} style={{ padding: '6px 14px', fontSize: 13, color: T.textMute, background: T.bg2, borderBottom: `1px solid ${T.border}` }}>
                  퇴사·퇴사예정 ({inactive.length}명)
                </td>
              </tr>
              {applySortToList(inactive).map((agent, i) => renderAgentRow(agent, true, i))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ title, color, icon: Icon, data, columns, summaryFields, groupByManager = false }) {
  if (!data) return null;
  const activeCount = data.agents?.filter(a => a.status === '재직' || a.status === '주말').length || 0;

  // 섹션 관리자 + agents의 subManager를 합쳐 중복 없이 표시
  const allManagers = (() => {
    const set = new Set();
    if (data.manager) set.add(data.manager);
    data.agents?.forEach(a => { if (a.subManager) set.add(a.subManager); });
    return [...set];
  })();

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Markdown-style section header */}
      <div style={{
        padding: '16px 20px',
        borderLeft: `3px solid ${color}`,
        background: `${color}0a`,
        borderRadius: `0 ${RADIUS.sm}px ${RADIUS.sm}px 0`,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: RADIUS.sm,
            background: `${color}20`, color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 13, color: T.textMute, margin: 0, fontFamily: MONO_STACK }}>
              관리자: {allManagers.length > 0 ? allManagers.join(' · ') : '-'} · 재직 {activeCount}명
            </p>
          </div>
        </div>
      </div>

      {/* Summary boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
        {summaryFields.map(f => (
          <div key={f.key} style={{
            padding: '12px 14px', borderRadius: RADIUS.sm,
            background: T.card, border: `1px solid ${T.border}`,
          }}>
            <div style={{ fontSize: 13, color: T.textMute, marginBottom: 4 }}>{f.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: MONO_STACK, color: data[f.key] > 0 ? color : T.textMute }}>
              {f.fmt ? f.fmt(data[f.key]) : fmtNum(data[f.key])}
            </div>
          </div>
        ))}
      </div>

      {/* Agent table */}
      {data.agents?.length > 0 ? (
        <Card style={{ overflow: 'hidden' }}>
          <AgentTable agents={data.agents} columns={columns} groupByManager={groupByManager} />
        </Card>
      ) : (
        <div style={{ padding: 20, color: T.textMute, fontSize: 18 }}>담당자 데이터 없음</div>
      )}
    </div>
  );
}

export default function AutoDetail({ page, report }) {
  const { reportDate, sections } = report.data;
  const s = sections || {};

  const headerDate = fmtDate(reportDate);

  if (page === 'tm') {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>TM 호전환</h1>
          <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{headerDate} 기준</p>
        </div>

        {/* Markdown-style intro */}
        <div style={{
          padding: '14px 16px', borderRadius: RADIUS.sm,
          background: `${T.accent}0a`, border: `1px solid ${T.accent}20`,
          marginBottom: 24, fontSize: 18, color: T.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: T.accent }}>TM 호전환</strong>은 텔레마케팅을 통해 갱신 DB를 분배받아 운전자 연결 및 보장분석·1차 호전환 성공건을 창출하는 부서입니다.
          성공률 = TM 신규 성공 / 영업인원 기준으로 산출됩니다.
        </div>

        <SectionBlock
          title="TM 호전환"
          color={T.accent}
          icon={Phone}
          data={s.tmHoJeon}
          summaryFields={[
            { key: 'sales', label: '영업인원' },
            { key: 'renewalDb', label: '갱신 DB 보유' },
            { key: 'newDb', label: '신규 DB' },
            { key: 'assigned', label: '갱신 분배' },
            { key: 'driverConnect', label: '운전자 연결' },
            { key: 'coverage', label: '보장 분석' },
            { key: 'success1st', label: '1차 호전환' },
            { key: 'successRate', label: 'TM 성공률', fmt: v => `${(v * 100).toFixed(1)}%` },
          ]}
          columns={[
            { key: 'assigned', label: '갱신분배', highlight: T.blue },
            { key: 'driverConnect', label: '운전자연결', highlight: T.accent },
            { key: 'coverage', label: '보장분석', highlight: T.green },
            { key: 'success1st', label: '1차호전환', highlight: T.purple },
          ]}
        />
      </div>
    );
  }

  if (page === 'contract') {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>계약실</h1>
          <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{headerDate} 기준</p>
        </div>
        <div style={{
          padding: '14px 16px', borderRadius: RADIUS.sm,
          background: `${T.blue}0a`, border: `1px solid ${T.blue}20`,
          marginBottom: 24, fontSize: 18, color: T.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: T.blue }}>계약실</strong>은 갱신 DB를 분배받아 보장분석을 통해 계약을 성사시키는 부서입니다.
        </div>
        <SectionBlock
          title="계약실"
          color={T.blue}
          icon={FileText}
          data={s.contract}
          summaryFields={[
            { key: 'sales', label: '영업인원' },
            { key: 'renewalDb', label: '갱신 DB 보유' },
            { key: 'newDb', label: '신규 DB' },
            { key: 'assigned', label: '갱신 분배' },
            { key: 'coverage', label: '보장 분석' },
          ]}
          columns={[
            { key: 'newDb', label: '신규DB', highlight: T.accent },
            { key: 'assigned', label: '갱신분배', highlight: T.blue },
            { key: 'coverage', label: '보장분석', highlight: T.green },
          ]}
        />
      </div>
    );
  }

  if (page === 'dealer') {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>딜러</h1>
          <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{headerDate} 기준</p>
        </div>
        <div style={{
          padding: '14px 16px', borderRadius: RADIUS.sm,
          background: `${T.green}0a`, border: `1px solid ${T.green}20`,
          marginBottom: 24, fontSize: 18, color: T.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: T.green }}>딜러 부서</strong>는 신규 및 갱신 차량 관련 보험 계약을 담당합니다.
          신규실은 신규 DB 중심, 갱신실은 갱신 DB 중심으로 운영됩니다.
        </div>
        <SectionBlock
          title="딜러 신규실"
          color={T.green}
          icon={Truck}
          data={s.dealerNew}
          summaryFields={[
            { key: 'sales', label: '영업인원' },
            { key: 'newDb', label: '신규 DB' },
            { key: 'driverConnect', label: '운전자 연결' },
            { key: 'coverage', label: '보장 분석' },
            { key: 'success1st', label: '계약 건수' },
          ]}
          columns={[
            { key: 'driverConnect', label: '운전자연결', highlight: T.accent },
            { key: 'coverage', label: '보장분석', highlight: T.green },
            { key: 'success1st', label: '계약', highlight: T.purple },
          ]}
        />
        <SectionBlock
          title="딜러 갱신실"
          color={T.yellow}
          icon={Truck}
          data={s.dealerRenewal}
          summaryFields={[
            { key: 'sales', label: '영업인원' },
            { key: 'renewalDb', label: '갱신 DB 보유' },
            { key: 'assigned', label: '갱신 분배' },
            { key: 'driverConnect', label: '운전자 연결' },
            { key: 'coverage', label: '보장 분석' },
            { key: 'success1st', label: '1차 호전환' },
          ]}
          columns={[
            { key: 'assigned', label: '갱신분배', highlight: T.blue },
            { key: 'driverConnect', label: '운전자연결', highlight: T.accent },
            { key: 'coverage', label: '보장분석', highlight: T.green },
            { key: 'success1st', label: '1차호전환', highlight: T.purple },
          ]}
        />
      </div>
    );
  }

  if (page === 'permission') {
    return (
      <div className="page-wrap">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>퍼미션실</h1>
          <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>{headerDate} 기준</p>
        </div>
        <div style={{
          padding: '14px 16px', borderRadius: RADIUS.sm,
          background: `${T.purple}0a`, border: `1px solid ${T.purple}20`,
          marginBottom: 24, fontSize: 18, color: T.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: T.purple }}>퍼미션실</strong>은 퍼미션(동의) DB를 배분받아 보장분석을 진행하는 부서입니다.
          대용량 DB를 처리하며 보장분석 건수가 핵심 KPI입니다.
        </div>
        <SectionBlock
          title="퍼미션실"
          color={T.purple}
          icon={Lock}
          data={s.permission}
          summaryFields={[
            { key: 'sales', label: '영업인원' },
            { key: 'assigned', label: '갱신 분배' },
            { key: 'coverage', label: '보장 분석' },
          ]}
          columns={[
            { key: 'assigned', label: '배분수량', highlight: T.blue },
            { key: 'coverage', label: '보장분석', highlight: T.purple },
          ]}
        />
      </div>
    );
  }

  return null;
}
