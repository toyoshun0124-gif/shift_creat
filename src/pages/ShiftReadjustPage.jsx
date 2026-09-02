import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';
import ShiftCandidateTable from '../components/ShiftCandidateTable.jsx';

export default function ShiftReadjustPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(null);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { period: p, pendingRequestCount: count } = await api.currentPeriod();
      setPeriod(p);
      setPendingRequestCount(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReadjust = async () => {
    setError('');
    setNotice('');
    setProcessing(true);
    try {
      const { candidates: c } = await api.readjustShift(period.id);
      setCandidates(c);
      setNotice('再調整依頼を反映した5件のシフト案を作成しました');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalize = async (candidateId) => {
    setError('');
    setNotice('');
    try {
      await api.finalizeShift(period.id, candidateId);
      setNotice('シフトを確定し、全体へ共有しました');
      setCandidates([]);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <Header title="シフト再調整" />
      <button type="button" className="btn btn-ghost" onClick={() => navigate('/manager')}>
        ← メニューに戻る
      </button>

      {loading ? (
        <p>読み込み中...</p>
      ) : (
        <>
          <Message>{error}</Message>
          <Message type="success">{notice}</Message>

          <div className="card">
            <p>未対応の再調整依頼: {pendingRequestCount} 件</p>
            <button type="button" className="btn btn-primary" onClick={handleReadjust} disabled={processing}>
              最初のシフト案を再調整する
            </button>
          </div>

          {candidates.length > 0 && (
            <div className="candidates">
              <h3>再調整後のシフト案（5案）</h3>
              {candidates.map((c) => (
                <ShiftCandidateTable key={c.id} candidate={c} onSelect={() => handleFinalize(c.id)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
