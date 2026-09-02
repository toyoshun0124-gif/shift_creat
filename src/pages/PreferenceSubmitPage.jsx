import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';

const DRAFT_KEY = 'employee-preference-form-month';
const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function getNextMonth() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 0-11 -> 次月の月番号(1-12)相当
  const target = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  return `${target.y}-${String(target.m).padStart(2, '0')}`;
}

function buildDays(month) {
  const [year, mon] = month.split('-').map(Number);
  const total = new Date(year, mon, 0).getDate();
  const days = [];
  for (let d = 1; d <= total; d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    const weekday = WEEKDAY_LABELS[new Date(year, mon - 1, d).getDay()];
    days.push({ date, weekday, startTime: '', endTime: '', error: false });
  }
  return days;
}

function isValidTimeRangeClient(start, end) {
  const re = /^([01]\d|2[0-3]|24):([0-5]\d)$/;
  if (!re.test(start) || !re.test(end)) return false;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
}

export default function PreferenceSubmitPage() {
  const navigate = useNavigate();
  const month = useMemo(() => getNextMonth(), []);
  const [days, setDays] = useState(() => buildDays(month));
  const [period, setPeriod] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [{ period: p, myPreferences }, draftRes] = await Promise.all([
          api.currentPeriod(),
          api.loadDraft(DRAFT_KEY).catch(() => ({ data: null })),
        ]);
        setPeriod(p);

        const base = buildDays(month);
        const byDate = new Map(base.map((d) => [d.date, d]));

        (myPreferences || [])
          .filter((pref) => pref.date.startsWith(`${month}-`))
          .forEach((pref) => {
            const day = byDate.get(pref.date);
            if (day) {
              day.startTime = pref.startTime;
              day.endTime = pref.endTime;
            }
          });

        if (draftRes?.data?.month === month && Array.isArray(draftRes.data.entries)) {
          draftRes.data.entries.forEach((entry) => {
            const day = byDate.get(entry.date);
            if (day) {
              day.startTime = entry.startTime || '';
              day.endTime = entry.endTime || '';
            }
          });
          setNotice('前回の入力内容を復元しました');
        }

        setDays(base);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const collectEntries = () => days.filter((d) => d.startTime || d.endTime).map(({ date, startTime, endTime }) => ({ date, startTime, endTime }));

  const saveDraft = async (silent = false) => {
    try {
      await api.saveDraft(DRAFT_KEY, { month, entries: collectEntries() });
      if (!silent) {
        setNotice('下書きを保存しました。閉じても後で復元できます。');
        setError('');
      }
    } catch (err) {
      if (!silent) setError(err.message);
    }
  };

  const updateDay = (date, field, value) => {
    setDays((prev) => prev.map((d) => (d.date === date ? { ...d, [field]: value, error: false } : d)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    // イレギュラーケース(v2): 1ヶ月の内、1つでも入力ミスがあれば先に進ませない
    let hasError = false;
    const validated = days.map((d) => {
      const filled = d.startTime || d.endTime;
      if (!filled) return { ...d, error: false };
      const ok = d.startTime && d.endTime && isValidTimeRangeClient(d.startTime, d.endTime);
      if (!ok) hasError = true;
      return { ...d, error: !ok };
    });
    setDays(validated);

    if (hasError) {
      setError('入力ミスがあります');
      return;
    }

    const entries = validated.filter((d) => d.startTime && d.endTime).map(({ date, startTime, endTime }) => ({ date, startTime, endTime }));

    if (entries.length === 0) {
      setError('入力ミスがあります');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitMonthPreferences(month, entries);
      await saveDraft(true);
      setNotice(`${month} の希望シフトを提出しました(${entries.length}日分)`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
          <p className="info-line">
            対象月: {month}
            {period && (
              <>
                {' '}
                / 提出締切: {new Date(period.deadline).toLocaleString('ja-JP')}
                {deadlinePassed && <span className="badge badge-danger">締切済み</span>}
              </>
            )}
          </p>

          <Message>{error}</Message>
          <Message type="success">{notice}</Message>

          <form className="card" onSubmit={handleSubmit}>
            <table className="table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>開始</th>
                  <th>終了</th>
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date} className={d.error ? 'row-error' : ''}>
                    <td>
                      {d.date}（{d.weekday}）
                    </td>
                    <td>
                      <input
                        type="time"
                        value={d.startTime}
                        onChange={(e) => updateDay(d.date, 'startTime', e.target.value)}
                        onBlur={() => saveDraft(true)}
                        maxLength={10}
                      />
                    </td>
                    <td>
                      <input
                        type="time"
                        value={d.endTime}
                        onChange={(e) => updateDay(d.date, 'endTime', e.target.value)}
                        onBlur={() => saveDraft(true)}
                        maxLength={10}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={() => saveDraft(false)}>
                下書き保存
              </button>
              <button type="submit" className="btn btn-primary" disabled={deadlinePassed || submitting}>
                {month} の希望をまとめて提出する
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
