import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';

const DRAFT_KEY = 'employee-preference-form';

export default function PreferenceSubmitPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ date: '', startTime: '', endTime: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [period, setPeriod] = useState(null);
  const [myPreferences, setMyPreferences] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadState = async () => {
    setLoading(true);
    try {
      const [{ period: p, myPreferences: prefs }, draftRes] = await Promise.all([
        api.currentPeriod(),
        api.loadDraft(DRAFT_KEY).catch(() => ({ data: null })),
      ]);
      setPeriod(p);
      setMyPreferences(prefs || []);
      if (draftRes?.data) {
        setForm(draftRes.data);
        setNotice('前回の入力内容を復元しました');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const saveDraft = async (nextForm) => {
    try {
      await api.saveDraft(DRAFT_KEY, nextForm);
    } catch {
      // 自動保存の失敗は画面遷移を妨げない
    }
  };

  const handleChange = (field) => (e) => {
    const nextForm = { ...form, [field]: e.target.value };
    setForm(nextForm);
  };

  const handleBlur = () => {
    saveDraft(form);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      await api.submitPreference(form.date, form.startTime, form.endTime);
      await saveDraft({ date: '', startTime: '', endTime: '' });
      setForm({ date: '', startTime: '', endTime: '' });
      setNotice('希望シフトを提出しました');
      loadState();
    } catch (err) {
      setError(err.message);
    }
  };

  const deadlinePassed = period && new Date() > new Date(period.deadline);

  return (
    <div className="page">
      <Header title="希望シフト提出" />
      <button type="button" className="btn btn-ghost" onClick={() => navigate('/employee')}>
        ← メニューに戻る
      </button>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          {period && (
            <p className="info-line">
              提出締切: {new Date(period.deadline).toLocaleString('ja-JP')}
              {deadlinePassed && <span className="badge badge-danger">締切済み</span>}
            </p>
          )}

          <Message>{error}</Message>
          <Message type="success">{notice}</Message>

          <form className="card" onSubmit={handleSubmit}>
            <label className="field">
              <span>日付</span>
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
            <button type="submit" className="btn btn-primary" disabled={deadlinePassed}>
              この希望を提出する
            </button>
          </form>

          <h3>提出済みの希望シフト</h3>
          {myPreferences.length === 0 ? (
            <p className="muted">まだ提出がありません</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>開始</th>
                  <th>終了</th>
                </tr>
              </thead>
              <tbody>
                {myPreferences.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>{p.startTime}</td>
                    <td>{p.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
