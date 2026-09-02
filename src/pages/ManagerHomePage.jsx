import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function ManagerHomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Header title="マネージャーメニュー" />
      <div className="button-grid">
        <button type="button" className="btn btn-tile" onClick={() => navigate('/manager/create')}>
          シフト作成依頼
        </button>
        <button type="button" className="btn btn-tile" onClick={() => navigate('/manager/notifications')}>
          再調整通知
        </button>
        <button type="button" className="btn btn-tile" onClick={() => navigate('/manager/readjust')}>
          シフト再調整
        </button>
      </div>
    </div>
  );
}
