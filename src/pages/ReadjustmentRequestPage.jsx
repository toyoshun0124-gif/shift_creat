import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';

const DRAFT_KEY = 'employee-readjustment-request-form';

export default function ReadjustmentRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '', reason: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .loadDraft(DRAFT_KEY)
      .then(({ data }) => {
        if (data) {
          setForm(data);
          setNotice('前回の入力内容を復元しました');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveDraft = async (nextForm) => {
    try {
      await api.saveDraft(DRAFT_KEY, nextForm);
    } catch {
      // 自動保存の失敗は無視する
    }
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleBlur = () => {
    saveDraft(form);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.submitReadjustmentRequest(form.date, form.startTime, form.endTime, form.reason);
      const cleared = { date: '', startTime: '', endTime: '', reason: '' };
      await saveDraft(cleared);
      setForm(cleared);
      setNotice('再調整申請を送信しました');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <Header title="再調整申請" />
      <button type="button" className="btn btn-ghost" onClick={() => navigate('/employee')}>
        ← メニューに戻る
      </button>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <Message>{error}</Message>
          <Message type="success">{notice}</Message>

          <form className="card" onSubmit={handleSubmit}>
            <label className="field">
              <span>変更したい日付</span>
              <input type="date" value={form.date} onChange={handleChange('date')} onBlur={handleBlur} maxLength={20} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>開始時刻</span>
                <input type="time" value={form.startTime} onChange={handleChange('startTime')} onBlur={handleBlur} maxLength={10} />
              </label>
              <label className="field">
                <span>終了時刻</span>
                <input type="time" value={form.endTime} onChange={handleChange('endTime')} onBlur={handleBlur} maxLength={10} />
              </label>
            </div>
            <label className="field">
              <span>理由（任意）</span>
              <textarea value={form.reason} onChange={handleChange('reason')} onBlur={handleBlur} maxLength={300} rows={3} />
            </label>
            <button type="submit" className="btn btn-primary">
              マネージャーへ申請する
            </button>
          </form>
        </>
      )}
    </div>
  );
}
