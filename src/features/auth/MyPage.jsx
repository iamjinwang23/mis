import { useState, useEffect } from 'react';
import { Lock, Shield, ChevronRight } from 'lucide-react';
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

export default function MyPage({ profile, onProfileChange }) {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwResult, setPwResult] = useState(null);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwResult(null);
    if (newPw !== confirmPw) {
      setPwResult({ ok: false, msg: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    if (newPw.length < 6) {
      setPwResult({ ok: false, msg: '비밀번호는 6자 이상이어야 합니다.' });
      return;
    }
    setPwLoading(true);
    try {
      await changePassword(newPw);
      setPwResult({ ok: true, msg: '비밀번호가 변경되었습니다.' });
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwResult({ ok: false, msg: '변경 실패: ' + err.message });
    } finally {
      setPwLoading(false);
    }
  };

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
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 4 }}>마이페이지</h1>
        <p style={{ fontSize: 18, color: T.textDim, fontFamily: MONO_STACK }}>
          {profile?.name} {profile?.position} · {profile?.email}
        </p>
      </div>

      {/* 내 정보 */}
      <Card style={{ padding: 24, marginBottom: 20, maxWidth: 520 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 18 }}>내 정보</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: 12 }}>
          {[
            { label: '이름',   value: profile?.name },
            { label: '직책',   value: profile?.position },
            { label: '이메일', value: profile?.email },
            { label: '권한',   value: isAdmin ? '관리자' : profile?.can_upload ? '업로드 가능' : '조회 전용' },
          ].map(({ label, value }) => (
            <>
              <span key={label + 'l'} style={{ fontSize: 13, color: T.textMute, fontWeight: 600 }}>{label}</span>
              <span key={label + 'v'} style={{ fontSize: 15, color: T.text, fontFamily: label === '이메일' ? MONO_STACK : FONT_STACK }}>
                {value}
              </span>
            </>
          ))}
        </div>
      </Card>

      {/* 비밀번호 변경 */}
      <Card style={{ padding: 24, marginBottom: 20, maxWidth: 520 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={15} color={T.accent} /> 비밀번호 변경
        </h2>
        <form onSubmit={handlePasswordChange}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>새 비밀번호</label>
            <input
              type="password"
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setPwResult(null); }}
              required
              minLength={6}
              placeholder="6자 이상"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setPwResult(null); }}
              required
              placeholder="동일하게 입력"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = T.accent; }}
              onBlur={e => { e.target.style.borderColor = T.border; }}
            />
          </div>
          {pwResult && (
            <div style={{
              marginBottom: 14, padding: '10px 12px', borderRadius: RADIUS.xs, fontSize: 13,
              background: pwResult.ok ? `${T.green}18` : T.redSoft,
              border: `1px solid ${pwResult.ok ? T.green : T.red}40`,
              color: pwResult.ok ? T.green : T.red,
            }}>
              {pwResult.msg}
            </div>
          )}
          <button
            type="submit"
            disabled={pwLoading}
            style={{
              padding: '10px 24px', borderRadius: RADIUS.xs, border: 'none',
              background: pwLoading ? `${T.accent}80` : T.accent,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: pwLoading ? 'not-allowed' : 'pointer', fontFamily: FONT_STACK,
            }}
          >
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
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
