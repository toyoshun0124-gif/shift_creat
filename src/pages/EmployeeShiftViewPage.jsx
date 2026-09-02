import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';

export default function EmployeeShiftViewPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(null);
  const [myAssignments, setMyAssignments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .viewShift()
      .then(({ period: p, myAssignments: mine, assignments: all }) => {
        setPeriod(p);
        setMyAssignments(mine);
        setAssignments(all);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <Header title="シフト閲覧" />
      <button type="button" className="btn btn-ghost" onClick={() => navigate('/employee')}>
        ← メニューに戻る
      </button>

      <Message>{error}</Message>

      {loading ? (
        <p>読み込み中...</p>
      ) : !period ? (
        <p className="muted">まだ共有されているシフトはありません</p>
      ) : (
        <>
          <h3>あなたのシフト</h3>
          {myAssignments.length === 0 ? (
            <p className="muted">あなたの割り当てはありません</p>
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
                {myAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.date}</td>
                    <td>{a.startTime}</td>
                    <td>{a.endTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3>全体のシフト</h3>
          <table className="table">
            <thead>
              <tr>
                <th>日付</th>
                <th>従業員</th>
                <th>開始</th>
                <th>終了</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id}>
                  <td>{a.date}</td>
                  <td>{a.user?.name}</td>
                  <td>{a.startTime}</td>
                  <td>{a.endTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
