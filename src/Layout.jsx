import { useState } from 'react';
import { T, FONT_STACK, MONO_STACK } from './theme.js';
import {
  LayoutDashboard, Building2, Database, Users,
  Phone, FileText, Truck, Lock,
  Upload, History, GitCompare,
  ChevronRight, Menu, X, List,
  LogOut,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    key: 'gfp',
    label: 'GFP 총괄',
    color: '#3e8fd4',
    pages: [
      { key: 'dashboard', label: '메인 대시보드', icon: LayoutDashboard, category: '실적' },
      { key: 'branches',  label: '지점별 실적',   icon: Building2,       category: '실적' },
      { key: 'personnel', label: '인원 현황',      icon: Users,           category: '인원' },
      { key: 'db',        label: 'DB 현황',        icon: Database,        category: 'DB'   },
    ],
  },
  {
    key: 'auto',
    label: '자동차 보험',
    color: T.green,
    pages: [
      { key: 'dashboard', label: '메인 대시보드', icon: LayoutDashboard },
      { key: 'tm', label: 'TM 호전환', icon: Phone },
      { key: 'contract', label: '계약실', icon: FileText },
      { key: 'dealer', label: '딜러', icon: Truck },
      { key: 'permission', label: '퍼미션실', icon: Lock },
    ],
  },
  {
    key: 'retail',
    label: '리테일 사업부',
    color: T.purple,
    pages: [
      { key: 'dashboard', label: '메인 대시보드', icon: LayoutDashboard },
      { key: 'execution', label: '실행내역', icon: List },
    ],
  },
];

const SHARED_NAV = [
  { key: 'upload', label: '파일 업로드', icon: Upload, section: 'shared' },
  { key: 'history', label: '업로드 히스토리', icon: History, section: 'shared' },
  { key: 'compare', label: '날짜 비교', icon: GitCompare, section: 'shared' },
];

const LNB_W = 224;

const D = {
  bg: '#16202a',
  border: 'rgba(255,255,255,0.08)',
  text: 'rgba(255,255,255,0.92)',
  textDim: 'rgba(255,255,255,0.70)',
  textMute: 'rgba(255,255,255,0.38)',
  itemBg: 'rgba(255,255,255,0.07)',
};

