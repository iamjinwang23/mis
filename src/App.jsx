import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from './theme.js';
import { listReports, onAuthStateChange, signOut, getProfile } from './db.js';
import { fmtDate } from './utils/formatters.js';
import Layout from './Layout.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import MyPage from './features/auth/MyPage.jsx';

// GFP pages
import Dashboard from './features/dashboard/Dashboard.jsx';
import GfpBranches from './features/dashboard/GfpBranches.jsx';
import GfpDb from './features/dashboard/GfpDb.jsx';
import GfpPersonnel from './features/dashboard/GfpPersonnel.jsx';

// Retail pages
import RetailDashboard from './features/retail/RetailDashboard.jsx';
import RetailExecution from './features/retail/RetailExecution.jsx';

// Auto pages
import AutoDashboard from './features/auto/AutoDashboard.jsx';
import AutoDetail from './features/auto/AutoDetail.jsx';

// Shared
import UploadView from './features/upload/UploadView.jsx';
import HistoryView from './features/history/HistoryView.jsx';
import CompareView from './features/compare/CompareView.jsx';

function DateSelect({ reports, selectedId, onSelect, color }) {
  if (!reports.length) return null;
  return (
    <select
      value={selectedId || ''}
      onChange={e => onSelect(e.target.value ? parseInt(e.target.value) : null)}
      style={{
        padding: '5px 8px', borderRadius: RADIUS.xs,
        background: T.card, border: `1px solid ${color}50`,
        color: T.text, fontSize: 15, fontFamily: MONO_STACK,
        cursor: 'pointer', outline: 'none',
      }}
    >
      {reports.map(r => (
        <option key={r.id} value={r.id}>{fmtDate(r.reportDate)}</option>
      ))}
    </select>
  );
}

