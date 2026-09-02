import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Header({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="app-header">
      <h1>{title}</h1>
      {user && (
        <div className="header-user">
          <span>
            {user.name}（{user.role === 'MANAGER' ? 'マネージャー' : '従業員'}）
          </span>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      )}
    </header>
  );
}