export default function Layout({ nav, onNav, gfpCount, autoCount, retailCount, user, profile, onLogout, onMyPage, children }) {
  const { section, page } = nav;
  const [lnbOpen, setLnbOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: T.bg, fontFamily: FONT_STACK }}>
      {/* 모바일 오버레이 */}
      {lnbOpen && (
        <div
          className="lnb-overlay"
          onClick={() => setLnbOpen(false)}
          style={{
            display: 'none',
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
          }}
        />
      )}
      {/* 모바일 햄버거 */}
      <button
        type="button"
        onClick={() => setLnbOpen(o => !o)}
        style={{
          display: 'none',
          position: 'fixed', top: 12, left: 12, zIndex: 200,
          width: 36, height: 36, borderRadius: 8,
          background: D.bg, border: 'none',
          color: D.text, cursor: 'pointer',
          alignItems: 'center', justifyContent: 'center',
        }}
        className="lnb-toggle"
      >
        {lnbOpen ? <X size={18} /> : <Menu size={18} />}
      </button>
      <style>{`
        @media (max-width: 768px) {
          .lnb-toggle { display: flex !important; }
          .lnb-overlay { display: block !important; }
          .lnb-aside { transform: translateX(${lnbOpen ? '0' : '-100%'}); transition: transform 0.25s ease; }
          .main-content { margin-left: 0 !important; }
        }
      `}</style>
      {/* LNB */}
      <aside className="lnb-aside" style={{
        width: LNB_W,
        flexShrink: 0,
        background: D.bg,
        borderRight: `1px solid ${D.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: `1px solid ${D.border}` }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontFamily: MONO_STACK, marginBottom: 14 }}>
            일일업무보고 시스템(MIS)
          </div>
          <img src="/logo.png" alt="MIS" style={{ height: 32, objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Section nav */}
        <nav style={{ flex: 1, padding: '8px 0' }}>
          {NAV_SECTIONS.map(sec => (
            <div key={sec.key} style={{ marginBottom: 16 }}>
              {/* Section header */}
              <div style={{
                padding: '8px 16px 4px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 11 }}>{sec.icon}</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: section === sec.key ? sec.color : D.textDim,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}>
                  {sec.label}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontFamily: MONO_STACK,
                  color: D.textMute,
                  background: D.itemBg,
                  padding: '1px 5px',
                  borderRadius: 3,
                }}>
                  {sec.key === 'gfp' ? gfpCount : sec.key === 'retail' ? retailCount : autoCount}
                </span>
              </div>

              {/* Page items — grouped by category when present */}
              {(() => {
                const groups = sec.pages.reduce((acc, pg) => {
                  const cat = pg.category || '';
                  const last = acc[acc.length - 1];
                  if (last && last.cat === cat) { last.pgs.push(pg); }
                  else { acc.push({ cat, pgs: [pg] }); }
                  return acc;
                }, []);

                return groups.map(({ cat, pgs }) => (
                  <div key={cat || '__none__'}>
                    {cat && (
                      <div style={{
                        padding: '6px 16px 2px 22px',
                        fontSize: 10, fontWeight: 700, color: D.textMute,
                        letterSpacing: '0.09em', textTransform: 'uppercase',
                      }}>
                        {cat}
                      </div>
                    )}
                    {pgs.map(pg => {
                      const isActive = section === sec.key && page === pg.key;
                      const Icon = pg.icon;
                      return (
                        <button type="button"
                          key={pg.key}
                          onClick={() => onNav({ section: sec.key, page: pg.key })}
                          style={{
                            width: '100%',
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 16px 7px 20px',
                            border: 'none',
                            background: isActive ? `${sec.color}18` : 'transparent',
                            color: isActive ? sec.color : D.textDim,
                            cursor: 'pointer', textAlign: 'left',
                            fontSize: 15, fontFamily: FONT_STACK,
                            fontWeight: isActive ? 600 : 400,
                            transition: 'all 0.15s',
                            borderLeft: isActive ? `2px solid ${sec.color}` : '2px solid transparent',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = D.itemBg;
                              e.currentTarget.style.color = D.text;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = D.textDim;
                            }
                          }}
                        >
                          <Icon size={14} strokeWidth={isActive ? 2.5 : 1.8} />
                          <span>{pg.label}</span>
                          {isActive && <ChevronRight size={11} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          ))}

          {/* Divider */}
          <div style={{ margin: '8px 16px', borderTop: `1px solid ${D.border}` }} />

          {/* Shared nav */}
          {SHARED_NAV.map(item => {
            const isActive = section === 'shared' && page === item.key;
            const Icon = item.icon;
            return (
              <button type="button"
                key={item.key}
                onClick={() => onNav({ section: 'shared', page: item.key })}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 16px',
                  border: 'none',
                  background: isActive ? D.itemBg : 'transparent',
                  color: isActive ? D.text : D.textDim,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 15,
                  fontFamily: FONT_STACK,
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = D.itemBg;
                    e.currentTarget.style.color = D.text;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = D.textDim;
                  }
                }}
              >
                <Icon size={14} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer — 계정 영역 */}
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${D.border}` }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {/* 클릭 → 마이페이지 */}
              <button
                type="button"
                onClick={onMyPage}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 6, textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = D.itemBg; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(62,143,212,0.25)', color: '#3e8fd4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                }}>
                  {(profile?.name ?? user.email)?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: D.text, lineHeight: 1.2, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {profile ? `${profile.name} ${profile.position}` : user.email}
                  </div>
                  {profile && (
                    <div style={{ fontSize: 10, color: D.textMute, fontFamily: MONO_STACK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                  )}
                </div>
              </button>
              {/* 로그아웃 */}
              <button
                type="button"
                onClick={onLogout}
                title="로그아웃"
                style={{
                  flexShrink: 0, padding: 5, borderRadius: 4, border: 'none',
                  background: 'transparent', color: D.textMute,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e05252'; }}
                onMouseLeave={e => { e.currentTarget.style.color = D.textMute; }}
              >
                <LogOut size={13} />
              </button>
            </div>
          )}
          <div style={{ fontSize: 10, color: D.textMute, fontFamily: MONO_STACK, paddingLeft: 2 }}>
            Cloud · Supabase
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" style={{ marginLeft: LNB_W, flex: 1, minHeight: '100vh', color: T.text }}>
        {children}
      </main>
    </div>
  );
}
