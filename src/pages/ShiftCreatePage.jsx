import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Header from '../components/Header.jsx';
import Message from '../components/Message.jsx';
import ShiftCandidateTable from '../components/ShiftCandidateTable.jsx';

export default function ShiftCreatePage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState(null);
  const [preferenceCount, setPreferenceCount] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { period: p, preferenceCount: count } = await api.currentPeriod();
      setPeriod(p);
      setPreferenceCount(count);
      if (p?.status !== 'COLLECTING') {
        // すでに生成済みの場合は最新のシフトを表示する目的で再度読み込みは行わない
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setError('');
    setNotice('');
    setGenerating(true);
    try {
      const { period: p, candidates: c } = await api.generateShift();
      setPeriod(p);
      setCandidates(c);
      setNotice('5件のシフト案を作成しました');
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
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
      <Header title="シフト作成依頼" />
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
            <p>提出された希望シフト件数: {preferenceCount} 件</p>
            {period && <p>期間ステータス: {statusLabel(period.status)}</p>}
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              希望日程からシフトを作成する
            </button>
          </div>

          {candidates.length > 0 && (
            <div className="candidates">
              <h3>シフト案（5案）</h3>
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

function statusLabel(status) {
  if (status === 'COLLECTING') return '希望日程募集中';
  if (status === 'GENERATED') return 'シフト案作成済み（未確定）';
  if (status === 'FINALIZED') return '確定・共有済み';
  return status;
}
