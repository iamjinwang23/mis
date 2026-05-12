import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { signIn } from '../../db.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: RADIUS.xs,
    background: T.bg2, border: `1px solid ${T.border}`,
    color: T.text, fontSize: 15, fontFamily: FONT_STACK,
    outline: 'none', transition: 'border-color 0.15s',
  };

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: T.textDim, marginBottom: 6, letterSpacing: '0.04em',
  };

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_STACK,
    }}>
      <div style={{
        width: 360, background: T.card,
        borderRadius: RADIUS.lg, border: `1px solid ${T.border}`,
        padding: '40px 32px',
        boxShadow: '0 8px 32px rgba(26,39,68,0.10)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="MIS"
            style={{ height: 32, objectFit: 'contain', marginBottom: 14, opacity: 0.7 }}
          />
          <div style={{ fontSize: 11, color: T.textMute, fontFamily: MONO_STACK, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            일일업무보고 시스템
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>이메일</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = `${T.border}`; }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = `${T.border}`; }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 12px', borderRadius: RADIUS.xs,
              background: T.redSoft, border: `1px solid ${T.red}40`,
              color: T.red, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              borderRadius: RADIUS.xs, border: 'none',
              background: loading ? `${T.accent}80` : T.accent,
              color: '#fff', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: FONT_STACK,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                로그인 중...
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </>
            ) : '로그인'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: T.textMute }}>
          계정 문의는 관리자에게 연락하세요
        </div>
      </div>
    </div>
  );
}
