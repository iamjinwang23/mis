import { useState, useEffect } from 'react';
import { Lock, Shield, X } from 'lucide-react';
import { T, FONT_STACK, MONO_STACK, RADIUS } from '../../theme.js';
import { changePassword, listProfiles, updateCanUpload } from '../../db.js';
import Card from '../../components/Card.jsx';

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: RADIUS.xs,
  background: T.bg2, border: `1px solid ${T.border}`,
  color: T.text, fontSize: 15, fontFamily: FONT_STACK, outline: 'none',
};

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: T.textDim, marginBottom: 6, letterSpacing: '0.04em',
};

const thStyle = {
  padding: '11px 16px', textAlign: 'left',
  fontSize: 12, fontWeight: 700, color: T.textDim,
  letterSpacing: '0.05em', textTransform: 'uppercase',
  whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}`,
};

const tdStyle = {
  padding: '13px 16px', fontSize: 15,
  color: T.text, fontFamily: FONT_STACK,
};

function PasswordModal({ email, onClose }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    if (newPw !== confirmPw) {
      setResult({ ok: false, msg: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPw.length < 6) {
      setResult({ ok: false, msg: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }
    setLoading(true);
    try {
      await changePassword(email, currentPw, newPw);
      setResult({ ok: true, msg: '비밀번호가 변경되었습니다.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setResult({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 420, background: T.card, borderRadius: RADIUS.lg,
        border: `1px solid ${T.border}`, padding: '28px 28px 24px',
        boxShadow: '0 12px 40px rgba(26,39,68,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={15} color={T.accent} />
            <span style={{ fontSize: 17, fontWeight: 700, color: T.text }}>비밀번호 변경</span>
          </div>
          <button type="button" onClick={onClose} style={{
            padding: 4, border: 'none', background: 'transparent',
            color: T.textMute, cursor: 'pointer', borderRadius: 4,
          }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>현재 비밀번호</label>
            <input
              type="password" value={currentPw}
              onChange={e => { setCurrentPw(e.target.value); setResult(null); }}
              required placeholder="현재 비밀번호 입력" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>새 비밀번호</label>
            <input
              type="password" value={newPw}
              onChange={e => { setNewPw(e.target.value); setResult(null); }}
              required minLength={6} placeholder="6자 이상" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>새 비밀번호 확인</label>
            <input
              type="password" value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setResult(null); }}
              required placeholder="동일하게 입력" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
          </div>

          {result && (
            <div style={{
              marginBottom: 16, padding: '10px 12px', borderRadius: RADIUS.xs, fontSize: 13,
              background: result.ok ? `${T.green}18` : T.redSoft,
              border: `1px solid ${result.ok ? T.green : T.red}40`,
              color: result.ok ? T.green : T.red,
            }}>
              {result.msg}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 18px', borderRadius: RADIUS.xs, border: `1px solid ${T.border}`,
              background: 'transparent', color: T.textDim, fontSize: 14,
              cursor: 'pointer', fontFamily: FONT_STACK,
            }}>
              취소
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '9px 20px', borderRadius: RADIUS.xs, border: 'none',
              background: loading ? `${T.accent}80` : T.accent,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: FONT_STACK,
            }}>
              {loading ? '변경 중...' : '변경하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MyPage({ profile }) {
  const [showPwModal, setShowPwModal] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [listLoading, setListLoading] = useState(false);

  const isAdmin = profile?.is_admin ?? false;

  useEffect(() => {
    if (!isAdmin) return;
    setListLoading(true);
    listProfiles()
      .then(setProfiles)
      .catch(console.error)
      .finally(() => setListLoading(false));
  }, [isAdmin]);

  const handleToggle = async (email, current, isAdminRow) => {
    if (isAdminRow) return;
    try {
      await updateCanUpload(email, !current);
      setProfiles(prev =>
        prev.map(p => p.email === email ? { ...p, can_upload: !current } : p)
      );
    } catch (err) {
      console.error('권한 변경 실패:', err);
    }
  };

  return (
    <div className="page-wrap">
      {showPwModal && (
        <PasswordModal email={profile?.email} onClose={() => setShowPwModal(false)} />
      )}

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>마이페이지</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {profile?.name} {profile?.position} · {profile?.email}
        </p>
      </div>

      {/* 내 정보 */}
      <Card style={{ padding: 24, marginBottom: 20, maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text }}>내 정보</h2>
          <button
            type="button"
            onClick={() => setShowPwModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: RADIUS.xs,
              border: `1px solid ${T.border}`, background: 'transparent',
              color: T.textDim, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: FONT_STACK,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textDim; }}
          >
            <Lock size={12} /> 비밀번호 변경
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 12 }}>
          {[
            { label: '이름',   value: profile?.name },
            { label: '직책',   value: profile?.position },
            { label: '이메일', value: profile?.email },
            { label: '권한',   value: isAdmin ? '관리자' : profile?.can_upload ? '업로드 가능' : '조회 전용' },
          ].map(({ label, value }) => (
            <>
              <span key={label + 'l'} style={{ fontSize: 13, color: T.textMute, fontWeight: 600, lineHeight: '1.6' }}>{label}</span>
              <span key={label + 'v'} style={{ fontSize: 15, color: T.text, fontFamily: label === '이메일' ? MONO_STACK : FONT_STACK, lineHeight: '1.6' }}>
                {value}
              </span>
            </>
          ))}
        </div>
      </Card>

      {/* 관리자 전용: 업로드 권한 관리 */}
      {isAdmin && (
        <Card style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={15} color={T.accent} />
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text }}>업로드 권한 관리</h2>
            <span style={{ marginLeft: 'auto', fontSize: 13, color: T.textMute }}>클릭으로 권한 변경</span>
          </div>
          {listLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: T.textMute, fontSize: 15 }}>로딩 중...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.bg2 }}>
                    <th style={thStyle}>이름</th>
                    <th style={thStyle}>직책</th>
                    <th style={{ ...thStyle, fontFamily: MONO_STACK }}>이메일</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>역할</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>업로드</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr
                      key={p.email}
                      style={{ borderBottom: `1px solid ${T.border}` }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.cardHover; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...tdStyle, color: T.textDim, fontSize: 14 }}>{p.position}</td>
                      <td style={{ ...tdStyle, fontFamily: MONO_STACK, fontSize: 13, color: T.textMute }}>{p.email}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {p.is_admin && (
                          <span style={{
                            fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                            background: `${T.accent}18`, color: T.accent,
                          }}>관리자</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggle(p.email, p.can_upload, p.is_admin)}
                          disabled={p.is_admin}
                          style={{
                            padding: '5px 16px', borderRadius: RADIUS.xs, fontSize: 13, fontWeight: 600,
                            border: `1px solid ${p.can_upload ? T.green + '50' : T.border}`,
                            background: p.can_upload ? `${T.green}15` : T.bg2,
                            color: p.can_upload ? T.green : T.textMute,
                            cursor: p.is_admin ? 'default' : 'pointer',
                            fontFamily: FONT_STACK,
                            opacity: p.is_admin ? 0.5 : 1,
                            transition: 'all 0.15s',
                          }}
                        >
                          {p.can_upload ? '허용' : '차단'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
