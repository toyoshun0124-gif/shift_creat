import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getToken } from '../lib/api.js';
import { useAuth } from '../lib/AuthContext.jsx';
import Message from '../components/Message.jsx';

export default function SetNamePage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // 個人情報のため、既存の名前があっても画面には表示しない（常に空欄から入力させる）
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { user: updatedUser } = await api.setName(name);
      login(getToken(), updatedUser);
      navigate(updatedUser.role === 'MANAGER' ? '/manager' : '/employee');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page page-center">
      <form className="card" onSubmit={handleSubmit}>
        <h2>お名前を入力してください</h2>
        <p className="subtitle">シフト表などに表示される名前です。あとから変更もできます。</p>
        <Message>{error}</Message>
        <label className="field">
          <span>お名前</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} autoFocus />
        </label>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          次へ
        </button>
      </form>
    </div>
  );
}
