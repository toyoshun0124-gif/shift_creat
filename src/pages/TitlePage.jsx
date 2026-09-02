import { useNavigate } from 'react-router-dom';

export default function TitlePage() {
  const navigate = useNavigate();

  return (
    <div className="page page-center">
      <div className="title-card">
        <h1>シフト作成アプリ</h1>
        <p className="subtitle">希望日程の収集からシフト作成・再調整まで、AIがまとめてサポートします。</p>
        <div className="button-stack">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/login/manager')}>
            マネージャーログイン
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/login/employee')}>
            従業員ログイン
          </button>
        </div>
      </div>
    </div>
  );
}
