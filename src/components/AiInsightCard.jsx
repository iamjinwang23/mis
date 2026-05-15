import { RefreshCw, AlertTriangle, TrendingUp, Lightbulb, Activity } from 'lucide-react';
import { RADIUS, FONT_STACK, MONO_STACK } from '../theme.js';

const ITEMS = [
  { key: 'diagnosis', label: '진단',   icon: Activity,      color: '#6366f1' },
  { key: 'risk',      label: '리스크', icon: AlertTriangle,  color: '#f43f5e' },
  { key: 'forecast',  label: '예측',   icon: TrendingUp,     color: '#10b981' },
  { key: 'action',    label: '처방',   icon: Lightbulb,      color: '#f59e0b' },
];

const GRADIENT = 'linear-gradient(135deg, #c084fc 0%, #818cf8 40%, #38bdf8 100%)';

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
      {ITEMS.map(item => (
        <div key={item.key} style={{
          padding: '12px 14px', borderRadius: RADIUS.sm,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 4, background: '#e2e8f0' }} />
            <div style={{ width: 32, height: 13, borderRadius: 3, background: '#e2e8f0' }} />
          </div>
          <div style={{ height: 12, borderRadius: 3, background: '#e2e8f0', marginBottom: 6 }} />
          <div style={{ height: 12, borderRadius: 3, background: '#e2e8f0', width: '65%' }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }`}</style>
    </div>
  );
}

export default function AiInsightCard({ insight, loading, error, onRefresh, reportDate }) {
  const isNoKey = error?.includes('VITE_GEMINI_API_KEY');

  return (
    <div style={{
      marginBottom: 24,
      padding: 2,
      borderRadius: RADIUS.lg + 2,
      background: GRADIENT,
      boxShadow: '0 0 24px rgba(129,140,248,0.18), 0 2px 8px rgba(192,132,252,0.12)',
    }}>
      <div style={{
        borderRadius: RADIUS.lg,
        background: '#ffffff',
        padding: '16px 20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* 스파클 아이콘 */}
            <SparkleIcon size={28} />
            <span style={{
              fontSize: 18, fontWeight: 800, fontFamily: FONT_STACK,
              background: GRADIENT,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
            }}>
              AI 인사이트
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {reportDate && (
              <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: MONO_STACK }}>
                {reportDate} 기준
              </span>
            )}
            <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: RADIUS.pill,
              border: 'none',
              background: loading ? '#e2e8f0' : GRADIENT,
              color: loading ? '#94a3b8' : '#fff',
              fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: FONT_STACK, transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
              boxShadow: loading ? 'none' : '0 2px 8px rgba(129,140,248,0.3)',
            }}
          >
            <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            새로고침
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(192,132,252,0.25) 0%, rgba(56,189,248,0.25) 100%)', marginBottom: 14 }} />

        {/* Body */}
        {loading && !insight && <Skeleton />}

        {error && !isNoKey && (
          <div style={{
            padding: '10px 14px', borderRadius: RADIUS.sm,
            background: '#fff1f2', border: '1px solid #fecdd3',
            fontSize: 13, color: '#e11d48', fontFamily: FONT_STACK,
          }}>
            ⚠ {error}
          </div>
        )}

        {isNoKey && (
          <div style={{
            padding: '10px 14px', borderRadius: RADIUS.sm,
            background: '#fffbeb', border: '1px solid #fde68a',
            fontSize: 13, color: '#92400e', fontFamily: FONT_STACK,
          }}>
            <strong>API 키 미설정</strong>
            {' '}— .env.local에 <code style={{ fontFamily: MONO_STACK, background: '#fef3c7', padding: '1px 5px', borderRadius: 3 }}>VITE_GEMINI_API_KEY=...</code> 를 추가하세요.
          </div>
        )}

        {insight && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
            opacity: loading ? 0.5 : 1,
            transition: 'opacity 0.3s',
          }}>
            {ITEMS.map(item => {
              const Icon = item.icon;
              const text = insight[item.key];
              if (!text) return null;
              return (
                <div key={item.key} style={{
                  padding: '12px 14px',
                  borderRadius: RADIUS.sm,
                  background: `${item.color}08`,
                  border: `1px solid ${item.color}22`,
                  display: 'flex', flexDirection: 'column', gap: 7,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                      background: `${item.color}15`, color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={12} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, fontFamily: FONT_STACK,
                      color: item.color, letterSpacing: '0.03em',
                      textTransform: 'uppercase',
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 13, color: '#1e293b',
                    lineHeight: 1.6, fontFamily: FONT_STACK,
                  }}>
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SparkleIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-5.74L4 10l5.91-1.74L12 2z" fill="url(#sg)" />
      <path d="M5 3l.74 2.26L8 6l-2.26.74L5 9l-.74-2.26L2 6l2.26-.74L5 3z" fill="url(#sg)" opacity="0.6" />
      <path d="M19 13l.74 2.26L22 16l-2.26.74L19 19l-.74-2.26L16 16l2.26-.74L19 13z" fill="url(#sg)" opacity="0.5" />
    </svg>
  );
}
