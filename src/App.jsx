import { Route, Routes } from 'react-router-dom';
import TitlePage from './pages/TitlePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SetNamePage from './pages/SetNamePage.jsx';
import ManagerHomePage from './pages/ManagerHomePage.jsx';
import EmployeeHomePage from './pages/EmployeeHomePage.jsx';
import ShiftCreatePage from './pages/ShiftCreatePage.jsx';
import ReadjustmentNoticePage from './pages/ReadjustmentNoticePage.jsx';
import ShiftReadjustPage from './pages/ShiftReadjustPage.jsx';
import PreferenceSubmitPage from './pages/PreferenceSubmitPage.jsx';
import EmployeeShiftViewPage from './pages/EmployeeShiftViewPage.jsx';
import ReadjustmentRequestPage from './pages/ReadjustmentRequestPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TitlePage />} />
      <Route path="/login/:roleKey" element={<LoginPage />} />
      <Route
        path="/set-name"
        element={
          <ProtectedRoute>
            <SetNamePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager"
        element={
          <ProtectedRoute role="MANAGER">
            <ManagerHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/create"
        element={
          <ProtectedRoute role="MANAGER">
            <ShiftCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/notifications"
        element={
          <ProtectedRoute role="MANAGER">
            <ReadjustmentNoticePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/readjust"
        element={
          <ProtectedRoute role="MANAGER">
            <ShiftReadjustPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <EmployeeHomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/preferences"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <PreferenceSubmitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/shift"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <EmployeeShiftViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/readjustment-request"
        element={
          <ProtectedRoute role="EMPLOYEE">
            <ReadjustmentRequestPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<TitlePage />} />
    </Routes>
  );
}
