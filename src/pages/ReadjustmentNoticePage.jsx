import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';

export default function ReadjustmentNoticePage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listReadjustmentRequests()
      .then(({ requests: r }) => setRequests(r))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Header title="再調整通知" />
      <button type="button" className="btn btn-ghost" onClick={() => navigate('/manager')}>
        ← メニューに戻る
      </button>

      <Message>{error}</Message>

      {loading ? (
        <p>読み込み中...</p>
      ) : requests.length === 0 ? (
        <p className="muted">現在、再調整依頼はありません</p>
      ) : (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>従業員ID</th>
                <th>氏名</th>
                <th>日程</th>
                <th>時間帯</th>
                <th>理由</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.user.loginId}</td>
                  <td>{r.user.name}</td>
                  <td>{r.date}</td>
                  <td>
                    {r.startTime}〜{r.endTime}
                  </td>
                  <td>{r.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/manager/readjust')}>
            シフト再調整へ進む
          </button>
        </>
      )}
    </div>
  );
}
