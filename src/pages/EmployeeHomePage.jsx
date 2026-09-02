import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function EmployeeHomePage() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Header title="従業員メニュー" />
      <div className="button-grid">
        <button type="button" className="btn btn-tile" onClick={() => navigate('/employee/preferences')}>
          希望シフト提出
        </button>
        <button type="button" className="btn btn-tile" onClick={() => navigate('/employee/shift')}>
          シフト閲覧
        </button>
        <button type="button" className="btn btn-tile" onClick={() => navigate('/employee/readjustment-request')}>
          再調整申請
        </button>
      </div>
    </div>
  );
}
