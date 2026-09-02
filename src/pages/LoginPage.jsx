import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Message from '../components/Message.jsx';

const ROLE_LABEL = {
  manager: { role: 'MANAGER', label: 'マネージャー', home: '/manager' },
  employee: { role: 'EMPLOYEE', label: '従業員', home: '/employee' },
};

export default function LoginPage() {
  const { roleKey } = useParams();
  const config = ROLE_LABEL[roleKey];
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!config) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { token, user } = await api.login(loginId, password, config.role);
      login(token, user);
      navigate(config.home);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h2>{config.label}ログイン</h2>
        <Message>{error}</Message>
        <label className="field">
          <span>ログインID</span>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          <span>パスワード</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          ログイン
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>
          戻る
        </button>
      </form>
    </div>
  );
}
