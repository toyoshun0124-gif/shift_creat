import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  if (!user) {
    // 中断後の再アクセス等、未ログイン状態は再度ログイン画面へ
    return <Navigate to="/" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