function DateRangePicker({ reports, idFrom, idTo, onChangeFrom, onChangeTo, color }) {
  if (!reports.length) return null;

  const toReport = reports.find(r => r.id === idTo) || reports[0];
  const fromReport = reports.find(r => r.id === idFrom);

  const toDate = toReport ? new Date(toReport.reportDate) : null;
  const fromDate = fromReport ? new Date(fromReport.reportDate) : null;

  const fromReports = toDate ? reports.filter(r => new Date(r.reportDate) <= toDate) : reports;
  const toReports = fromDate ? reports.filter(r => new Date(r.reportDate) >= fromDate) : reports;

  const applyPreset = (days) => {
    const latest = reports[0];
    onChangeTo(latest.id);
    if (days === 0) {
      const prev = reports[1];
      if (prev) onChangeFrom(prev.id);
      return;
    }
    const target = new Date(latest.reportDate);
    target.setDate(target.getDate() - days);
    const closest = [...reports].sort((a, b) =>
      Math.abs(new Date(a.reportDate) - target) - Math.abs(new Date(b.reportDate) - target)
    )[0];
    onChangeFrom(closest?.id ?? latest.id);
  };

  const presets = [
    { label: '전일', days: 0 },
    { label: '7일', days: 7 },
    { label: '30일', days: 30 },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 13, color: T.textMute, fontWeight: 600 }}>기간</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {presets.map(p => (
          <button type="button"
            key={p.label}
            onClick={() => applyPreset(p.days)}
            style={{
              padding: '3px 9px', borderRadius: RADIUS.xs,
              background: T.bg2, border: `1px solid ${T.border}`,
              color: T.textDim, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: MONO_STACK,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <DateSelect reports={fromReports} selectedId={idFrom} onSelect={onChangeFrom} color={color} />
      <span style={{ fontSize: 13, color: T.textMute }}>~</span>
      <DateSelect reports={toReports} selectedId={idTo} onSelect={onChangeTo} color={color} />
    </div>
  );
}

function toLocalDateStr(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function isUploadedToday(reports) {
  const todayStr = toLocalDateStr(new Date());
  return reports.some(r => r.reportDate === todayStr);
}

function UploadStatusBar({ gfpOk, retailOk, autoOk }) {
  const today = new Date();
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${weekdays[today.getDay()]})`;

  const items = [
    { label: 'GFP 총괄',     ok: gfpOk,    color: T.accent  },
    { label: '리테일 사업부', ok: retailOk, color: T.purple  },
    { label: '자동차 보험',   ok: autoOk,   color: T.green   },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: T.textMute, fontFamily: MONO_STACK, fontWeight: 600 }}>
        {dateStr}
      </span>
      <div style={{ width: 1, height: 14, background: T.border }} />
      {items.map(item => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {item.ok
            ? <CheckCircle2 size={13} color={item.color} />
            : <Circle      size={13} color={T.textMute}  />
          }
          <span style={{
            fontSize: 12,
            color: item.ok ? item.color : T.textMute,
            fontFamily: FONT_STACK,
            fontWeight: item.ok ? 600 : 400,
          }}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const SECTION_META = {
  gfp:    { label: 'GFP 총괄',    color: T.accent,  emoji: '💼' },
  retail: { label: '리테일 사업부', color: T.purple,  emoji: '🏦' },
  auto:   { label: '자동차 보험',  color: T.green,   emoji: '🚗' },
};

function EmptyState({ section, onUpload }) {
  const meta = SECTION_META[section] || SECTION_META.auto;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', color: T.textMute, padding: 32, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: RADIUS.lg, margin: '0 auto 16px',
        background: `${meta.color}18`, color: meta.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
      }}>
        {meta.emoji}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: T.textDim, marginBottom: 8 }}>
        {meta.label} 보고서가 없습니다
      </div>
      <div style={{ fontSize: 18, marginBottom: 20 }}>
        파일을 업로드하면 대시보드가 활성화됩니다.
      </div>
      <button type="button"
        onClick={onUpload}
        style={{
          padding: '10px 20px', borderRadius: RADIUS.xs,
          background: meta.color, color: T.bg,
          fontSize: 18, fontWeight: 700, cursor: 'pointer',
          border: 'none', fontFamily: FONT_STACK,
        }}
      >
        파일 업로드 →
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [nav, setNav] = useState({ section: 'gfp', page: 'dashboard' });
  const [gfpReports, setGfpReports] = useState([]);
  const [autoReports, setAutoReports] = useState([]);
  const [retailReports, setRetailReports] = useState([]);
  const [selectedGfpId, setSelectedGfpId] = useState(null);
  const [selectedGfpIdFrom, setSelectedGfpIdFrom] = useState(null);
  const [selectedAutoId, setSelectedAutoId] = useState(null);
  const [selectedAutoIdFrom, setSelectedAutoIdFrom] = useState(null);
  const [selectedRetailId, setSelectedRetailId] = useState(null);
  const [selectedRetailIdFrom, setSelectedRetailIdFrom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const [gfp, auto, retail] = await Promise.all([listReports('gfp'), listReports('auto'), listReports('retail')]);
      setGfpReports(gfp);
      setAutoReports(auto);
      setRetailReports(retail);
      if (gfp.length && !selectedGfpId) setSelectedGfpId(gfp[0].id);
      if (gfp.length >= 2 && !selectedGfpIdFrom) setSelectedGfpIdFrom(gfp[1].id);
      if (auto.length && !selectedAutoId) setSelectedAutoId(auto[0].id);
      if (retail.length && !selectedRetailId) setSelectedRetailId(retail[0].id);
    } catch (err) {
      console.error('DB load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadReports();
      getProfile(user.email).then(setProfile).catch(console.error);
    } else {
      setProfile(null);
      setGfpReports([]);
      setAutoReports([]);
      setRetailReports([]);
    }
  }, [user]);

  // Font loading
  useEffect(() => {
    if (document.getElementById('mis-fonts')) return;
    const link = document.createElement('link');
    link.id = 'mis-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }, []);

  const handleNav = (newNav) => setNav(newNav);

  const showSnackbar = (message) => {
    setSnackbar(message);
    setTimeout(() => setSnackbar(null), 3000);
  };

  const handleUploaded = async (type, id) => {
    await loadReports();
    if (type === 'gfp') setSelectedGfpId(id);
    else if (type === 'retail') setSelectedRetailId(id);
    else setSelectedAutoId(id);
    const labels = { gfp: 'GFP 총괄', retail: '리테일 사업부', auto: '자동차 보험' };
    showSnackbar(`${labels[type] || type} 업로드 완료`);
  };

  const currentGfp = gfpReports.find(r => r.id === selectedGfpId) || gfpReports[0] || null;
  const prevGfp = gfpReports.find(r => r.id === selectedGfpIdFrom) || null;
  const currentAuto = autoReports.find(r => r.id === selectedAutoId) || autoReports[0] || null;
  const prevAuto = autoReports.find(r => r.id === selectedAutoIdFrom) || null;
  const currentRetail = retailReports.find(r => r.id === selectedRetailId) || retailReports[0] || null;

  const { section, page } = nav;

  const headerColor = section === 'gfp' ? T.accent : section === 'auto' ? T.green : section === 'retail' ? T.purple : T.textDim;
  const currentReports = section === 'gfp' ? gfpReports : section === 'auto' ? autoReports : section === 'retail' ? retailReports : [];
  const currentSelectedId = section === 'gfp' ? selectedGfpId : section === 'retail' ? selectedRetailId : selectedAutoId;
  const setCurrentSelectedId = section === 'gfp' ? setSelectedGfpId : section === 'retail' ? setSelectedRetailId : setSelectedAutoId;

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center', color: T.textDim }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.accent, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <div style={{ fontSize: 18 }}>로딩 중...</div>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>
      );
    }

    // Shared pages
    if (section === 'shared') {
      if (page === 'mypage') {
        return <MyPage profile={profile} />;
      }
      if (page === 'upload') {
        return <UploadView onUploaded={handleUploaded} canUpload={profile?.can_upload ?? false} />;
      }
      if (page === 'history') {
        return (
          <HistoryView
            gfpReports={gfpReports}
            retailReports={retailReports}
            autoReports={autoReports}
            onSelectReport={(r) => {
              if (r.type === 'gfp') {
                setSelectedGfpId(r.id);
                setNav({ section: 'gfp', page: 'dashboard' });
              } else if (r.type === 'retail') {
                setSelectedRetailId(r.id);
                setNav({ section: 'retail', page: 'dashboard' });
              } else if (r.type === 'auto') {
                setSelectedAutoId(r.id);
                setNav({ section: 'auto', page: 'dashboard' });
              }
            }}
            onRefresh={loadReports}
          />
        );
      }
      if (page === 'compare') {
        return <CompareView gfpReports={gfpReports} retailReports={retailReports} autoReports={autoReports} />;
      }
    }

    // GFP pages
    if (section === 'gfp') {
      if (!currentGfp) {
        return <EmptyState section="gfp" onUpload={() => setNav({ section: 'shared', page: 'upload' })} />;
      }
      if (page === 'dashboard') return <Dashboard data={currentGfp.data} prevData={prevGfp?.data || null} allReports={gfpReports} />;
      if (page === 'branches') return <GfpBranches report={currentGfp} />;
      if (page === 'personnel') return <GfpPersonnel report={currentGfp} />;
      if (page === 'db') return <GfpDb report={currentGfp} />;
    }

    // Retail pages
    if (section === 'retail') {
      if (!currentRetail) {
        return <EmptyState section="retail" onUpload={() => setNav({ section: 'shared', page: 'upload' })} />;
      }
      if (page === 'dashboard') return <RetailDashboard report={currentRetail} />;
      if (page === 'execution') return <RetailExecution report={currentRetail} />;
    }

    // Auto pages
    if (section === 'auto') {
      if (!currentAuto) {
        return <EmptyState section="auto" onUpload={() => setNav({ section: 'shared', page: 'upload' })} />;
      }
      if (page === 'dashboard') {
        return <AutoDashboard report={currentAuto} prevReport={prevAuto} allReports={autoReports} onNavigate={(p) => setNav({ section: 'auto', page: p })} />;
      }
      if (['tm', 'contract', 'dealer', 'permission'].includes(page)) {
        return <AutoDetail page={page} report={currentAuto} />;
      }
    }

    return null;
  };

  if (!authReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bg }}>
        <div style={{ textAlign: 'center', color: T.textDim }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.border}`, borderTopColor: T.accent, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <Layout
      nav={nav}
      onNav={handleNav}
      gfpCount={gfpReports.length}
      autoCount={autoReports.length}
      retailCount={retailReports.length}
      user={user}
      profile={profile}
      onLogout={async () => { await signOut(); }}
      onMyPage={() => setNav({ section: 'shared', page: 'mypage' })}
    >
      {snackbar && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, padding: '12px 24px', borderRadius: RADIUS.md,
          background: T.green, color: '#fff',
          fontSize: 15, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
          animation: 'fadeInUp 0.2s ease',
        }}>
          {snackbar}
          <style>{`@keyframes fadeInUp { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
        </div>
      )}
      {/* Top bar - always visible */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: `${T.bg}ee`, backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <UploadStatusBar
          gfpOk={isUploadedToday(gfpReports)}
          retailOk={isUploadedToday(retailReports)}
          autoOk={isUploadedToday(autoReports)}
        />
        {(section === 'gfp' || section === 'auto' || section === 'retail') && currentReports.length > 0 && (
          section === 'gfp' ? (
            <DateRangePicker
              reports={gfpReports}
              idFrom={selectedGfpIdFrom}
              idTo={selectedGfpId}
              onChangeFrom={setSelectedGfpIdFrom}
              onChangeTo={setSelectedGfpId}
              color={headerColor}
            />
          ) : section === 'retail' ? (
            <DateRangePicker
              reports={retailReports}
              idFrom={selectedRetailIdFrom}
              idTo={selectedRetailId}
              onChangeFrom={setSelectedRetailIdFrom}
              onChangeTo={setSelectedRetailId}
              color={headerColor}
            />
          ) : (
            <DateRangePicker
              reports={autoReports}
              idFrom={selectedAutoIdFrom}
              idTo={selectedAutoId}
              onChangeFrom={setSelectedAutoIdFrom}
              onChangeTo={setSelectedAutoId}
              color={headerColor}
            />
          )
        )}
      </div>

      {renderContent()}
    </Layout>
  );
}
